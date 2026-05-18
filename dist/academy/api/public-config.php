<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$googleAnalyticsId = academy_env([
    'GOOGLE_ANALYTICS_ID',
    'GA_MEASUREMENT_ID',
    'VITE_GOOGLE_ANALYTICS_ID',
    'VITE_GA_MEASUREMENT_ID',
], '');

if (!is_string($googleAnalyticsId) || !preg_match('/^G-[A-Z0-9]+$/i', $googleAnalyticsId)) {
    $googleAnalyticsId = null;
}

academy_json_response(200, [
    'ok' => true,
    'googleAnalyticsId' => $googleAnalyticsId,
]);
