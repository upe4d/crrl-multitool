<?php
header('Content-Type: application/json; charset=utf-8'); http_response_code(503); echo json_encode(['error'=>'Этот формат требует установленного движка конвертации и не доступен на обычном PHP-хостинге.'],JSON_UNESCAPED_UNICODE);
