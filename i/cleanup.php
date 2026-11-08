<?php
declare(strict_types=1);
// Запускать только из планировщика; по HTTP очистка недоступна.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/storage.php';
try {
    $n = locked(function (string $dir): int { $entries = readEntries($dir); $removed = purgeExpired($dir, $entries, time()); if ($removed) saveEntries($dir, $entries); return $removed; });
    echo "Удалено просроченных изображений: $n\n";
} catch (Throwable $e) { fwrite(STDERR, $e->getMessage() . "\n"); exit(1); }
