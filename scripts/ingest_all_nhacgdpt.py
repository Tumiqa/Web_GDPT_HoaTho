import os
import sys
import re
import json
import time
import shutil
import urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import internetarchive as ia
from mutagen.mp3 import MP3

WORKSPACE_DIR = Path(r"D:\Project Ca Nhan\Web_GDPT_HoaTho")
DATA_DIR = WORKSPACE_DIR / "data"
NHAC_JSON_PATH = DATA_DIR / "nhac.json"
BACKUP_DIR = DATA_DIR / "backups"
TEMP_DIR = WORKSPACE_DIR / "temp_ingest"
SCRATCH_DIR = Path(r"C:\Users\cuqua\.gemini\antigravity\brain\a19ed4f5-a84f-4721-a8c3-eaf1cea5aa9f\scratch")
STATE_FILE = SCRATCH_DIR / "ingest_state.json"
INPUT_FILE = SCRATCH_DIR / "new_songs_to_process.json"

ACCESS_KEY = "EZgjLekzqfGfF61E"
SECRET_KEY = "X64ndZiG8A4BXQMD"
ITEM_ID = "list_nhac_web_3"

def clean_filename(title, artist):
    clean_t = re.sub(r'[\\/*?:"<>|#%&{}~`\^]', '', title).strip()
    clean_a = re.sub(r'[\\/*?:"<>|#%&{}~`\^]', '', artist).strip()
    clean_t = re.sub(r'\s+', ' ', clean_t)
    clean_a = re.sub(r'\s+', ' ', clean_a)
    
    if not clean_t:
        clean_t = "Bai Ca GDPT"
    
    if clean_a and clean_a.lower() not in ['chưa rõ', 'đang cập nhật', 'gdpt', 'nhạc gdpt', 'nhac gdpt']:
        fname = f"{clean_t} - {clean_a}.mp3"
    else:
        fname = f"{clean_t} - Nhạc GĐPT.mp3"
    return fname

def get_duration(fpath):
    try:
        audio = MP3(fpath)
        sec = int(audio.info.length)
        m, s = divmod(sec, 60)
        return f"{m:02d}:{s:02d}"
    except Exception:
        return "03:30"

def download_file(song_info, target_dir):
    url = song_info['mp3_url']
    if 'nhacgdpt.com//' in url:
        url = url.replace('nhacgdpt.com//', 'nhacgdpt.com/')
        
    title = song_info['title']
    artist = song_info.get('artist', 'Nhạc GĐPT')
    fname = clean_filename(title, artist)
    target_path = target_dir / fname
    
    # Handle duplicate target filename in same batch
    counter = 1
    stem = target_path.stem
    while target_path.exists():
        target_path = target_dir / f"{stem}_{counter}.mp3"
        counter += 1
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=25, stream=True)
        if r.status_code == 200:
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=32768):
                    if chunk:
                        f.write(chunk)
            
            # verify size > 10KB
            if target_path.stat().st_size > 10240:
                duration = get_duration(str(target_path))
                return {
                    'status': 'success',
                    'song_info': song_info,
                    'local_path': str(target_path),
                    'filename': target_path.name,
                    'title': title,
                    'artist': artist if artist and artist.lower() not in ['chưa rõ', 'đang cập nhật'] else 'Nhạc GĐPT',
                    'duration': duration
                }
            else:
                target_path.unlink(missing_ok=True)
                return {'status': 'error', 'song_info': song_info, 'error': 'File too small'}
        else:
            return {'status': 'error', 'song_info': song_info, 'error': f'HTTP {r.status_code}'}
    except Exception as e:
        if target_path.exists():
            target_path.unlink(missing_ok=True)
        return {'status': 'error', 'song_info': song_info, 'error': str(e)}

def upload_single_file(item_res, item):
    fname = item_res['filename']
    fpath = item_res['local_path']
    try:
        res = item.upload(fpath, retries=3, verbose=False)
        return {'status': 'success', 'data': item_res}
    except Exception as e:
        return {'status': 'error', 'data': item_res, 'error': str(e)}

def main(batch_limit=None):
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        all_songs = json.load(f)
        
    # Load state
    uploaded_urls = set()
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                state_data = json.load(f)
                uploaded_urls = set(state_data.get('uploaded_urls', []))
        except Exception:
            pass
            
    # Load current nhac.json
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        current_data = json.load(f)
    existing_titles_norm = {re.sub(r'[^a-zA-Z0-9]', '', x['title'].lower()) for x in current_data}
    
    remaining_songs = [s for s in all_songs if s['mp3_url'] not in uploaded_urls]
    to_process = []
    for s in remaining_songs:
        t_clean = re.sub(r'[^a-zA-Z0-9]', '', s['title'].lower())
        if t_clean not in existing_titles_norm:
            to_process.append(s)
            
    print(f"Tổng số bài hát còn lại cần thêm: {len(to_process)}")
    if not to_process:
        print("Tất cả bài hát đã được xử lý xong!")
        return

    # Init archive session
    s = ia.get_session(config={'s3': {'access': ACCESS_KEY, 'secret': SECRET_KEY}})
    item = s.get_item(ITEM_ID)
    
    BATCH_SIZE = 40
    chunks = [to_process[i:i + BATCH_SIZE] for i in range(0, len(to_process), BATCH_SIZE)]
    if batch_limit:
        chunks = chunks[:batch_limit]
        
    print(f"Bắt đầu xử lý {len(chunks)} đợt (mỗi đợt tối đa {BATCH_SIZE} bài)...")
    
    total_added = 0
    for chunk_idx, chunk in enumerate(chunks, 1):
        print(f"\n==================================================")
        print(f"--- ĐỢT {chunk_idx}/{len(chunks)}: {len(chunk)} BÀI HÁT ---")
        print(f"==================================================")
        
        # 1. Tải về đồng thời 8 luồng
        print(f"1. Đang tải {len(chunk)} file MP3 về thư mục tạm...")
        downloaded = []
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_song = {executor.submit(download_file, s_info, TEMP_DIR): s_info for s_info in chunk}
            for future in as_completed(future_to_song):
                res = future.result()
                if res['status'] == 'success':
                    downloaded.append(res)
                else:
                    print(f"  [!] Bỏ qua {res['song_info']['title']}: {res.get('error')}")
                    
        print(f"  -> Tải thành công {len(downloaded)}/{len(chunk)} bài.")
        if not downloaded:
            print("  Không có file nào tải thành công trong đợt này. Tiếp tục đợt sau...")
            continue
            
        # 2. Upload đồng thời 3 luồng lên Archive.org
        print(f"2. Đang upload {len(downloaded)} bài lên Archive.org ({ITEM_ID}) song song...")
        batch_success = []
        with ThreadPoolExecutor(max_workers=3) as up_executor:
            futures = [up_executor.submit(upload_single_file, item_res, item) for item_res in downloaded]
            for f in as_completed(futures):
                up_res = f.result()
                if up_res['status'] == 'success':
                    d = up_res['data']
                    batch_success.append(d)
                    uploaded_urls.add(d['song_info']['mp3_url'])
                    print(f"    -> OK: {d['filename']} ({d['duration']})")
                else:
                    print(f"    [X] Lỗi upload {up_res['data']['filename']}: {up_res.get('error')}")
                
        # 3. Cập nhật nhac.json
        print(f"3. Cập nhật nhac.json với {len(batch_success)} bài...")
        with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
            live_data = json.load(f)
            
        cur_titles = {x['title'].strip().lower() for x in live_data}
        cur_max_id = max([x.get('id', 0) for x in live_data], default=0)
        
        for item_res in batch_success:
            t_low = item_res['title'].strip().lower()
            if t_low in cur_titles:
                continue
            cur_max_id += 1
            encoded_name = urllib.parse.quote(item_res['filename'])
            src_url = f"https://archive.org/download/{ITEM_ID}/{encoded_name}"
            
            new_entry = {
                "id": cur_max_id,
                "title": item_res['title'],
                "artist": item_res['artist'],
                "src": src_url,
                "duration": item_res['duration']
            }
            live_data.append(new_entry)
            cur_titles.add(t_low)
            total_added += 1
            
        with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(live_data, f, ensure_ascii=False, indent=4)
            
        # Save state
        with open(STATE_FILE, 'w', encoding='utf-8') as sf:
            json.dump({'uploaded_urls': list(uploaded_urls)}, sf, ensure_ascii=False)
            
        # 4. DỌN DẸP SẠCH SẼ TẤT CẢ FILE MP3 ĐÃ TẢI VỀ
        print(f"4. Dọn dẹp sạch sẽ các file tạm trong ổ đĩa...")
        deleted_count = 0
        for f in TEMP_DIR.glob("*.mp3"):
            try:
                f.unlink(missing_ok=True)
                deleted_count += 1
            except Exception as e:
                pass
        print(f"  -> Đã xoá toàn bộ {deleted_count} file mp3 tạm thời. Ổ đĩa hoàn toàn sạch sẽ!")
        print(f"  -> Đợt {chunk_idx}/{len(chunks)} hoàn thành! Tổng bài hát trên web hiện tại: {len(live_data)}")
        
    print(f"\n==================================================")
    print(f"=== TOÀN BỘ CÁC ĐỢT HOÀN TẤT ===")
    print(f"Đã thêm thành công: {total_added} bài hát mới vào hệ thống.")
    print(f"==================================================")

if __name__ == "__main__":
    limit = None
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
    main(batch_limit=limit)
