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
    $candidatePaths = [
        academy_root_path() . DIRECTORY_SEPARATOR . '.env.local',
        academy_root_path() . DIRECTORY_SEPARATOR . '.env',
        dirname(academy_root_path()) . DIRECTORY_SEPARATOR . '.env.local',
        dirname(academy_root_path()) . DIRECTORY_SEPARATOR . '.env',
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

            $env[$key] = $value;
        }

        break;
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

function academy_plans(): array
{
    return [
        'sprint' => [
            'key' => 'sprint',
            'label' => 'AI Marketing Sprint',
            'amountUsd' => 200,
            'checkoutUrl' => academy_checkout_url_for_plan('sprint')
        ],
        'bootcamp' => [
            'key' => 'bootcamp',
            'label' => 'AI Content and Video Bootcamp',
            'amountUsd' => 650,
            'checkoutUrl' => academy_checkout_url_for_plan('bootcamp')
        ],
        'corporate' => [
            'key' => 'corporate',
            'label' => 'Corporate Academy Program',
            'amountUsd' => 4800,
            'checkoutUrl' => academy_checkout_url_for_plan('corporate')
        ]
    ];
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
            pincode TEXT NOT NULL,
            company TEXT,
            password_hash TEXT NOT NULL,
            email_confirmation_token TEXT,
            email_confirmation_sent_at TEXT,
            email_confirmed_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

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
            pincode TEXT NOT NULL,
            company TEXT,
            plan_key TEXT NOT NULL,
            plan_name TEXT NOT NULL,
            amount_usd REAL NOT NULL,
            checkout_url TEXT NOT NULL,
            checkout_reference TEXT NOT NULL UNIQUE,
            payment_status TEXT NOT NULL DEFAULT "payment_pending",
            academic_status TEXT NOT NULL DEFAULT "awaiting_payment",
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(account_id) REFERENCES academy_accounts(id) ON DELETE CASCADE
        )'
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_accounts_email_normalized_idx ON academy_accounts(email_normalized)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_enrollments_account_id_idx ON academy_enrollments(account_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS academy_enrollments_email_idx ON academy_enrollments(email)');

    return $pdo;
}

function academy_find_account(PDO $pdo, string $normalizedEmail): ?array
{
    $statement = $pdo->prepare('SELECT * FROM academy_accounts WHERE email_normalized = :email LIMIT 1');
    $statement->execute(['email' => $normalizedEmail]);
    $account = $statement->fetch();

    return is_array($account) ? $account : null;
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

function academy_send_confirmation_email(array $recipient, array $plan): void
{
    $host = academy_smtp_value(['SMTP_HOST', 'Outgoing Server']);
    $port = (int) academy_smtp_value(['SMTP_PORT', 'SMTP Port']);
    $username = academy_smtp_value(['SMTP_USERNAME', 'emailaddress']);
    $password = academy_smtp_value(['SMTP_PASSWORD', 'password']);
    $fromEmail = academy_env(['SMTP_FROM_EMAIL', 'emailaddress'], $username) ?: $username;
    $fromName = academy_env(['SMTP_FROM_NAME'], 'Digrro Academy') ?: 'Digrro Academy';

    $subject = academy_mail_header_value('Confirm your Digrro Academy registration');
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
    academy_smtp_command($socket, 'RCPT TO:<' . $recipient['email'] . '>', [250, 251]);
    academy_smtp_command($socket, 'DATA', [354]);

    $headers = [
        'Date: ' . date(DATE_RFC2822),
        'From: ' . academy_mail_header_value($fromName) . ' <' . academy_mail_header_value($fromEmail) . '>',
        'To: ' . academy_mail_header_value($recipient['full_name']) . ' <' . academy_mail_header_value($recipient['email']) . '>',
        'Subject: ' . $subject,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit'
    ];

    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . academy_smtp_escape($body) . "\r\n.\r\n");
    academy_smtp_expect($socket, [250]);
    academy_smtp_command($socket, 'QUIT', [221]);
    fclose($socket);
}
