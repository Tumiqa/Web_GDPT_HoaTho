<?php
/* ============================================================
   GĐPT HÒA THỌ — Auth API Endpoint
   Handles: login, logout, me, user management
   ============================================================ */

require_once __DIR__ . '/auth_helpers.php';

header('Content-Type: application/json; charset=utf-8');

// ===== CORS — Chỉ cho phép request từ domain chính thức =====
$allowedOrigins = [
    'https://gdpthoatho.id.vn',
    'https://www.gdpthoatho.id.vn',
    'http://localhost',
    'http://127.0.0.1',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

// ===== Security Headers =====
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Ensure DB is initialized
initAuthDB();

$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';

switch ($action) {

    // ===== LOGIN =====
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Vui lòng nhập tên đăng nhập và mật khẩu']);
            exit;
        }

        // Lookup user
        $user = getUserByUsername($username);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
            exit;
        }

        // Verify password (bcrypt)
        if (!verifyPassword($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Tên đăng nhập hoặc mật khẩu không đúng']);
            exit;
        }

        // Create session
        $token = createSession($user['id']);
        setSessionCookie($token);

        // Tạo CSRF token cho session mới
        generateCsrfToken();

        echo json_encode([
            'success' => true,
            'user' => [
                'id'          => $user['id'],
                'username'    => $user['username'],
                'displayName' => $user['display_name'],
                'role'        => $user['role'],
                'fullName'    => $user['full_name'],
                'dob'         => $user['dob'],
                'position'    => $user['position'],
                'rank'        => $user['rank'],
                'studyLevel'  => $user['study_level'],
                'dharmaName'  => $user['dharma_name'],
                'avatarUrl'   => $user['avatar_url'] ?? '',
                'nganh'       => $user['nganh'] ?? '',
            ]
        ]);
        break;

    // ===== LOGOUT =====
    case 'logout':
        $currentUser = getCurrentUser();
        if ($currentUser) {
            deleteSession($currentUser['sessionId']);
        }
        clearSessionCookie();
        echo json_encode(['success' => true]);
        break;

    // ===== GET CURRENT USER =====
    case 'me':
        $currentUser = getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Chưa đăng nhập', 'authenticated' => false]);
            exit;
        }
        echo json_encode([
            'authenticated' => true,
            'user' => [
                'id'          => $currentUser['userId'],
                'username'    => $currentUser['username'],
                'displayName' => $currentUser['displayName'],
                'role'        => $currentUser['role'],
                'fullName'    => $currentUser['fullName'],
                'dob'         => $currentUser['dob'],
                'position'    => $currentUser['position'],
                'rank'        => $currentUser['rank'],
                'studyLevel'  => $currentUser['studyLevel'],
                'dharmaName'  => $currentUser['dharmaName'],
                'avatarUrl'   => $currentUser['avatarUrl'] ?? '',
                'nganh'       => $currentUser['nganh'] ?? '',
            ]
        ]);
        break;

    // ===== CREATE USER (Admin only) =====
    case 'create-user':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $admin = requireRole('admin');

        $body = json_decode(file_get_contents('php://input'), true);
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        $displayName = trim($body['displayName'] ?? $username);
        $role = $body['role'] ?? 'member';

        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Cần có tên đăng nhập và mật khẩu']);
            exit;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Mật khẩu phải có ít nhất 6 ký tự']);
            exit;
        }

        $fullName = trim($body['fullName'] ?? '');
        $dob = trim($body['dob'] ?? '');
        $position = trim($body['position'] ?? '');
        $rank = trim($body['rank'] ?? '');
        $studyLevel = trim($body['studyLevel'] ?? '');
        $dharmaName = trim($body['dharmaName'] ?? '');
        $nganh = trim($body['nganh'] ?? '');

        if (!in_array($role, ['admin', 'member'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Vai trò không hợp lệ (admin hoặc member)']);
            exit;
        }

        // Only super-admin (0903549528) can create admin accounts
        if ($role === 'admin' && $admin['username'] !== '0903549528') {
            http_response_code(403);
            echo json_encode(['error' => 'Chỉ có tài khoản Admin tối cao (0903549528) mới có quyền tạo tài khoản Admin']);
            exit;
        }

        $newUser = createUser($username, $password, $displayName, $role, $fullName, $dob, $position, $rank, $studyLevel, $dharmaName, $nganh);
        if (!$newUser) {
            http_response_code(409);
            echo json_encode(['error' => 'Tên đăng nhập đã tồn tại']);
            exit;
        }

        echo json_encode(['success' => true, 'user' => $newUser]);
        break;

    // ===== LIST USERS (Admin only) =====
    case 'list-users':
        $admin = requireRole('admin');
        $users = listUsers();
        echo json_encode(['users' => $users]);
        break;

    // ===== DELETE USER (Admin only) =====
    case 'delete-user':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $admin = requireRole('admin');

        $body = json_decode(file_get_contents('php://input'), true);
        $userId = $body['userId'] ?? '';

        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu userId']);
            exit;
        }

        // Can't delete yourself
        if ($userId === $admin['userId']) {
            http_response_code(400);
            echo json_encode(['error' => 'Không thể xóa chính mình']);
            exit;
        }

        // Only super-admin (0903549528) is allowed to delete any account
        if ($admin['username'] !== '0903549528') {
            http_response_code(403);
            echo json_encode(['error' => 'Chỉ có tài khoản Admin tối cao (0903549528) mới có quyền xóa tài khoản']);
            exit;
        }

        $deleted = deleteUser($userId);
        if (!$deleted) {
            http_response_code(400);
            echo json_encode(['error' => 'Không thể xóa admin cuối cùng hoặc user không tồn tại']);
            exit;
        }

        // Also delete their sessions
        deleteUserSessions($userId);

        echo json_encode(['success' => true]);
        break;

    // ===== CHANGE PASSWORD (Admin only or self) =====
    case 'change-password':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $currentUser = requireAuth();

        $body = json_decode(file_get_contents('php://input'), true);
        $targetUserId = $body['userId'] ?? $currentUser['userId'];
        $newPassword = $body['newPassword'] ?? '';

        // Only super-admin (0903549528) can change other users' passwords
        if ($targetUserId !== $currentUser['userId']) {
            if ($currentUser['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Không đủ quyền']);
                exit;
            }

            if ($currentUser['username'] !== '0903549528') {
                http_response_code(403);
                echo json_encode(['error' => 'Chỉ có tài khoản Admin tối cao (0903549528) mới có quyền thay đổi mật khẩu của tài khoản khác']);
                exit;
            }
        }

        if (strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Mật khẩu phải có ít nhất 6 ký tự']);
            exit;
        }

        $changed = changePassword($targetUserId, $newPassword);
        if (!$changed) {
            http_response_code(404);
            echo json_encode(['error' => 'User không tồn tại']);
            exit;
        }

        // Invalidate all sessions for target user (force re-login)
        deleteUserSessions($targetUserId);

        echo json_encode(['success' => true]);
        break;

    // ===== UPDATE USER ROLE (Admin only) =====
    case 'update-role':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $admin = requireRole('admin');

        $body = json_decode(file_get_contents('php://input'), true);
        $userId = $body['userId'] ?? '';
        $newRole = $body['role'] ?? '';

        if (!$userId || !$newRole) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu userId hoặc role']);
            exit;
        }

        // Can't change own role
        if ($userId === $admin['userId']) {
            http_response_code(400);
            echo json_encode(['error' => 'Không thể thay đổi vai trò của chính mình']);
            exit;
        }

        // Fetch target user's role to check if we are promoting to admin or demoting an admin
        $db = getAuthDB();
        $stmt = $db->prepare('SELECT username, role FROM users WHERE id = :id');
        $stmt->bindValue(':id', $userId, SQLITE3_TEXT);
        $result = $stmt->execute();
        $targetUser = $result->fetchArray(SQLITE3_ASSOC);
        $stmt->close();
        $db->close();

        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['error' => 'Người dùng không tồn tại']);
            exit;
        }

        // If either the target user is currently an admin OR the new assigned role is 'admin',
        // only allow the developer (username = '0903549528') to perform this action.
        if ($targetUser['role'] === 'admin' || $newRole === 'admin') {
            if ($admin['username'] !== '0903549528') {
                http_response_code(403);
                echo json_encode(['error' => 'Bạn không có quyền quản lý quyền Admin. Chỉ có nhà phát triển mới thực hiện được việc này.']);
                exit;
            }
        }

        $updated = updateUserRole($userId, $newRole);
        if (!$updated) {
            http_response_code(400);
            echo json_encode(['error' => 'Không thể cập nhật vai trò']);
            exit;
        }

        echo json_encode(['success' => true]);
        break;

    // ===== UPDATE USER PROFILE =====
    case 'update-profile':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $currentUser = requireAuth();

        $body = json_decode(file_get_contents('php://input'), true);
        $targetUserId = trim($body['userId'] ?? '');
        $fullName = trim($body['fullName'] ?? '');
        $dob = trim($body['dob'] ?? '');
        $dharmaName = trim($body['dharmaName'] ?? '');
        $position = trim($body['position'] ?? '');
        $rank = trim($body['rank'] ?? '');
        $studyLevel = trim($body['studyLevel'] ?? '');
        $nganh = trim($body['nganh'] ?? '');

        if (!$fullName) {
            http_response_code(400);
            echo json_encode(['error' => 'Họ và tên không được để trống']);
            exit;
        }

        // If updating another user's profile
        if ($targetUserId && $targetUserId !== $currentUser['userId']) {
            if ($currentUser['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Bạn không có quyền chỉnh sửa thông tin người dùng khác']);
                exit;
            }

            if ($currentUser['username'] !== '0903549528') {
                http_response_code(403);
                echo json_encode(['error' => 'Chỉ có tài khoản Admin tối cao (0903549528) mới có quyền chỉnh sửa thông tin cá nhân của đoàn sinh']);
                exit;
            }

            updateUserProfileByAdmin($targetUserId, $fullName, $dob, $dharmaName, $position, $rank, $studyLevel, $nganh);
            echo json_encode(['success' => true]);
            exit;
        }

        // Updating own profile
        $updated = updateProfile($currentUser['userId'], $fullName, $dob, $dharmaName, $position, $rank, $studyLevel, $nganh);
        echo json_encode(['success' => true]);
        break;

    // ===== UPLOAD AVATAR =====
    case 'upload-avatar':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }

        $currentUser = requireAuth();

        if (!isset($_FILES['avatar'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Không tìm thấy file tải lên']);
            exit;
        }

        $file = $_FILES['avatar'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Lỗi tải file lên server']);
            exit;
        }

        // Validate size (max 2MB)
        if ($file['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['error' => 'Kích thước ảnh tối đa là 2MB']);
            exit;
        }

        // Validate MIME type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Chỉ chấp nhận các định dạng ảnh JPEG, PNG, GIF, WebP']);
            exit;
        }

        // Determine extension
        $ext = 'jpg';
        if ($mimeType === 'image/png') $ext = 'png';
        elseif ($mimeType === 'image/gif') $ext = 'gif';
        elseif ($mimeType === 'image/webp') $ext = 'webp';

        // Prepare upload directory
        $uploadDir = __DIR__ . '/uploads/avatars';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate clean file name
        $fileName = $currentUser['userId'] . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        // Delete old avatar if it exists
        if (!empty($currentUser['avatarUrl'])) {
            $oldPath = __DIR__ . '/' . ltrim($currentUser['avatarUrl'], '/');
            if (file_exists($oldPath) && is_file($oldPath)) {
                @unlink($oldPath);
            }
        }

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $avatarUrl = 'uploads/avatars/' . $fileName;
            
            // Update database
            $updated = updateUserAvatar($currentUser['userId'], $avatarUrl);
            if ($updated) {
                echo json_encode(['success' => true, 'avatarUrl' => $avatarUrl]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Không thể cập nhật avatar vào database']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Không thể lưu file trên máy chủ']);
        }
        break;

    // ===== LIST EXAMS =====
    case 'list-exams':
        $currentUser = getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Vui lòng đăng nhập để xem đề thi', 'exams' => []]);
            exit;
        }
        $nganh = isset($_GET['nganh']) ? trim($_GET['nganh']) : null;
        $bac = isset($_GET['bac']) ? trim($_GET['bac']) : null;
        $isAdmin = ($currentUser['role'] === 'admin');
        
        $exams = listExams($nganh, $bac, $isAdmin);
        echo json_encode(['exams' => $exams]);
        break;

    // ===== GET EXAM =====
    case 'get-exam':
        $currentUser = getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Vui lòng đăng nhập để vào làm đề thi']);
            exit;
        }
        $id = isset($_GET['id']) ? trim($_GET['id']) : '';
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu mã đề thi']);
            exit;
        }
        $exam = getExamById($id);
        if (!$exam) {
            http_response_code(404);
            echo json_encode(['error' => 'Không tìm thấy đề thi']);
            exit;
        }
        echo json_encode(['exam' => $exam]);
        break;

    // ===== SUBMIT EXAM =====
    case 'submit-exam':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        $currentUser = getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Vui lòng đăng nhập để làm bài thi']);
            exit;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $examId = trim($body['examId'] ?? '');
        $userAnswers = $body['answers'] ?? [];
        $timeSpent = max(0, intval($body['timeSpentSeconds'] ?? 0));
        $tabSwitches = max(0, intval($body['tabSwitches'] ?? 0));

        if (!$examId) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu mã đề thi']);
            exit;
        }

        $result = submitExamResult($examId, $currentUser['userId'], $userAnswers, $timeSpent, $tabSwitches);
        if (isset($result['error'])) {
            http_response_code(400);
            echo json_encode($result);
            exit;
        }

        echo json_encode(['success' => true, 'result' => $result]);
        break;

    // ===== USER EXAM RESULTS =====
    case 'user-exam-results':
        $currentUser = getCurrentUser();
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Chưa đăng nhập']);
            exit;
        }
        $results = getUserExamResults($currentUser['userId']);
        echo json_encode(['results' => $results]);
        break;

    // ===== ADMIN SAVE EXAM (Admin only) =====
    case 'admin-save-exam':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        $currentUser = getCurrentUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Quyền hạn bị từ chối']);
            exit;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) {
            http_response_code(400);
            echo json_encode(['error' => 'Dữ liệu không hợp lệ']);
            exit;
        }

        $saved = saveExam($body);
        echo json_encode(['success' => true, 'exam' => $saved]);
        break;

    // ===== ADMIN DELETE EXAM (Admin only) =====
    case 'admin-delete-exam':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        $currentUser = getCurrentUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Quyền hạn bị từ chối']);
            exit;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $id = trim($body['id'] ?? '');
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu ID đề thi']);
            exit;
        }

        deleteExam($id);
        echo json_encode(['success' => true]);
        break;

    // ===== ADMIN LIST ALL EXAM RESULTS (Admin only) =====
    case 'admin-list-exam-results':
        $currentUser = getCurrentUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Quyền hạn bị từ chối']);
            exit;
        }
        $results = getAllExamResults();
        echo json_encode(['results' => $results]);
        break;

    // ===== UPLOAD EXAM IMAGE (Admin only) =====
    case 'upload-exam-image':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        $currentUser = getCurrentUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Quyền hạn bị từ chối']);
            exit;
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Vui lòng chọn tệp hình ảnh hợp lệ']);
            exit;
        }

        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(['error' => 'Chỉ chấp nhận các tệp ảnh JPG, PNG, GIF, WEBP']);
            exit;
        }

        $uploadDir = __DIR__ . '/uploads/exam';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = 'q_' . time() . '_' . generateSecureId(6) . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            echo json_encode(['success' => true, 'imageUrl' => 'uploads/exam/' . $fileName]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Không thể lưu tệp ảnh']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
