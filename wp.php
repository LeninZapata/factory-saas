<?php
/**
 * Plugin Name: Factory SaaS
 * Plugin URI: https://factorysaas.com
 * Plugin ID: factory-saas
 * Plugin prefix: fs
 * Description: API REST para Factory SaaS - Framework híbrido standalone/WordPress
 * Version: 1.0.0
 * Author: Lenin Zapata
 * Author URI: https://factorysaas.com
 * Requires at least: 5.0
 * Requires PHP: 8.1
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */
// DETECTAR ENTORNO
$isWP = defined('ABSPATH') && function_exists('add_action');

// DEFINIR PATHS
// Definir paths según entorno
$thePluginPath = $isWP ? plugin_dir_path(__FILE__) : __DIR__;
$thePluginUrl  = $isWP ? plugin_dir_url(__FILE__) : '';

// Definir ABSPATH si no está definido (para wp and standalone)
if (!defined('ABSPATH')) { define('ABSPATH', $thePluginPath . '/'); }

// CARGAR FUNCIONES AUXILIARES DE NIVEL 1
require_once __DIR__ . '/funcs.php';

// OBTENER DATOS DEL PLUGIN
$pluginData = get_file_data(__FILE__, [ 'Plugin Name', 'Version', 'Text Domain', 'Description', 'Author', 'Requires PHP', 'Plugin ID' ]);

// CARGAR BOOTSTRAP
require_once $thePluginPath . '/backend/bootstrap.php'; // Cargar bootstrap (maneja todo)