<?php
class ogFile {

  private static $logMeta = ['module' => 'file', 'layer' => 'framework'];

  static function saveJson($filePath, $data, $module = 'system', $action = 'create') {
    $dir = dirname($filePath);

    if (!is_dir($dir)) {
      if (!mkdir($dir, 0755, true)) {
        ogLog::error("ogFile::saveJson - No se pudo crear directorio: {$dir}", ['dir' => $dir], self::$logMeta);
        return false;
      }
    }

    $jsonData = [
      'created' => date('Y-m-d H:i:s'),
      'module' => $module,
      'action' => $action,
      'data' => $data
    ];

    $json = json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if (file_put_contents($filePath, $json) === false) {
      ogLog::error("ogFile::saveJson - Error al escribir archivo: {$filePath}", ['path' => $filePath], self::$logMeta);
      return false;
    }

    return $data;
  }

  static function saveJsonItems($filePath, $items, $module = 'system', $action = 'create') {
    $dir = dirname($filePath);

    if (!is_dir($dir)) {
      if (!mkdir($dir, 0755, true)) {
        ogLog::error("ogFile::saveJsonItems - No se pudo crear directorio: {$dir}", ['dir' => $dir], self::$logMeta);
        return false;
      }
    }

    $jsonData = [
      'created' => date('Y-m-d H:i:s'),
      'module' => $module,
      'action' => $action,
      'items' => $items
    ];

    $json = json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if (file_put_contents($filePath, $json) === false) {
      ogLog::error("ogFile::saveJsonItems - Error al escribir archivo: {$filePath}", ['path' => $filePath], self::$logMeta);
      return false;
    }

    return $items;
  }

  static function getJson($filePath, $reconstructCallback = null) {
    if (file_exists($filePath)) {
      $content = file_get_contents($filePath);
      if ($content === false) {
        ogLog::error("ogFile::getJson - Error al leer archivo: {$filePath}", ['path' => $filePath], self::$logMeta);
        return null;
      }

      $json = json_decode($content, true);
      if ($json === null) {
        ogLog::error("ogFile::getJson - JSON inválido: {$filePath}", ['path' => $filePath], self::$logMeta);
        return null;
      }

      return $json['data'] ?? $json['items'] ?? $json;
    }

    if ($reconstructCallback && is_callable($reconstructCallback)) {
      return $reconstructCallback();
    }

    return null;
  }

  static function ensureDir($path) {
    if (!is_dir($path)) {
      return mkdir($path, 0755, true);
    }
    return true;
  }

  static function delete($filePath) {
    if (!file_exists($filePath)) {
      return true;
    }

    if (unlink($filePath)) {
      return true;
    }

    ogLog::error("ogFile::delete - No se pudo eliminar archivo: {$filePath}", ['path' => $filePath], self::$logMeta);
    return false;
  }

  static function deletePattern($pattern) {
    $files = glob($pattern);

    if ($files === false) {
      return 0;
    }

    $deleted = 0;
    foreach ($files as $file) {
      if (is_file($file) && unlink($file)) {
        $deleted++;
      }
    }

    return $deleted;
  }
}

/**
 * @doc-start
 * FILE: framework/helpers/ogFile.php
 * ROLE: Helper de archivos. Lectura y escritura de JSON, gestión de directorios
 *       y eliminación de archivos con logging de errores.
 *
 * MÉTODOS:
 *   ogFile::saveJson($path, $data, $module, $action)
 *     → guarda $data bajo clave 'data' en JSON con metadata (created, module, action)
 *
 *   ogFile::saveJsonItems($path, $items, $module, $action)
 *     → igual que saveJson pero guarda bajo clave 'items' (para arrays/colecciones)
 *
 *   ogFile::getJson($path, $reconstructCallback)
 *     → lee y retorna 'data' o 'items' del JSON
 *     → si el archivo no existe ejecuta $reconstructCallback (opcional)
 *
 *   ogFile::ensureDir($path)
 *     → crea el directorio si no existe (mkdir recursivo 0755)
 *
 *   ogFile::delete($path)
 *     → elimina un archivo, retorna true si no existe o si se eliminó correctamente
 *
 *   ogFile::deletePattern($pattern)
 *     → elimina archivos por patrón glob → retorna cantidad eliminada
 *     → ogFile::deletePattern($dir . '/*.cache')
 *
 * NOTAS:
 *   - Crea directorios automáticamente si no existen (saveJson, saveJsonItems)
 *   - Todos los errores se loguean via ogLog con module 'file'
 * @doc-end
 */