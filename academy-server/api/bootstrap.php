<?php

declare(strict_types=1);

function academy_root_path(): string
{
    return dirname(__DIR__, 2);
}

function academy_load_env(): array
{
    static $env = null;

    if ($env !== null) {
        return $env;
    }

    $env = [];
    $rootPath = academy_root_path();
    $parentRootPath = dirname($rootPath);
    $academyPath = dirname(__DIR__);
    $candidatePaths = [
        $parentRootPath . DIRECTORY_SEPARATOR . '.env',
        $rootPath . DIRECTORY_SEPARATOR . '.env',
        $academyPath . DIRECTORY_SEPARATOR . '.env',
        $parentRootPath . DIRECTORY_SEPARATOR . '.env.local',
        $rootPath . DIRECTORY_SEPARATOR . '.env.local',
        $academyPath . DIRECTORY_SEPARATOR . '.env.local',
    ];

    foreach ($candidatePaths as $path) {
        if (!is_file($path)) {
            continue;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            $delimiter = strpos($trimmed, '=');
            if ($delimiter === false) {
                continue;
            }

            $key = trim(substr($trimmed, 0, $delimiter));
            $value = trim(substr($trimmed, $delimiter + 1));
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            if ($value !== '' || !isset($env[$key]) || trim((string) $env[$key]) === '') {
                $env[$key] = $value;
            }
        }
    }

    return $env;
}

function academy_env(array $keys, ?string $default = null): ?string
{
    $env = academy_load_env();

    foreach ($keys as $key) {
        $serverValue = $_SERVER[$key] ?? null;
        if (is_string($serverValue) && trim($serverValue) !== '') {
            return trim($serverValue);
        }

        $runtimeValue = getenv($key);
        if (is_string($runtimeValue) && trim($runtimeValue) !== '') {
            return trim($runtimeValue);
        }

        if (isset($env[$key]) && trim($env[$key]) !== '') {
            return trim($env[$key]);
        }
    }

    return $default;
}

function academy_env_values(array $keys): array
{
    $env = academy_load_env();
    $values = [];

    foreach ($keys as $key) {
        $serverValue = $_SERVER[$key] ?? null;
        if (is_string($serverValue) && trim($serverValue) !== '') {
            $values[] = trim($serverValue);
        }

        $runtimeValue = getenv($key);
        if (is_string($runtimeValue) && trim($runtimeValue) !== '') {
            $values[] = trim($runtimeValue);
        }

        if (isset($env[$key]) && trim($env[$key]) !== '') {
            $values[] = trim($env[$key]);
        }
    }

    return array_values(array_unique($values));
}

function academy_runtime_environment(): string
{
    $configured = strtolower((string) academy_env(['ACADEMY_ENV', 'APP_ENV', 'STRIPE_MODE', 'STRIPE_ENV'], ''));
    if (in_array($configured, ['production', 'prod', 'live'], true)) {
        return 'production';
    }

    if (in_array($configured, ['development', 'dev', 'local', 'test', 'testing'], true)) {
        return 'development';
    }

    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '' || str_contains($host, 'localhost') || str_starts_with($host, '127.') || $host === '::1') {
        return 'development';
    }

    return 'production';
}

function academy_stripe_key_matches_environment(string $key, string $environment): bool
{
    if ($environment === 'production') {
        return str_starts_with($key, 'sk_live_') || str_starts_with($key, 'rk_live_');
    }

    return str_starts_with($key, 'sk_test_') || str_starts_with($key, 'rk_test_');
}

function academy_first_env_value(array $keys): ?string
{
    $values = academy_env_values($keys);
    return $values[0] ?? null;
}

function academy_json_response(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function academy_request_payload(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        academy_json_response(400, [
            'ok' => false,
            'message' => 'Invalid registration payload.'
        ]);
    }

    return $decoded;
}

function academy_normalize_email(string $value): string
{
    return strtolower(trim($value));
}

function academy_academy_base_url(): string
{
    $configured = academy_env(['ACADEMY_BASE_URL']);
    if (is_string($configured) && $configured !== '') {
        return rtrim($configured, '/');
    }

    $isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $scheme = $isHttps ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/academy/api/register.php');
    $academyPath = dirname(dirname($scriptName));
    if ($academyPath === '.' || $academyPath === DIRECTORY_SEPARATOR) {
        $academyPath = '';
    }

    return $scheme . '://' . $host . rtrim($academyPath, '/');
}

function academy_confirmation_url(string $token): string
{
    return academy_academy_base_url() . '/api/confirm.php?token=' . urlencode($token);
}

function academy_password_reset_url(string $token): string
{
    return academy_academy_base_url() . '/reset-password.html?token=' . urlencode($token);
}

function academy_password_reset_ttl_seconds(): int
{
    $configured = academy_env(['ACADEMY_PASSWORD_RESET_TTL']);
    if (is_string($configured) && ctype_digit($configured)) {
        return max(300, min((int) $configured, 24 * 3600));
    }

    return 3600;
}

function academy_password_reset_expires_at(): string
{
    return gmdate('Y-m-d H:i:s', time() + academy_password_reset_ttl_seconds());
}

function academy_generated_payment_links(): array
{
    static $config = null;

    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . DIRECTORY_SEPARATOR . 'generated-payment-links.json';
    if (!is_file($path)) {
        $config = ['mode' => 'unconfigured', 'links' => []];
        return $config;
    }

    $raw = file_get_contents($path);
    if ($raw === false || trim($raw) === '') {
        $config = ['mode' => 'unconfigured', 'links' => []];
        return $config;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        $config = ['mode' => 'invalid', 'links' => []];
        return $config;
    }

    $config = $decoded;
    return $config;
}

function academy_checkout_url_for_plan(string $planKey): ?string
{
    $links = academy_generated_payment_links()['links'] ?? [];
    $paymentLink = $links[$planKey] ?? null;
    $url = is_array($paymentLink) ? ($paymentLink['url'] ?? null) : null;

    return is_string($url) && trim($url) !== '' ? trim($url) : null;
}

function academy_url_with_query(string $baseUrl, array $queryParams): string
{
    $parts = parse_url($baseUrl);
    if ($parts === false) {
        return $baseUrl;
    }

    $existingQuery = [];
    if (isset($parts['query'])) {
        parse_str($parts['query'], $existingQuery);
    }

    $parts['query'] = http_build_query(array_merge($existingQuery, $queryParams));

    $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
    $user = $parts['user'] ?? '';
    $pass = isset($parts['pass']) ? ':' . $parts['pass'] : '';
    $auth = $user !== '' ? $user . $pass . '@' : '';
    $host = $parts['host'] ?? '';
    $port = isset($parts['port']) ? ':' . $parts['port'] : '';
    $path = $parts['path'] ?? '';
    $query = isset($parts['query']) && $parts['query'] !== '' ? '?' . $parts['query'] : '';
    $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

    return $scheme . $auth . $host . $port . $path . $query . $fragment;
}

function academy_build_checkout_url(string $baseUrl, string $email, string $checkoutReference, string $planKey): string
{
    return academy_url_with_query($baseUrl, [
        'prefilled_email' => $email,
        'client_reference_id' => $checkoutReference,
        'utm_source' => 'digrro_academy',
        'utm_medium' => 'website',
        'utm_campaign' => $planKey,
    ]);
}

function academy_stripe_secret_key(): ?string
{
    $environment = academy_runtime_environment();
    $preferredKeys = $environment === 'production'
        ? ['STRIPE_SECRET_KEY_LIVE', 'STRIPE_LIVE_SECRET_KEY', 'STRIPE_SECRET_LIVE', 'stripe_secret_key_live', 'secret_key_live']
        : ['STRIPE_SECRET_KEY_TEST', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_SECRET_TEST', 'stripe_secret_key_test', 'secret_key_test'];

    $preferred = academy_first_env_value($preferredKeys);
    if (is_string($preferred) && $preferred !== '') {
        return $preferred;
    }

    foreach (academy_env_values([
        'STRIPE_SECRET_KEY',
        'STRIPE_SECRET',
        'STRIPE_SECRET_KEY_LIVE',
        'STRIPE_SECRET_KEY_TEST',
        'stripe_secret_key',
        'secret_key',
        'Secret key',
    ]) as $value) {
        if (academy_stripe_key_matches_environment($value, $environment)) {
            return $value;
        }
    }

    return null;
}

function academy_stripe_webhook_secret(): ?string
{
    $environment = academy_runtime_environment();
    $preferredKeys = $environment === 'production'
        ? ['STRIPE_WEBHOOK_SECRET_LIVE', 'STRIPE_LIVE_WEBHOOK_SECRET']
        : ['STRIPE_WEBHOOK_SECRET_TEST', 'STRIPE_TEST_WEBHOOK_SECRET'];

    $preferred = academy_first_env_value($preferredKeys);
    if (is_string($preferred) && $preferred !== '') {
        return $preferred;
    }

    return academy_env([
        'STRIPE_WEBHOOK_SECRET',
        'stripe_webhook_secret',
        'Webhook signing secret',
    ]);
}

function academy_stripe_api_version(): string
{
    return '2026-02-25.clover';
}

function academy_stripe_form_encode(array $params): string
{
    return http_build_query($params, '', '&', PHP_QUERY_RFC3986);
}

function academy_stripe_request(string $method, string $path, array $params = []): array
{
    $secretKey = academy_stripe_secret_key();
    if (!is_string($secretKey) || $secretKey === '') {
        throw new RuntimeException('Stripe secret key is not configured.');
    }

    $method = strtoupper($method);
    $url = 'https://api.stripe.com/v1/' . ltrim($path, '/');
    $body = academy_stripe_form_encode($params);

    if ($method === 'GET' && $body !== '') {
        $url .= (str_contains($url, '?') ? '&' : '?') . $body;
        $body = '';
    }

    $headers = [
        'Authorization: Bearer ' . $secretKey,
        'Stripe-Version: ' . academy_stripe_api_version(),
    ];

    if ($method !== 'GET') {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
    }

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        if ($curl === false) {
            throw new RuntimeException('Could not initialize Stripe request.');
        }

        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($method !== 'GET') {
            curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        }

        $rawResponse = curl_exec($curl);
        $statusCode = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $errorMessage = curl_error($curl);
        curl_close($curl);

        if ($rawResponse === false) {
            throw new RuntimeException('Could not reach Stripe. ' . $errorMessage);
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $method === 'GET' ? '' : $body,
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ]);

        $rawResponse = file_get_contents($url, false, $context);
        $statusCode = 0;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $headerLine) {
                if (preg_match('/^HTTP\/\S+\s+(\d+)/', $headerLine, $matches) === 1) {
                    $statusCode = (int) $matches[1];
                    break;
                }
            }
        }

        if ($rawResponse === false) {
            throw new RuntimeException('Could not reach Stripe.');
        }
    }

    $decoded = json_decode($rawResponse, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe returned an invalid response.');
    }

    if ($statusCode < 200 || $statusCode >= 300) {
        $message = $decoded['error']['message'] ?? 'Stripe rejected the checkout request.';
        throw new RuntimeException((string) $message);
    }

    return $decoded;
}

function academy_checkout_success_url(): string
{
    return academy_academy_base_url() . '/api/checkout-complete.php?session_id={CHECKOUT_SESSION_ID}';
}

function academy_checkout_cancel_url(string $planKey): string
{
    return academy_url_with_query(academy_academy_base_url() . '/', [
        'checkout' => 'cancelled',
        'plan' => $planKey,
    ]);
}

function academy_normalize_stripe_checkout_url(string $url): string
{
    return preg_replace('#^https://checkout\.stripe\.com/#', 'https://buy.stripe.com/', $url) ?? $url;
}

function academy_checkout_url_needs_refresh(string $url): bool
{
    $url = academy_normalize_stripe_checkout_url(trim($url));
    if ($url === '') {
        return true;
    }

    return preg_match('#^https://buy\.stripe\.com/c/pay/cs_(live|test)_#', $url) !== 1;
}

function academy_checkout_metadata(array $plan, string $email, string $checkoutReference): array
{
    return [
        'academy_system' => 'digrro_academy',
        'academy_plan_key' => (string) $plan['key'],
        'academy_checkout_reference' => $checkoutReference,
        'academy_email' => $email,
    ];
}

function academy_create_checkout_session(array $plan, string $email, string $phoneNumber, string $checkoutReference): array
{
    $amountCents = (int) round(((float) $plan['amountUsd']) * 100);
    $metadata = academy_checkout_metadata($plan, $email, $checkoutReference);

    return academy_stripe_request('POST', 'checkout/sessions', [
        'mode' => 'payment',
        'success_url' => academy_checkout_success_url(),
        'cancel_url' => academy_checkout_cancel_url((string) $plan['key']),
        'client_reference_id' => $checkoutReference,
        'customer_email' => $email,
        'line_items' => [
            [
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'usd',
                    'unit_amount' => $amountCents,
                    'product_data' => [
                        'name' => 'Digrro Academy | ' . $plan['label'],
                        'description' => (string) ($plan['checkoutDescription'] ?? $plan['label']),
                        'metadata' => $metadata,
                    ],
                ],
            ],
        ],
        'metadata' => $metadata,
        'payment_intent_data' => [
            'metadata' => $metadata,
        ],
        'allow_promotion_codes' => 'true',
        'billing_address_collection' => 'auto',
        'phone_number_collection' => [
            'enabled' => 'true',
        ],
        'submit_type' => 'pay',
        'custom_text' => [
            'submit' => [
                'message' => 'Your Digrro Academy registration will stay linked to this email address.',
            ],
        ],
    ]);
}

function academy_retrieve_checkout_session(string $sessionId): array
{
    return academy_stripe_request('GET', 'checkout/sessions/' . rawurlencode($sessionId));
}

function academy_default_plans(): array
{
    return [
        'test' => [
            'key' => 'test',
            'label' => 'Academy Login Test',
            'amountUsd' => 10,
            'checkoutDescription' => 'Digrro Academy test checkout for confirming registration, Stripe payment, and student login access.',
            'durationText' => 'Login test',
            'audienceText' => 'Stripe checkout',
            'badge' => 'Test plan',
            'description' => 'Use this to verify registration, payment, and student login.',
            'features' => [
                'Create a student account with email and password',
                'Complete a low-cost Stripe checkout',
                'Log in and confirm dashboard access'
            ],
            'teacherName' => 'Digrro Trainer',
            'learningUrl' => '',
            'displayOrder' => 0
        ],
        'sprint' => [
            'key' => 'sprint',
            'label' => 'AI Marketing Sprint',
            'amountUsd' => 200,
            'checkoutDescription' => 'Live AI marketing workshop for campaign planning, copy, and content workflow acceleration.',
            'durationText' => '4 hours',
            'audienceText' => 'Live workshop',
            'badge' => '',
            'description' => 'Per seat or $1,750 private team',
            'features' => [
                'AI prompting for campaigns and content',
                'Hooks, offers and content planning',
                'Quick-start prompt pack'
            ],
            'teacherName' => 'Digrro Trainer',
            'learningUrl' => '',
            'displayOrder' => 1
        ],
        'bootcamp' => [
            'key' => 'bootcamp',
            'label' => 'AI Content and Video Bootcamp',
            'amountUsd' => 650,
            'checkoutDescription' => 'Four-week bootcamp for AI content systems, short-form video, and execution workflows.',
            'durationText' => '4 weeks',
            'audienceText' => '8 live sessions',
            'badge' => 'Most chosen',
            'description' => 'Early bird, $850 standard',
            'features' => [
                'Content systems and operations',
                'AI scripting, editing, captions, repurposing',
                'Capstone and certificate pathway'
            ],
            'teacherName' => 'Digrro Trainer',
            'learningUrl' => '',
            'displayOrder' => 2
        ],
        'corporate' => [
            'key' => 'corporate',
            'label' => 'Corporate Academy Program',
            'amountUsd' => 4800,
            'checkoutDescription' => 'Private corporate AI training program with customized delivery, templates, and team enablement.',
            'durationText' => 'Private',
            'audienceText' => 'Custom agenda',
            'badge' => '',
            'description' => 'Up to 15 seats, custom from $7,500',
            'features' => [
                'Discovery and role-based design',
                'Private sessions and SOP handoff',
                'Management rollout support'
            ],
            'teacherName' => 'Digrro Trainer',
            'learningUrl' => '',
            'displayOrder' => 3
        ]
    ];
}

function academy_courses_seed_if_empty(PDO $pdo): void
{
    $pdo->exec("UPDATE academy_courses SET teacher_name = 'Digrro Trainer' WHERE teacher_name = 'Digrro Faculty'");

    $existingRows = $pdo->query('SELECT plan_key FROM academy_courses')->fetchAll();
    $existingKeys = [];
    foreach ($existingRows as $row) {
        $existingKeys[(string) ($row['plan_key'] ?? '')] = true;
    }

    $insert = $pdo->prepare(
        'INSERT INTO academy_courses (plan_key, label, amount_usd, duration_text, audience_text, badge, description, features_json, checkout_description, teacher_name, learning_url, display_order, is_active)
         VALUES (:plan_key, :label, :amount_usd, :duration_text, :audience_text, :badge, :description, :features_json, :checkout_description, :teacher_name, :learning_url, :display_order, 1)'
    );
    foreach (academy_default_plans() as $plan) {
        if (isset($existingKeys[$plan['key']])) {
            continue;
        }

        $insert->execute([
            'plan_key' => $plan['key'],
            'label' => $plan['label'],
            'amount_usd' => $plan['amountUsd'],
            'duration_text' => $plan['durationText'] ?? '',
            'audience_text' => $plan['audienceText'] ?? '',
            'badge' => $plan['badge'] ?? '',
            'description' => $plan['description'] ?? '',
            'features_json' => json_encode($plan['features'] ?? []),
            'checkout_description' => $plan['checkoutDescription'] ?? '',
            'teacher_name' => $plan['teacherName'] ?? 'Digrro Trainer',
            'learning_url' => $plan['learningUrl'] ?? '',
            'display_order' => $plan['displayOrder'] ?? 0
        ]);
    }
}

function academy_course_row_to_plan(array $row): array
{
    $features = json_decode((string) ($row['features_json'] ?? '[]'), true);
    if (!is_array($features)) {
        $features = [];
    }
    $key = (string) $row['plan_key'];
    return [
        'id' => (int) ($row['id'] ?? 0),
        'key' => $key,
        'label' => (string) $row['label'],
        'amountUsd' => (float) $row['amount_usd'],
        'durationText' => (string) ($row['duration_text'] ?? ''),
        'audienceText' => (string) ($row['audience_text'] ?? ''),
        'badge' => (string) ($row['badge'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'features' => array_values(array_map('strval', $features)),
        'checkoutDescription' => (string) ($row['checkout_description'] ?? ''),
        'teacherName' => (string) ($row['teacher_name'] ?? ''),
        'learningUrl' => (string) ($row['learning_url'] ?? ''),
        'displayOrder' => (int) ($row['display_order'] ?? 0),
        'isActive' => (int) ($row['is_active'] ?? 1) === 1,
        'checkoutUrl' => academy_checkout_url_for_plan($key)
    ];
}

function academy_plans(): array
{
    try {
        $pdo = academy_pdo();
        academy_courses_seed_if_empty($pdo);
        $rows = $pdo->query('SELECT * FROM academy_courses WHERE is_active = 1 ORDER BY display_order ASC, id ASC')->fetchAll();
        $plans = [];
        foreach ($rows as $row) {
            $plan = academy_course_row_to_plan($row);
            $plans[$plan['key']] = $plan;
        }
        if ($plans !== []) {
            return $plans;
        }
    } catch (Throwable $e) {
        // fall through to defaults
    }
    $defaults = [];
    foreach (academy_default_plans() as $plan) {
        $plan['checkoutUrl'] = academy_checkout_url_for_plan($plan['key']);
        $defaults[$plan['key']] = $plan;
    }
    return $defaults;
}

function academy_all_courses(PDO $pdo): array
{
    academy_courses_seed_if_empty($pdo);
    $rows = $pdo->query('SELECT * FROM academy_courses ORDER BY display_order ASC, id ASC')->fetchAll();
    return array_map('academy_course_row_to_plan', $rows);
}

function academy_plan(string $planKey): ?array
{
    $plans = academy_plans();
    return $plans[$planKey] ?? null;
}

function academy_storage_dir(): string
{
    $configured = academy_env(['ACADEMY_STORAGE_DIR']);
    $storageDir = $configured ?: academy_root_path() . DIRECTORY_SEPARATOR . 'academy-data';
    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        throw new RuntimeException('Could not prepare academy storage directory.');
    }

    return $storageDir;
}

function academy_db_path(): string
{
    return academy_storage_dir() . DIRECTORY_SEPARATOR . 'academy.sqlite';
}

function academy_table_has_column(PDO $pdo, string $tableName, string $columnName): bool
{
    $columns = $pdo->query('PRAGMA table_info(' . $tableName . ')');
    if ($columns === false) {
        return false;
    }

    foreach ($columns->fetchAll() as $column) {
        if (($column['name'] ?? '') === $columnName) {
            return true;
        }
    }

    return false;
}

function academy_ensure_table_column(PDO $pdo, string $tableName, string $columnName, string $definition): void
{
    if (academy_table_has_column($pdo, $tableName, $columnName)) {
        return;
    }

    $pdo->exec('ALTER TABLE ' . $tableName . ' ADD COLUMN ' . $columnName . ' ' . $definition);
}

function academy_pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $pdo = new PDO('sqlite:' . academy_db_path());
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON;');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS academy_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            email_normalized TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            address_line TEXT NOT NULL,
            country TEXT NOT NULL,
            city TEXT NOT NULL,
            pincode TEXT NOT NULL DEFAULT "",
            company TEXT,
            password_hash TEXT NOT NULL,
            email_confirmation_token TEXT,
            email_confirmation_sent_at TEXT,
            email_confirmed_at TEXT,
            password_reset_token TEXT,
            password_reset_sent_at TEXT,
            password_reset_expires_at TEXT,
            password_reset_used_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    academy_ensure_table_column($pdo, 'academy_accounts', 'password_reset_token', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_accounts', 'password_reset_sent_at', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_accounts', 'password_reset_expires_at', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_accounts', 'password_reset_used_at', 'TEXT');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS academy_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            address_line TEXT NOT NULL,
            country TEXT NOT NULL,
            city TEXT NOT NULL,
            pincode TEXT NOT NULL DEFAULT "",
            company TEXT,
            plan_key TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            amount_usd REAL NOT NULL,
            checkout_url TEXT NOT NULL,
            checkout_reference TEXT NOT NULL UNIQUE,
            stripe_checkout_session_id TEXT,
            stripe_payment_intent_id TEXT,
            payment_status TEXT NOT NULL DEFAULT "payment_pending",
            academic_status TEXT NOT NULL DEFAULT "awaiting_payment",
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            paid_at TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(account_id) REFERENCES academy_accounts(id) ON DELETE CASCADE
        )'
    );

    academy_ensure_table_column($pdo, 'academy_enrollments', 'stripe_checkout_session_id', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_enrollments', 'stripe_payment_intent_id', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_enrollments', 'paid_at', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_enrollments', 'updated_at', 'TEXT');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS academy_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_key TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL,
            amount_usd REAL NOT NULL,
            duration_text TEXT,
            audience_text TEXT,
            badge TEXT,
            description TEXT,
            features_json TEXT NOT NULL DEFAULT "[]",
            checkout_description TEXT,
            teacher_name TEXT,
            learning_url TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    academy_ensure_table_column($pdo, 'academy_courses', 'teacher_name', 'TEXT');
    academy_ensure_table_column($pdo, 'academy_courses', 'learning_url', 'TEXT');

    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_courses_plan_key_idx ON academy_courses(plan_key)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_accounts_email_normalized_idx ON academy_accounts(email_normalized)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_accounts_password_reset_token_idx ON academy_accounts(password_reset_token)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_enrollments_account_id_idx ON academy_enrollments(account_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_enrollments_email_idx ON academy_enrollments(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_enrollments_checkout_session_idx ON academy_enrollments(stripe_checkout_session_id)');

    return $pdo;
}

function academy_find_account(PDO $pdo, string $normalizedEmail): ?array
{
    $statement = $pdo->prepare('SELECT * FROM academy_accounts WHERE email_normalized = :email LIMIT 1');
    $statement->execute(['email' => $normalizedEmail]);
    $account = $statement->fetch();

    return is_array($account) ? $account : null;
}

function academy_record_checkout_session(PDO $pdo, string $checkoutReference, array $session): void
{
    $checkoutUrl = academy_normalize_stripe_checkout_url((string) ($session['url'] ?? ''));
    $sessionId = (string) ($session['id'] ?? '');

    if ($checkoutUrl === '' || $sessionId === '') {
        throw new RuntimeException('Stripe did not return a checkout URL.');
    }

    $statement = $pdo->prepare(
        'UPDATE academy_enrollments
         SET checkout_url = :checkout_url,
             stripe_checkout_session_id = :stripe_checkout_session_id,
             payment_status = :payment_status,
             updated_at = CURRENT_TIMESTAMP
         WHERE checkout_reference = :checkout_reference'
    );

    $statement->execute([
        'checkout_url' => $checkoutUrl,
        'stripe_checkout_session_id' => $sessionId,
        'payment_status' => (string) ($session['payment_status'] ?? 'unpaid'),
        'checkout_reference' => $checkoutReference,
    ]);
}

function academy_plan_matching_amount(float $amountUsd): ?array
{
    foreach (academy_plans() as $plan) {
        if (abs((float) ($plan['amountUsd'] ?? -1) - $amountUsd) < 0.01) {
            return $plan;
        }
    }

    return null;
}

function academy_checkout_plan_for_enrollment(PDO $pdo, array $row, ?array $course): array
{
    $amountUsd = (float) ($row['amount_usd'] ?? 0);
    $plan = $course;
    $changed = false;
    $courseAmountMismatch = $amountUsd > 0
        && $plan !== null
        && abs((float) ($plan['amountUsd'] ?? 0) - $amountUsd) >= 0.01;

    if ($amountUsd > 0 && ($plan === null || $courseAmountMismatch)) {
        $matchedPlan = academy_plan_matching_amount($amountUsd);
        if ($matchedPlan !== null) {
            $plan = $matchedPlan;
            $changed = true;
        } elseif ($courseAmountMismatch) {
            $changed = true;
        }
    }

    if ($plan === null) {
        $plan = [
            'key' => (string) ($row['plan_key'] ?? ''),
            'label' => (string) ($row['plan_name'] ?? 'Digrro Academy'),
            'amountUsd' => $amountUsd,
            'checkoutDescription' => (string) ($row['plan_name'] ?? 'Digrro Academy enrollment'),
        ];
    }

    if ($amountUsd > 0) {
        $plan['amountUsd'] = $amountUsd;
    }

    $planKey = (string) ($plan['key'] ?? '');
    $planName = (string) ($plan['label'] ?? '');
    if (
        (int) ($row['id'] ?? 0) > 0
        && ($planKey !== (string) ($row['plan_key'] ?? '') || $planName !== (string) ($row['plan_name'] ?? ''))
    ) {
        $statement = $pdo->prepare(
            'UPDATE academy_enrollments
             SET plan_key = :plan_key,
                 plan_name = :plan_name,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $statement->execute([
            'plan_key' => $planKey,
            'plan_name' => $planName,
            'id' => (int) $row['id'],
        ]);
        $row['plan_key'] = $planKey;
        $row['plan_name'] = $planName;
        $changed = true;
    }

    return [
        'row' => $row,
        'plan' => $plan,
        'changed' => $changed,
    ];
}

function academy_refresh_enrollment_checkout_session(PDO $pdo, array $row, ?array $course): array
{
    if (academy_enrollment_is_paid($row)) {
        return $row;
    }

    $checkoutPlan = academy_checkout_plan_for_enrollment($pdo, $row, $course);
    $row = $checkoutPlan['row'];
    $plan = $checkoutPlan['plan'];
    $forceRefresh = (bool) $checkoutPlan['changed'];
    $currentUrl = (string) ($row['checkout_url'] ?? '');
    if (!$forceRefresh && !academy_checkout_url_needs_refresh($currentUrl)) {
        $normalizedUrl = academy_normalize_stripe_checkout_url($currentUrl);
        if ($normalizedUrl !== $currentUrl && trim($normalizedUrl) !== '') {
            $statement = $pdo->prepare(
                'UPDATE academy_enrollments
                 SET checkout_url = :checkout_url,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'checkout_url' => $normalizedUrl,
                'id' => (int) $row['id'],
            ]);
            $row['checkout_url'] = $normalizedUrl;
        }
        return $row;
    }

    $checkoutReference = trim((string) ($row['checkout_reference'] ?? ''));
    $email = academy_normalize_email((string) ($row['email'] ?? ''));
    if ($checkoutReference === '' || $email === '') {
        return $row;
    }

    try {
        $session = academy_create_checkout_session(
            $plan,
            $email,
            (string) ($row['phone_number'] ?? ''),
            $checkoutReference
        );
        academy_record_checkout_session($pdo, $checkoutReference, $session);
        $row['checkout_url'] = academy_normalize_stripe_checkout_url((string) ($session['url'] ?? ''));
        $row['stripe_checkout_session_id'] = (string) ($session['id'] ?? '');
        $row['payment_status'] = (string) ($session['payment_status'] ?? 'unpaid');
    } catch (Throwable $error) {
        return $row;
    }

    return $row;
}

function academy_checkout_session_is_paid(array $session): bool
{
    $paymentStatus = (string) ($session['payment_status'] ?? '');
    return in_array($paymentStatus, ['paid', 'no_payment_required'], true);
}

function academy_apply_checkout_session_to_enrollment(PDO $pdo, array $session): bool
{
    $sessionId = (string) ($session['id'] ?? '');
    $paymentIntentId = (string) ($session['payment_intent'] ?? '');
    $paymentStatus = (string) ($session['payment_status'] ?? 'unpaid');
    $isPaid = academy_checkout_session_is_paid($session);
    $metadata = is_array($session['metadata'] ?? null) ? $session['metadata'] : [];
    $checkoutReference = (string) ($session['client_reference_id'] ?? ($metadata['academy_checkout_reference'] ?? ''));

    $where = [];
    $params = [
        'stripe_checkout_session_id' => $sessionId !== '' ? $sessionId : null,
        'stripe_payment_intent_id' => $paymentIntentId !== '' ? $paymentIntentId : null,
        'payment_status' => $paymentStatus,
        'paid' => $isPaid ? 1 : 0,
    ];

    if ($checkoutReference !== '') {
        $where[] = 'checkout_reference = :checkout_reference';
        $params['checkout_reference'] = $checkoutReference;
    }

    if ($sessionId !== '') {
        $where[] = 'stripe_checkout_session_id = :lookup_session_id';
        $params['lookup_session_id'] = $sessionId;
    }

    if ($where === []) {
        return false;
    }

    $statement = $pdo->prepare(
        'UPDATE academy_enrollments
         SET stripe_checkout_session_id = COALESCE(:stripe_checkout_session_id, stripe_checkout_session_id),
             stripe_payment_intent_id = COALESCE(:stripe_payment_intent_id, stripe_payment_intent_id),
             payment_status = :payment_status,
             academic_status = CASE WHEN :paid = 1 THEN "payment_received" ELSE academic_status END,
             paid_at = CASE WHEN :paid = 1 THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE ' . implode(' OR ', $where)
    );

    $statement->execute($params);

    return $statement->rowCount() > 0;
}

function academy_stripe_signature_is_valid(string $payload, string $signatureHeader, string $secret): bool
{
    $timestamp = null;
    $signatures = [];

    foreach (explode(',', $signatureHeader) as $piece) {
        [$key, $value] = array_pad(explode('=', trim($piece), 2), 2, '');
        if ($key === 't') {
            $timestamp = $value;
        }

        if ($key === 'v1') {
            $signatures[] = $value;
        }
    }

    if ($timestamp === null || $signatures === [] || !ctype_digit($timestamp)) {
        return false;
    }

    if (abs(time() - (int) $timestamp) > 300) {
        return false;
    }

    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, $signature)) {
            return true;
        }
    }

    return false;
}

function academy_escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function academy_mail_header_value(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value) ?? '');
}

function academy_smtp_value(array $keys): string
{
    $value = academy_env($keys);
    if (!is_string($value) || $value === '') {
        throw new RuntimeException('The academy SMTP configuration is incomplete.');
    }

    return $value;
}

function academy_smtp_read($socket): string
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }

    if ($response === '') {
        throw new RuntimeException('The SMTP server closed the connection unexpectedly.');
    }

    return $response;
}

function academy_smtp_expect($socket, array $allowedCodes): string
{
    $response = academy_smtp_read($socket);
    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $allowedCodes, true)) {
        throw new RuntimeException('SMTP error: ' . trim($response));
    }

    return $response;
}

function academy_smtp_command($socket, string $command, array $allowedCodes): string
{
    fwrite($socket, $command . "\r\n");
    return academy_smtp_expect($socket, $allowedCodes);
}

function academy_smtp_escape(string $body): string
{
    $body = str_replace(["\r\n", "\r"], "\n", $body);
    $body = str_replace("\n.", "\n..", $body);
    return str_replace("\n", "\r\n", $body);
}

function academy_send_plain_text_email(string $toEmail, string $toName, string $subject, string $body): void
{
    $host = academy_smtp_value(['SMTP_HOST', 'Outgoing Server']);
    $port = (int) academy_smtp_value(['SMTP_PORT', 'SMTP Port']);
    $username = academy_smtp_value(['SMTP_USERNAME', 'emailaddress']);
    $password = academy_smtp_value(['SMTP_PASSWORD', 'password']);
    $fromEmail = academy_env(['SMTP_FROM_EMAIL', 'emailaddress'], $username) ?: $username;
    $fromName = academy_env(['SMTP_FROM_NAME'], 'Digrro Academy') ?: 'Digrro Academy';

    $transport = ($port === 465 ? 'ssl://' : '') . $host . ':' . $port;
    $socket = @stream_socket_client($transport, $errorNumber, $errorMessage, 30, STREAM_CLIENT_CONNECT);
    if (!is_resource($socket)) {
        throw new RuntimeException('Could not connect to the SMTP server. ' . $errorMessage);
    }

    stream_set_timeout($socket, 30);

    academy_smtp_expect($socket, [220]);
    academy_smtp_command($socket, 'EHLO digrro.com', [250]);

    if ($port !== 465) {
        academy_smtp_command($socket, 'STARTTLS', [220]);
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('Could not start TLS for SMTP.');
        }
        academy_smtp_command($socket, 'EHLO digrro.com', [250]);
    }

    academy_smtp_command($socket, 'AUTH LOGIN', [334]);
    academy_smtp_command($socket, base64_encode($username), [334]);
    academy_smtp_command($socket, base64_encode($password), [235]);
    academy_smtp_command($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
    academy_smtp_command($socket, 'RCPT TO:<' . $toEmail . '>', [250, 251]);
    academy_smtp_command($socket, 'DATA', [354]);

    $safeToName = $toName !== '' ? $toName : $toEmail;
    $headers = [
        'Date: ' . date(DATE_RFC2822),
        'From: ' . academy_mail_header_value($fromName) . ' <' . academy_mail_header_value($fromEmail) . '>',
        'To: ' . academy_mail_header_value($safeToName) . ' <' . academy_mail_header_value($toEmail) . '>',
        'Subject: ' . academy_mail_header_value($subject),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit'
    ];

    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . academy_smtp_escape($body) . "\r\n.\r\n");
    academy_smtp_expect($socket, [250]);
    academy_smtp_command($socket, 'QUIT', [221]);
    fclose($socket);
}

function academy_send_confirmation_email(array $recipient, array $plan): void
{
    $confirmationUrl = academy_confirmation_url((string) $recipient['email_confirmation_token']);
    $body = implode("\n", [
        'Hi ' . $recipient['full_name'] . ',',
        '',
        'Please confirm your Digrro Academy registration for ' . $plan['label'] . '.',
        '',
        'Confirmation link:',
        $confirmationUrl,
        '',
        'Plan: ' . $plan['label'],
        'Checkout reference: ' . $recipient['checkout_reference'],
        '',
        'If you did not start this registration, you can ignore this email.',
        '',
        'Digrro Academy'
    ]);

    academy_send_plain_text_email(
        (string) $recipient['email'],
        (string) $recipient['full_name'],
        'Confirm your Digrro Academy registration',
        $body
    );
}

function academy_send_password_reset_email(array $recipient): void
{
    $ttlMinutes = (int) ceil(academy_password_reset_ttl_seconds() / 60);
    $resetUrl = academy_password_reset_url((string) $recipient['password_reset_token']);
    $fullName = trim((string) ($recipient['full_name'] ?? ''));
    $body = implode("\n", [
        'Hi ' . ($fullName !== '' ? $fullName : 'there') . ',',
        '',
        'Use the link below to reset your Digrro Academy password.',
        '',
        'Reset password link:',
        $resetUrl,
        '',
        'This link expires in ' . $ttlMinutes . ' minutes.',
        'If you did not request a password reset, you can ignore this email.',
        '',
        'Digrro Academy'
    ]);

    academy_send_plain_text_email(
        (string) $recipient['email'],
        $fullName,
        'Reset your Digrro Academy password',
        $body
    );
}

function academy_admin_email_normalized(): ?string
{
    $value = academy_env(['ACADEMY_ADMIN_EMAIL']);
    return is_string($value) && $value !== '' ? academy_normalize_email($value) : null;
}

function academy_admin_password_hash(): ?string
{
    return academy_env(['ACADEMY_ADMIN_PASSWORD_HASH']);
}

function academy_admin_token_secret(): ?string
{
    return academy_env(['ACADEMY_ADMIN_TOKEN_SECRET']);
}

function academy_admin_token_ttl_seconds(): int
{
    $configured = academy_env(['ACADEMY_ADMIN_TOKEN_TTL']);
    if (is_string($configured) && ctype_digit($configured)) {
        return (int) $configured;
    }
    return 8 * 3600;
}

function academy_admin_credentials_configured(): bool
{
    return academy_admin_email_normalized() !== null
        && academy_admin_password_hash() !== null
        && academy_admin_token_secret() !== null;
}

function academy_admin_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function academy_admin_base64url_decode(string $value): string
{
    $remainder = strlen($value) % 4;
    if ($remainder !== 0) {
        $value .= str_repeat('=', 4 - $remainder);
    }
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    return $decoded === false ? '' : $decoded;
}

function academy_admin_issue_token(string $email): string
{
    $secret = academy_admin_token_secret();
    if (!is_string($secret) || $secret === '') {
        throw new RuntimeException('Admin token secret is not configured.');
    }
    $payload = [
        'email' => $email,
        'role' => 'admin',
        'iat' => time(),
        'exp' => time() + academy_admin_token_ttl_seconds()
    ];
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if ($payloadJson === false) {
        throw new RuntimeException('Could not encode admin token payload.');
    }
    $payloadEncoded = academy_admin_base64url_encode($payloadJson);
    $signature = hash_hmac('sha256', $payloadEncoded, $secret, true);
    $signatureEncoded = academy_admin_base64url_encode($signature);
    return $payloadEncoded . '.' . $signatureEncoded;
}

function academy_admin_verify_token(?string $token): ?array
{
    if (!is_string($token) || $token === '') {
        return null;
    }
    $secret = academy_admin_token_secret();
    if (!is_string($secret) || $secret === '') {
        return null;
    }
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }
    [$payloadEncoded, $signatureEncoded] = $parts;
    $expected = hash_hmac('sha256', $payloadEncoded, $secret, true);
    $provided = academy_admin_base64url_decode($signatureEncoded);
    if (!hash_equals($expected, $provided)) {
        return null;
    }
    $payloadJson = academy_admin_base64url_decode($payloadEncoded);
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }
    if (($payload['role'] ?? '') !== 'admin') {
        return null;
    }
    if (!isset($payload['exp']) || (int) $payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

function academy_admin_token_from_request(): ?string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (is_array($headers)) {
        foreach ($headers as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) {
                $value = (string) $value;
                if (stripos($value, 'Bearer ') === 0) {
                    return trim(substr($value, 7));
                }
            }
        }
    }
    $serverAuth = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
    if (is_string($serverAuth) && stripos($serverAuth, 'Bearer ') === 0) {
        return trim(substr($serverAuth, 7));
    }
    return null;
}

function academy_student_token_secret(): ?string
{
    return academy_env(['ACADEMY_STUDENT_TOKEN_SECRET', 'ACADEMY_ADMIN_TOKEN_SECRET']);
}

function academy_student_token_ttl_seconds(): int
{
    $configured = academy_env(['ACADEMY_STUDENT_TOKEN_TTL']);
    if (is_string($configured) && ctype_digit($configured)) {
        return (int) $configured;
    }
    return 30 * 24 * 3600;
}

function academy_student_tokens_configured(): bool
{
    $secret = academy_student_token_secret();
    return is_string($secret) && $secret !== '';
}

function academy_student_issue_token(array $account): string
{
    $secret = academy_student_token_secret();
    if (!is_string($secret) || $secret === '') {
        throw new RuntimeException('Student token secret is not configured.');
    }

    $payload = [
        'accountId' => (int) $account['id'],
        'email' => (string) $account['email_normalized'],
        'role' => 'student',
        'iat' => time(),
        'exp' => time() + academy_student_token_ttl_seconds()
    ];
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if ($payloadJson === false) {
        throw new RuntimeException('Could not encode student token payload.');
    }
    $payloadEncoded = academy_admin_base64url_encode($payloadJson);
    $signature = hash_hmac('sha256', $payloadEncoded, $secret, true);
    $signatureEncoded = academy_admin_base64url_encode($signature);
    return $payloadEncoded . '.' . $signatureEncoded;
}

function academy_student_verify_token(?string $token): ?array
{
    if (!is_string($token) || $token === '') {
        return null;
    }
    $secret = academy_student_token_secret();
    if (!is_string($secret) || $secret === '') {
        return null;
    }
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }
    [$payloadEncoded, $signatureEncoded] = $parts;
    $expected = hash_hmac('sha256', $payloadEncoded, $secret, true);
    $provided = academy_admin_base64url_decode($signatureEncoded);
    if (!hash_equals($expected, $provided)) {
        return null;
    }
    $payloadJson = academy_admin_base64url_decode($payloadEncoded);
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }
    if (($payload['role'] ?? '') !== 'student') {
        return null;
    }
    if (!isset($payload['accountId']) || (int) $payload['accountId'] < 1) {
        return null;
    }
    if (!isset($payload['exp']) || (int) $payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

function academy_student_token_from_request(): ?string
{
    return academy_admin_token_from_request();
}

function academy_student_require_authenticated(PDO $pdo): array
{
    $payload = academy_student_verify_token(academy_student_token_from_request());
    if ($payload === null) {
        academy_json_response(401, ['ok' => false, 'message' => 'Student authentication required.']);
    }

    $statement = $pdo->prepare('SELECT * FROM academy_accounts WHERE id = :id LIMIT 1');
    $statement->execute(['id' => (int) $payload['accountId']]);
    $account = $statement->fetch();
    if (!is_array($account)) {
        academy_json_response(401, ['ok' => false, 'message' => 'Student account was not found.']);
    }

    return $account;
}

function academy_admin_require_authenticated(): array
{
    $token = academy_admin_token_from_request();
    $payload = academy_admin_verify_token($token);
    if ($payload === null) {
        academy_json_response(401, ['ok' => false, 'message' => 'Admin authentication required.']);
    }
    return $payload;
}

function academy_admin_check_credentials(string $email, string $password): bool
{
    $configuredEmail = academy_admin_email_normalized();
    $configuredHash = academy_admin_password_hash();
    if ($configuredEmail === null || $configuredHash === null) {
        return false;
    }
    if (!hash_equals($configuredEmail, academy_normalize_email($email))) {
        return false;
    }
    return password_verify($password, $configuredHash);
}

function academy_course_get(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM academy_courses WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    return is_array($row) ? academy_course_row_to_plan($row) : null;
}

function academy_course_by_plan_key(PDO $pdo, string $planKey): ?array
{
    academy_courses_seed_if_empty($pdo);
    $statement = $pdo->prepare('SELECT * FROM academy_courses WHERE plan_key = :plan_key LIMIT 1');
    $statement->execute(['plan_key' => $planKey]);
    $row = $statement->fetch();
    return is_array($row) ? academy_course_row_to_plan($row) : null;
}

function academy_enrollment_is_paid(array $row): bool
{
    $paymentStatus = (string) ($row['payment_status'] ?? '');
    $academicStatus = (string) ($row['academic_status'] ?? '');
    return in_array($paymentStatus, ['paid', 'no_payment_required'], true)
        || $academicStatus === 'payment_received'
        || trim((string) ($row['paid_at'] ?? '')) !== '';
}

function academy_dashboard_course_summary(?array $course, array $row, bool $includeLearningUrl): array
{
    $features = is_array($course['features'] ?? null) ? $course['features'] : [];
    $summary = [
        'key' => (string) ($course['key'] ?? $row['plan_key'] ?? ''),
        'label' => (string) ($course['label'] ?? $row['plan_name'] ?? ''),
        'amountUsd' => (float) ($course['amountUsd'] ?? $row['amount_usd'] ?? 0),
        'durationText' => (string) ($course['durationText'] ?? ''),
        'audienceText' => (string) ($course['audienceText'] ?? ''),
        'teacherName' => (string) ($course['teacherName'] ?? ''),
        'description' => (string) ($course['description'] ?? ''),
        'features' => array_values(array_map('strval', $features))
    ];

    if ($includeLearningUrl) {
        $summary['learningUrl'] = (string) ($course['learningUrl'] ?? '');
    }

    return $summary;
}

function academy_student_dashboard(PDO $pdo, array $account): array
{
    $statement = $pdo->prepare(
        'SELECT *
         FROM academy_enrollments
         WHERE account_id = :account_id
         ORDER BY created_at DESC, id DESC'
    );
    $statement->execute(['account_id' => (int) $account['id']]);
    $rows = $statement->fetchAll();

    $enrollments = [];
    foreach ($rows as $row) {
        $course = academy_course_by_plan_key($pdo, (string) $row['plan_key']);
        $isPaid = academy_enrollment_is_paid($row);
        if (!$isPaid) {
            $row = academy_refresh_enrollment_checkout_session($pdo, $row, $course);
            $course = academy_course_by_plan_key($pdo, (string) $row['plan_key']);
            $isPaid = academy_enrollment_is_paid($row);
        }
        $enrollments[] = [
            'id' => (int) $row['id'],
            'planKey' => (string) $row['plan_key'],
            'planName' => (string) $row['plan_name'],
            'amountUsd' => (float) $row['amount_usd'],
            'paymentStatus' => (string) $row['payment_status'],
            'academicStatus' => (string) $row['academic_status'],
            'isPaid' => $isPaid,
            'checkoutUrl' => $isPaid ? '' : (string) ($row['checkout_url'] ?? ''),
            'createdAt' => (string) $row['created_at'],
            'paidAt' => (string) ($row['paid_at'] ?? ''),
            'course' => academy_dashboard_course_summary($course, $row, $isPaid)
        ];
    }

    $availableCourses = [];
    foreach (academy_plans() as $plan) {
        $availableCourses[] = academy_dashboard_course_summary($plan, [
            'plan_key' => $plan['key'] ?? '',
            'plan_name' => $plan['label'] ?? '',
            'amount_usd' => $plan['amountUsd'] ?? 0,
        ], false);
    }

    return [
        'user' => [
            'id' => (int) $account['id'],
            'email' => (string) $account['email'],
            'fullName' => (string) $account['full_name'],
            'emailConfirmed' => trim((string) ($account['email_confirmed_at'] ?? '')) !== '',
            'company' => (string) ($account['company'] ?? '')
        ],
        'enrollments' => $enrollments,
        'availableCourses' => $availableCourses
    ];
}

function academy_course_create(PDO $pdo, array $data): array
{
    $statement = $pdo->prepare(
        'INSERT INTO academy_courses (plan_key, label, amount_usd, duration_text, audience_text, badge, description, features_json, checkout_description, teacher_name, learning_url, display_order, is_active)
         VALUES (:plan_key, :label, :amount_usd, :duration_text, :audience_text, :badge, :description, :features_json, :checkout_description, :teacher_name, :learning_url, :display_order, :is_active)'
    );
    $statement->execute([
        'plan_key' => $data['plan_key'],
        'label' => $data['label'],
        'amount_usd' => $data['amount_usd'],
        'duration_text' => $data['duration_text'],
        'audience_text' => $data['audience_text'],
        'badge' => $data['badge'],
        'description' => $data['description'],
        'features_json' => $data['features_json'],
        'checkout_description' => $data['checkout_description'],
        'teacher_name' => $data['teacher_name'],
        'learning_url' => $data['learning_url'],
        'display_order' => $data['display_order'],
        'is_active' => $data['is_active']
    ]);
    return academy_course_get($pdo, (int) $pdo->lastInsertId());
}

function academy_course_update(PDO $pdo, int $id, array $data): ?array
{
    $statement = $pdo->prepare(
        'UPDATE academy_courses SET
            plan_key = :plan_key,
            label = :label,
            amount_usd = :amount_usd,
            duration_text = :duration_text,
            audience_text = :audience_text,
            badge = :badge,
            description = :description,
            features_json = :features_json,
            checkout_description = :checkout_description,
            teacher_name = :teacher_name,
            learning_url = :learning_url,
            display_order = :display_order,
            is_active = :is_active,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );
    $statement->execute([
        'id' => $id,
        'plan_key' => $data['plan_key'],
        'label' => $data['label'],
        'amount_usd' => $data['amount_usd'],
        'duration_text' => $data['duration_text'],
        'audience_text' => $data['audience_text'],
        'badge' => $data['badge'],
        'description' => $data['description'],
        'features_json' => $data['features_json'],
        'checkout_description' => $data['checkout_description'],
        'teacher_name' => $data['teacher_name'],
        'learning_url' => $data['learning_url'],
        'display_order' => $data['display_order'],
        'is_active' => $data['is_active']
    ]);
    return academy_course_get($pdo, $id);
}

function academy_course_delete(PDO $pdo, int $id): bool
{
    $statement = $pdo->prepare('DELETE FROM academy_courses WHERE id = :id');
    $statement->execute(['id' => $id]);
    return $statement->rowCount() > 0;
}

function academy_course_validate_payload(array $payload): array
{
    $errors = [];
    $planKey = trim((string) ($payload['planKey'] ?? $payload['plan_key'] ?? ''));
    $label = trim((string) ($payload['label'] ?? ''));
    $amountUsd = $payload['amountUsd'] ?? $payload['amount_usd'] ?? null;

    if ($planKey === '' || !preg_match('/^[a-z0-9_\-]+$/i', $planKey)) {
        $errors[] = 'Plan key must be alphanumeric (letters, digits, dashes, underscores).';
    }
    if ($label === '') {
        $errors[] = 'Label is required.';
    }
    if (!is_numeric($amountUsd) || (float) $amountUsd < 0) {
        $errors[] = 'Amount must be a non-negative number.';
    }

    $features = $payload['features'] ?? [];
    if (is_string($features)) {
        $features = array_filter(array_map('trim', preg_split('/\r?\n/', $features) ?: []));
    }
    if (!is_array($features)) {
        $features = [];
    }
    $cleanFeatures = [];
    foreach ($features as $f) {
        $f = trim((string) $f);
        if ($f !== '') $cleanFeatures[] = $f;
    }

    $isActive = $payload['isActive'] ?? $payload['is_active'] ?? true;
    $isActiveInt = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($isActiveInt === null) $isActiveInt = true;

    return [
        'errors' => $errors,
        'data' => [
            'plan_key' => strtolower($planKey),
            'label' => $label,
            'amount_usd' => (float) $amountUsd,
            'duration_text' => trim((string) ($payload['durationText'] ?? $payload['duration_text'] ?? '')),
            'audience_text' => trim((string) ($payload['audienceText'] ?? $payload['audience_text'] ?? '')),
            'badge' => trim((string) ($payload['badge'] ?? '')),
            'description' => trim((string) ($payload['description'] ?? '')),
            'features_json' => json_encode($cleanFeatures, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'checkout_description' => trim((string) ($payload['checkoutDescription'] ?? $payload['checkout_description'] ?? '')),
            'teacher_name' => trim((string) ($payload['teacherName'] ?? $payload['teacher_name'] ?? '')),
            'learning_url' => trim((string) ($payload['learningUrl'] ?? $payload['learning_url'] ?? '')),
            'display_order' => (int) ($payload['displayOrder'] ?? $payload['display_order'] ?? 0),
            'is_active' => $isActiveInt ? 1 : 0
        ]
    ];
}
