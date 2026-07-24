<?php
/* ============================================================
   GĐPT HÒA THỌ — Form Registration Webhook API
   Nhận dữ liệu từ Google Apps Script (Google Form)
   Tự động tạo tài khoản hoặc nhắc lại thông tin đăng nhập
   ============================================================ */

require_once __DIR__ . '/auth_helpers.php';

header('Content-Type: application/json; charset=utf-8');

// ===== CORS — Cho phép Google Apps Script gọi =====
// Google Apps Script gọi từ script.google.com hoặc script.googleusercontent.com
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Secret');

// ===== Security Headers =====
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ===== CHỈ CHO PHÉP POST =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Only POST is accepted.']);
    exit;
}

// ===== WEBHOOK SECRET — Xác thực request từ Google Apps Script =====
// Thay đổi secret này và cập nhật trong Google Apps Script
define('WEBHOOK_SECRET', 'GDPT_HoaTho_Webhook_2026_s3cR3t');

$incomingSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '';
if (!hash_equals(WEBHOOK_SECRET, $incomingSecret)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid webhook secret']);
    exit;
}

// ===== PARSE REQUEST BODY =====
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true);

if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

// ===== EXTRACT & VALIDATE FIELDS =====
$fullNameRaw   = trim($body['fullName'] ?? '');
$phone         = trim($body['phone'] ?? '');
$dharmaNameRaw = trim($body['dharmaName'] ?? '');
$dobDay        = trim($body['dobDay'] ?? '');
$dobMonth      = trim($body['dobMonth'] ?? '');
$dobYear       = trim($body['dobYear'] ?? '');
$address       = trim($body['address'] ?? '');
$groupName     = trim($body['groupName'] ?? '');    // Đoàn: Oanh vũ Nam, Thiếu Nữ, ...
$studyLevel    = trim($body['studyLevel'] ?? '');    // Bậc tu học
$activityTime  = trim($body['activityTime'] ?? '');  // Thời gian sinh hoạt
$email         = trim($body['email'] ?? '');          // Email từ Google Form

// Validate required fields
if (empty($fullNameRaw) || empty($phone) || empty($dobDay) || empty($dobMonth) || empty($dobYear)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: fullName, phone, dobDay, dobMonth, dobYear']);
    exit;
}

// ===== NORMALIZE DATA =====
// Ensure DB is initialized
initAuthDB();

// 1. Title-case Họ tên
$fullName = mbUcwordsVietnamese($fullNameRaw);

// 2. Pháp danh: nếu "Không có" / "không có" / rỗng → set empty
$dharmaName = '';
$dharmaNameNormalized = mb_strtolower(trim($dharmaNameRaw), 'UTF-8');
if (!empty($dharmaNameRaw) && $dharmaNameNormalized !== 'không có' && $dharmaNameNormalized !== 'khong co' && $dharmaNameNormalized !== 'không' && $dharmaNameNormalized !== 'ko' && $dharmaNameNormalized !== 'ko có') {
    $dharmaName = mbUcwordsVietnamese($dharmaNameRaw);
}

// 3. Display name = Pháp danh (nếu có), ngược lại = Tên (từ cuối của họ tên)
$nameParts = explode(' ', $fullName);
$lastName = end($nameParts); // Lấy tên (phần cuối)
$displayName = !empty($dharmaName) ? $dharmaName : $fullName;

// 4. DOB format: DD/MM/YYYY
$dobFormatted = str_pad($dobDay, 2, '0', STR_PAD_LEFT) . '/'
              . str_pad($dobMonth, 2, '0', STR_PAD_LEFT) . '/'
              . $dobYear;

// 5. Phone number cleanup (remove spaces, dashes)
$phone = preg_replace('/[^0-9]/', '', $phone);
// Ensure it starts with 0 (Vietnam phone format)
if (!empty($phone) && $phone[0] !== '0') {
    // If starts with 84 (country code), replace with 0
    if (strpos($phone, '84') === 0 && strlen($phone) > 9) {
        $phone = '0' . substr($phone, 2);
    }
}

// 6. Study level & Position (Huynh trưởng detection — Rule 4)
$position = '';
$rank = '';
$huynhTruongLevels = ['kiên', 'trì', 'định', 'lực'];
$studyLevelLower = mb_strtolower($studyLevel, 'UTF-8');
foreach ($huynhTruongLevels as $htLevel) {
    if (mb_strpos($studyLevelLower, $htLevel) !== false) {
        $position = 'Huynh trưởng';
        break;
    }
}

// Nếu không phải Huynh trưởng, gán position theo Đoàn
if (empty($position) && !empty($groupName)) {
    $position = 'Đoàn sinh';
}

// Title-case study level
if (!empty($studyLevel)) {
    $studyLevel = mbUcwordsVietnamese($studyLevel);
}

// 7. Generate password
$plainPassword = generatePasswordFromForm($dharmaName, $fullName, $dobDay, $dobMonth, $dobYear);

// ===== CHECK EXISTING USER BY PHONE (USERNAME) =====
$existingUser = getUserByUsername($phone);

if ($existingUser) {
    // ===== USER ALREADY EXISTS — Return info for reminder email =====
    // Lưu ý: KHÔNG trả về password hash, không tạo lại
    // Tái tạo mật khẩu từ thông tin hiện có để gửi mail nhắc
    $existDharma = $existingUser['dharma_name'] ?? '';
    $existFullName = $existingUser['full_name'] ?? '';
    $existDob = $existingUser['dob'] ?? '';

    // Parse existing DOB to regenerate password
    $existPassword = '';
    if (!empty($existDob)) {
        $dobParts = explode('/', $existDob);
        if (count($dobParts) === 3) {
            $existPassword = generatePasswordFromForm(
                $existDharma,
                $existFullName,
                $dobParts[0], // day
                $dobParts[1], // month
                $dobParts[2]  // year
            );
        }
    }

    echo json_encode([
        'status'      => 'EXISTS',
        'message'     => 'Tài khoản đã tồn tại',
        'username'    => $phone,
        'password'    => $existPassword,
        'displayName' => $existingUser['display_name'] ?? '',
        'fullName'    => $existingUser['full_name'] ?? '',
        'dharmaName'  => $existingUser['dharma_name'] ?? '',
    ]);
    exit;
}

// ===== CREATE NEW USER =====
$newUser = createUser(
    $phone,           // username = số điện thoại
    $plainPassword,   // mật khẩu plain (sẽ hash bằng bcrypt trong createUser)
    $displayName,     // tên hiển thị
    'member',         // role
    $fullName,        // họ tên đầy đủ
    $dobFormatted,    // ngày sinh DD/MM/YYYY
    $position,        // chức vụ (Huynh trưởng / Đoàn sinh / '')
    $rank,            // cấp (để trống)
    $studyLevel,      // bậc tu học
    $dharmaName       // pháp danh
);

if (!$newUser) {
    // Race condition — user was created between our check and insert
    http_response_code(409);
    echo json_encode([
        'status'  => 'ERROR',
        'message' => 'Không thể tạo tài khoản. Số điện thoại có thể đã được đăng ký.',
    ]);
    exit;
}

echo json_encode([
    'status'      => 'CREATED',
    'message'     => 'Tạo tài khoản thành công',
    'username'    => $phone,
    'password'    => $plainPassword,
    'displayName' => $displayName,
    'fullName'    => $fullName,
    'dharmaName'  => $dharmaName,
    'position'    => $position,
    'studyLevel'  => $studyLevel,
]);
