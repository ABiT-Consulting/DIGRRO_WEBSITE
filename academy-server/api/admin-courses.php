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

function admin_courses_resolve_id(): ?int
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

if ($method === 'GET') {
    $courses = academy_all_courses($pdo);
    academy_json_response(200, ['ok' => true, 'courses' => $courses]);
}

if ($method === 'POST') {
    $payload = academy_request_payload();
    $validated = academy_course_validate_payload($payload);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }
    try {
        $created = academy_course_create($pdo, $validated['data']);
    } catch (PDOException $e) {
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A course with that plan key already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not create the course.']);
    }
    academy_json_response(201, ['ok' => true, 'course' => $created]);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $id = admin_courses_resolve_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Course id is required.']);
    }
    if (academy_course_get($pdo, $id) === null) {
        academy_json_response(404, ['ok' => false, 'message' => 'Course not found.']);
    }
    $payload = academy_request_payload();
    $validated = academy_course_validate_payload($payload);
    if ($validated['errors']) {
        academy_json_response(400, ['ok' => false, 'message' => implode(' ', $validated['errors'])]);
    }
    try {
        $updated = academy_course_update($pdo, $id, $validated['data']);
    } catch (PDOException $e) {
        if (str_contains((string) $e->getMessage(), 'UNIQUE')) {
            academy_json_response(409, ['ok' => false, 'message' => 'A course with that plan key already exists.']);
        }
        academy_json_response(500, ['ok' => false, 'message' => 'Could not update the course.']);
    }
    academy_json_response(200, ['ok' => true, 'course' => $updated]);
}

if ($method === 'DELETE') {
    $id = admin_courses_resolve_id();
    if ($id === null) {
        academy_json_response(400, ['ok' => false, 'message' => 'Course id is required.']);
    }
    $deleted = academy_course_delete($pdo, $id);
    if (!$deleted) {
        academy_json_response(404, ['ok' => false, 'message' => 'Course not found.']);
    }
    academy_json_response(200, ['ok' => true, 'message' => 'Course removed.']);
}

academy_json_response(405, ['ok' => false, 'message' => 'Method not allowed.']);
