import json
import re
import unicodedata
import requests

NHAC_JSON_PATH = r"D:\Project Ca Nhan\Web_GDPT_HoaTho\data\nhac.json"

# Vietnamese collation alphabet
VN_ALPHABET = "aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ"
VN_MAP = {ch: idx for idx, ch in enumerate(VN_ALPHABET)}

def vn_sort_key(s):
    s = s.lower().strip()
    key = []
    for ch in s:
        if ch in VN_MAP:
            key.append(VN_MAP[ch])
        else:
            key.append(1000 + ord(ch))
    return key

with open(NHAC_JSON_PATH, 'r', encoding='utf-8') as f:
    songs = json.load(f)

print(f"Tổng bài trước khi sắp xếp: {len(songs)}")

# Sắp xếp theo tiếng Việt
songs.sort(key=lambda x: vn_sort_key(x['title']))

# Đánh số ID tuần tự 1..N
for idx, s in enumerate(songs, 1):
    s['id'] = idx
    # Chuẩn hoá khoảng trắng
    s['title'] = s['title'].strip()
    s['artist'] = s['artist'].strip()
    # Format duration if it has single digit minutes e.g. 0:54 -> 00:54
    dur = s.get('duration', '03:00')
    if dur:
        parts = dur.split(':')
        if len(parts) == 2:
            try:
                m = int(parts[0])
                sec = int(parts[1])
                s['duration'] = f"{m:02d}:{sec:02d}"
            except Exception:
                pass

with open(NHAC_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(songs, f, ensure_ascii=False, indent=4)

print(f"Đã cập nhật và sắp xếp {len(songs)} bài hát thành công!")

# Test 5 bài ngẫu nhiên từ Archive.org
print("\n--- TEST HTTP TRUY CẬP STREAM ARCHIVE.ORG ---")
test_indices = [0, 50, 150, 300, 500, len(songs)-1]
for i in test_indices:
    song = songs[i]
    try:
        r = requests.head(song['src'], headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        print(f"[{r.status_code}] ID {song['id']}: {song['title']} -> {song['src'][:80]}...")
    except Exception as e:
        print(f"[ERR] ID {song['id']}: {song['title']} -> {e}")
