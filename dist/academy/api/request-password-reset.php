<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$payload = academy_request_payload();
$email = academy_normalize_email((string) ($payload['email'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    academy_json_response(400, ['ok' => false, 'message' => 'Enter the email used for your academy registration.']);
}

$publicMessage = 'If this email is registered, we sent a password reset link.';

try {
    $pdo = academy_pdo();
    $account = academy_find_account($pdo, $email);

    if ($account === null) {
        academy_json_response(200, ['ok' => true, 'message' => $publicMessage]);
    }

    $token = bin2hex(random_bytes(32));
    $expiresAt = academy_password_reset_expires_at();

    $statement = $pdo->prepare(
        'UPDATE academy_accounts
         SET password_reset_token = :token,
             password_reset_sent_at = CURRENT_TIMESTAMP,
             password_reset_expires_at = :expires_at,
             password_reset_used_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );
    $statement->execute([
        'token' => $token,
        'expires_at' => $expiresAt,
        'id' => (int) $account['id'],
    ]);

    $account['password_reset_token'] = $token;
    academy_send_password_reset_email($account);

    academy_json_response(200, ['ok' => true, 'message' => $publicMessage]);
} catch (Throwable $error) {
    academy_json_response(500, [
        'ok' => false,
        'message' => 'We could not send the reset email right now. Please try again in a moment.'
    ]);
}
