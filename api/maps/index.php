<?php
header('Content-Type: application/json; charset=utf-8'); http_response_code(503); echo json_encode(['error'=>'Сбор Google Maps требует отдельного браузерного процесса. На обычном PHP-хостинге без команд он недоступен.'],JSON_UNESCAPED_UNICODE);
