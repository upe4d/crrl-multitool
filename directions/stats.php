<?php
declare(strict_types=1);

// Считаем только переходы из каталога; адреса и данные посетителей не сохраняем.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$catalog = json_decode((string) @file_get_contents(__DIR__ . '/catalog.json'), true);
if (!is_array($catalog)) respond(503, ['error' => 'Каталог недоступен']);
$allowed = [];
foreach ($catalog as $item) {
    if (isset($item['url']) && is_string($item['url'])) $allowed[$item['url']] = true;
}
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST') respond(405, ['error' => 'Метод не поддерживается']);
$url = '';
if ($method === 'POST') {
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 1024) respond(413, ['error' => 'Запрос слишком большой']);
    $input = json_decode((string) file_get_contents('php://input', false, null, 0, 1025), true);
    $url = is_array($input) && is_string($input['url'] ?? null) ? $input['url'] : '';
    if (strlen($url) > 300 || !isset($allowed[$url])) respond(400, ['error' => 'Неизвестный инструмент']);
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') respond(403, ['error' => 'Недопустимый источник']);
}
$dir = getenv('MULTITOOL_STATS_DIR') ?: '/var/lib/multitool-stats';
if (!is_dir($dir) || !is_writable($dir)) respond(503, ['error' => 'Статистика временно недоступна']);
$handle = @fopen($dir . '/catalog-counts.json', 'c+');
if (!$handle || !flock($handle, LOCK_EX)) respond(503, ['error' => 'Не удалось открыть статистику']);
$raw = stream_get_contents($handle, 131072);
$counts = $raw ? json_decode($raw, true) : [];
if (!is_array($counts)) { flock($handle, LOCK_UN); fclose($handle); respond(503, ['error' => 'Ошибка данных статистики']); }
if ($method === 'POST') {
    $counts[$url] = min((int) ($counts[$url] ?? 0) + 1, 1000000000);
    $encoded = json_encode($counts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    rewind($handle);
    if ($encoded === false || !ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
        flock($handle, LOCK_UN); fclose($handle); respond(503, ['error' => 'Не удалось сохранить статистику']);
    }
}
flock($handle, LOCK_UN);
fclose($handle);
$counts = array_intersect_key($counts, $allowed);
arsort($counts, SORT_NUMERIC);
respond(200, ['counts' => array_slice($counts, 0, 10, true)]);
