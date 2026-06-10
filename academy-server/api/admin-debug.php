<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$expectedToken = 'academy-admin-debug-20260610';
if (!isset($_GET['token']) || !hash_equals($expectedToken, (string) $_GET['token'])) {
    http_response_code(404);
    exit;
}

function academy_debug_hash_summary(?string $hash): array
{
    if (!is_string($hash) || $hash === '') {
        return [
            'configured' => false,
        ];
    }

    $type = 'unknown';
    if (str_starts_with($hash, 'pbkdf2:')) {
        $parts = explode(':', $hash);
        $type = count($parts) >= 2 ? 'pbkdf2:' . $parts[1] : 'pbkdf2';
    } else {
        $info = password_get_info($hash);
        $type = (string) ($info['algoName'] ?? 'password_hash');
    }

    return [
        'configured' => true,
        'type' => $type,
        'length' => strlen($hash),
        'fingerprint' => substr(hash('sha256', $hash), 0, 12),
    ];
}

function academy_debug_candidate_env_files(): array
{
    $rootPath = academy_root_path();
    $parentRootPath = dirname($rootPath);
    $academyPath = dirname(__DIR__);
    $candidatePaths = [
        'parent .env' => $parentRootPath . DIRECTORY_SEPARATOR . '.env',
        'root .env' => $rootPath . DIRECTORY_SEPARATOR . '.env',
        'academy .env' => $academyPath . DIRECTORY_SEPARATOR . '.env',
        'parent .env.local' => $parentRootPath . DIRECTORY_SEPARATOR . '.env.local',
        'root .env.local' => $rootPath . DIRECTORY_SEPARATOR . '.env.local',
        'academy .env.local' => $academyPath . DIRECTORY_SEPARATOR . '.env.local',
    ];

    $files = [];
    foreach ($candidatePaths as $label => $path) {
        $keys = [];
        if (is_file($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $trimmed = trim((string) $line);
                if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                    continue;
                }
                $key = trim(substr($trimmed, 0, (int) strpos($trimmed, '=')));
                if (str_starts_with($key, 'ACADEMY_ADMIN_')) {
                    $keys[] = $key;
                }
            }
        }

        $files[] = [
            'label' => $label,
            'exists' => is_file($path),
            'adminKeys' => array_values(array_unique($keys)),
        ];
    }

    return $files;
}

$configuredHash = academy_admin_password_hash();

academy_json_response(200, [
    'ok' => true,
    'phpVersion' => PHP_VERSION,
    'functions' => [
        'hash_pbkdf2' => function_exists('hash_pbkdf2'),
        'password_verify' => function_exists('password_verify'),
        'str_starts_with' => function_exists('str_starts_with'),
    ],
    'paths' => [
        'root' => basename(academy_root_path()),
        'academy' => basename(dirname(__DIR__)),
        'bootstrapFingerprint' => is_file(__DIR__ . '/bootstrap.php')
            ? substr(sha1_file(__DIR__ . '/bootstrap.php'), 0, 12)
            : null,
    ],
    'envFiles' => academy_debug_candidate_env_files(),
    'admin' => [
        'configuredIdentity' => academy_admin_identity_normalized(),
        'configuredHash' => academy_debug_hash_summary($configuredHash),
        'builtinHash' => academy_debug_hash_summary(academy_builtin_admin_password_hash()),
        'configuredHashMatchesSerenity' => is_string($configuredHash)
            ? academy_admin_password_hash_matches($configuredHash, 'serenity')
            : false,
        'builtinHashMatchesSerenity' => academy_admin_password_hash_matches(academy_builtin_admin_password_hash(), 'serenity'),
        'checkCredentialsAdminSerenity' => academy_admin_check_credentials('admin', 'serenity'),
        'credentialsConfigured' => academy_admin_credentials_configured(),
    ],
]);
