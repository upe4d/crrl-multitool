<?php
header('Content-Type: application/json; charset=utf-8'); http_response_code(503); echo json_encode(['error'=>'Для генерации ИИ нужен отдельно настроенный сервер модели. Можно создать заготовку без ИИ.'],JSON_UNESCAPED_UNICODE);
