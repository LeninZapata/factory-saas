<?php
/**
 * Plugin Name: Factory SaaS
 * Plugin URI: https://factorysaas.com
 * Plugin ID: factory-saas
 * Plugin prefix: fs
 * Description: API REST para Factory SaaS - Framework híbrido standalone/WordPress
 * Version: 0.1
 * Author: Lenin Zapata
 * Author URI: https://factorysaas.com
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */
// Detectar entorno
$isWP = defined('ABSPATH') && function_exists('add_action');

// Definir paths según entorno
$thePluginPath = $isWP ? plugin_dir_path(__FILE__) : __DIR__;
$thePluginUrl  = $isWP ? plugin_dir_url(__FILE__) : '';

// Definir ABSPATH si no está definido (para wp and standalone)
if (!defined('ABSPATH')) { define('ABSPATH', $thePluginPath . '/'); }

// Cargar funciones auxiliares de nivel 1
require_once __DIR__ . '/funcs.php';

// Obtener datos del plugin
$pluginData = get_file_data(__FILE__, [ 
  'Plugin Name', 'Version', 'Text Domain', 
  'Description', 'Author', 'Requires PHP', 
  'Plugin ID', 'Plugin prefix'
]);

// Cargar bootstrap
require_once $thePluginPath . '/backend/bootstrap.php'; // Cargar bootstrap (maneja todo)