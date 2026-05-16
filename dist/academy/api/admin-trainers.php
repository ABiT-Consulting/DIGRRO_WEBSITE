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

function academy_admin_trainer_id(): ?int
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

function academy_admin_trainer_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'fullName' => (string) $row['full_name'],
        'email' => (string) $row['email'],
        'phoneNumber' => (string) ($row['phone_number'] ?? ''),
        'specialty' => (string) ($row['specialty'] ?? ''),
        'bio' => (string) ($row['bio'] ?? ''),
        'isActive' => (int) ($row['is_active'] ?? 0) === 1,
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
    ];
}

function academy_admin_trainer_payload(array $payload, bool $isCreate): array
{
    $errors = [];
    $fullName = trim((string) ($payload['fullName'] ?? $payload['full_name'] ?? ''));
    $email = academy_normalize_email((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');
    $isActive = $payload['isActive'] ?? $payload['is_active'] ?? true;
    $active = filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($active === null) $active = true;

    if ($fullName === '') $errors[] = 'Trainer name is required.';
    if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) $errors[] = 'Enter a valid trainer email.';
    if ($isCreate && strlen($password) < 8) $errors[] = 'Trainer password must be at least 8 characters.';
    if (!$isCreate && $password !== '' && strlen($password) < 8) $errors[] = 'Trainer password must be at least 8 characters.';

    return [
        'errors' => $errors,
        'data' => [
            'full_name' => $fullName,
            'email' => $email,
            'email_normalized' => $email,
            'phone_number' => trim((string) ($payload['phoneNumber'] ?? $payload['phone_number'] ?? '')),
            'password' => $password,
            'specialty' => trim((string) ($payload['specialty'] ?? '')),
            'bio' => trim((string) ($payload['bio'] ?? '')),
            'is_active' => $active ? 1 : 0,
        ],
    ];
}

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM academy_trainers ORDER BY is_active DESC, full_name ASC, id DESC')->fetchAll();
    academy_json_response(200, ['ok' => true, 'trainers' => array_map('academy_admin_trainer_row', $rows)]);
}

if ($method === 'POST') {
    $payload = academy_request_payload();
    $validated = academy_admin_trainer_payload($payload, true);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }

    $data = $validated['data'];
    try {
        $statement = $pdo->prepare(
            'INSERT INTO academy_trainers (full_name, email, email_normalized, phone_number, password_hash, specialty, bio, is_active)
             VALUES (:full_name, :email, :email_normalized, :phone_number, :password_hash, :specialty, :bio, :is_active)'
        );
        $statement->execute([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'email_normalized' => $data['email_normalized'],
            'phone_number' => $data['phone_number'],
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'specialty' => $data['specialty'],
            'bio' => $data['bio'],
            'is_active' => $data['is_active'],
        ]);
    } catch (PDOException $e) {
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A trainer with that email already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not create the trainer.']);
    }

    $created = $pdo->prepare('SELECT * FROM academy_trainers WHERE id = :id LIMIT 1');
    $created->execute(['id' => (int) $pdo->lastInsertId()]);
    academy_json_response(201, ['ok' => true, 'trainer' => academy_admin_trainer_row($created->fetch())]);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = academy_admin_trainer_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Trainer id is required.']);
    }

    $exists = $pdo->prepare('SELECT * FROM academy_trainers WHERE id = :id LIMIT 1');
    $exists->execute(['id' => $id]);
    if (!is_array($exists->fetch())) {
        academy_json_response(404, ['ok' => false, 'message' => 'Trainer not found.']);
    }

    $payload = academy_request_payload();
    $validated = academy_admin_trainer_payload($payload, false);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }

    $data = $validated['data'];
    try {
        if ($data['password'] !== '') {
            $statement = $pdo->prepare(
                'UPDATE academy_trainers
                 SET full_name = :full_name, email = :email, email_normalized = :email_normalized,
                     phone_number = :phone_number, password_hash = :password_hash, specialty = :specialty,
                     bio = :bio, is_active = :is_active, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $id,
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'email_normalized' => $data['email_normalized'],
                'phone_number' => $data['phone_number'],
                'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                'specialty' => $data['specialty'],
                'bio' => $data['bio'],
                'is_active' => $data['is_active'],
            ]);
        } else {
            $statement = $pdo->prepare(
                'UPDATE academy_trainers
                 SET full_name = :full_name, email = :email, email_normalized = :email_normalized,
                     phone_number = :phone_number, specialty = :specialty, bio = :bio,
                     is_active = :is_active, updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $id,
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'email_normalized' => $data['email_normalized'],
                'phone_number' => $data['phone_number'],
                'specialty' => $data['specialty'],
                'bio' => $data['bio'],
                'is_active' => $data['is_active'],
            ]);
        }
    } catch (PDOException $e) {
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A trainer with that email already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not update the trainer.']);
    }

    $updated = $pdo->prepare('SELECT * FROM academy_trainers WHERE id = :id LIMIT 1');
    $updated->execute(['id' => $id]);
    academy_json_response(200, ['ok' => true, 'trainer' => academy_admin_trainer_row($updated->fetch())]);
}

if ($method === 'DELETE') {
    $id = academy_admin_trainer_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Trainer id is required.']);
    }

    $statement = $pdo->prepare('DELETE FROM academy_trainers WHERE id = :id');
    $statement->execute(['id' => $id]);
    if ($statement->rowCount() < 1) {
        academy_json_response(404, ['ok' => false, 'message' => 'Trainer not found.']);
    }
    academy_json_response(200, ['ok' => true, 'message' => 'Trainer removed.']);
}

academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
