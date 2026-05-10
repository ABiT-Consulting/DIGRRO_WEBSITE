<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

if (!academy_admin_credentials_configured()) {
    academy_json_response(503, [
        'ok' => false,
        'message' => 'Admin credentials are not configured. Set ACADEMY_ADMIN_EMAIL, ACADEMY_ADMIN_PASSWORD_HASH and ACADEMY_ADMIN_TOKEN_SECRET in your .env file.'
    ]);
}

$payload = academy_request_payload();
$email = trim((string) ($payload['email'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if ($email === '' || $password === '') {
    academy_json_response(400, ['ok' => false, 'message' => 'Email and password are required.']);
}

if (!academy_admin_check_credentials($email, $password)) {
    academy_json_response(401, ['ok' => false, 'message' => 'Email or password is incorrect.']);
}

try {
    $token = academy_admin_issue_token(academy_normalize_email($email));
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not issue admin token.']);
}

academy_json_response(200, [
    'ok' => true,
    'message' => 'Logged in.',
    'token' => $token,
    'expiresIn' => academy_admin_token_ttl_seconds()
]);
