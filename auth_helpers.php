<?php
/* ============================================================
   GĐPT HÒA THỌ — Auth Helpers (Lucia Auth Philosophy)
   Pure PHP authentication — Zero external dependencies
   Session-based · bcrypt · SHA-256 · Constant-time comparison
   ============================================================ */

// ===== CONFIG =====
define('AUTH_DB_PATH', __DIR__ . '/data/auth.db');
define('SESSION_LIFETIME', 60 * 60 * 24); // 24 hours
define('SESSION_COOKIE_NAME', 'gdpt_session');
define('BCRYPT_COST', 12);

// ===== BRUTE-FORCE PROTECTION CONFIG =====
// Khóa tạm thời sau khi nhập sai mật khẩu liên tục
define('MAX_LOGIN_ATTEMPTS', 5);        // Số lần thử tối đa
define('LOCKOUT_DURATION', 15 * 60);    // Khóa 15 phút (tính bằng giây)
define('CSRF_TOKEN_NAME', 'gdpt_csrf'); // Tên cookie chứa CSRF token

// ===== DATABASE =====

/**
 * Get or create SQLite database connection
 */
function getAuthDB(): SQLite3 {
    $dbDir = dirname(AUTH_DB_PATH);
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0755, true);
    }

    $db = new SQLite3(AUTH_DB_PATH);
    $db->enableExceptions(true);
    $db->exec('PRAGMA journal_mode=WAL');
    $db->exec('PRAGMA foreign_keys=ON');

    return $db;
}

/**
 * Initialize database tables
 */
function initAuthDB(): void {
    $db = getAuthDB();

    $db->exec('
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT "member",
            created_at INTEGER NOT NULL,
            full_name TEXT DEFAULT "",
            dob TEXT DEFAULT "",
            position TEXT DEFAULT "",
            rank TEXT DEFAULT "",
            study_level TEXT DEFAULT "",
            dharma_name TEXT DEFAULT "",
            avatar_url TEXT DEFAULT ""
        )
    ');

    // Attempt to add column if it doesn't exist (for existing DBs)
    try {
        @$db->exec('ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ""');
    } catch (Exception $e) {
        // Ignore if column already exists
    }

    $db->exec('
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            secret_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ');

    // Index for faster session lookups
    $db->exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)');

    $db->close();
}

// ===== SECURE RANDOM STRING =====

/**
 * Generate a cryptographically secure random string (120+ bits entropy)
 * Uses Web Crypto API philosophy — pure random, no Math.random()
 */
function generateSecureId(int $length = 24): string {
    $alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'; // Human-readable, no l/o/0/1
    $bytes = random_bytes($length);
    $id = '';
    for ($i = 0; $i < $length; $i++) {
        $id .= $alphabet[ord($bytes[$i]) % strlen($alphabet)];
    }
    return $id;
}

// ===== PASSWORD HASHING (bcrypt) =====

/**
 * Hash password using bcrypt
 * bcrypt is built into PHP — no external library needed
 */
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Verify password against bcrypt hash
 */
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

// ===== SESSION SECRET HASHING (SHA-256) =====

/**
 * Hash session secret using SHA-256
 * SHA-256 is fine here because secrets have 120+ bits entropy (unguessable)
 */
function hashSessionSecret(string $secret): string {
    return hash('sha256', $secret);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(string $a, string $b): bool {
    return hash_equals($a, $b);
}

// ===== SESSION MANAGEMENT =====

/**
 * Create a new session for user (Lucia Auth pattern)
 * Returns session token: <session_id>.<session_secret>
 */
function createSession(string $userId): string {
    $db = getAuthDB();

    $sessionId = generateSecureId();
    $sessionSecret = generateSecureId();
    $secretHash = hashSessionSecret($sessionSecret);
    $now = time();
    $expiresAt = $now + SESSION_LIFETIME;

    $stmt = $db->prepare('INSERT INTO sessions (id, user_id, secret_hash, created_at, expires_at) VALUES (:id, :uid, :hash, :cat, :eat)');
    $stmt->bindValue(':id', $sessionId, SQLITE3_TEXT);
    $stmt->bindValue(':uid', $userId, SQLITE3_TEXT);
    $stmt->bindValue(':hash', $secretHash, SQLITE3_TEXT);
    $stmt->bindValue(':cat', $now, SQLITE3_INTEGER);
    $stmt->bindValue(':eat', $expiresAt, SQLITE3_INTEGER);
    $stmt->execute();
    $stmt->close();

    // Cleanup expired sessions (housekeeping)
    $db->exec('DELETE FROM sessions WHERE expires_at < ' . $now);

    $db->close();

    // Token format: <id>.<secret>
    return $sessionId . '.' . $sessionSecret;
}

/**
 * Validate session token (Lucia Auth pattern)
 * Parse token → lookup session → verify hash → check expiry
 * Returns user data or null
 */
function validateSession(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;

    $sessionId = $parts[0];
    $sessionSecret = $parts[1];

    $db = getAuthDB();

    // Lookup session + user in one query
    $stmt = $db->prepare('
        SELECT s.id, s.secret_hash, s.created_at, s.expires_at, s.user_id,
               u.username, u.display_name, u.role, u.full_name, u.dob, u.position, u.rank, u.study_level, u.dharma_name, u.avatar_url
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = :sid
    ');
    $stmt->bindValue(':sid', $sessionId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    $stmt->close();

    if (!$row) {
        $db->close();
        return null;
    }

    // Check expiry
    if (time() >= $row['expires_at']) {
        $db->exec("DELETE FROM sessions WHERE id = '" . SQLite3::escapeString($sessionId) . "'");
        $db->close();
        return null;
    }

    // Verify secret (constant-time comparison)
    $tokenSecretHash = hashSessionSecret($sessionSecret);
    if (!constantTimeEqual($tokenSecretHash, $row['secret_hash'])) {
        $db->close();
        return null;
    }

    $db->close();

    return [
        'userId'      => $row['user_id'],
        'username'    => $row['username'],
        'displayName' => $row['display_name'],
        'role'        => $row['role'],
        'fullName'    => $row['full_name'],
        'dob'         => $row['dob'],
        'position'    => $row['position'],
        'rank'        => $row['rank'],
        'studyLevel'  => $row['study_level'],
        'dharmaName'  => $row['dharma_name'],
        'avatarUrl'   => $row['avatar_url'] ?? '',
        'sessionId'   => $row['id'],
        'createdAt'   => $row['created_at'],
        'expiresAt'   => $row['expires_at'],
    ];
}

/**
 * Delete a session (logout)
 */
function deleteSession(string $sessionId): void {
    $db = getAuthDB();
    $stmt = $db->prepare('DELETE FROM sessions WHERE id = :id');
    $stmt->bindValue(':id', $sessionId, SQLITE3_TEXT);
    $stmt->execute();
    $stmt->close();
    $db->close();
}

/**
 * Delete all sessions for a user
 */
function deleteUserSessions(string $userId): void {
    $db = getAuthDB();
    $stmt = $db->prepare('DELETE FROM sessions WHERE user_id = :uid');
    $stmt->bindValue(':uid', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $stmt->close();
    $db->close();
}

// ===== COOKIE MANAGEMENT =====

/**
 * Set session cookie (HttpOnly, Secure, SameSite=Strict)
 * SameSite=Strict: Cookie chỉ gửi kèm request cùng domain
 * → Chống CSRF mạnh nhất (không gửi cookie khi click link từ trang khác)
 */
function setSessionCookie(string $token): void {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(SESSION_COOKIE_NAME, $token, [
        'expires'  => time() + SESSION_LIFETIME,
        'path'     => '/',
        'httponly'  => true,
        'secure'   => $isSecure,
        'samesite' => 'Strict',
    ]);
}

/**
 * Clear session cookie
 */
function clearSessionCookie(): void {
    setcookie(SESSION_COOKIE_NAME, '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'httponly'  => true,
        'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'samesite' => 'Strict',
    ]);
}

/**
 * Get session token from cookie
 */
function getSessionToken(): ?string {
    return $_COOKIE[SESSION_COOKIE_NAME] ?? null;
}

// ===== HIGH-LEVEL AUTH FUNCTIONS =====

/**
 * Get current authenticated user from cookie
 * Returns user data or null
 */
function getCurrentUser(): ?array {
    $token = getSessionToken();
    if (!$token) return null;
    return validateSession($token);
}

/**
 * Require authentication — redirect or return 401
 */
function requireAuth(): array {
    $user = getCurrentUser();
    if (!$user) {
        if (php_sapi_name() === 'cli') {
            die("Not authenticated\n");
        }
        http_response_code(401);
        echo json_encode(['error' => 'Chưa đăng nhập']);
        exit;
    }
    return $user;
}

/**
 * Require specific role
 */
function requireRole(string $role): array {
    $user = requireAuth();
    if ($user['role'] !== $role) {
        http_response_code(403);
        echo json_encode(['error' => 'Không đủ quyền truy cập']);
        exit;
    }
    return $user;
}

// ===== USER MANAGEMENT =====

/**
 * Create a new user (Admin only via CLI/API)
 */
function createUser(
    string $username,
    string $password,
    string $displayName,
    string $role = 'member',
    string $fullName = '',
    string $dob = '',
    string $position = '',
    string $rank = '',
    string $studyLevel = '',
    string $dharmaName = ''
): ?array {
    $db = getAuthDB();

    // Check if username already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE username = :u');
    $stmt->bindValue(':u', $username, SQLITE3_TEXT);
    $result = $stmt->execute();
    if ($result->fetchArray()) {
        $stmt->close();
        $db->close();
        return null; // Username already exists
    }
    $stmt->close();

    $userId = generateSecureId();
    $passwordHash = hashPassword($password);
    $now = time();

    $stmt = $db->prepare('
        INSERT INTO users (id, username, password_hash, display_name, role, created_at, full_name, dob, position, rank, study_level, dharma_name)
        VALUES (:id, :u, :ph, :dn, :r, :ca, :fn, :dob, :pos, :rank, :sl, :dn_name)
    ');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->bindValue(':u', $username, SQLITE3_TEXT);
    $stmt->bindValue(':ph', $passwordHash, SQLITE3_TEXT);
    $stmt->bindValue(':dn', $displayName, SQLITE3_TEXT);
    $stmt->bindValue(':r', $role, SQLITE3_TEXT);
    $stmt->bindValue(':ca', $now, SQLITE3_INTEGER);
    $stmt->bindValue(':fn', $fullName, SQLITE3_TEXT);
    $stmt->bindValue(':dob', $dob, SQLITE3_TEXT);
    $stmt->bindValue(':pos', $position, SQLITE3_TEXT);
    $stmt->bindValue(':rank', $rank, SQLITE3_TEXT);
    $stmt->bindValue(':sl', $studyLevel, SQLITE3_TEXT);
    $stmt->bindValue(':dn_name', $dharmaName, SQLITE3_TEXT);
    $stmt->execute();
    $stmt->close();
    $db->close();

    return [
        'id'          => $userId,
        'username'    => $username,
        'displayName' => $displayName,
        'role'        => $role,
        'fullName'    => $fullName,
        'dob'         => $dob,
        'position'    => $position,
        'rank'        => $rank,
        'studyLevel'  => $studyLevel,
        'dharmaName'  => $dharmaName,
        'createdAt'   => $now,
    ];
}

/**
 * Get user by username
 */
function getUserByUsername(string $username): ?array {
    $db = getAuthDB();
    $stmt = $db->prepare('
        SELECT id, username, password_hash, display_name, role, created_at, full_name, dob, position, rank, study_level, dharma_name, avatar_url
        FROM users WHERE username = :u
    ');
    $stmt->bindValue(':u', $username, SQLITE3_TEXT);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    $stmt->close();
    $db->close();

    return $row ?: null;
}

/**
 * List all users (without password hashes)
 */
function listUsers(): array {
    $db = getAuthDB();
    $result = $db->query('
        SELECT id, username, display_name, role, created_at, full_name, dob, position, rank, study_level, dharma_name, avatar_url 
        FROM users 
        ORDER BY created_at DESC
    ');
    $users = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $users[] = $row;
    }
    $db->close();
    return $users;
}

/**
 * Delete a user and their sessions
 */
function deleteUser(string $userId): bool {
    $db = getAuthDB();

    // Don't allow deleting the last admin
    $stmt = $db->prepare('SELECT COUNT(*) as cnt FROM users WHERE role = "admin" AND id != :id');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    $stmt->close();

    // Check if user being deleted is admin
    $stmt = $db->prepare('SELECT role FROM users WHERE id = :id');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $result = $stmt->execute();
    $userRow = $result->fetchArray(SQLITE3_ASSOC);
    $stmt->close();

    if ($userRow && $userRow['role'] === 'admin' && $row['cnt'] < 1) {
        $db->close();
        return false; // Can't delete last admin
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = :id');
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $changes = $db->changes();
    $stmt->close();
    $db->close();

    return $changes > 0;
}

/**
 * Change user password
 */
function changePassword(string $userId, string $newPassword): bool {
    $db = getAuthDB();
    $newHash = hashPassword($newPassword);
    $stmt = $db->prepare('UPDATE users SET password_hash = :ph WHERE id = :id');
    $stmt->bindValue(':ph', $newHash, SQLITE3_TEXT);
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $changes = $db->changes();
    $stmt->close();
    $db->close();

    return $changes > 0;
}

/**
 * Update user avatar URL
 */
function updateUserAvatar(string $userId, string $avatarUrl): bool {
    $db = getAuthDB();
    $stmt = $db->prepare('UPDATE users SET avatar_url = :av WHERE id = :id');
    $stmt->bindValue(':av', $avatarUrl, SQLITE3_TEXT);
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $changes = $db->changes();
    $stmt->close();
    $db->close();

    return $changes > 0;
}

/**
 * Update user role
 */
function updateUserRole(string $userId, string $newRole): bool {
    if (!in_array($newRole, ['admin', 'member'])) return false;

    $db = getAuthDB();
    $stmt = $db->prepare('UPDATE users SET role = :r WHERE id = :id');
    $stmt->bindValue(':r', $newRole, SQLITE3_TEXT);
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $changes = $db->changes();
    $stmt->close();
    $db->close();

    return $changes > 0;
}

/**
 * Update user profile
 */
function updateProfile(string $userId, string $fullName, string $dob, string $dharmaName): bool {
    $db = getAuthDB();
    $stmt = $db->prepare('
        UPDATE users
        SET full_name = :fn, dob = :dob, dharma_name = :dn
        WHERE id = :id
    ');
    $stmt->bindValue(':fn', $fullName, SQLITE3_TEXT);
    $stmt->bindValue(':dob', $dob, SQLITE3_TEXT);
    $stmt->bindValue(':dn', $dharmaName, SQLITE3_TEXT);
    $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
    $stmt->execute();
    $changes = $db->changes();
    $stmt->close();
    $db->close();

    return $changes > 0;
}

// ============================================================
// VIETNAMESE TEXT PROCESSING — Xử lý tiếng Việt
// Dùng cho tự động tạo tài khoản từ Google Form
// ============================================================

/**
 * Loại bỏ dấu tiếng Việt (Vietnamese accent removal)
 * Ví dụ: "Chúc Vương" → "Chuc Vuong"
 */
function removeVietnameseAccents(string $str): string {
    $search = [
        // Lowercase vowels with accents
        'à','á','ạ','ả','ã',
        'â','ầ','ấ','ậ','ẩ','ẫ',
        'ă','ằ','ắ','ặ','ẳ','ẵ',
        'è','é','ẹ','ẻ','ẽ',
        'ê','ề','ế','ệ','ể','ễ',
        'ì','í','ị','ỉ','ĩ',
        'ò','ó','ọ','ỏ','õ',
        'ô','ồ','ố','ộ','ổ','ỗ',
        'ơ','ờ','ớ','ợ','ở','ỡ',
        'ù','ú','ụ','ủ','ũ',
        'ư','ừ','ứ','ự','ử','ữ',
        'ỳ','ý','ỵ','ỷ','ỹ',
        'đ',
        // Uppercase vowels with accents
        'À','Á','Ạ','Ả','Ã',
        'Â','Ầ','Ấ','Ậ','Ẩ','Ẫ',
        'Ă','Ằ','Ắ','Ặ','Ẳ','Ẵ',
        'È','É','Ẹ','Ẻ','Ẽ',
        'Ê','Ề','Ế','Ệ','Ể','Ễ',
        'Ì','Í','Ị','Ỉ','Ĩ',
        'Ò','Ó','Ọ','Ỏ','Õ',
        'Ô','Ồ','Ố','Ộ','Ổ','Ỗ',
        'Ơ','Ờ','Ớ','Ợ','Ở','Ỡ',
        'Ù','Ú','Ụ','Ủ','Ũ',
        'Ư','Ừ','Ứ','Ự','Ử','Ữ',
        'Ỳ','Ý','Ỵ','Ỷ','Ỹ',
        'Đ',
    ];

    $replace = [
        // Lowercase replacements
        'a','a','a','a','a',
        'a','a','a','a','a','a',
        'a','a','a','a','a','a',
        'e','e','e','e','e',
        'e','e','e','e','e','e',
        'i','i','i','i','i',
        'o','o','o','o','o',
        'o','o','o','o','o','o',
        'o','o','o','o','o','o',
        'u','u','u','u','u',
        'u','u','u','u','u','u',
        'y','y','y','y','y',
        'd',
        // Uppercase replacements
        'A','A','A','A','A',
        'A','A','A','A','A','A',
        'A','A','A','A','A','A',
        'E','E','E','E','E',
        'E','E','E','E','E','E',
        'I','I','I','I','I',
        'O','O','O','O','O',
        'O','O','O','O','O','O',
        'O','O','O','O','O','O',
        'U','U','U','U','U',
        'U','U','U','U','U','U',
        'Y','Y','Y','Y','Y',
        'D',
    ];

    return str_replace($search, $replace, $str);
}

/**
 * Viết hoa chữ cái đầu mỗi từ (Title Case cho tiếng Việt)
 * Ví dụ: "nguyễn văn an" → "Nguyễn Văn An"
 */
function mbUcwordsVietnamese(string $str): string {
    $str = mb_strtolower(trim($str), 'UTF-8');
    // Split by spaces, capitalize first letter of each word
    $words = preg_split('/\s+/', $str);
    $result = [];
    foreach ($words as $word) {
        if ($word === '') continue;
        $result[] = mb_strtoupper(mb_substr($word, 0, 1, 'UTF-8'), 'UTF-8')
                  . mb_substr($word, 1, null, 'UTF-8');
    }
    return implode(' ', $result);
}

/**
 * Sinh mật khẩu tự động theo quy tắc GĐPT Hòa Thọ
 *
 * Có pháp danh:  @PhápdanhKhôngDấu + DDMM
 *   VD: Chúc Vương + 10/03/2004 → @ChucVuong1003
 *
 * Không pháp danh: @HọTênKhôngDấu + DDMMYYYY
 *   VD: Nguyễn Văn An + 10/03/2004 → @NguyenVanAn10032004
 *
 * @param string $dharmaName Pháp danh (đã title-case), rỗng nếu không có
 * @param string $fullName   Họ tên đầy đủ (đã title-case)
 * @param string $dob        Ngày sinh dạng DD/MM/YYYY hoặc MM/DD/YYYY (Google Form)
 * @return string Mật khẩu plain text
 */
function generatePasswordFromForm(string $dharmaName, string $fullName, string $dobDay, string $dobMonth, string $dobYear): string {
    if (!empty($dharmaName)) {
        // Có pháp danh: @PhápdanhKhôngDấu + DDMM
        $nameNoAccent = removeVietnameseAccents($dharmaName);
        $nameNoSpace = str_replace(' ', '', $nameNoAccent);
        $datePart = str_pad($dobDay, 2, '0', STR_PAD_LEFT)
                  . str_pad($dobMonth, 2, '0', STR_PAD_LEFT);
        return '@' . $nameNoSpace . $datePart;
    } else {
        // Không pháp danh: @HọTênKhôngDấu + DDMMYYYY
        $nameNoAccent = removeVietnameseAccents($fullName);
        $nameNoSpace = str_replace(' ', '', $nameNoAccent);
        $datePart = str_pad($dobDay, 2, '0', STR_PAD_LEFT)
                  . str_pad($dobMonth, 2, '0', STR_PAD_LEFT)
                  . $dobYear;
        return '@' . $nameNoSpace . $datePart;
    }
}

// ============================================================
// BRUTE-FORCE PROTECTION — Chống dò mật khẩu
// Khóa tạm thời IP sau khi nhập sai quá MAX_LOGIN_ATTEMPTS lần
// Sử dụng file-based (không cần thêm bảng SQL)
// ============================================================

/**
 * Lấy đường dẫn file lưu số lần đăng nhập thất bại của IP
 * Mỗi IP có 1 file riêng trong data/rate_limit/
 */
function getRateLimitFile(string $ip): string {
    $dir = __DIR__ . '/data/rate_limit/';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    // Sanitize IP thành tên file an toàn
    $safeIp = preg_replace('/[^a-zA-Z0-9\.\-_]/', '_', $ip);
    return $dir . $safeIp . '.json';
}

/**
 * Kiểm tra IP có đang bị khóa tạm thời không
 * Trả về: ['locked' => bool, 'attempts' => int, 'remaining_seconds' => int]
 */
function checkLoginRateLimit(): array {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $file = getRateLimitFile($ip);

    if (!file_exists($file)) {
        return ['locked' => false, 'attempts' => 0, 'remaining_seconds' => 0];
    }

    $data = json_decode(file_get_contents($file), true);
    if (!$data) {
        return ['locked' => false, 'attempts' => 0, 'remaining_seconds' => 0];
    }

    $attempts = $data['attempts'] ?? 0;
    $lockedUntil = $data['locked_until'] ?? 0;

    // Nếu đang trong thời gian khóa
    if ($lockedUntil > time()) {
        $remaining = $lockedUntil - time();
        return [
            'locked' => true,
            'attempts' => $attempts,
            'remaining_seconds' => $remaining,
        ];
    }

    // Nếu thời gian khóa đã hết → reset bộ đếm
    if ($lockedUntil > 0 && $lockedUntil <= time()) {
        unlink($file);
        return ['locked' => false, 'attempts' => 0, 'remaining_seconds' => 0];
    }

    return ['locked' => false, 'attempts' => $attempts, 'remaining_seconds' => 0];
}

/**
 * Ghi nhận 1 lần đăng nhập thất bại
 * Nếu vượt quá MAX_LOGIN_ATTEMPTS → kích hoạt khóa tạm thời
 */
function recordFailedLogin(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $file = getRateLimitFile($ip);

    $data = ['attempts' => 0, 'locked_until' => 0];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?? $data;
    }

    $data['attempts'] = ($data['attempts'] ?? 0) + 1;
    $data['last_attempt'] = time();

    // Vượt quá giới hạn → khóa IP
    if ($data['attempts'] >= MAX_LOGIN_ATTEMPTS) {
        $data['locked_until'] = time() + LOCKOUT_DURATION;
    }

    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

/**
 * Reset bộ đếm khi đăng nhập thành công
 */
function clearLoginAttempts(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $file = getRateLimitFile($ip);
    if (file_exists($file)) {
        unlink($file);
    }
}

/**
 * Dọn dẹp file rate limit đã hết hạn (gọi định kỳ)
 */
function cleanupExpiredRateLimits(): void {
    $dir = __DIR__ . '/data/rate_limit/';
    if (!is_dir($dir)) return;

    $files = glob($dir . '*.json');
    foreach ($files as $file) {
        $data = json_decode(file_get_contents($file), true);
        if (!$data) {
            unlink($file);
            continue;
        }
        // Xóa file cũ hơn 1 giờ (đã hết khóa từ lâu)
        $lastAttempt = $data['last_attempt'] ?? 0;
        if (time() - $lastAttempt > 3600) {
            unlink($file);
        }
    }
}

// ============================================================
// CSRF TOKEN — Chống tấn công Cross-Site Request Forgery
// Tạo token ngẫu nhiên gắn vào session, kiểm tra khi POST
// ============================================================

/**
 * Tạo CSRF token mới (gắn vào cookie)
 * Token sẽ được JS đọc từ cookie và gửi kèm trong Header X-CSRF-Token
 */
function generateCsrfToken(): string {
    $token = bin2hex(random_bytes(32)); // 256-bit random token
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(CSRF_TOKEN_NAME, $token, [
        'expires'  => 0, // Session cookie (hết hạn khi đóng trình duyệt)
        'path'     => '/',
        'httponly'  => false, // JS cần đọc được để gửi kèm header
        'secure'   => $isSecure,
        'samesite' => 'Strict',
    ]);
    return $token;
}

/**
 * Kiểm tra CSRF token từ Header X-CSRF-Token
 * So sánh với giá trị cookie (Double Submit Cookie pattern)
 */
function validateCsrfToken(): bool {
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $cookieToken = $_COOKIE[CSRF_TOKEN_NAME] ?? '';

    // Cả hai phải tồn tại và khớp nhau
    if (empty($headerToken) || empty($cookieToken)) {
        return false;
    }

    return hash_equals($cookieToken, $headerToken);
}
