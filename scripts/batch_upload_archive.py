import os
import sys
import json
import urllib.parse
from pathlib import Path
import shutil
import time
import internetarchive as ia
from mutagen.mp3 import MP3

WORKSPACE_DIR = Path(r"D:\Project Ca Nhan\Web_GDPT_HoaTho")
DATA_DIR = WORKSPACE_DIR / "data"
NHAC_JSON_PATH = DATA_DIR / "nhac.json"
BACKUP_DIR = DATA_DIR / "backups"
TEMP_DIR = WORKSPACE_DIR / "temp_music"

ACCESS_KEY = "EZgjLekzqfGfF61E"
SECRET_KEY = "X64ndZiG8A4BXQMD"
ITEM_ID = "list_nhac_web_4"

def parse_song_meta(filename):
    """Tách tên bài hát và tác giả từ filename"""
    base = filename[:-4]  # remove .mp3
    parts = base.split(" - ")
    if len(parts) >= 2:
        title = parts[0].strip()
        artist = " - ".join(parts[1:]).strip()
    else:
        title = base.strip()
        artist = "GĐPT"
    return title, artist

def main():
    print(f"=== BẮT ĐẦU UPLOAD TOÀN BỘ 35 BÀI LÊN ARCHIVE.ORG ({ITEM_ID}) ===")
    
    mp3_files = sorted(list(TEMP_DIR.glob("*.mp3")))
    if not mp3_files:
        print("Không tìm thấy file MP3 nào trong temp_music!")
        return
        
    print(f"Tìm thấy {len(mp3_files)} bài hát cần upload.")
    
    # 1. Cấu hình session Internet Archive
    s = ia.get_session(config={
        's3': {
            'access': ACCESS_KEY,
            'secret': SECRET_KEY
        }
    })
    
    item = s.get_item(ITEM_ID)
    file_paths = [str(f) for f in mp3_files]
    
    # 2. Upload hàng loạt
    print("Đang tiến hành upload lên Archive.org...")
    metadata = {
        'title': 'Kho Nhạc Gia Đình Phật Tử Hoà Thọ - Phần 4',
        'mediatype': 'audio',
        'creator': 'GĐPT Hoà Thọ',
        'collection': 'opensource_audio',
        'language': 'vie',
        'description': 'Kho nhạc Gia Đình Phật Tử phục vụ website https://gdpthoatho.id.vn'
    }
    
    try:
        res = item.upload(
            file_paths,
            metadata=metadata,
            retries=5,
            verbose=True
        )
        print("Upload hoàn tất!", res)
    except Exception as e:
        print(f"Lỗi khi upload: {e}")
        return

    # 3. Chuẩn bị danh sách bài hát mới để cập nhật nhac.json
    print("\n=== ĐANG CẬP NHẬT WEBSITE (data/nhac.json) ===")
    
    # Đọc dữ liệu nhac.json hiện tại
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        songs = json.load(f)
        
    # Tạo bản backup
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / f"nhac_backup_before_batch_{int(time.time())}.json"
    shutil.copyfile(NHAC_JSON_PATH, backup_path)
    print(f"Đã sao lưu trước khi cập nhật: {backup_path.name}")
    
    max_id = max([s.get('id', 0) for s in songs], default=0)
    existing_titles = {s.get('title', '').strip().lower() for s in songs}
    
    added_count = 0
    for f in mp3_files:
        title, artist = parse_song_meta(f.name)
        if title.lower() in existing_titles:
            print(f"Bỏ qua bài đã có: {title}")
            continue
            
        audio = MP3(str(f))
        dur_sec = int(audio.info.length)
        m, sec = divmod(dur_sec, 60)
        dur_str = f"{m}:{sec:02d}"
        
        encoded_name = urllib.parse.quote(f.name)
        src_url = f"https://archive.org/download/{ITEM_ID}/{encoded_name}"
        
        max_id += 1
        new_track = {
            "id": max_id,
            "title": title,
            "artist": artist,
            "src": src_url,
            "duration": dur_str
        }
        songs.append(new_track)
        existing_titles.add(title.lower())
        added_count += 1
        print(f"  + Thêm: #{max_id} {title} - {artist} ({dur_str})")
        
    # Sắp xếp toàn bộ bài hát theo bảng chữ cái tiếng Việt
    songs.sort(key=lambda x: x['title'].lower())
    
    # Ghi lại vào nhac.json
    with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=4)
        
    print(f"\n[THÀNH CÔNG RỰC RỠ] Đã thêm mới {added_count} bài hát.")
    print(f"Tổng số bài hát trên website gdpthoatho.id.vn hiện tại: {len(songs)} bài!")

if __name__ == "__main__":
    main()

