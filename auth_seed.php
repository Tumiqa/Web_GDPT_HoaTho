<?php
/* ============================================================
   GĐPT HÒA THỌ — Auth Seed Script
   Run via CLI: php auth_seed.php
   Creates database + default admin & member accounts
   ============================================================ */

// Only allow CLI execution
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script can only be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/auth_helpers.php';

echo "╔══════════════════════════════════════════════╗\n";
echo "║   GĐPT Hòa Thọ — Auth Database Setup        ║\n";
echo "║   Tạo database + tài khoản mặc định          ║\n";
echo "╚══════════════════════════════════════════════╝\n\n";

// Delete existing database file to apply new schema
if (file_exists(AUTH_DB_PATH)) {
    echo "🗑️  Xóa database cũ... ";
    unlink(AUTH_DB_PATH);
    // Delete WAL files if they exist
    if (file_exists(AUTH_DB_PATH . '-wal')) unlink(AUTH_DB_PATH . '-wal');
    if (file_exists(AUTH_DB_PATH . '-shm')) unlink(AUTH_DB_PATH . '-shm');
    echo "✅ Xong\n";
}

// Initialize database
echo "📦 Khởi tạo database mới... ";
initAuthDB();
echo "✅ OK\n";
echo "   → " . AUTH_DB_PATH . "\n\n";

// Create admin account
echo "👤 Tạo tài khoản Admin...\n";
$admin = createUser(
    '0903549528', 
    '@ChucVuong1003', 
    'Chúc Vương', 
    'admin',
    'Trương Minh Quân', // Tên
    '10/03/2004',      // Ngày sinh
    'Huynh trưởng',     // Chức vụ
    'Tập sự',          // Cấp
    'Kiên',            // Bậc học
    'Chúc Vương'       // Pháp Danh
);
if ($admin) {
    echo "   ✅ Username: 0903549528\n";
    echo "   🔑 Password: @ChucVuong1003\n";
    echo "   🏷️  Role: admin\n";
    echo "   📛 Tên hiển thị: Chúc Vương\n";
    echo "   📝 Tên khai sinh: Trương Minh Quân\n\n";
} else {
    echo "   ⚠️  Username '0903549528' đã tồn tại, bỏ qua.\n\n";
}

// Create member account
echo "👤 Tạo tài khoản Member...\n";
$member = createUser(
    'phungvanvu', 
    'member123', 
    'Đức Thuận', 
    'member',
    'Phùng Văn Vũ',    // Tên
    '',                // Ngày sinh
    'Đoàn sinh',       // Chức vụ
    '',                // Cấp
    'Hướng thiện',     // Bậc học
    'Đức Thuận'        // Pháp Danh
);
if ($member) {
    echo "   ✅ Username: phungvanvu\n";
    echo "   🔑 Password: member123\n";
    echo "   🏷️  Role: member\n";
    echo "   📛 Tên hiển thị: Đức Thuận\n";
    echo "   📝 Tên khai sinh: Phùng Văn Vũ\n\n";
} else {
    echo "   ⚠️  Username 'phungvanvu' đã tồn tại, bỏ qua.\n\n";
}

// Summary
echo "════════════════════════════════════════════════\n";
echo "✨ Hoàn tất! Danh sách tài khoản:\n\n";

$users = listUsers();
foreach ($users as $user) {
    $roleEmoji = $user['role'] === 'admin' ? '🔴' : '🔵';
    echo "   {$roleEmoji} {$user['username']} ({$user['display_name']}) — {$user['role']}\n";
}

echo "\n💡 Đăng nhập tại website\n";

