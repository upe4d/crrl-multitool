<?php
declare(strict_types=1);

// Реестр CLI хранит только явно опубликованный компонент; исходники не исполняются сервером.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
const REGISTRY_TTL = 86400;
const MAX_BYTES = 262144;
const MAX_ITEMS = 500;
$directory = getenv('TANCN_REGISTRY_DIR') ?: '/var/lib/multitool-tancn/registry';

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        header('Access-Control-Allow-Origin: *');
        $id = (string) ($_GET['id'] ?? '');
        if (!preg_match('/\A[a-f0-9]{32}\z/D', $id)) respond(404, ['error' => 'Компонент не найден']);
        $file = $directory . '/' . $id . '.json';
        if (!is_file($file) || filemtime($file) < time() - REGISTRY_TTL) respond(404, ['error' => 'Срок действия ссылки истёк']);
        $json = file_get_contents($file);
        if ($json === false) throw new RuntimeException('Registry read failed');
        echo $json;
        exit;
    }
    if ($method !== 'POST') respond(405, ['error' => 'Метод не поддерживается']);
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://tools.crrl.ru') respond(403, ['error' => 'Создайте ссылку в конструкторе Мультитула']);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') respond(415, ['error' => 'Ожидается JSON']);
    $raw = file_get_contents('php://input', false, null, 0, MAX_BYTES + 1);
    if ($raw === false || strlen($raw) > MAX_BYTES) respond(413, ['error' => 'Размер компонента превышает 256 КБ']);
    $item = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($item) || !is_string($item['name'] ?? null) || !preg_match('/\A[a-zA-Z0-9_-]{1,80}\z/D', $item['name']) || !is_array($item['files'] ?? null) || count($item['files']) < 1 || count($item['files']) > 20) respond(422, ['error' => 'Проверьте название и файлы компонента']);
    foreach ($item['files'] as $file) {
        if (!is_array($file) || !is_string($file['content'] ?? null) || !is_string($file['path'] ?? null) || strlen($file['path']) > 240 || str_contains($file['path'], '..') || str_starts_with($file['path'], '/')) respond(422, ['error' => 'Некорректное описание файла']);
    }
    if (!is_dir($directory) || !is_writable($directory)) throw new RuntimeException('Registry directory unavailable');
    $lock = fopen($directory . '/registry.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) throw new RuntimeException('Registry lock failed');
    // Обслуживаем только отдельный временный реестр: ссылки действуют одни сутки.
    $files = glob($directory . '/*.json') ?: [];
    $count = 0;
    foreach ($files as $file) {
        if (filemtime($file) < time() - REGISTRY_TTL) { unlink($file); } else { $count++; }
    }
    if ($count >= MAX_ITEMS) respond(429, ['error' => 'Реестр заполнен. Скопируйте код из редактора']);
    $item['$schema'] = 'https://ui.shadcn.com/schema/registry-item.json';
    $item['type'] = 'registry:component';
    $id = bin2hex(random_bytes(16));
    $bytes = json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (file_put_contents($directory . '/' . $id . '.json', $bytes, LOCK_EX) === false) throw new RuntimeException('Registry write failed');
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(201, ['data' => ['id' => 'https://tools.crrl.ru/tancn/registry.php?id=' . $id]]);
} catch (JsonException) {
    respond(400, ['error' => 'Некорректный JSON']);
} catch (Throwable $error) {
    error_log('TANCN registry: ' . $error->getMessage());
    respond(503, ['error' => 'Реестр временно недоступен. Код можно скопировать из редактора']);
}
