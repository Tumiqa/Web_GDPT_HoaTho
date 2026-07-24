<?php
// ============================================================
// GĐPT HÒA THỌ — Đồng bộ tài khoản từ Google Sheets
// Chạy bằng Cronjob mỗi 1-5 phút
// 
// Crontab: */1 * * * * php /path/to/cron_sync_sheets.php >> /path/to/sync.log 2>&1
// 
// Kiến trúc Pull:
// Google Form → GAS ghi vào Sheets → PHP kéo từ Sheets → Tạo account trong auth.db
// ============================================================

require_once __DIR__ . '/auth_helpers.php';

// ===== CẤU HÌNH =====
// URL Web App của Google Apps Script (lấy sau khi Deploy GAS)
// Format: https://script.google.com/macros/s/DEPLOY_ID/exec
define('GAS_WEBAPP_URL', 'https://script.google.com/macros/s/AKfycbx1E5SpfPEMpPLihzr3-PdpyQ4a5CslvaSRp9BP5HVObUDSiLi5JIlKqduziOzAaa4o/exec'); // ← PASTE URL SAU KHI DEPLOY GAS

// Mã bí mật (phải khớp với doGet trong Code.gs)
define('SYNC_SECRET', 'GDPT_HoaTho_Sync_2026_s3cR3t');

// Log prefix
define('LOG_PREFIX', '[' . date('Y-m-d H:i:s') . '] ');

// ===== MAIN =====
function main() {
    echo LOG_PREFIX . "Bắt đầu đồng bộ...\n";
    
    if (empty(GAS_WEBAPP_URL)) {
        echo LOG_PREFIX . "❌ Chưa cấu hình GAS_WEBAPP_URL. Hãy deploy GAS Web App và paste URL vào.\n";
        return;
    }
    
    // 1. Lấy danh sách tài khoản chưa đồng bộ
    $pendingUrl = GAS_WEBAPP_URL . '?action=pending&secret=' . urlencode(SYNC_SECRET);
    
    $response = @file_get_contents($pendingUrl);
    if ($response === false) {
        echo LOG_PREFIX . "❌ Không kết nối được GAS Web App\n";
        return;
    }
    
    $data = json_decode($response, true);
    if (!$data || $data['status'] !== 'OK') {
        echo LOG_PREFIX . "❌ Phản hồi không hợp lệ: " . substr($response, 0, 200) . "\n";
        return;
    }
    
    $accounts = $data['accounts'] ?? [];
    $count = count($accounts);
    
    if ($count === 0) {
        echo LOG_PREFIX . "✅ Không có tài khoản mới cần đồng bộ\n";
        return;
    }
    
    echo LOG_PREFIX . "📋 Tìm thấy {$count} tài khoản chưa đồng bộ\n";
    
    // Khởi tạo DB
    initAuthDB();
    
    $syncedRows = [];
    $created = 0;
    $skipped = 0;
    $errors = 0;
    
    foreach ($accounts as $account) {
        $rawUsername = trim($account['username'] ?? '');
        $fullName = trim($account['full_name'] ?? '');
        $displayName = trim($account['display_name'] ?? '');
        $dharmaName = trim($account['dharma_name'] ?? '');
        $dob = trim($account['dob'] ?? '');
        $position = trim($account['position'] ?? '');
        $studyLevel = trim($account['study_level'] ?? '');
        $row = intval($account['row'] ?? 0);
        
        // Cleanup phone number: ensure leading '0'
        $username = preg_replace('/[^0-9]/', '', $rawUsername);
        if (!empty($username) && $username[0] !== '0') {
            if (strpos($username, '84') === 0 && strlen($username) > 9) {
                $username = '0' . substr($username, 2);
            } else {
                $username = '0' . $username;
            }
        }
        
        if (empty($username)) {
            echo LOG_PREFIX . "  ⚠️ Bỏ qua: username rỗng (row {$row})\n";
            $errors++;
            continue;
        }
        
        // Kiểm tra đã tồn tại trong auth.db chưa
        $existing = getUserByUsername($username);
        if ($existing) {
            echo LOG_PREFIX . "  ℹ️ Đã tồn tại: {$username} — đánh dấu synced\n";
            $syncedRows[] = $row;
            $skipped++;
            continue;
        }
        
        // Tạo mật khẩu (cùng thuật toán với GAS)
        $plainPassword = generatePasswordFromSheet($dharmaName, $fullName, $dob);
        if (empty($plainPassword)) {
            echo LOG_PREFIX . "  ❌ Không tạo được MK cho {$username} (thiếu DOB?)\n";
            $errors++;
            continue;
        }
        
        // Standardize DOB format to DD/MM/YYYY
        $dobParts = parseDobToParts($dob);
        $dobFormatted = $dobParts ? "{$dobParts['day']}/{$dobParts['month']}/{$dobParts['year']}" : $dob;
        
        // Tạo user
        $newUser = createUser(
            $username,      // SĐT
            $plainPassword, // MK plain (createUser sẽ hash bcrypt)
            $displayName,   // Tên hiển thị
            'member',       // Role
            $fullName,      // Họ tên
            $dobFormatted,  // Ngày sinh DD/MM/YYYY
            $position,      // Chức vụ
            '',             // Rank (trống)
            $studyLevel,    // Bậc tu học
            $dharmaName     // Pháp danh
        );
        
        if ($newUser) {
            echo LOG_PREFIX . "  ✅ Đã tạo: {$username} ({$fullName})\n";
            $syncedRows[] = $row;
            $created++;
        } else {
            echo LOG_PREFIX . "  ❌ Lỗi tạo user: {$username}\n";
            $errors++;
        }
    }
    
    // 2. Đánh dấu đã đồng bộ trong Google Sheets
    if (!empty($syncedRows)) {
        $markUrl = GAS_WEBAPP_URL 
            . '?action=mark_synced'
            . '&secret=' . urlencode(SYNC_SECRET)
            . '&rows=' . urlencode(implode(',', $syncedRows));
        
        $markResponse = @file_get_contents($markUrl);
        echo LOG_PREFIX . "📝 Đã đánh dấu synced: " . count($syncedRows) . " dòng\n";
    }
    
    echo LOG_PREFIX . "✅ Hoàn tất: +{$created} mới, {$skipped} bỏ qua, {$errors} lỗi\n";
}

/**
 * Parse ngày sinh từ bất kỳ định dạng nào (DD/MM/YYYY, ISO, JS Date string)
 */
function parseDobToParts(string $dob): ?array {
    if (empty($dob)) return null;
    
    // Loại bỏ phần tên múi giờ trong ngoặc đơn như "(Indochina Time)" khiến strtotime bị lỗi
    $dobClean = trim(preg_replace('/\s*\(.*?\)/', '', $dob));
    
    // Format 1: DD/MM/YYYY
    $parts = explode('/', $dobClean);
    if (count($parts) === 3 && is_numeric($parts[0]) && is_numeric($parts[1]) && is_numeric($parts[2])) {
        return [
            'day' => str_pad($parts[0], 2, '0', STR_PAD_LEFT),
            'month' => str_pad($parts[1], 2, '0', STR_PAD_LEFT),
            'year' => $parts[2]
        ];
    }
    
    // Format 2: strtotime (JS Date, ISO string, etc.)
    $ts = strtotime($dobClean);
    if ($ts !== false && $ts > 0) {
        return [
            'day' => date('d', $ts),
            'month' => date('m', $ts),
            'year' => date('Y', $ts)
        ];
    }
    
    // Format 3: Regex YYYY-MM-DD
    if (preg_match('/(\d{4})-(\d{1,2})-(\d{1,2})/', $dobClean, $m)) {
        return [
            'day' => str_pad($m[3], 2, '0', STR_PAD_LEFT),
            'month' => str_pad($m[2], 2, '0', STR_PAD_LEFT),
            'year' => $m[1]
        ];
    }
    
    return null;
}

/**
 * Sinh mật khẩu từ dữ liệu Sheet (cùng thuật toán với GAS)
 */
function generatePasswordFromSheet(string $dharmaName, string $fullName, string $dob): string {
    $dobParts = parseDobToParts($dob);
    if (!$dobParts) return '';
    
    return generatePasswordFromForm($dharmaName, $fullName, $dobParts['day'], $dobParts['month'], $dobParts['year']);
}

// Chạy
main();
