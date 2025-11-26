<?php
// helpers/sessionCleanup.php - Limpieza de sesiones expiradas
class sessionCleanup {

  // Limpiar sesiones expiradas
  static function clean() {
    $sessionsDir = STORAGE_PATH . 'sessions/';

    if (!is_dir($sessionsDir)) {
      return ['cleaned' => 0, 'errors' => 0];
    }

    $cleaned = 0;
    $errors = 0;
    $now = time();

    foreach (scandir($sessionsDir) as $file) {
      if ($file === '.' || $file === '..') continue;

      $sessionFile = $sessionsDir . $file;

      try {
        $session = json_decode(file_get_contents($sessionFile), true);

        if (!$session || !isset($session['expires_at'])) {
          // Sesión corrupta
          unlink($sessionFile);
          $cleaned++;
          continue;
        }

        // Verificar expiración
        if (strtotime($session['expires_at']) < $now) {
          unlink($sessionFile);
          $cleaned++;
          log::debug('sessionCleanup', "Sesión expirada eliminada: {$file}");
        }
      } catch (Exception $e) {
        $errors++;
        log::error('sessionCleanup', "Error procesando {$file}: " . $e->getMessage());
      }
    }

    if ($cleaned > 0) {
      log::info('sessionCleanup', "Limpieza completada: {$cleaned} sesiones eliminadas");
    }

    return [
      'cleaned' => $cleaned,
      'errors' => $errors
    ];
  }

  // Obtener estadísticas de sesiones
  static function stats() {
    $sessionsDir = STORAGE_PATH . 'sessions/';

    if (!is_dir($sessionsDir)) {
      return [
        'total' => 0,
        'active' => 0,
        'expired' => 0
      ];
    }

    $total = 0;
    $active = 0;
    $expired = 0;
    $now = time();

    foreach (scandir($sessionsDir) as $file) {
      if ($file === '.' || $file === '..') continue;

      $total++;
      $sessionFile = $sessionsDir . $file;

      try {
        $session = json_decode(file_get_contents($sessionFile), true);

        if (!$session || !isset($session['expires_at'])) {
          $expired++;
          continue;
        }

        if (strtotime($session['expires_at']) < $now) {
          $expired++;
        } else {
          $active++;
        }
      } catch (Exception $e) {
        $expired++;
      }
    }

    return [
      'total' => $total,
      'active' => $active,
      'expired' => $expired
    ];
  }

  // Limpiar TODAS las sesiones de un usuario específico
  static function cleanByUserId($userId) {
    $sessionsDir = STORAGE_PATH . 'sessions/';

    if (!is_dir($sessionsDir)) {
      return 0;
    }

    $cleaned = 0;

    foreach (scandir($sessionsDir) as $file) {
      if ($file === '.' || $file === '..') continue;

      $sessionFile = $sessionsDir . $file;

      try {
        $session = json_decode(file_get_contents($sessionFile), true);

        if ($session && isset($session['user_id']) && $session['user_id'] == $userId) {
          unlink($sessionFile);
          $cleaned++;
        }
      } catch (Exception $e) {
        log::error('sessionCleanup', "Error limpiando sesión: " . $e->getMessage());
      }
    }

    log::info('sessionCleanup', "Limpiadas {$cleaned} sesiones del usuario {$userId}");

    return $cleaned;
  }
}