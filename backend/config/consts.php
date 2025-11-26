<?php
// Constantes de configuración
define('IS_DEV', true);

define('DB_HOST', 'localhost');
define('DB_NAME', 'factory-saas');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

define('BASE_PATH', realpath(dirname(dirname((__DIR__)))));
define('BACKEND_PATH', BASE_PATH . '/backend/');
define('FRONTEND_PATH', BASE_PATH . '/frontend/');
define('ROUTES_PATH', BACKEND_PATH . 'routes/');
define('STORAGE_PATH', BACKEND_PATH . '/storage/');
define('LOG_PATH', STORAGE_PATH . 'logs/');
define('API_BASE_URL', '/api/');

define('API_DEFAULT_TIMEOUT', 30);
define('API_MAX_PAYLOAD_SIZE', 1048576);