<?php
declare(strict_types=1);
// Хранилище расположено вне корня сайта, доступ синхронизируется общей блокировкой.
const TTL = 300;
const MAX_BYTES = 50 * 1024 * 1024;
function storageDir(): string { return getenv('TEMP_IMAGE_STORAGE') ?: dirname(__DIR__, 2) . '/photo-share-data'; }
function locked(callable $action): mixed {
    $dir = storageDir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('Хранилище недоступно');
    $lock = fopen($dir . '/.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Не удалось открыть хранилище');
    try { return $action($dir); } finally { flock($lock, LOCK_UN); fclose($lock); }
}
function readEntries(string $dir): array {
    $file = $dir . '/entries.json';
    if (!is_file($file)) return [];
    $decoded = json_decode((string)file_get_contents($file), true);
    if (!is_array($decoded)) throw new RuntimeException('Не удалось прочитать сведения о ссылках');
    return $decoded;
}
function saveEntries(string $dir, array $entries): void {
    $tmp = $dir . '/entries-' . bin2hex(random_bytes(8)) . '.tmp';
    $json = json_encode($entries, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, $dir . '/entries.json')) throw new RuntimeException('Не удалось сохранить сведения о ссылке');
}
function purgeExpired(string $dir, array &$entries, int $now): int {
    $count = 0;
    foreach ($entries as $id => $entry) {
        if (!preg_match('/^[A-Za-z0-9_-]{16}$/D', (string)$id) || !is_array($entry) || !isset($entry['expires']) || (int)$entry['expires'] > $now) continue;
        $file = $dir . '/' . $id . '.bin';
        if (is_file($file) && !@unlink($file)) continue;
        unset($entries[$id]); $count++;
    }
    // Если запись не сохранилась после загрузки, удаляем только собственные старые файлы.
    foreach (glob($dir . '/*.bin') ?: [] as $file) {
        $id = basename($file, '.bin');
        if (!preg_match('/^[A-Za-z0-9_-]{16}$/D', $id) || isset($entries[$id])) continue;
        $modified = @filemtime($file);
        if ($modified !== false && $modified + TTL <= $now && @unlink($file)) $count++;
    }
    return $count;
}
function ipHash(string $dir, string $ip): string {
    $file = $dir . '/.salt';
    if (!is_file($file) && file_put_contents($file, random_bytes(32), LOCK_EX) === false) throw new RuntimeException('Не удалось создать ключ');
    $salt = file_get_contents($file);
    if (!is_string($salt) || strlen($salt) !== 32) throw new RuntimeException('Ключ хранилища недоступен');
    return hash_hmac('sha256', $ip, $salt);
}
// Разбор размеров PHP адаптирован из Fileshare, лицензия приведена рядом.
function iniBytes(string $key): int {
    $value = trim((string)ini_get($key));
    if ($value === '' || $value === '-1') return PHP_INT_MAX;
    $last = strtolower(substr($value, -1)); $n = (int)$value;
    return match ($last) { 'g' => $n * 1073741824, 'm' => $n * 1048576, 'k' => $n * 1024, default => $n };
}
