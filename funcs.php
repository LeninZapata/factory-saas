<?php
if( ! function_exists('get_file_data') ) :
/**
 * Obtener datos del header del archivo (compatibilidad standalone)
 *
 * @param string $file Ruta del archivo
 * @param array $headers Headers a extraer
 * @return array Datos extraídos
 */
function get_file_data($file, $headers = []) {
  $fileData = [];

  if (!file_exists($file)) {
    return array_fill_keys($headers, '');
  }

  // Leer primeras 8KB del archivo
  $fp = fopen($file, 'r');
  $fileContent = fread($fp, 8192);
  fclose($fp);

  // Mapeo de headers comunes
  $headerMap = [
    'Plugin Name'       => 'Name',
    'Plugin URI'        => 'PluginURI',
    'Description'       => 'Description',
    'Version'           => 'Version',
    'Author'            => 'Author',
    'Author URI'        => 'AuthorURI',
    'Text Domain'       => 'TextDomain',
    'Domain Path'       => 'DomainPath',
    'Requires at least' => 'RequiresWP',
    'Requires PHP'      => 'RequiresPHP',
    'License'           => 'License',
    'License URI'       => 'LicenseURI',
    'Plugin ID'         => 'PluginID',
    'Plugin prefix'     => 'PluginPrefix'
  ];

  // Extraer cada header
  foreach ($headers as $header) {
    $key = $headerMap[$header] ?? $header;

    // Buscar patrón: Header: Value
    $pattern = '/^[ \t\/*#@]*' . preg_quote($header, '/') . ':(.*)$/mi';

    if (preg_match($pattern, $fileContent, $match)) {
      $fileData[$key] = trim(preg_replace('/\s*(?:\*\/|\?>).*/', '', $match[1]));
    } else {
      $fileData[$key] = '';
    }
  }

  return $fileData;
}
endif;

if( ! function_exists('ogIsLocalhost') ) :
// Detecta si la aplicación está corriendo en localhost
function ogIsLocalhost() {
  $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
  return in_array($host, ['localhost', '127.0.0.1', '::1'])
    || strpos($host, 'localhost:') === 0
    || strpos($host, '127.0.0.1:') === 0;
}
endif;

if( ! function_exists('ogIsDev') ) :
// Detecta si la aplicación está en modo desarrollo
function ogIsDev() {
  return ogIsLocalhost() || (defined('OG_IS_DEV') && OG_IS_DEV);
}
endif;

if( ! function_exists('ogIsProduction') ) :
// Detecta si la aplicación está en modo producción
function ogIsProduction() {
  return !ogIsDev();
}
endif;