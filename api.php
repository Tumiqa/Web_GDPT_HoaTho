<?php
/* ============================================================
   GĐPT HÒA THỌ — API Backend
   Đọc/ghi JSON data files. Deploy lên hosting PHP là chạy.
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Allowed modules (maps to data/*.json files)
$ALLOWED_MODULES = ['sinhhoat', 'nhac', 'tailieu', 'kynang', 'bachoc', 'config'];
$DATA_DIR = __DIR__ . '/data/';
$CONFIG_FILE = $DATA_DIR . 'config.json';

// Get module from query string
$module = isset($_GET['module']) ? strtolower(trim($_GET['module'])) : '';

if (!$module || !in_array($module, $ALLOWED_MODULES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid module. Allowed: ' . implode(', ', $ALLOWED_MODULES)]);
    exit;
}

$filePath = $DATA_DIR . $module . '.json';

// ===== GET: Read data =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($filePath)) {
        echo json_encode([]);
        exit;
    }
    $data = file_get_contents($filePath);
    echo $data;
    exit;
}

// ===== POST: Write data (requires auth) =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verify admin token
    $token = isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : '';

    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing X-Admin-Token header']);
        exit;
    }

    // Load config to get password hash
    if (!file_exists($CONFIG_FILE)) {
        http_response_code(500);
        echo json_encode(['error' => 'Config file not found']);
        exit;
    }

    $config = json_decode(file_get_contents($CONFIG_FILE), true);
    $expectedHash = isset($config['adminPasswordHash']) ? $config['adminPasswordHash'] : '';

    // Token should be the SHA-256 hash of the password
    if ($token !== $expectedHash) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid admin token']);
        exit;
    }

    // Read POST body
    $body = file_get_contents('php://input');
    $json = json_decode($body);

    if ($json === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body: ' . json_last_error_msg()]);
        exit;
    }

    // Ensure data directory exists
    if (!is_dir($DATA_DIR)) {
        mkdir($DATA_DIR, 0755, true);
    }

    // Write data
    $result = file_put_contents($filePath, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write file']);
        exit;
    }

    echo json_encode(['success' => true, 'module' => $module, 'bytes' => $result]);
    exit;
}

// Unsupported method
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
