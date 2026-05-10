<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

try {
    $pdo = academy_pdo();
    $account = academy_student_require_authenticated($pdo);
    academy_json_response(200, [
        'ok' => true,
        'dashboard' => academy_student_dashboard($pdo, $account)
    ]);
} catch (Throwable $error) {
    academy_json_response(500, [
        'ok' => false,
        'message' => 'We could not load your academy dashboard right now.'
    ]);
}
