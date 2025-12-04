<?php
// Log - Sistema de logging
class log {
  // Log debug (solo desarrollo)
  static function debug($msg, $ctx = null) {
    if (!IS_DEV) return;
    self::write('DEBUG', $msg, $ctx);
  }

  // Log info
  static function info($msg, $ctx = null) {
    self::write('INFO', $msg, $ctx);
  }

  // Log warning
  static function warning($msg, $ctx = null) {
    self::write('WARNING', $msg, $ctx);
  }

  // Log error
  static function error($msg, $ctx = null) {
    self::write('ERROR', $msg, $ctx);
  }

  // Log SQL (solo desarrollo)
  static function sql($sql, $bindings = []) {
    if (!IS_DEV) return;
    self::debug('SQL Query', ['sql' => $sql, 'bindings' => $bindings]);
  }

  // Método privado de escritura
  private static function write($level, $msg, $ctx) {
    $log = '[' . date('Y-m-d H:i:s') . "] $level: $msg";
    if ($ctx) $log .= ' | ' . json_encode($ctx, JSON_UNESCAPED_UNICODE);

    // Crear directorio de logs si no existe
    if (!is_dir(LOG_PATH)) {
      mkdir(LOG_PATH, 0755, true);
    }

    // Archivo de log por día
    
    $logFile = LOG_PATH . '/log_' . date('Y-m-d') . '.log';

    // Escribir en archivo
    file_put_contents($logFile, $log . PHP_EOL, FILE_APPEND);
  }
}