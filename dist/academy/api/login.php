<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$payload = academy_request_payload();
$email = academy_normalize_email((string) ($payload['email'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if ($email === '' || $password === '') {
    academy_json_response(400, ['ok' => false, 'message' => 'Email and password are required.']);
}

try {
    $pdo = academy_pdo();
    $account = academy_find_account($pdo, $email);
    if ($account === null || !password_verify($password, (string) $account['password_hash'])) {
        academy_json_response(401, ['ok' => false, 'message' => 'Email or password is incorrect.']);
    }

    $dashboard = academy_student_dashboard($pdo, $account);
    $response = [
        'ok' => true,
        'message' => 'Logged in.',
        'dashboard' => $dashboard
    ];

    if (academy_student_tokens_configured()) {
        $response['token'] = academy_student_issue_token($account);
        $response['expiresIn'] = academy_student_token_ttl_seconds();
    }

    academy_json_response(200, $response);
} catch (Throwable $error) {
    academy_json_response(500, [
        'ok' => false,
        'message' => 'We could not log you in right now. Please try again in a moment.'
    ]);
}
