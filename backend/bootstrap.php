<?php
// Inicialización compartida

// Validar versión de PHP requerida (antes de cargar cualquier cosa)
$phpValid = ogValidatePhpVersion($pluginData['RequiresPHP'] ?? '8.1', $isWP);

// Si falla en WordPress, no continuar carga
if (!$phpValid && $isWP) { return; }

$pluginName    = $isWP ? $pluginData['PluginID'] : 'default';
$appPath       = $thePluginPath . '/backend/app';

// Load framework
require_once $appPath . '/config/init.php';

// Registrar instancia de la aplicación
ogApp($pluginName, $appPath, $isWP);

// Guardar paths importantes en memoria volátil
ogApp()->helper('cache')::memorySet('path_middle', $thePluginPath . '/backend/middle');
ogApp()->helper('cache')::memorySet('path_framework', $thePluginPath . '/backend/framework');
ogApp()->helper('cache')::memorySet('path_backend', $thePluginPath . '/backend');

// Las rutas de app se cargan DESPUÉS de crear ogApplication
// HOOKS WORDPRESS (solo si está en WordPress)
if ($isWP) {

  // Registrar rewrite rules
  /*function factory_saas_rewrite_rules() {
    add_rewrite_rule(
      '^api/factory/(.*)$',
      'index.php?factory_api_route=$matches[1]',
      'top'
    );
  }
  add_action('init', 'factory_saas_rewrite_rules');

  // Registrar query var
  function factory_saas_query_vars($vars) {
    $vars[] = 'factory_api_route';
    return $vars;
  }
  add_filter('query_vars', 'factory_saas_query_vars');

  // Interceptar requests
  function factory_saas_template_redirect() {
    $route = get_query_var('factory_api_route');

    if ($route !== '') {
      $_SERVER['REQUEST_URI'] = '/api/' . $route;

      // Cargar y ejecutar api.php
      require_once FACTORY_BACKEND_PATH . '/api.php';
      exit;
    }
  }
  add_action('template_redirect', 'factory_saas_template_redirect', 1);

  // Flush rewrite rules
  register_activation_hook(FACTORY_PLUGIN_PATH . 'factory-saas-api.php', function() {
    factory_saas_rewrite_rules();
    flush_rewrite_rules();
  });

  register_deactivation_hook(FACTORY_PLUGIN_PATH . 'factory-saas-api.php', function() {
    flush_rewrite_rules();
  });*/

} else {
  // STANDALONE: Ejecutar api.php directamente
  // Si estamos en standalone (llamado desde wp-file.php vía .htaccess)
  // y la URL es /api/*, ejecutar api.php
  if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/api/') !== false) {
    require_once $thePluginPath . '/backend/api.php';
    exit;
  }
}

/**
 * @doc-start
 * FILE: backend/bootstrap.php
 * ROLE: Orquestador del arranque. Inicializa el framework, registra la instancia
 *       ogApp y despacha la request según el entorno (WordPress o standalone).
 *
 * ENTRYPOINT:
 *   Todo comienza desde wp.php (raíz del proyecto), que es el archivo inicial
 *   tanto para WordPress como para standalone.
 *
 * FLUJO COMPLETO DE ARRANQUE:
 *
 *   wp.php
 *   ├── Detecta entorno: $isWP = defined('ABSPATH')
 *   ├── Carga funcs.php (ogIsLocalhost, ogIsDev, ogValidatePhpVersion, get_file_data)
 *   ├── Lee metadata del plugin desde wp.php header (Plugin ID, Version, RequiresPHP...)
 *   └── Carga bootstrap.php
 *
 *   bootstrap.php
 *   ├── Valida versión PHP mínima (RequiresPHP del header de wp.php)
 *   ├── Carga app/config/init.php
 *   │   ├── Carga framework/config/init.php (si no está cargado)
 *   │   │   └── Inicializa núcleo: helpers, cores, middleware, rutas del framework
 *   │   ├── Carga app/config/consts.php  (constantes del proyecto, ej: WEBHOOK_META_VERIFY_TOKEN)
 *   │   └── Carga app/config/execute.php
 *   │       ├── Configura error reporting según OG_IS_DEV
 *   │       ├── Carga app/config/database.php → ogDb::setConfig()
 *   │       └── Carga app/config/tables.php   → ogDb::setTables()
 *   ├── Registra instancia: ogApp($pluginName, $appPath, $isWP)
 *   └── Guarda paths en memoria volátil (ogCache::memorySet):
 *       'path_middle'    → /backend/middle
 *       'path_framework' → /backend/framework
 *       'path_backend'   → /backend
 *
 *   STANDALONE → api.php
 *   ├── Headers CORS + Content-Type: application/json
 *   ├── Maneja OPTIONS preflight
 *   └── $app = new ogApplication(); $app->run();
 *       └── ogApi carga rutas: framework/ + middle/ + app/
 *
 *   WORDPRESS → hooks de WP (add_action, rewrite rules)
 *   └── intercepta /api/* → ejecuta api.php
 *
 * ARQUITECTURA DE 3 CAPAS:
 *   El sistema busca recursos en las 3 capas en orden: app → middle → framework
 *   Todas las capas comparten la misma estructura de carpetas interna:
 *
 *   {capa}/
 *   ├── resources/
 *   │   ├── controllers/   → XxxController.php
 *   │   ├── handlers/      → XxxHandler.php
 *   │   └── schemas/       → xxx.json (CRUD automático)
 *   ├── routes/            → xxx.php (rutas manuales)
 *   ├── lang/es/           → xxx.php (traducciones)
 *   ├── helpers/           → helpers locales de la capa
 *   └── services/          → servicios e integraciones
 *
 *   PORTABILIDAD: un archivo puede moverse entre capas sin modificación.
 *   Si AuthHandler.php está en middle/ y se mueve a app/, el sistema
 *   lo encontrará automáticamente porque busca en las 3 capas.
 *   Esto permite promover código de framework → middle → app según
 *   cuánto sea específico del proyecto.
 *
 *   PRIORIDAD: app/ siempre gana sobre middle/ y framework/.
 *   Si el mismo archivo existe en dos capas, se usa el de app/.
 *   Esto permite override sin tocar el código original.
 *
 * CAPAS DE RUTAS (cargadas por ogApi en cada request):
 *   1. framework/routes/  → system, logs, sessions, country
 *   2. middle/routes/     → auth, user, sessions, cleanup
 *   3. app/routes/        → bot, sale, webhook, product, client, etc.
 *
 * CONFIGURACIÓN DE LA APP (app/config/):
 *   consts.php   → constantes del proyecto (tokens, claves externas)
 *   database.php → credenciales DB por entorno (localhost vs producción)
 *   tables.php   → alias de tablas: ['bots'=>'bots', 'sales'=>'sales', ...]
 *   execute.php  → configura DB + tablas + error reporting
 *   init.php     → punto de entrada de app/config/, carga los 4 anteriores
 *
 * FUNCIONES GLOBALES (funcs.php — nivel raíz del proyecto):
 *   ogIsLocalhost()              → bool
 *   ogIsDev()                    → bool
 *   ogIsProduction()             → bool
 *   ogValidatePhpVersion($v)     → valida PHP mínimo, muestra error en WP o standalone
 *   get_file_data($file,$headers)→ extrae metadata del header de wp.php
 * @doc-end
 */