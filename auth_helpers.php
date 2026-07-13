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
 * Set session cookie (HttpOnly, Secure, SameSite=Lax)
 */
function setSessionCookie(string $token): void {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie(SESSION_COOKIE_NAME, $token, [
        'expires'  => time() + SESSION_LIFETIME,
        'path'     => '/',
        'httponly'  => true,
        'secure'   => $isSecure,
        'samesite' => 'Lax',
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
        'samesite' => 'Lax',
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
