<?php
// Constantes de la APLICACIÓN (específicas de este proyecto)

// Cargar configuración de base de datos
$dbConfig = require __DIR__ . '/database.php';
define('DB_HOST', $dbConfig['host']);
define('DB_NAME', $dbConfig['name']);
define('DB_USER', $dbConfig['user']);
define('DB_PASS', $dbConfig['pass']);
define('DB_CHARSET', $dbConfig['charset']);

// Cargar nombres de tablas
$tables = require __DIR__ . '/tables.php';
define('DB_TABLES', $tables);


// Calcular rutas base ANTES de cargar framework
if (!defined('BASE_PATH')) {
  define('BASE_PATH', realpath(dirname(dirname(dirname(__DIR__)))));
  define('BACKEND_PATH', BASE_PATH . '/backend');
  define('APP_PATH', BACKEND_PATH . '/app');
}

// Rutas complementarias
define('STORAGE_PATH', APP_PATH . '/storage');
define('LOG_PATH', STORAGE_PATH . '/logs');
define('SHARED_PATH', BASE_PATH . '/shared');


// Aquí puedes agregar más constantes específicas del proyecto
// define('APP_NAME', 'Factory SaaS');
// define('APP_VERSION', '1.0.0');