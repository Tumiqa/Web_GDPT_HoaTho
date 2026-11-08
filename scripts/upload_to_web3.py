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
ITEM_ID = "list_nhac_web_3"

def parse_song_meta(filename):
    base = filename[:-4]
    parts = base.split(" - ")
    if len(parts) >= 2:
        title = parts[0].strip()
        artist = " - ".join(parts[1:]).strip()
    else:
        title = base.strip()
        artist = "GĐPT"
    return title, artist

def main():
    print(f"=== UPLOAD TO APPROVED ITEM: {ITEM_ID} ===")
    
    s = ia.get_session(config={
        's3': {
            'access': ACCESS_KEY,
            'secret': SECRET_KEY
        }
    })
    
    item = s.get_item(ITEM_ID)
    
    # Check already existing files in list_nhac_web_3
    existing_in_archive = {f.name for f in item.get_files()}
    print(f"Files already on {ITEM_ID}:", len(existing_in_archive))
    
    all_local = sorted(list(TEMP_DIR.glob("*.mp3")))
    to_upload = [f for f in all_local if f.name not in existing_in_archive]
    print(f"Local files needing upload: {len(to_upload)}/{len(all_local)}")
    
    for idx, f in enumerate(to_upload, 1):
        print(f"\n({idx}/{len(to_upload)}) Đang upload: {f.name}...")
        try:
            res = item.upload(
                str(f),
                retries=3,
                verbose=False
            )
            print(f"  -> Upload xong! Kết quả: {res}")
        except Exception as e:
            print(f"  [X] Lỗi upload {f.name}: {e}")
            
    print("\n=== HOÀN TẤT UPLOAD. ĐANG ĐỒNG BỘ DATA/NHAC.JSON ===")
    
    with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
        songs = json.load(f)
        
    # Backup
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_file = BACKUP_DIR / f"nhac_backup_web3_{int(time.time())}.json"
    shutil.copyfile(NHAC_JSON_PATH, backup_file)
    
    # Update src URLs: replace list_nhac_web_4 with list_nhac_web_3
    updated_links = 0
    for s_entry in songs:
        src = s_entry.get('src', '')
        if 'list_nhac_web_4' in src:
            s_entry['src'] = src.replace('list_nhac_web_4', ITEM_ID)
            updated_links += 1
            
    songs.sort(key=lambda x: x['title'].lower())
    
    with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=4)
        
    print(f"Đã cập nhật {updated_links} đường dẫn sang {ITEM_ID}.")
    print(f"Tổng số bài hát trong nhac.json: {len(songs)} bài.")

if __name__ == "__main__":
    main()

