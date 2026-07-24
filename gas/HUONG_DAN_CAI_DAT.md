# 📋 HƯỚNG DẪN CÀI ĐẶT — Tự Động Tạo Tài Khoản (Kiến Trúc Pull)

## Kiến Trúc Hệ Thống

```
Người dùng điền Form
    ↓
Google Apps Script (xử lý nội bộ)
    ├→ Ghi vào Google Sheets (database tạm)
    └→ Gửi email TK/MK cho người dùng (NGAY LẬP TỨC)
    
Server PHP (Cronjob mỗi phút)
    ├→ Kéo dữ liệu từ Google Sheets (request ĐI RA — không bị WAF chặn)
    └→ Tạo account trong auth.db
```

> 💡 **Tại sao kiến trúc này?** Hosting iNET có tường lửa OneShield+ chặn request ĐI VÀO. 
> Bằng cách để server chủ động PULL dữ liệu (request đi ra), vấn đề WAF biến mất hoàn toàn.

---

## Phần 1: Cài Đặt Google Apps Script

### Bước 1: Bật Thu Thập Email

1. Mở Google Form → ⚙️ Cài đặt → tab **Câu trả lời**
2. Bật **"Thu thập địa chỉ email"** → chọn **"Đã xác minh"**
3. Lưu

### Bước 2: Mở Script Editor

1. Trong Google Form → ⋮ → **"< > Trình chỉnh sửa tập lệnh"**

### Bước 3: Dán Code

1. **Xóa** toàn bộ code mẫu
2. Copy nội dung file `gas/Code.gs` → **Paste** vào
3. Nhấn **💾 Lưu** (Ctrl+S)

### Bước 4: Tạo Sheet Đồng Bộ

1. Chọn hàm **`setupSyncSheet`** → **▶ Run**
2. Cấp quyền khi được yêu cầu
3. Xem Log → **Copy URL của Sheet** (sẽ dùng để kiểm tra)

### Bước 5: Kích Hoạt Trigger

1. Chọn hàm **`setupTrigger`** → **▶ Run**
2. Phải thấy: `✅ Đã tạo trigger onFormSubmit thành công!`

### Bước 6: Test Xử Lý Nội Bộ

1. Chọn hàm **`testLocalProcessing`** → **▶ Run**
2. Kiểm tra tất cả test đều ✅

### Bước 7: Deploy Web App (Để PHP Kéo Dữ Liệu)

1. Trong Apps Script Editor → nhấn **Triển khai** (Deploy) → **Triển khai mới** (New deployment)
2. Chọn loại: **Ứng dụng web** (Web app)
3. Cấu hình:
   - Mô tả: `Sync API`
   - Thực thi với tư cách: **Tôi** (Me)
   - Ai có quyền truy cập: **Bất kỳ ai** (Anyone)
4. Nhấn **Triển khai** (Deploy)
5. **Copy URL Web App** — sẽ có dạng: `https://script.google.com/macros/s/AKfyc.../exec`

### Bước 8: Test Form Đầy Đủ

1. Mở Google Form → **Preview** (👁️)
2. Điền thông tin test
3. Gửi form
4. Kiểm tra:
   - ✅ Email nhận được thông báo TK/MK
   - ✅ Dữ liệu xuất hiện trong Google Sheet

---

## Phần 2: Cài Đặt PHP Sync (Trên Hosting)

### Bước 1: Cấu Hình URL

Mở file `cron_sync_sheets.php`, dòng ~17, paste URL Web App từ Bước 7:

```php
define('GAS_WEBAPP_URL', 'https://script.google.com/macros/s/AKfyc.../exec');
```

### Bước 2: Upload Lên Hosting

Upload file `cron_sync_sheets.php` lên hosting (cùng thư mục với `auth_helpers.php`)

### Bước 3: Cài Đặt Cronjob

Trong OnePanel → **Cronjob** → thêm:

```
*/1 * * * * php /đường/dẫn/đến/cron_sync_sheets.php >> /đường/dẫn/đến/sync.log 2>&1
```

Hoặc chạy thủ công để test:
```bash
php cron_sync_sheets.php
```

---

## Xử Lý Sự Cố

| Vấn đề | Nguyên nhân | Cách sửa |
|---------|------------|----------|
| Không nhận email | Chưa bật thu thập email | Bước 1 Phần 1 |
| Sheet không có dữ liệu | Trigger chưa tạo | Chạy `setupTrigger()` |
| PHP báo "Chưa cấu hình URL" | Chưa paste URL Web App | Bước 1 Phần 2 |
| PHP báo "Không kết nối được" | URL Web App sai hoặc chưa deploy | Kiểm tra deploy |
| Account chưa có trên web | Cron chưa chạy | Chạy thủ công hoặc đợi cron |

---

## Quy Tắc Mật Khẩu

| Trường hợp | Format | Ví dụ |
|------------|--------|-------|
| **Có pháp danh** | `@PhápdanhKhôngDấu + DDMM` | Chúc Vương + 10/03/2004 → `@ChucVuong1003` |
| **Không có pháp danh** | `@HọTênKhôngDấu + DDMMYYYY` | Nguyễn Văn An + 10/03/2004 → `@NguyenVanAn10032004` |

## Quy Tắc Position

| Bậc tu học chứa | Position |
|-----------------|----------|
| Kiên, Trì, Định, Lực | Huynh trưởng |
| Khác (hoặc trống) | Đoàn sinh |
