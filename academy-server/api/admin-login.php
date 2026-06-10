<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

if (!academy_admin_credentials_configured()) {
    academy_json_response(503, [
        'ok' => false,
        'message' => 'Admin credentials are not configured.'
    ]);
}

$payload = academy_request_payload();
$identity = trim((string) ($payload['username'] ?? $payload['email'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if ($identity === '' || $password === '') {
    academy_json_response(400, ['ok' => false, 'message' => 'Username and password are required.']);
}

if (!academy_admin_check_credentials($identity, $password)) {
    academy_json_response(401, ['ok' => false, 'message' => 'Username or password is incorrect.']);
}

try {
    $token = academy_admin_issue_token(academy_normalize_admin_identity($identity));
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not issue admin token.']);
}

academy_json_response(200, [
    'ok' => true,
    'message' => 'Logged in.',
    'token' => $token,
    'expiresIn' => academy_admin_token_ttl_seconds()
]);
