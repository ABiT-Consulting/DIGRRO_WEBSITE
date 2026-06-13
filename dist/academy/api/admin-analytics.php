<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

academy_admin_require_authenticated();

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

try {
    $pdo = academy_pdo();
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not open the academy database.']);
}

function academy_admin_analytics_count(PDO $pdo, string $sql, array $params = []): int
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return (int) $statement->fetchColumn();
}

function academy_admin_analytics_event_counts(PDO $pdo, string $since): array
{
    $statement = $pdo->prepare(
        'SELECT event_name, COUNT(*) AS event_count
         FROM academy_analytics_events
         WHERE occurred_at >= :since
         GROUP BY event_name
         ORDER BY event_count DESC, event_name ASC'
    );
    $statement->execute(['since' => $since]);

    $counts = [];
    foreach ($statement->fetchAll() as $row) {
        $counts[(string) $row['event_name']] = (int) $row['event_count'];
    }
    return $counts;
}

function academy_admin_analytics_daily(PDO $pdo, string $since): array
{
    $statement = $pdo->prepare(
        'SELECT substr(occurred_at, 1, 10) AS day,
                COUNT(*) AS events,
                COUNT(DISTINCT session_id) AS visitors,
                SUM(CASE WHEN event_name = "page_view" THEN 1 ELSE 0 END) AS page_views,
                SUM(CASE WHEN event_name = "subscribe_click" THEN 1 ELSE 0 END) AS subscribe_clicks,
                SUM(CASE WHEN event_name = "registration_success" THEN 1 ELSE 0 END) AS successful_registrations
         FROM academy_analytics_events
         WHERE occurred_at >= :since
         GROUP BY substr(occurred_at, 1, 10)
         ORDER BY day DESC
         LIMIT 30'
    );
    $statement->execute(['since' => $since]);

    $items = [];
    foreach ($statement->fetchAll() as $row) {
        $items[] = [
            'day' => (string) $row['day'],
            'events' => (int) $row['events'],
            'visitors' => (int) $row['visitors'],
            'pageViews' => (int) $row['page_views'],
            'subscribeClicks' => (int) $row['subscribe_clicks'],
            'successfulRegistrations' => (int) $row['successful_registrations'],
        ];
    }
    return $items;
}

function academy_admin_analytics_recent_events(PDO $pdo, string $since): array
{
    $statement = $pdo->prepare(
        'SELECT event_name, session_id, page_path, referrer, metadata_json, occurred_at
         FROM academy_analytics_events
         WHERE occurred_at >= :since
         ORDER BY occurred_at DESC, id DESC
         LIMIT 80'
    );
    $statement->execute(['since' => $since]);

    $events = [];
    foreach ($statement->fetchAll() as $row) {
        $metadata = json_decode((string) ($row['metadata_json'] ?? '{}'), true);
        $events[] = [
            'eventName' => (string) $row['event_name'],
            'sessionId' => substr((string) $row['session_id'], 0, 12),
            'pagePath' => (string) ($row['page_path'] ?? ''),
            'referrer' => (string) ($row['referrer'] ?? ''),
            'metadata' => is_array($metadata) ? $metadata : [],
            'occurredAt' => (string) $row['occurred_at'],
        ];
    }
    return $events;
}

$daysQuery = $_GET['days'] ?? '30';
$days = is_string($daysQuery) && ctype_digit($daysQuery) ? (int) $daysQuery : 30;
$days = max(1, min(365, $days));
$since = gmdate('Y-m-d H:i:s', time() - ($days * 86400));
$eventCounts = academy_admin_analytics_event_counts($pdo, $since);

$summary = [
    'days' => $days,
    'visitors' => academy_admin_analytics_count(
        $pdo,
        'SELECT COUNT(DISTINCT session_id) FROM academy_analytics_events WHERE occurred_at >= :since',
        ['since' => $since]
    ),
    'pageViews' => (int) ($eventCounts['page_view'] ?? 0),
    'subscribeClicks' => (int) ($eventCounts['subscribe_click'] ?? 0),
    'registrationAttempts' => (int) ($eventCounts['registration_attempt'] ?? 0),
    'registrationSuccesses' => (int) ($eventCounts['registration_success'] ?? 0),
    'registrationFailures' => (int) ($eventCounts['registration_failure'] ?? 0),
    'checkoutRedirects' => (int) ($eventCounts['checkout_redirect'] ?? 0),
    'studentAccounts' => academy_admin_analytics_count($pdo, 'SELECT COUNT(*) FROM academy_accounts'),
    'enrollments' => academy_admin_analytics_count($pdo, 'SELECT COUNT(*) FROM academy_enrollments'),
    'paidEnrollments' => academy_admin_analytics_count(
        $pdo,
        'SELECT COUNT(*) FROM academy_enrollments
         WHERE payment_status IN ("paid", "no_payment_required")
            OR academic_status = "payment_received"
            OR paid_at IS NOT NULL'
    ),
];

academy_json_response(200, [
    'ok' => true,
    'summary' => $summary,
    'eventCounts' => $eventCounts,
    'daily' => academy_admin_analytics_daily($pdo, $since),
    'recentEvents' => academy_admin_analytics_recent_events($pdo, $since),
]);
