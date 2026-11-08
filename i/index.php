<?php
declare(strict_types=1);
require __DIR__ . '/storage.php';
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, no-cache, must-revalidate, private');
header("Content-Security-Policy: default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'");
function respond(int $code, array $data): never { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function validId(mixed $id): bool { return is_string($id) && preg_match('/^[A-Za-z0-9_-]{16}$/D', $id) === 1; }
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $expected = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://') . $host;
        if ($origin === '' || !hash_equals($expected, $origin)) respond(403, ['error' => 'Запрос отклонён']);
        $f = $_FILES['image'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK) respond(400, ['error' => 'Не удалось загрузить файл. Проверьте ограничение размера сервера.']);
        if ($f['size'] < 1 || $f['size'] > MAX_BYTES) respond(400, ['error' => 'Размер изображения должен быть не больше 50 МиБ']);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true) || @getimagesize($f['tmp_name']) === false) respond(400, ['error' => 'Поддерживаются изображения JPG, PNG, GIF и WebP']);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        if (!filter_var($ip, FILTER_VALIDATE_IP)) respond(400, ['error' => 'Не удалось определить IP-адрес']);
        $created = locked(function (string $dir) use ($f, $ip, $mime): array {
            $now = time(); $entries = readEntries($dir); purgeExpired($dir, $entries, $now);
            $hash = ipHash($dir, $ip);
            foreach ($entries as $entry) if (($entry['ip'] ?? '') === $hash && (int)($entry['expires'] ?? 0) > $now) return ['blocked' => true, 'expires' => (int)$entry['expires']];
            $id = rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
            if (isset($entries[$id]) || is_file($dir . '/' . $id . '.bin')) throw new RuntimeException('Повторите загрузку');
            if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $id . '.bin')) throw new RuntimeException('Не удалось сохранить изображение');
            $entries[$id] = ['ip' => $hash, 'mime' => $mime, 'expires' => $now + TTL];
            saveEntries($dir, $entries);
            return ['id' => $id, 'expires' => $now + TTL];
        });
        if (!empty($created['blocked'])) respond(429, ['error' => 'С этого IP уже создана активная ссылка. Дождитесь её истечения.', 'expires' => $created['expires']]);
        respond(201, ['id' => $created['id'], 'expires' => $created['expires']]);
    }
    $id = $_GET['file'] ?? null;
    if ($id !== null) {
        if (!validId($id)) { http_response_code(404); exit; }
        $found = locked(function (string $dir) use ($id): ?array {
            $entries = readEntries($dir); $e = $entries[$id] ?? null;
            if (!$e || (int)$e['expires'] <= time() || !in_array($e['mime'] ?? '', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) return null;
            $handle = @fopen($dir . '/' . $id . '.bin', 'rb');
            if (!$handle) return null;
            return ['handle' => $handle, 'mime' => $e['mime'], 'size' => fstat($handle)['size']];
        });
        if (!$found) { http_response_code(404); exit; }
        header('Content-Type: ' . $found['mime']); header('Content-Disposition: inline; filename="image"');
        header('Content-Length: ' . $found['size']); fpassthru($found['handle']); fclose($found['handle']);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); exit; }
    $view = $_GET['id'] ?? '';
    $expiry = validId($view) ? locked(function (string $dir) use ($view): int { $e = readEntries($dir)[$view] ?? null; return $e && (int)$e['expires'] > time() && is_file($dir . '/' . $view . '.bin') ? (int)$e['expires'] : 0; }) : 0;
    if ($view !== '' && !$expiry) http_response_code(404);
} catch (Throwable $e) { if ($_SERVER['REQUEST_METHOD'] === 'POST') respond(500, ['error' => 'Сервис временно недоступен']); http_response_code(500); exit('Сервис временно недоступен'); }
?><!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Передай изображение</title><link rel="stylesheet" href="style.css?v=1"></head><body><header><a class="brand" href="/">МУЛЬТИ<span>ТУЛ</span></a><a class="back" href="/#notes">← Передай текст</a></header><main><div class="intro"><span class="eyebrow">БЫСТРЫЙ ОБМЕН / ИЗОБРАЖЕНИЯ</span><h1>Передай изображение</h1><p>Загрузите картинку и поделитесь ссылкой. Через пять минут после создания она перестанет работать.</p></div>
<?php if ($view !== '' && !$expiry): ?><div class="box"><h2>Ссылка больше не действует</h2><p>Изображение удалено или срок хранения истёк.</p><a class="button" href="./">Создать новую ссылку ↗</a></div>
<?php elseif ($expiry): ?><div class="layout"><section class="box"><div class="row"><h2>Изображение</h2><span class="timer" data-expiry="<?= $expiry ?>">Осталось ...</span></div><img class="shared" src="?file=<?= htmlspecialchars($view, ENT_QUOTES) ?>" alt="Общее изображение"><a class="button" href="?file=<?= htmlspecialchars($view, ENT_QUOTES) ?>" download="image">Скачать изображение ↓</a></section><aside class="box info"><h2>Временная ссылка</h2><p>Срок отсчитывается с момента создания. После истечения ссылка перестанет открываться у всех.</p><a href="./">Создать свою ссылку ↗</a></aside></div>
<?php else: ?><div class="layout"><section class="box"><form id="upload"><div class="row"><h2>Загрузите изображение</h2><span class="limit">До 50 МиБ</span></div><label class="drop" for="image"><span>↑</span><strong id="filename">Выберите изображение</strong><small>JPG, PNG, GIF или WebP</small><input id="image" type="file" name="image" accept="image/jpeg,image/png,image/gif,image/webp" required hidden></label><div class="actions"><button type="submit" id="submit">Создать ссылку ↗</button><span id="status" role="status" aria-live="polite"></span></div></form><div id="result" hidden><label for="link">Ваша ссылка</label><div class="copy-row"><input id="link" readonly><button type="button" id="copy">Копировать</button></div><p class="timer" id="countdown"></p></div></section><aside class="box info"><h2>Как это работает</h2><p><b>01</b> Загрузите изображение до 50 МиБ</p><p><b>02</b> Отправьте полученную ссылку</p><p><b>03</b> Через 5 минут ссылка перестанет действовать</p><p>С одного IP можно создать одну активную ссылку.</p></aside></div><?php endif; ?></main><script src="app.js?v=1" defer></script></body></html>
