<?php
/* ============================================================
   GĐPT HÒA THỌ — API Backend v3.0
   Đọc/ghi JSON data files + auto backup
   Auth: Session-based (backward-compatible with X-Admin-Token)
   ============================================================ */

require_once __DIR__ . '/auth_helpers.php';

header('Content-Type: application/json; charset=utf-8');

// ===== CORS — Chỉ cho phép request từ domain chính thức =====
// Wildcard '*' đã bị thay thế bằng domain cụ thể để tăng bảo mật
$allowedOrigins = [
    'https://gdpthoatho.id.vn',
    'https://www.gdpthoatho.id.vn',
    'http://localhost',
    'http://127.0.0.1',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback: cho phép same-origin (không gửi header → trình duyệt tự cho phép)
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

// ===== Security Headers cho API Response =====
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$ALLOWED_MODULES = ['sinhhoat', 'nhac', 'tailieu', 'kynang'];
$DATA_DIR = __DIR__ . '/data/';
$BACKUP_DIR = $DATA_DIR . 'backups/';
$CONFIG_FILE = $DATA_DIR . 'config.json';

$module = isset($_GET['module']) ? strtolower(trim($_GET['module'])) : '';

if (!$module || !in_array($module, $ALLOWED_MODULES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid module. Allowed: ' . implode(', ', $ALLOWED_MODULES)]);
    exit;
}

$filePath = $DATA_DIR . $module . '.json';

// ===== FILE UPLOAD: Upload document files (tailieu module only) =====
$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';

if ($action === 'upload' && $module === 'tailieu' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Auth check — admin only
    $currentUser = getCurrentUser();
    if (!$currentUser || $currentUser['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Bạn không có quyền upload file (cần quyền Admin)']);
        exit;
    }

    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Không tìm thấy file tải lên']);
        exit;
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Lỗi tải file lên server (code: ' . $file['error'] . ')']);
        exit;
    }

    // Validate size (max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Kích thước file tối đa là 10MB']);
        exit;
    }

    // Validate MIME type
    $allowedMimes = [
        'application/pdf'                                                                 => 'pdf',
        'application/msword'                                                              => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'          => 'docx',
        'application/vnd.ms-excel'                                                        => 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'                => 'xlsx',
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!isset($allowedMimes[$mimeType])) {
        // Fallback: check file extension
        $origExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        if (!in_array($origExt, $allowedExts)) {
            http_response_code(400);
            echo json_encode(['error' => 'Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX']);
            exit;
        }
        $ext = $origExt;
    } else {
        $ext = $allowedMimes[$mimeType];
    }

    // Prepare upload directory
    $uploadDir = __DIR__ . '/uploads/tailieu';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate clean file name (timestamp + sanitized original name)
    $baseName = pathinfo($file['name'], PATHINFO_FILENAME);
    $baseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $baseName);
    $baseName = substr($baseName, 0, 50); // Limit length
    $fileName = time() . '_' . $baseName . '.' . $ext;
    $destPath = $uploadDir . '/' . $fileName;

    if (move_uploaded_file($file['tmp_name'], $destPath)) {
        $fileUrl = 'uploads/tailieu/' . $fileName;
        echo json_encode([
            'success'  => true,
            'url'      => $fileUrl,
            'fileName' => $file['name'],
            'fileType' => $ext,
            'fileSize' => $file['size'],
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Không thể lưu file trên máy chủ']);
    }
    exit;
}

// ===== GET: Read data (Public — no auth required) =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($filePath)) { echo json_encode([]); exit; }
    echo file_get_contents($filePath);
    exit;
}

// ===== POST: Write data (Auth required — admin role only) =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // --- AUTH CHECK ---
    // Method 1: Session-based auth (new system)
    $currentUser = getCurrentUser();
    $isAuthorized = false;

    if ($currentUser) {
        // Session-based: only admin can write
        if ($currentUser['role'] === 'admin') {
            $isAuthorized = true;
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Bạn không có quyền chỉnh sửa (cần quyền Admin)']);
            exit;
        }
    } else {
        // Method 2: Legacy X-Admin-Token (backward compatibility)
        $token = isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : '';
        if ($token) {
            if (file_exists($CONFIG_FILE)) {
                $config = json_decode(file_get_contents($CONFIG_FILE), true);
                $expectedHash = isset($config['adminPasswordHash']) ? $config['adminPasswordHash'] : '';
                if ($token === $expectedHash) {
                    $isAuthorized = true;
                }
            }
        }
    }

    if (!$isAuthorized) {
        http_response_code(401);
        echo json_encode(['error' => 'Chưa đăng nhập hoặc không đủ quyền']);
        exit;
    }

    $body = file_get_contents('php://input');
    $json = json_decode($body);
    if ($json === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }

    // Ensure directories exist
    if (!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0755, true);
    if (!is_dir($BACKUP_DIR)) mkdir($BACKUP_DIR, 0755, true);

    // Auto backup before overwrite
    if (file_exists($filePath)) {
        $timestamp = date('Y-m-d_His');
        $backupFile = $BACKUP_DIR . $module . '_' . $timestamp . '.json';
        copy($filePath, $backupFile);

        // Keep only last 10 backups per module
        $backups = glob($BACKUP_DIR . $module . '_*.json');
        if (count($backups) > 10) {
            sort($backups);
            $toDelete = array_slice($backups, 0, count($backups) - 10);
            foreach ($toDelete as $old) { unlink($old); }
        }
    }

    // Write data
    $result = file_put_contents($filePath, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($result === false) { http_response_code(500); echo json_encode(['error' => 'Failed to write']); exit; }

    echo json_encode(['success' => true, 'module' => $module, 'bytes' => $result, 'backup' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
