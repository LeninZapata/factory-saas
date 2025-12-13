<?php
// Configuración de base de datos
define('DB_HOST', isLocalhost() ? 'localhost' : '');
define('DB_NAME', isLocalhost() ? 'factory-saas' : '');
define('DB_USER', isLocalhost() ? 'root' : '');
define('DB_PASS', isLocalhost() ? '' : '');
define('DB_CHARSET', 'utf8mb4');