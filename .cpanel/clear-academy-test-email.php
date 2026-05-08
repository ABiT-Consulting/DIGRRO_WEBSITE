<?php

declare(strict_types=1);

$deployPath = rtrim((string) ($argv[1] ?? ''), "/\\");
$email = strtolower(trim((string) ($argv[2] ?? '')));

if ($deployPath === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDOUT, "WARNING: Academy test email cleanup skipped because input was invalid.\n");
    exit(0);
}

$dbPath = $deployPath . DIRECTORY_SEPARATOR . 'academy-data' . DIRECTORY_SEPARATOR . 'academy.sqlite';
if (!is_file($dbPath)) {
    fwrite(STDOUT, "WARNING: Academy test email cleanup skipped because the database was not found.\n");
    exit(0);
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON;');

    $pdo->beginTransaction();

    $deleteEnrollments = $pdo->prepare('DELETE FROM academy_enrollments WHERE lower(email) = :email');
    $deleteEnrollments->execute(['email' => $email]);

    $deleteAccount = $pdo->prepare('DELETE FROM academy_accounts WHERE email_normalized = :email OR lower(email) = :email');
    $deleteAccount->execute(['email' => $email]);

    $pdo->commit();

    fwrite(
        STDOUT,
        sprintf(
            "Academy test email cleanup removed %d account row(s) and %d enrollment row(s) for %s.\n",
            $deleteAccount->rowCount(),
            $deleteEnrollments->rowCount(),
            $email
        )
    );
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    fwrite(STDOUT, 'WARNING: Academy test email cleanup failed: ' . $error->getMessage() . "\n");
}
