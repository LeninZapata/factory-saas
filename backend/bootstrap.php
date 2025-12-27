<?php
/**
 * BOOTSTRAP.PHP - Inicialización compartida
 * Funciona tanto standalone como en WordPress
 */

// ========================================
// DETECTAR ENTORNO
// ========================================
$isWordPress = defined('ABSPATH');

// ========================================
// DEFINIR PATHS
// ========================================

if ($isWordPress) {
  // WordPress: paths del plugin
  if (!defined('FACTORY_PLUGIN_PATH')) {
    define('FACTORY_PLUGIN_PATH', plugin_dir_path(__FILE__));
  }

  define('FACTORY_BASE_PATH', FACTORY_PLUGIN_PATH);
  define('FACTORY_BACKEND_PATH', FACTORY_BASE_PATH . '/backend');
  define('FACTORY_APP_PATH', FACTORY_BACKEND_PATH . '/app');

  $pluginName = 'factory-saas';
  $appPath = FACTORY_APP_PATH;

} else {
  // Standalone: paths relativos
  if (!defined('FACTORY_BASE_PATH')) {
    define('FACTORY_BASE_PATH', dirname(__DIR__)); // Desde /backend/bootstrap.php
  }

  define('FACTORY_BACKEND_PATH', FACTORY_BASE_PATH . '/backend');
  define('FACTORY_APP_PATH', FACTORY_BACKEND_PATH . '/app');

  $pluginName = 'default';
  $appPath = FACTORY_APP_PATH;
}

// ========================================
// CONSTANTES GLOBALES (compatibilidad)
// ========================================

if (!defined('BASE_PATH')) {
  define('BASE_PATH', FACTORY_BASE_PATH);
  define('BACKEND_PATH', FACTORY_BACKEND_PATH);
  define('APP_PATH', FACTORY_APP_PATH);
}

// ========================================
// CARGAR FRAMEWORK
// ========================================

// Cargar init.php (carga framework si no existe)
require_once FACTORY_APP_PATH . '/config/init.php';

// ========================================
// REGISTRAR INSTANCIA
// ========================================

// Registrar instancia de la aplicación
ogApp($pluginName, $appPath);

// ========================================
// HOOKS WORDPRESS (solo si está en WordPress)
// ========================================

if ($isWordPress) {

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
}