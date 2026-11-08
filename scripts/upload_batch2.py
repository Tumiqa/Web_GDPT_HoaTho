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
BATCH2_DIR = WORKSPACE_DIR / "temp_music_batch2"

ACCESS_KEY = "EZgjLekzqfGfF61E"
SECRET_KEY = "X64ndZiG8A4BXQMD"
ITEM_ID = "list_nhac_web_3"

def main():
    print(f"=== BẮT ĐẦU UPLOAD BATCH 2 ({ITEM_ID}) ===")
    
    with open(r'C:\Users\cuqua\.gemini\antigravity\brain\a19ed4f5-a84f-4721-a8c3-eaf1cea5aa9f\scratch\batch2_downloaded.json', 'r', encoding='utf-8') as f:
        songs_to_upload = json.load(f)
        
    print(f"Số lượng bài hát cần upload: {len(songs_to_upload)}")
    
    s = ia.get_session(config={
        's3': {
            'access': ACCESS_KEY,
            'secret': SECRET_KEY
        }
    })
    item = s.get_item(ITEM_ID)
    
    # 1. Upload từng file
    success_uploads = []
    for idx, s_info in enumerate(songs_to_upload, 1):
        fpath = s_info['local_path']
        fname = s_info['filename']
        print(f"({idx}/{len(songs_to_upload)}) Đang upload: {fname}...")
        try:
            res = item.upload(
                fpath,
                retries=3,
                verbose=False
            )
            success_uploads.append(s_info)
            print(f"  -> OK ({res})")
        except Exception as e:
            print(f"  [X] Lỗi upload {fname}: {e}")
            
    print(f"\nUpload xong {len(success_uploads)}/{len(songs_to_upload)} bài lên Archive.org!")
    
    # 2. Cập nhật nhac.json
    print("\n=== ĐỒNG BỘ DỮ LIỆU VÀO DATA/NHAC.JSON ===")
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        current_data = json.load(f)
        
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_file = BACKUP_DIR / f"nhac_backup_before_batch2_{int(time.time())}.json"
    shutil.copyfile(NHAC_JSON_PATH, backup_file)
    print(f"Đã sao lưu: {backup_file.name}")
    
    max_id = max([x.get('id', 0) for x in current_data], default=0)
    existing_titles = {x['title'].strip().lower() for x in current_data}
    
    added_count = 0
    for s_info in success_uploads:
        t_low = s_info['title'].strip().lower()
        if t_low in existing_titles:
            continue
            
        max_id += 1
        encoded_name = urllib.parse.quote(s_info['filename'])
        src_url = f"https://archive.org/download/{ITEM_ID}/{encoded_name}"
        
        new_entry = {
            "id": max_id,
            "title": s_info['title'],
            "artist": s_info['artist'],
            "src": src_url,
            "duration": s_info['duration']
        }
        current_data.append(new_entry)
        existing_titles.add(t_low)
        added_count += 1
        
    # Sắp xếp theo thứ tự bảng chữ cái tiếng Việt
    current_data.sort(key=lambda x: x['title'].lower())
    
    with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, ensure_ascii=False, indent=4)
        
    print(f"\n[HOÀN TẤT VANG DỘI] Đã thêm {added_count} bài hát mới vào kho nhạc!")
    print(f"Tổng số bài hát trên website hiện tại: {len(current_data)} bài!")

if __name__ == "__main__":
    main()

