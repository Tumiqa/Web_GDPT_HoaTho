<?php
/* ============================================================
   GĐPT HÒA THỌ — API Backend v2.0
   Đọc/ghi JSON data files + auto backup
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$ALLOWED_MODULES = ['sinhhoat', 'nhac', 'tailieu', 'kynang', 'config'];
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

// ===== GET: Read data =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($filePath)) { echo json_encode([]); exit; }
    echo file_get_contents($filePath);
    exit;
}

// ===== POST: Write data =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : '';
    if (!$token) { http_response_code(401); echo json_encode(['error' => 'Missing X-Admin-Token']); exit; }

    if (!file_exists($CONFIG_FILE)) { http_response_code(500); echo json_encode(['error' => 'Config not found']); exit; }
    $config = json_decode(file_get_contents($CONFIG_FILE), true);
    $expectedHash = isset($config['adminPasswordHash']) ? $config['adminPasswordHash'] : '';

    if ($token !== $expectedHash) { http_response_code(403); echo json_encode(['error' => 'Invalid token']); exit; }

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
