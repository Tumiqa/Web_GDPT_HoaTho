"""
Tool tự động tìm kiếm, tải, chuyển đổi MP3, upload lên Archive.org và cập nhật nhac.json cho GĐPT Hoà Thọ
"""

import os
import sys
import json
import re
import time
import shutil
import argparse
from pathlib import Path
import yt_dlp
import imageio_ffmpeg
from mutagen.mp3 import MP3

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
WORKSPACE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = WORKSPACE_DIR / "data"
NHAC_JSON_PATH = DATA_DIR / "nhac.json"
BACKUP_DIR = DATA_DIR / "backups"
SCRATCH_DIR = WORKSPACE_DIR / "temp_music"

# Các bài hát nòng cốt không thể thiếu của GĐPT
VITAL_GDPT_SONGS = [
    {
        "title": "Sen Trắng",
        "artist": "Hằng Phương Thiền Chiếu - Ưng Hội",
        "yt_url": "https://www.youtube.com/watch?v=s8lafEGyFqs",
        "note": "Bài ca chính thức của GĐPT Việt Nam"
    },
    {
        "title": "Trầm Hương Đốt",
        "artist": "Bửu Bác",
        "yt_url": "https://www.youtube.com/watch?v=1SQYzsSUCYU",
        "note": "Bài nguyện hương Phật Giáo"
    },
    {
        "title": "Dây Thân Ái",
        "artist": "Nhạc GĐPT",
        "yt_url": "https://www.youtube.com/watch?v=M-PAdASGWNs",
        "note": "Bài hát bế mạc chia tay chính thức GĐPT"
    },
    {
        "title": "Huyền Trang Ca",
        "artist": "Hoàng Cang",
        "yt_url": "https://www.youtube.com/watch?v=WXR9fvwSBXE",
        "note": "Bài ca Huynh trưởng / Trại Vạn Hạnh"
    },
    {
        "title": "Đêm Giã Từ",
        "artist": "Anh Lạc",
        "yt_url": "https://www.youtube.com/watch?v=_QcfrnxNMtg",
        "note": "Bài ca cuối lửa GĐPT"
    }
]

def clean_song_info(raw_title):
    """Làm sạch tên bài hát và tác giả từ tiêu đề video YouTube"""
    cleaned = re.sub(r'\[.*?\]\s*', '', raw_title)
    cleaned = re.sub(r'\(.*?\)', '', cleaned).strip()
    
    parts = cleaned.split(' - ')
    if len(parts) >= 2:
        title = parts[0].strip()
        artist = ' - '.join(parts[1:]).strip()
    else:
        title = cleaned.strip()
        artist = "GĐPT"
        
    # Chuẩn hóa viết hoa chữ cái đầu
    title = ' '.join(word.capitalize() for word in title.split())
    artist = ' '.join(word.capitalize() for word in artist.split())
    return title, artist

def load_existing_titles():
    """Lấy danh sách các bài hát đã có trong nhac.json để chống trùng lặp"""
    if not NHAC_JSON_PATH.exists():
        return set()
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        songs = json.load(f)
    return {s['title'].strip().lower() for s in songs}

def is_similar_title(t1, t2):
    """Kiểm tra 2 tên bài hát có thực sự là một bài hay không"""
    import unicodedata
    def norm(s):
        s = unicodedata.normalize('NFD', s.lower())
        s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
        s = re.sub(r'[^a-z0-9]', '', s)
        return s
    n1, n2 = norm(t1), norm(t2)
    return n1 == n2

def scan_nhac_gdpt_40(include_beats=False):
    """Quét toàn bộ video từ kênh Nhạc GĐPT 4.0 và lọc ra bài chưa có trên web"""
    print("[1/4] Đang quét danh sách bài hát từ kênh YouTube 'Nhạc GĐPT 4.0'...")
    existing = load_existing_titles()
    
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'skip_download': True,
    }
    
    channel_url = 'https://www.youtube.com/@NhacGDPT4.0/videos'
    candidates = []
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(channel_url, download=False)
            entries = info.get('entries', [])
            print(f"  -> Tìm thấy tổng cộng {len(entries)} video trên kênh.")
            
            for e in entries:
                raw_title = e.get('title', '').strip()
                if not include_beats and ('beat' in raw_title.lower() or 'karaoke' in raw_title.lower()):
                    continue
                    
                title, artist = clean_song_info(raw_title)
                
                # Kiểm tra trùng lặp
                is_duplicate = any(is_similar_title(title, ex) for ex in existing)
                        
                if not is_duplicate:
                    candidates.append({
                        'title': title,
                        'artist': artist,
                        'yt_url': e.get('url'),
                        'raw_title': raw_title
                    })
        except Exception as ex:
            print(f"  [!] Lỗi khi quét kênh Nhạc GĐPT 4.0: {ex}")
            
    # Thêm các bài kinh điển nếu chưa có
    for v in VITAL_GDPT_SONGS:
        if not any(is_similar_title(v['title'], ex) for ex in existing) and not any(is_similar_title(v['title'], c['title']) for c in candidates):
            candidates.append(v)
            
    print(f"  -> Lọc được {len(candidates)} bài mới toanh chưa có trên website.")
    return candidates

def download_and_convert(candidates, max_count=None):
    """Tải âm thanh từ YouTube và chuyển đổi sang MP3 chuẩn 192kbps"""
    SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    if max_count:
        candidates = candidates[:max_count]
        
    print(f"[2/4] Bắt đầu tải và chuyển đổi {len(candidates)} bài hát sang MP3...")
    processed_songs = []
    
    for idx, c in enumerate(candidates, 1):
        print(f"\n({idx}/{len(candidates)}) Đang xử lý: {c['title']} - {c['artist']}...")
        safe_name = re.sub(r'[\\/*?:"<>|]', '_', f"{c['title']} - {c['artist']}")
        out_tmpl = str(SCRATCH_DIR / f"{safe_name}.%(ext)s")
        target_mp3 = SCRATCH_DIR / f"{safe_name}.mp3"
        
        if target_mp3.exists():
            print(f"  -> File đã tồn tại, bỏ qua tải lại.")
        else:
            ydl_opts = {
                'format': 'bestaudio/best',
                'ffmpeg_location': FFMPEG_EXE,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'outtmpl': out_tmpl,
                'quiet': True,
                'no_warnings': True,
            }
            
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.extract_info(c['yt_url'], download=True)
            except Exception as e:
                print(f"  [X] Không thể tải '{c['title']}': {e}")
                continue
                
        if target_mp3.exists():
            try:
                audio = MP3(str(target_mp3))
                duration_sec = int(audio.info.length)
                m, s = divmod(duration_sec, 60)
                duration_str = f"{m}:{s:02d}"
            except Exception:
                duration_str = "3:00"
                
            processed_songs.append({
                'title': c['title'],
                'artist': c['artist'],
                'mp3_path': str(target_mp3),
                'filename': target_mp3.name,
                'duration': duration_str
            })
            print(f"  -> Đã chuyển đổi MP3 thành công! Thời lượng: {duration_str}")
            
    print(f"\n[OK] Hoàn thành tải và chuyển đổi {len(processed_songs)}/{len(candidates)} bài.")
    return processed_songs

def upload_to_archive(processed_songs, item_id, access_key, secret_key):
    """Upload hàng loạt file MP3 lên Archive.org và lấy link trực tiếp"""
    import internetarchive as ia
    import urllib.parse
    
    print(f"[3/4] Đang upload {len(processed_songs)} file lên Archive.org (Item: {item_id})...")
    
    metadata = {
        'collection': 'opensource_audio',
        'title': 'Kho Nhạc Gia Đình Phật Tử - GĐPT Hoà Thọ',
        'mediatype': 'audio',
        'creator': 'GĐPT Hoà Thọ',
        'description': 'Bộ sưu tập âm nhạc Gia Đình Phật Tử Việt Nam phục vụ website https://gdpthoatho.id.vn',
        'language': 'vie'
    }
    
    files_to_upload = [s['mp3_path'] for s in processed_songs]
    
    try:
        ia.upload(
            identifier=item_id,
            files=files_to_upload,
            metadata=metadata,
            access_key=access_key,
            secret_key=secret_key,
            verbose=True
        )
        print("  -> Upload toàn bộ lên Archive.org thành công!")
    except Exception as e:
        print(f"  [X] Lỗi upload Archive.org: {e}")
        return []
        
    uploaded_songs = []
    for s in processed_songs:
        encoded_fn = urllib.parse.quote(s['filename'])
        src_url = f"https://archive.org/download/{item_id}/{encoded_fn}"
        uploaded_songs.append({
            'title': s['title'],
            'artist': s['artist'],
            'src': src_url,
            'duration': s['duration']
        })
        
    return uploaded_songs

def update_nhac_json(new_songs):
    """Cập nhật dữ liệu vào data/nhac.json kèm backup an toàn"""
    print(f"[4/4] Đang cập nhật {len(new_songs)} bài hát vào website (data/nhac.json)...")
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_file = BACKUP_DIR / f"nhac_backup_{int(time.time())}.json"
    
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        current_data = json.load(f)
        
    shutil.copyfile(NHAC_JSON_PATH, backup_file)
    print(f"  -> Đã tạo bản sao lưu tại: {backup_file.name}")
    
    max_id = max([s.get('id', 0) for s in current_data], default=0)
    for s in new_songs:
        max_id += 1
        s['id'] = max_id
        current_data.append(s)
        
    # Sắp xếp lại theo thứ tự bảng chữ cái tiếng Việt
    current_data.sort(key=lambda x: x['title'].lower())
    
    with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, ensure_ascii=False, indent=4)
        
    print(f"  -> Thành công! Tổng số bài hát trên web hiện tại: {len(current_data)} bài.")

def main():
    parser = argparse.ArgumentParser(description="Tự động thu thập và upload nhạc GĐPT")
    parser.add_argument("--scan-only", action="store_true", help="Chỉ quét danh sách bài hát mới")
    parser.add_argument("--download-only", action="store_true", help="Chỉ tải và convert MP3 cục bộ")
    parser.add_argument("--max", type=int, default=None, help="Giới hạn số bài xử lý")
    parser.add_argument("--item-id", type=str, default="gdpt_hoatho_nhac_collection_2026", help="Identifier trên Archive.org")
    parser.add_argument("--access-key", type=str, default=None, help="Archive.org S3 Access Key")
    parser.add_argument("--secret-key", type=str, default=None, help="Archive.org S3 Secret Key")
    parser.add_argument("--include-beats", action="store_true", help="Bao gồm cả bản Beat / Karaoke")
    
    args = parser.parse_args()
    
    candidates = scan_nhac_gdpt_40(include_beats=args.include_beats)
    
    if args.scan_only:
        print("\n--- DANH SÁCH BÀI HÁT TÌM THẤY ---")
        for i, c in enumerate(candidates, 1):
            print(f"{i}. {c['title']} - {c['artist']} | {c.get('note', '')}")
        return
        
    processed = download_and_convert(candidates, max_count=args.max)
    
    if args.download_only:
        print(f"\n[Hoàn tất] Đã lưu {len(processed)} file MP3 tại: {SCRATCH_DIR}")
        return
        
    if not args.access_key or not args.secret_key:
        print("\n[!] Chưa có S3 Keys để upload tự động lên Archive.org.")
        print("    Vui lòng cung cấp Access Key & Secret Key từ https://archive.org/account/s3.php")
        return
        
    uploaded = upload_to_archive(processed, args.item_id, args.access_key, args.secret_key)
    if uploaded:
        update_nhac_json(uploaded)

if __name__ == "__main__":
    main()
