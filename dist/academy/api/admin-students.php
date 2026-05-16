<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

academy_admin_require_authenticated();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
    $pdo = academy_pdo();
} catch (Throwable $e) {
    academy_json_response(500, ['ok' => false, 'message' => 'Could not open the academy database.']);
}

function academy_admin_student_id(): ?int
{
    $idQuery = $_GET['id'] ?? null;
    if (is_string($idQuery) && ctype_digit($idQuery)) {
        return (int) $idQuery;
    }

    $payload = academy_request_payload();
    $idBody = $payload['id'] ?? null;
    if (is_int($idBody)) return $idBody;
    if (is_string($idBody) && ctype_digit($idBody)) return (int) $idBody;
    return null;
}

function academy_admin_student_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'fullName' => (string) $row['full_name'],
        'email' => (string) $row['email'],
        'phoneNumber' => (string) ($row['phone_number'] ?? ''),
        'addressLine' => (string) ($row['address_line'] ?? ''),
        'country' => (string) ($row['country'] ?? ''),
        'city' => (string) ($row['city'] ?? ''),
        'company' => (string) ($row['company'] ?? ''),
        'emailConfirmed' => trim((string) ($row['email_confirmed_at'] ?? '')) !== '',
        'enrollmentCount' => (int) ($row['enrollment_count'] ?? 0),
        'paidEnrollmentCount' => (int) ($row['paid_enrollment_count'] ?? 0),
        'latestEnrollmentAt' => (string) ($row['latest_enrollment_at'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
        'enrollments' => is_array($row['enrollments'] ?? null) ? $row['enrollments'] : [],
    ];
}

function academy_admin_student_payload(array $payload, bool $isCreate): array
{
    $errors = [];
    $fullName = trim((string) ($payload['fullName'] ?? $payload['full_name'] ?? ''));
    $email = academy_normalize_email((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $emailConfirmed = $payload['emailConfirmed'] ?? $payload['email_confirmed'] ?? true;
    $confirmed = filter_var($emailConfirmed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($confirmed === null) $confirmed = true;

    if ($fullName === '') $errors[] = 'Student name is required.';
    if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) $errors[] = 'Enter a valid student email.';
    if ($isCreate && strlen($password) < 8) $errors[] = 'Student password must be at least 8 characters.';
    if (!$isCreate && $password !== '' && strlen($password) < 8) $errors[] = 'Student password must be at least 8 characters.';

    return [
        'errors' => $errors,
        'data' => [
            'email' => $email,
            'email_normalized' => $email,
            'full_name' => $fullName,
            'phone_number' => trim((string) ($payload['phoneNumber'] ?? $payload['phone_number'] ?? '')),
            'address_line' => trim((string) ($payload['addressLine'] ?? $payload['address_line'] ?? '')),
            'country' => trim((string) ($payload['country'] ?? '')),
            'city' => trim((string) ($payload['city'] ?? '')),
            'company' => trim((string) ($payload['company'] ?? '')),
            'password' => $password,
            'email_confirmed_at' => $confirmed ? gmdate('Y-m-d H:i:s') : null,
        ],
    ];
}

function academy_admin_student_enrollments(PDO $pdo, int $accountId): array
{
    $statement = $pdo->prepare(
        'SELECT id, plan_key, plan_name, amount_usd, payment_status, academic_status, checkout_reference, created_at, paid_at
         FROM academy_enrollments
         WHERE account_id = :account_id
         ORDER BY created_at DESC, id DESC'
    );
    $statement->execute(['account_id' => $accountId]);
    $rows = $statement->fetchAll();
    $items = [];
    foreach ($rows as $row) {
        $items[] = [
            'id' => (int) $row['id'],
            'planKey' => (string) $row['plan_key'],
            'planName' => (string) $row['plan_name'],
            'amountUsd' => (float) $row['amount_usd'],
            'paymentStatus' => (string) $row['payment_status'],
            'academicStatus' => (string) $row['academic_status'],
            'checkoutReference' => (string) $row['checkout_reference'],
            'createdAt' => (string) $row['created_at'],
            'paidAt' => (string) ($row['paid_at'] ?? ''),
        ];
    }
    return $items;
}

function academy_admin_student_summary_query(PDO $pdo): array
{
    $statement = $pdo->query(
        'SELECT a.*,
                COUNT(e.id) AS enrollment_count,
                COALESCE(SUM(CASE WHEN e.payment_status IN ("paid", "no_payment_required")
                    OR e.academic_status = "payment_received"
                    OR e.paid_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_enrollment_count,
                MAX(e.created_at) AS latest_enrollment_at
         FROM academy_accounts a
         LEFT JOIN academy_enrollments e ON e.account_id = a.id
         GROUP BY a.id
         ORDER BY a.created_at DESC, a.id DESC'
    );
    return $statement->fetchAll();
}

if ($method === 'GET') {
    $idQuery = $_GET['id'] ?? null;
    if (is_string($idQuery) && ctype_digit($idQuery)) {
        $statement = $pdo->prepare(
            'SELECT a.*,
                    COUNT(e.id) AS enrollment_count,
                    COALESCE(SUM(CASE WHEN e.payment_status IN ("paid", "no_payment_required")
                        OR e.academic_status = "payment_received"
                        OR e.paid_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS paid_enrollment_count,
                    MAX(e.created_at) AS latest_enrollment_at
             FROM academy_accounts a
             LEFT JOIN academy_enrollments e ON e.account_id = a.id
             WHERE a.id = :id
             GROUP BY a.id
             LIMIT 1'
        );
        $statement->execute(['id' => (int) $idQuery]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            academy_json_response(404, ['ok' => false, 'message' => 'Student not found.']);
        }
        $row['enrollments'] = academy_admin_student_enrollments($pdo, (int) $row['id']);
        academy_json_response(200, ['ok' => true, 'student' => academy_admin_student_row($row)]);
    }

    academy_json_response(200, [
        'ok' => true,
        'students' => array_map('academy_admin_student_row', academy_admin_student_summary_query($pdo)),
    ]);
}

if ($method === 'POST') {
    $payload = academy_request_payload();
    $validated = academy_admin_student_payload($payload, true);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }

    $data = $validated['data'];
    try {
        $statement = $pdo->prepare(
            'INSERT INTO academy_accounts (
                email, email_normalized, full_name, phone_number, address_line, country, city,
                pincode, company, password_hash, email_confirmed_at
             ) VALUES (
                :email, :email_normalized, :full_name, :phone_number, :address_line, :country, :city,
                "", :company, :password_hash, :email_confirmed_at
             )'
        );
        $statement->execute([
            'email' => $data['email'],
            'email_normalized' => $data['email_normalized'],
            'full_name' => $data['full_name'],
            'phone_number' => $data['phone_number'],
            'address_line' => $data['address_line'],
            'country' => $data['country'],
            'city' => $data['city'],
            'company' => $data['company'] !== '' ? $data['company'] : null,
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'email_confirmed_at' => $data['email_confirmed_at'],
        ]);
    } catch (PDOException $e) {
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A student with that email already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not create the student.']);
    }

    $id = (int) $pdo->lastInsertId();
    $statement = $pdo->prepare('SELECT * FROM academy_accounts WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    $row['enrollment_count'] = 0;
    $row['paid_enrollment_count'] = 0;
    $row['latest_enrollment_at'] = '';
    academy_json_response(201, ['ok' => true, 'student' => academy_admin_student_row($row)]);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = academy_admin_student_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Student id is required.']);
    }

    $exists = $pdo->prepare('SELECT * FROM academy_accounts WHERE id = :id LIMIT 1');
    $exists->execute(['id' => $id]);
    if (!is_array($exists->fetch())) {
        academy_json_response(404, ['ok' => false, 'message' => 'Student not found.']);
    }

    $payload = academy_request_payload();
    $validated = academy_admin_student_payload($payload, false);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }

    $data = $validated['data'];
    try {
        $pdo->beginTransaction();
        if ($data['password'] !== '') {
            $statement = $pdo->prepare(
                'UPDATE academy_accounts
                 SET email = :email, email_normalized = :email_normalized, full_name = :full_name,
                     phone_number = :phone_number, address_line = :address_line, country = :country,
                     city = :city, company = :company, password_hash = :password_hash,
                     email_confirmed_at = :email_confirmed_at, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $id,
                'email' => $data['email'],
                'email_normalized' => $data['email_normalized'],
                'full_name' => $data['full_name'],
                'phone_number' => $data['phone_number'],
                'address_line' => $data['address_line'],
                'country' => $data['country'],
                'city' => $data['city'],
                'company' => $data['company'] !== '' ? $data['company'] : null,
                'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                'email_confirmed_at' => $data['email_confirmed_at'],
            ]);
        } else {
            $statement = $pdo->prepare(
                'UPDATE academy_accounts
                 SET email = :email, email_normalized = :email_normalized, full_name = :full_name,
                     phone_number = :phone_number, address_line = :address_line, country = :country,
                     city = :city, company = :company, email_confirmed_at = :email_confirmed_at,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $id,
                'email' => $data['email'],
                'email_normalized' => $data['email_normalized'],
                'full_name' => $data['full_name'],
                'phone_number' => $data['phone_number'],
                'address_line' => $data['address_line'],
                'country' => $data['country'],
                'city' => $data['city'],
                'company' => $data['company'] !== '' ? $data['company'] : null,
                'email_confirmed_at' => $data['email_confirmed_at'],
            ]);
        }

        $sync = $pdo->prepare(
            'UPDATE academy_enrollments
             SET email = :email, full_name = :full_name, phone_number = :phone_number,
                 address_line = :address_line, country = :country, city = :city,
                 company = :company, updated_at = CURRENT_TIMESTAMP
             WHERE account_id = :id'
        );
        $sync->execute([
            'id' => $id,
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'phone_number' => $data['phone_number'],
            'address_line' => $data['address_line'],
            'country' => $data['country'],
            'city' => $data['city'],
            'company' => $data['company'] !== '' ? $data['company'] : null,
        ]);
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A student with that email already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not update the student.']);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        academy_json_response(500, ['ok' => false, 'message' => 'Could not update the student.']);
    }

    $statement = $pdo->prepare('SELECT * FROM academy_accounts WHERE id = :id LIMIT 1');
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    $row['enrollment_count'] = 0;
    $row['paid_enrollment_count'] = 0;
    $row['latest_enrollment_at'] = '';
    $row['enrollments'] = academy_admin_student_enrollments($pdo, $id);
    academy_json_response(200, ['ok' => true, 'student' => academy_admin_student_row($row)]);
}

if ($method === 'DELETE') {
    $id = academy_admin_student_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Student id is required.']);
    }

    $statement = $pdo->prepare('DELETE FROM academy_accounts WHERE id = :id');
    $statement->execute(['id' => $id]);
    if ($statement->rowCount() < 1) {
        academy_json_response(404, ['ok' => false, 'message' => 'Student not found.']);
    }
    academy_json_response(200, ['ok' => true, 'message' => 'Student removed.']);
}

academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
