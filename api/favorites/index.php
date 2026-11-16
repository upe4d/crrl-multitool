<?php
declare(strict_types=1);

// Избранное и учётные записи хранятся вне доступного из интернета каталога.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('multitool_favorites');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
function reply(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function validUrls(array $urls, array $allowed): array {
    $out = [];
    foreach ($urls as $url) if (is_string($url) && isset($allowed[$url])) $out[$url] = true;
    return array_keys($out);
}
$dir = getenv('MULTITOOL_ACCOUNTS_DIR') ?: '/var/lib/multitool-accounts';
if (!is_dir($dir) || !is_writable($dir)) reply(503, ['error' => 'Сервис избранного временно недоступен']);
$catalog = json_decode((string) @file_get_contents(dirname(__DIR__, 2) . '/directions/catalog.json'), true);
if (!is_array($catalog)) reply(503, ['error' => 'Каталог временно недоступен']);
// Игры участвуют в том же избранном; допустимы только адреса из локального каталога.
$games = json_decode((string) @file_get_contents(dirname(__DIR__, 2) . '/games/catalog.json'), true);
if (is_array($games)) {
    foreach ($games as $game) {
        if (is_array($game) && is_string($game['url'] ?? null) && preg_match('/\A\/games\/play\.html\?id=[a-z0-9-]+\z/D', $game['url'])) $catalog[] = $game;
    }
}
$allowed = [];
foreach ($catalog as $item) if (isset($item['url']) && is_string($item['url'])) $allowed[$item['url']] = true;
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST') reply(405, ['error' => 'Метод не поддерживается']);
$input = [];
if ($method === 'POST') {
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) reply(413, ['error' => 'Слишком большой запрос']);
    $input = json_decode((string) file_get_contents('php://input', false, null, 0, 32769), true);
    if (!is_array($input) || !is_string($input['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $input['csrf'])) reply(403, ['error' => 'Обновите страницу и повторите действие']);
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') reply(403, ['error' => 'Недопустимый источник']);
}
$lock = @fopen($dir . '/accounts.lock', 'c+');
if (!$lock || !flock($lock, LOCK_EX)) reply(503, ['error' => 'Сервис временно занят']);
$path = $dir . '/accounts.json';
$raw = is_file($path) ? @file_get_contents($path) : '{}';
$accounts = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($accounts)) { flock($lock, LOCK_UN); fclose($lock); reply(503, ['error' => 'Ошибка хранилища']); }
$user = $_SESSION['user'] ?? null;
$action = $method === 'POST' && is_string($input['action'] ?? null) ? $input['action'] : '';
$dirty = false;
$error = null;
$code = 400;
if ($action === 'register' || $action === 'login') {
    $userName = strtolower(trim(is_string($input['username'] ?? null) ? $input['username'] : ''));
    $now = time();
    // Ограничение попыток по адресу хранится в виде хеша и автоматически устаревает.
    $limitPath = $dir . '/attempts.json';
    $attempts = is_file($limitPath) ? json_decode((string) @file_get_contents($limitPath), true) : [];
    if (!is_array($attempts)) $attempts = [];
    $attempts = array_filter($attempts, static fn($row) => is_array($row) && ($row['until'] ?? 0) > $now);
    $key = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $entry = $attempts[$key] ?? ['count' => 0, 'until' => $now + 900];
    if (($entry['count'] ?? 0) >= 10) { $error = 'Слишком много попыток. Повторите через 15 минут'; $code = 429; }
    else {
        $entry['count']++; $attempts[$key] = $entry;
        if (count($attempts) > 10000 || file_put_contents($limitPath, json_encode($attempts), LOCK_EX) === false) { $error = 'Сервис временно недоступен'; $code = 503; }
        elseif (!preg_match('/\A[a-z0-9_.-]{3,32}\z/D', $userName)) $error = 'Логин: 3–32 латинских символа, цифры, точка, дефис или подчёркивание';
        elseif ($action === 'register' && isset($accounts[$userName])) $error = 'Этот логин уже занят';
        elseif ($action === 'register' && count($accounts) >= 10000) { $error = 'Регистрация временно недоступна'; $code = 503; }
        elseif ($action === 'login' && !isset($accounts[$userName])) { $error = 'Логин не найден'; $code = 404; }
        else {
            if ($action === 'register') { $accounts[$userName] = ['favorites' => []]; $dirty = true; }
            session_regenerate_id(true);
            $_SESSION['user'] = $userName; $_SESSION['csrf'] = bin2hex(random_bytes(32)); $user = $userName;
        }
    }
} elseif ($action === 'logout') {
    unset($_SESSION['user']); session_regenerate_id(true); $_SESSION['csrf'] = bin2hex(random_bytes(32)); $user = null;
} elseif ($action === 'change') {
    if (!is_string($user) || !isset($accounts[$user])) { $error = 'Войдите в аккаунт'; $code = 401; }
    else {
        $add = is_array($input['add'] ?? null) ? validUrls($input['add'], $allowed) : [];
        $remove = is_array($input['remove'] ?? null) ? validUrls($input['remove'], $allowed) : [];
        $old = validUrls(is_array($accounts[$user]['favorites'] ?? null) ? $accounts[$user]['favorites'] : [], $allowed);
        $accounts[$user]['favorites'] = array_values(array_diff(array_unique(array_merge($old, $add)), $remove));
        $dirty = true;
    }
} elseif ($method === 'POST') $error = 'Неизвестное действие';
if ($dirty && !$error) {
    $encoded = json_encode($accounts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $temp = tempnam($dir, 'account-');
    if ($encoded === false || $temp === false || file_put_contents($temp, $encoded, LOCK_EX) !== strlen($encoded) || !rename($temp, $path)) {
        if (is_string($temp) && is_file($temp)) unlink($temp);
        $error = 'Не удалось сохранить данные'; $code = 503;
        if ($action === 'register') unset($_SESSION['user']);
    }
}
$result = ['csrf' => $_SESSION['csrf'], 'username' => null, 'favorites' => []];
if (!$error && is_string($user) && isset($accounts[$user])) {
    $result['username'] = $user;
    $result['favorites'] = validUrls(is_array($accounts[$user]['favorites'] ?? null) ? $accounts[$user]['favorites'] : [], $allowed);
}
flock($lock, LOCK_UN); fclose($lock);
if ($error) reply($code, ['error' => $error]);
reply(200, $result);
