<?php
/* Проксирует только необходимые Mail.tm API-маршруты с нашего домена, чтобы браузер не блокировал CORS. */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$path = (string)($_GET['path'] ?? '');
$parsed = parse_url($path);
$route = (string)($parsed['path'] ?? '');
$query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

if (!preg_match('~^/(domains|accounts|token|messages)(/[A-Za-z0-9_-]+)?$~', $route)) {
    http_response_code(400);
    echo json_encode(['message' => 'Недопустимый маршрут Mail.tm'], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$allowedMethods = ['GET', 'POST'];
if (!in_array($method, $allowedMethods, true)) {
    http_response_code(405);
    header('Allow: GET, POST');
    exit;
}

$ch = curl_init('https://api.mail.tm' . $route . $query);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => array_values(array_filter([
        'Accept: application/json',
        'Content-Type: application/json',
        isset($_SERVER['HTTP_AUTHORIZATION']) ? 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'] : null,
    ])),
]);
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$body = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($body === false || $error !== '') {
    http_response_code(502);
    echo json_encode(['message' => 'Mail.tm временно недоступен'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code($status > 0 ? $status : 502);
echo $body;
