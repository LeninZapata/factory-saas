<?php
// Constantes del FRAMEWORK (genéricas, reutilizables)

// Configuración de zona horaria
define('OG_TIMEZONE', 'America/Guayaquil');
date_default_timezone_set(OG_TIMEZONE);

// Constantes de tiempo (en segundos)
define('OG_TIME_SECOND', 1);
define('OG_TIME_MINUTE', 60);
define('OG_TIME_HOUR', 3600);
define('OG_TIME_DAY', 86400);
define('OG_TIME_WEEK', 604800);
define('OG_TIME_MONTH', 2592000);
define('OG_TIME_YEAR', 31536000);

// Configuración de sesiones
define('OG_SESSION_TTL', OG_TIME_DAY * 1);
define('OG_SESSION_TTL_MS', OG_SESSION_TTL * 1000);

// Configuración de la API
define('OG_API_DEFAULT_TIMEOUT', 60);
define('OG_API_MAX_PAYLOAD_SIZE', 1048576);

// Configuración de idioma
define('OG_DEFAULT_LANG', 'es');

// Rutas de Servicios del Framework
define('OG_SERVICES_PATH', OG_FRAMEWORK_PATH . '/services');

/**
 * @doc-start
 * FILE: framework/config/consts.php
 * ROLE: Constantes globales del framework. Genéricas y reutilizables por cualquier proyecto.
 *
 * TIEMPO:
 *   OG_TIME_SECOND | OG_TIME_MINUTE | OG_TIME_HOUR
 *   OG_TIME_DAY | OG_TIME_WEEK | OG_TIME_MONTH | OG_TIME_YEAR
 *
 * SESIONES:
 *   OG_SESSION_TTL    → duración en segundos (default: 1 día)
 *   OG_SESSION_TTL_MS → duración en milisegundos
 *
 * API:
 *   OG_API_DEFAULT_TIMEOUT   → 60 segundos
 *   OG_API_MAX_PAYLOAD_SIZE  → 1MB
 *
 * OTROS:
 *   OG_TIMEZONE    → 'America/Guayaquil' (se aplica con date_default_timezone_set)
 *   OG_DEFAULT_LANG → 'es'
 *   OG_SERVICES_PATH → OG_FRAMEWORK_PATH . '/services'
 * @doc-end
 */