<?php
/**
 * Log - Sistema de logging avanzado
 *
 * Características:
 * - Formato TAB-separated parseable
 * - Auto-detección de file/line
 * - Configuración flexible (presets + templates)
 * - Rotación por tamaño (1MB default)
 * - Organización por carpetas customizables
 */
class log {

  private static $config = [
    'format' => 'daily',              // daily, monthly, single, custom
    'template' => null,               // Template personalizado si format=custom
    'level' => 'debug',               // Nivel mínimo: debug, info, warning, error
    'max_size' => 1048576,            // 1MB por archivo
    'enabled' => true                 // Habilitar/deshabilitar logs
  ];

  private static $levels = [
    'debug' => 0,
    'info' => 1,
    'warning' => 2,
    'error' => 3
  ];

  // Configurar el sistema de logs
  static function setConfig($config) {
    self::$config = array_merge(self::$config, $config);
  }

  // Log debug (solo desarrollo)
  static function debug($msg, $ctx = [], $meta = []) {
    if (!IS_DEV) return;
    self::write('DEBUG', $msg, $ctx, $meta);
  }

  // Log info
  static function info($msg, $ctx = [], $meta = []) {
    self::write('INFO', $msg, $ctx, $meta);
  }

  // Log warning
  static function warning($msg, $ctx = [], $meta = []) {
    self::write('WARNING', $msg, $ctx, $meta);
  }

  // Log error
  static function error($msg, $ctx = [], $meta = []) {
    self::write('ERROR', $msg, $ctx, $meta);
  }

  // Log SQL (solo desarrollo)
  static function sql($sql, $bindings = []) {
    if (!IS_DEV) return;
    self::write('SQL', $sql, ['bindings' => $bindings], ['module' => 'database']);
  }

  /**
   * Método principal de escritura
   *
   * @param string $level Nivel del log (DEBUG, INFO, WARNING, ERROR)
   * @param string $msg Mensaje descriptivo
   * @param array $ctx Contexto/datos (se convierte a JSON)
   * @param array $meta Metadata adicional (module, custom vars, etc.)
   */
  private static function write($level, $msg, $ctx = [], $meta = []) {
    // Verificar si está habilitado
    if (!self::$config['enabled']) return;

    // Verificar nivel mínimo
    $minLevel = self::$levels[self::$config['level']] ?? 0;
    $currentLevel = self::$levels[strtolower($level)] ?? 0;
    if ($currentLevel < $minLevel) return;

    // Auto-detectar file y line
    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
    $caller = $trace[2] ?? $trace[1] ?? [];

    $file = isset($caller['file']) ? basename($caller['file']) : 'unknown';
    $line = $caller['line'] ?? 0;
    $module = $meta['module'] ?? 'app';

    // Formato del log (TAB-separated)
    // [timestamp] [level] [module] [file:line] [message] [context_json]
    $timestamp = date('Y-m-d H:i:s');
    $contextJson = empty($ctx) ? '' : json_encode($ctx, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $logLine = implode("\t", [
      "[$timestamp]",
      $level,
      $module,
      "$file:$line",
      $msg,
      $contextJson
    ]) . PHP_EOL;

    // Obtener ruta del archivo de log
    $logFile = self::getLogFilePath($level, $module, $meta);

    // Crear directorio si no existe
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
      mkdir($logDir, 0755, true);
    }

    // Verificar rotación por tamaño
    $logFile = self::checkRotation($logFile);

    // Escribir en archivo
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
  }

  /**
   * Obtener ruta del archivo de log según configuración
   *
   * @param string $level Nivel del log
   * @param string $module Módulo
   * @param array $meta Metadata con custom vars
   * @return string Ruta completa del archivo
   */
  private static function getLogFilePath($level, $module, $meta) {
    $basePath = LOG_PATH;
    $date = [
      'year' => date('Y'),
      'month' => date('m'),
      'day' => date('d'),
      'hour' => date('H')
    ];

    $format = self::$config['format'];

    // Presets
    switch ($format) {
      case 'single':
        // Todos en un archivo: logs/app.log
        return "$basePath/app.log";

      case 'monthly':
        // Por mes: logs/2025/12/app.log
        return "$basePath/{$date['year']}/{$date['month']}/app.log";

      case 'daily':
        // Por día: logs/2025/12/08/app.log
        return "$basePath/{$date['year']}/{$date['month']}/{$date['day']}/app.log";

      case 'custom':
        // Template personalizado
        return self::parseTemplate($basePath, $date, $module, $meta);

      default:
        // Default: daily
        return "$basePath/{$date['year']}/{$date['month']}/{$date['day']}/app.log";
    }
  }

  /**
   * Parsear template personalizado
   *
   * Template puede usar variables:
   * - {year}, {month}, {day}, {hour}
   * - {module}
   * - {custom_var} donde custom_var viene en $meta['custom']
   *
   * Ejemplos:
   * - "{year}/{month}/{day}/{module}.log"
   * - "{year}/{month}/{day}/bot/{bot_id}.log"
   * - "{module}/{year}/{month}/{day}/{file}.log"
   *
   * @param string $basePath Base path de logs
   * @param array $date Array con year, month, day, hour
   * @param string $module Módulo actual
   * @param array $meta Metadata con custom vars
   * @return string Ruta completa
   */
  private static function parseTemplate($basePath, $date, $module, $meta) {
    $template = self::$config['template'] ?? '{year}/{month}/{day}/{module}.log';

    // Reemplazar variables de fecha
    $template = str_replace(
      ['{year}', '{month}', '{day}', '{hour}'],
      [$date['year'], $date['month'], $date['day'], $date['hour']],
      $template
    );

    // Reemplazar module
    $template = str_replace('{module}', $module, $template);

    // Reemplazar custom vars
    if (isset($meta['custom']) && is_array($meta['custom'])) {
      foreach ($meta['custom'] as $key => $value) {
        $template = str_replace("{{$key}}", $value, $template);
      }
    }

    // Si quedaron variables sin reemplazar, usar 'default'
    $template = preg_replace('/\{[^}]+\}/', 'default', $template);

    // Asegurar extensión .log
    if (!str_ends_with($template, '.log')) {
      $template .= '.log';
    }

    return "$basePath/$template";
  }

  /**
   * Verificar rotación por tamaño
   * Si el archivo supera el límite, crear uno nuevo con sufijo
   *
   * Ejemplos:
   * - app.log (< 1MB)
   * - app_1.log (cuando app.log llega a 1MB)
   * - app_2.log (cuando app_1.log llega a 1MB)
   *
   * @param string $logFile Ruta del archivo
   * @return string Ruta del archivo (puede ser el mismo o uno nuevo)
   */
  private static function checkRotation($logFile) {
    $maxSize = self::$config['max_size'];

    // Si el archivo no existe o no supera el límite, usarlo
    if (!file_exists($logFile) || filesize($logFile) < $maxSize) {
      return $logFile;
    }

    // Buscar el siguiente archivo disponible
    $pathInfo = pathinfo($logFile);
    $dir = $pathInfo['dirname'];
    $filename = $pathInfo['filename'];
    $ext = $pathInfo['extension'];

    $counter = 1;
    while (true) {
      $newFile = "$dir/{$filename}_{$counter}.$ext";

      if (!file_exists($newFile) || filesize($newFile) < $maxSize) {
        return $newFile;
      }

      $counter++;

      // Límite de seguridad (evitar loop infinito)
      if ($counter > 1000) {
        return $logFile;
      }
    }
  }

  /**
   * Obtener logs parseados desde un archivo
   *
   * @param string $file Ruta del archivo
   * @param int $limit Límite de líneas (0 = todas)
   * @return array Array de logs parseados
   */
  static function parse($file, $limit = 0) {
    if (!file_exists($file)) {
      return [];
    }

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($limit > 0) {
      $lines = array_slice($lines, -$limit);
    }

    $logs = [];
    foreach ($lines as $line) {
      $parts = explode("\t", $line);

      if (count($parts) >= 5) {
        $logs[] = [
          'timestamp' => trim($parts[0], '[]'),
          'level' => $parts[1],
          'module' => $parts[2],
          'location' => $parts[3],
          'message' => $parts[4],
          'context' => isset($parts[5]) && !empty($parts[5]) ? json_decode($parts[5], true) : null
        ];
      }
    }

    return $logs;
  }

  /**
   * Buscar archivos de log según criterios
   *
   * @param array $criteria Criterios de búsqueda (date, module, custom vars)
   * @return array Array de rutas de archivos encontrados
   */
  static function find($criteria = []) {
    $basePath = LOG_PATH;
    $pattern = $basePath;

    // Construir patrón de búsqueda
    if (isset($criteria['year'])) {
      $pattern .= '/' . $criteria['year'];
    } else {
      $pattern .= '/*';
    }

    if (isset($criteria['month'])) {
      $pattern .= '/' . $criteria['month'];
    } else {
      $pattern .= '/*';
    }

    if (isset($criteria['day'])) {
      $pattern .= '/' . $criteria['day'];
    } else {
      $pattern .= '/*';
    }

    // Buscar archivos .log recursivamente
    $files = glob($pattern . '/*.log');

    // Buscar en subdirectorios también
    $subdirs = glob($pattern . '/*', GLOB_ONLYDIR);
    foreach ($subdirs as $subdir) {
      $files = array_merge($files, glob($subdir . '/*.log'));
    }

    return $files ?: [];
  }

  /**
   * Obtener logs de hoy
   *
   * @param int $limit Límite de líneas
   * @return array Array de logs
   */
  static function today($limit = 100) {
    $files = self::find([
      'year' => date('Y'),
      'month' => date('m'),
      'day' => date('d')
    ]);

    $allLogs = [];
    foreach ($files as $file) {
      $logs = self::parse($file, 0);
      $allLogs = array_merge($allLogs, $logs);
    }

    // Ordenar por timestamp DESC
    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    return $limit > 0 ? array_slice($allLogs, 0, $limit) : $allLogs;
  }

  /**
   * Obtener últimos logs (sin importar fecha)
   *
   * @param int $limit Límite de líneas
   * @return array Array de logs
   */
  static function latest($limit = 50) {
    // Buscar todos los archivos
    $files = self::find([]);

    // Ordenar por fecha de modificación DESC
    usort($files, function($a, $b) {
      return filemtime($b) - filemtime($a);
    });

    // Leer solo los primeros archivos necesarios
    $allLogs = [];
    foreach (array_slice($files, 0, 10) as $file) {
      $logs = self::parse($file, 0);
      $allLogs = array_merge($allLogs, $logs);
    }

    // Ordenar por timestamp DESC
    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    return array_slice($allLogs, 0, $limit);
  }
}