<?php
// Constantes de configuración
define('IS_DEV', true);

// Configuración de zona horaria
define('TIMEZONE', 'America/Guayaquil');
date_default_timezone_set(TIMEZONE);

// Constantes de tiempo (en segundos)
define('TIME_SECOND', 1);
define('TIME_MINUTE', 60);
define('TIME_HOUR', 3600);
define('TIME_DAY', 86400);
define('TIME_WEEK', 604800);
define('TIME_MONTH', 2592000); // 30 días
define('TIME_YEAR', 31536000); // 365 días

// Configuración de sesiones
define('SESSION_TTL', TIME_DAY * 1); // 1 día (24 horas)
define('SESSION_TTL_MS', SESSION_TTL * 1000); // En milisegundos para frontend

// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'factory-saas');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Rutas del sistema
define('BASE_PATH', realpath(dirname(dirname(dirname(__DIR__)))));
define('BACKEND_PATH', BASE_PATH . '/backend');
define('FRAMEWORK_PATH', BACKEND_PATH . '/framework');
define('APP_PATH', BACKEND_PATH . '/app');
define('FRONTEND_PATH', BASE_PATH . '/frontend');
define('EXTENSIONS_PATH', BACKEND_PATH . '/extensions');
define('ROUTES_PATH', APP_PATH . '/routes');
define('STORAGE_PATH', APP_PATH . '/storage');
define('LOG_PATH', STORAGE_PATH . '/logs');
define('API_BASE_URL', '/api');

// Configuración de la API
define('API_DEFAULT_TIMEOUT', 60);
define('API_MAX_PAYLOAD_SIZE', 1048576);

// Ejecuta otros archivos de configuración
require_once APP_PATH . '/config/debug.php';