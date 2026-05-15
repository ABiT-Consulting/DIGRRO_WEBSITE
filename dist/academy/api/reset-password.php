<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function academy_find_account_by_password_reset_token(PDO $pdo, string $token): ?array
{
    $statement = $pdo->prepare(
        'SELECT *
         FROM academy_accounts
         WHERE password_reset_token = :token
           AND password_reset_used_at IS NULL
           AND password_reset_expires_at IS NOT NULL
           AND datetime(password_reset_expires_at) >= datetime("now")
         LIMIT 1'
    );
    $statement->execute(['token' => $token]);
    $account = $statement->fetch();

    return is_array($account) ? $account : null;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $token = trim((string) ($_GET['token'] ?? ''));
    if ($token === '') {
        academy_json_response(400, ['ok' => false, 'message' => 'Reset link is missing.']);
    }

    try {
        $pdo = academy_pdo();
        $account = academy_find_account_by_password_reset_token($pdo, $token);
        if ($account === null) {
            academy_json_response(400, ['ok' => false, 'message' => 'This reset link is invalid or has expired.']);
        }

        academy_json_response(200, ['ok' => true, 'message' => 'Reset link is valid.']);
    } catch (Throwable $error) {
        academy_json_response(500, ['ok' => false, 'message' => 'We could not verify the reset link right now.']);
    }
}

if ($method !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$payload = academy_request_payload();
$token = trim((string) ($payload['token'] ?? ''));
$password = (string) ($payload['password'] ?? '');
$confirmPassword = (string) ($payload['confirmPassword'] ?? '');

if ($token === '') {
    academy_json_response(400, ['ok' => false, 'message' => 'Reset link is missing.']);
}

if (strlen($password) < 8) {
    academy_json_response(400, ['ok' => false, 'message' => 'Use a password with at least 8 characters.']);
}

if ($password !== $confirmPassword) {
    academy_json_response(400, ['ok' => false, 'message' => 'Password and confirm password must match.']);
}

try {
    $pdo = academy_pdo();
    $account = academy_find_account_by_password_reset_token($pdo, $token);
    if ($account === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'This reset link is invalid or has expired.']);
    }

    $statement = $pdo->prepare(
        'UPDATE academy_accounts
         SET password_hash = :password_hash,
             password_reset_token = NULL,
             password_reset_expires_at = NULL,
             password_reset_used_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );
    $statement->execute([
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'id' => (int) $account['id'],
    ]);

    academy_json_response(200, [
        'ok' => true,
        'message' => 'Your password has been reset. You can log in with the new password now.'
    ]);
} catch (Throwable $error) {
    academy_json_response(500, [
        'ok' => false,
        'message' => 'We could not reset your password right now. Please try again in a moment.'
    ]);
}
