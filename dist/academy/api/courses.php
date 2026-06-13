<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

try {
    $plans = academy_plans();
    $pdo = academy_pdo();
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not load courses.']);
}

$publicCourses = [];
foreach ($plans as $plan) {
    if (isset($plan['isActive']) && !$plan['isActive']) {
        continue;
    }
    $seatLimit = (int) ($plan['seatLimit'] ?? 0);
    $seatCount = academy_enrollment_count_for_plan($pdo, (string) ($plan['key'] ?? ''));
    $seatsRemaining = $seatLimit > 0 ? max(0, $seatLimit - $seatCount) : null;

    $publicCourses[] = [
        'key' => $plan['key'] ?? '',
        'label' => $plan['label'] ?? '',
        'amountUsd' => (float) ($plan['amountUsd'] ?? 0),
        'priceText' => '$' . number_format((float) ($plan['amountUsd'] ?? 0), 0),
        'studentDiscountEnabled' => (bool) ($plan['studentDiscountEnabled'] ?? true),
        'studentDiscountPercent' => (float) ($plan['studentDiscountPercent'] ?? academy_student_discount_percent()),
        'studentDiscountAmountUsd' => academy_discounted_amount_usd($plan, [
            'discount_percent' => (float) ($plan['studentDiscountPercent'] ?? academy_student_discount_percent()),
        ]),
        'studentDiscountPriceText' => '$' . number_format(academy_discounted_amount_usd($plan, [
            'discount_percent' => (float) ($plan['studentDiscountPercent'] ?? academy_student_discount_percent()),
        ]), 0),
        'durationText' => $plan['durationText'] ?? '',
        'audienceText' => $plan['audienceText'] ?? '',
        'teacherName' => $plan['teacherName'] ?? '',
        'badge' => $plan['badge'] ?? '',
        'description' => $plan['description'] ?? '',
        'features' => $plan['features'] ?? [],
        'displayOrder' => $plan['displayOrder'] ?? 0,
        'seatLimit' => $seatLimit,
        'seatCount' => $seatCount,
        'seatsRemaining' => $seatsRemaining,
        'isFull' => $seatLimit > 0 && $seatsRemaining === 0
    ];
}

academy_json_response(200, ['ok' => true, 'courses' => $publicCourses]);
