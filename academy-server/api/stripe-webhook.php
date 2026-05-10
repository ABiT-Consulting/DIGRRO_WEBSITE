<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, [
        'ok' => false,
        'message' => 'Method not allowed.'
    ]);
}

$webhookSecret = academy_stripe_webhook_secret();
if (!is_string($webhookSecret) || $webhookSecret === '') {
    academy_json_response(503, [
        'ok' => false,
        'message' => 'Stripe webhook signing secret is not configured.'
    ]);
}

$payload = file_get_contents('php://input');
$signatureHeader = (string) ($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');

if (!is_string($payload) || $payload === '' || $signatureHeader === '') {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Missing Stripe webhook payload or signature.'
    ]);
}

if (!academy_stripe_signature_is_valid($payload, $signatureHeader, $webhookSecret)) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Invalid Stripe webhook signature.'
    ]);
}

$event = json_decode($payload, true);
if (!is_array($event)) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Invalid Stripe webhook JSON.'
    ]);
}

$eventType = (string) ($event['type'] ?? '');
$session = $event['data']['object'] ?? null;

if (str_starts_with($eventType, 'checkout.session.') && is_array($session)) {
    academy_apply_checkout_session_to_enrollment(academy_pdo(), $session);
}

academy_json_response(200, [
    'ok' => true
]);
