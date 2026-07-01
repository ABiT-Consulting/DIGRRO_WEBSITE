<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

$payload = academy_request_payload();
$eventName = strtolower(trim((string) ($payload['eventName'] ?? $payload['event_name'] ?? '')));
$sessionId = trim((string) ($payload['sessionId'] ?? $payload['session_id'] ?? ''));
$pagePath = trim((string) ($payload['pagePath'] ?? $payload['page_path'] ?? ''));
$referrer = trim((string) ($payload['referrer'] ?? ''));
$metadata = $payload['metadata'] ?? [];

if ($eventName === '' || !preg_match('/^[a-z0-9_.:-]{2,64}$/', $eventName)) {
    academy_json_response(400, ['ok' => false, 'message' => 'Invalid tracking event.']);
}

if ($sessionId === '' || !preg_match('/^[a-zA-Z0-9_.:-]{8,128}$/', $sessionId)) {
    academy_json_response(400, ['ok' => false, 'message' => 'Invalid tracking session.']);
}

if (!is_array($metadata)) {
    $metadata = [];
}

$cleanMetadata = [];
foreach ($metadata as $key => $value) {
    $key = trim((string) $key);
    if ($key === '' || strlen($key) > 48) {
        continue;
    }

    if (is_scalar($value) || $value === null) {
        $cleanMetadata[$key] = substr((string) $value, 0, 240);
    }
}

$metadataJson = json_encode($cleanMetadata, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($metadataJson === false) {
    $metadataJson = '{}';
}

try {
    $pdo = academy_pdo();
    $statement = $pdo->prepare(
        'INSERT INTO academy_analytics_events (
            event_name, session_id, page_path, referrer, user_agent, ip_hash, metadata_json
         ) VALUES (
            :event_name, :session_id, :page_path, :referrer, :user_agent, :ip_hash, :metadata_json
         )'
    );
    $statement->execute([
        'event_name' => $eventName,
        'session_id' => $sessionId,
        'page_path' => substr($pagePath, 0, 500),
        'referrer' => substr($referrer, 0, 500),
        'user_agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
        'ip_hash' => academy_tracking_hash_ip(academy_tracking_client_ip()),
        'metadata_json' => $metadataJson,
    ]);
} catch (Throwable $error) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not save tracking event.']);
}

academy_json_response(200, ['ok' => true]);
