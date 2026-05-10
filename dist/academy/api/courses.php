<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

try {
    $plans = academy_plans();
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not load courses.']);
}

$publicCourses = [];
foreach ($plans as $plan) {
    if (isset($plan['isActive']) && !$plan['isActive']) {
        continue;
    }
    $publicCourses[] = [
        'key' => $plan['key'] ?? '',
        'label' => $plan['label'] ?? '',
        'amountUsd' => (float) ($plan['amountUsd'] ?? 0),
        'priceText' => '$' . number_format((float) ($plan['amountUsd'] ?? 0), 0),
        'durationText' => $plan['durationText'] ?? '',
        'audienceText' => $plan['audienceText'] ?? '',
        'teacherName' => $plan['teacherName'] ?? '',
        'badge' => $plan['badge'] ?? '',
        'description' => $plan['description'] ?? '',
        'features' => $plan['features'] ?? [],
        'displayOrder' => $plan['displayOrder'] ?? 0
    ];
}

academy_json_response(200, ['ok' => true, 'courses' => $publicCourses]);
