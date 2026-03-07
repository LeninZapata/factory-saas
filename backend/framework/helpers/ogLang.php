<?php
// lang - Helper de idiomas con lazy loading y cache
class ogLang {
  private static $translations = [];
  private static $loaded = [];  // Cache de módulos cargados
  private static $locale = 'es';
  private static $fallback = 'es';

  // Cargar idioma (solo guarda el locale, NO carga archivos)
  static function load($locale = 'es') {
    self::$locale = $locale;
    // NO cargamos archivos aquí, se hace bajo demanda en get()
  }

  // Obtener traducción usando dot notation (con lazy loading)
  static function get($key, $replace = []) {
    // Extraer módulo (primera parte antes del punto)
    $parts = explode('.', $key);
    $module = $parts[0];  // Ej: 'core', 'auth', 'services'

    // Lazy load: cargar módulo solo si no está en cache
    if (!isset(self::$loaded[$module])) {
      self::loadModule($module);
    }

    // Navegar por el árbol de traducciones
    $value = self::$translations;
    foreach ($parts as $segment) {
      if (!isset($value[$segment])) {
        return $key; // Si no existe, retornar la key
      }
      $value = $value[$segment];
    }

    // Reemplazar variables {var}
    foreach ($replace as $k => $v) {
      $value = str_replace("{{$k}}", $v, $value);
    }

    return $value;
  }

  // Cargar módulo específico bajo demanda
  private static function loadModule($module) {
    // Marcar como cargado (evitar loops)
    self::$loaded[$module] = true;

    $merged = [];

    // Caso especial: 'services' (es un array de subarrays)
    if ($module === 'services') {
      $merged = self::loadServicesModules();
      self::$translations[$module] = $merged;
      return;
    }

    // 1. Cargar desde framework
    $frameworkFile = OG_FRAMEWORK_PATH . "/lang/" . self::$locale . "/{$module}.php";
    if (file_exists($frameworkFile)) {
      $merged = require $frameworkFile;
    }

    // 2. Merge con app (si existe)
    $appFile = ogApp()->getPath() . "/lang/" . self::$locale . "/{$module}.php";
    if (file_exists($appFile)) {
      $appTranslations = require $appFile;
      $merged = array_merge($merged, $appTranslations);
    }

    self::$translations[$module] = $merged;
  }

  // Cargar módulos de services bajo demanda
  private static function loadServicesModules() {
    $services = [];

    // Cargar services del framework
    $frameworkServicesPath = OG_FRAMEWORK_PATH . "/lang/" . self::$locale . "/services/";
    if (is_dir($frameworkServicesPath)) {
      foreach (scandir($frameworkServicesPath) as $file) {
        if ($file === '.' || $file === '..') continue;
        $serviceName = str_replace('.php', '', $file);
        $services[$serviceName] = require $frameworkServicesPath . $file;
      }
    }

    // Merge con services del app (si existen)
    $appServicesPath = ogApp()->getPath() . "/lang/" . self::$locale . "/services/";
    if (is_dir($appServicesPath)) {
      foreach (scandir($appServicesPath) as $file) {
        if ($file === '.' || $file === '..') continue;
        $serviceName = str_replace('.php', '', $file);

        if (isset($services[$serviceName])) {
          // Merge si ya existe en framework
          $appServiceTranslations = require $appServicesPath . $file;
          $services[$serviceName] = array_merge($services[$serviceName], $appServiceTranslations);
        } else {
          // Agregar si es nuevo del app
          $services[$serviceName] = require $appServicesPath . $file;
        }
      }
    }

    return $services;
  }

  // Cambiar idioma en runtime
  static function setLocale($locale) {
    self::$locale = $locale;
    self::$translations = [];  // Limpiar cache
    self::$loaded = [];        // Limpiar módulos cargados
  }

  // Obtener idioma actual
  static function getLocale() {
    return self::$locale;
  }

  // Debug: ver qué módulos están cargados en memoria
  static function getLoadedModules() {
    return array_keys(self::$loaded);
  }

  // Debug: ver estadísticas de cache
  static function getCacheStats() {
    return [
      'locale' => self::$locale,
      'modules_loaded' => count(self::$loaded),
      'modules' => array_keys(self::$loaded),
      'memory_usage' => memory_get_usage(true)
    ];
  }
}

// Helper global __()
if( !function_exists('__')) {
  function __($key, $replace = []) {
    return ogLang::get($key, $replace);
  }
}


/**
 * @doc-start
 * FILE: framework/helpers/ogLang.php
 * ROLE: Helper de traducciones con lazy loading por módulo. Carga archivos de
 *       idioma bajo demanda la primera vez que se accede a cada módulo.
 *
 * USO PRINCIPAL (helper global):
 *   __('auth.login_failed')
 *   __('core.controller.not_found', ['resource' => 'user'])
 *   __('services.email.sent')
 *
 * MÉTODOS:
 *   ogLang::load('es')              → establece locale (NO carga archivos)
 *   ogLang::get($key, $replace)     → obtiene traducción con dot notation
 *   ogLang::setLocale('en')         → cambia idioma y limpia cache en runtime
 *   ogLang::getLocale()             → retorna locale actual
 *   ogLang::getLoadedModules()      → array de módulos cargados (debug)
 *   ogLang::getCacheStats()         → locale, módulos cargados, memory usage (debug)
 *
 * ESTRUCTURA DE ARCHIVOS:
 *   framework/lang/es/{module}.php          → traducciones base del framework
 *   framework/lang/es/services/{service}.php → traducciones de servicios
 *   app/lang/es/{module}.php                → sobreescribe/extiende framework
 *
 * MÓDULOS DISPONIBLES EN FRAMEWORK:
 *   api, auth, core, country, helper, log, middleware, session, validation
 *   services: ai, chatapi, email, evolution, storage, webhook
 *
 * LAZY LOADING:
 *   - Al llamar __('auth.x') → carga framework/lang/es/auth.php + app/lang/es/auth.php
 *   - Merge app sobre framework (app tiene prioridad)
 *   - Módulo 'services' carga todos los archivos de la carpeta services/
 *   - Cada módulo se carga una sola vez por request
 *
 * VARIABLES EN TRADUCCIONES:
 *   Archivo: 'not_found' => 'Recurso {resource} no encontrado'
 *   Uso:     __('core.not_found', ['resource' => 'user'])
 *
 * NOTAS:
 *   - helper __() protegido con function_exists() para multi-plugin
 *   - Si key no existe retorna la key original (nunca falla)
 *   - Fallback locale: 'es'
 * @doc-end
 */