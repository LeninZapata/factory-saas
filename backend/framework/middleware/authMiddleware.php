<?php
class authMiddleware {

  function handle() {
    $token = $this->getToken();

    if (!$token) {
      response::unauthorized(__('middleware.auth.token_missing'));
      return false;
    }

    $session = $this->getSessionFromToken($token);

    if (!$session) {
      response::unauthorized(__('middleware.auth.token_invalid'));
      return false;
    }

    // Verificar expiración
    if ($session['expires_timestamp'] < time()) {
      // Limpiar la sesión expirada inmediatamente
      $this->deleteSession($token);

      // Limpieza oportunista
      $cleaned = $this->cleanupExpiredSessions(10);

      response::unauthorized(__('middleware.auth.token_expired'));
      return false;
    }

    // Sesión válida - ejecutar limpieza oportunista de todas formas
    $cleaned = $this->cleanupExpiredSessions(10);
    
    if ($cleaned > 0) {
      log::info('authMiddleware - Limpieza oportunista ejecutada', [
        'cleaned' => $cleaned,
        'user_id' => $session['user_id']
      ], ['module' => 'auth', 'layer' => 'middleware']);
    }

    $GLOBALS['auth_user_id'] = $session['user_id'];
    $GLOBALS['auth_user'] = $session['user'];

    return true;
  }

  private function getToken() {
    if (function_exists('getallheaders')) {
      $headers = getallheaders();
      if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
          return $matches[1];
        }
      }
    }

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
      if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
        return $matches[1];
      }
    }

    if (function_exists('apache_request_headers')) {
      $headers = apache_request_headers();
      if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
          return $matches[1];
        }
      }
    }

    return null;
  }

  private function getSessionFromToken($token) {
    $sessionsDir = STORAGE_PATH . '/sessions/';

    if (!is_dir($sessionsDir)) {
      return null;
    }

    $tokenShort = substr($token, 0, 16);
    $pattern = $sessionsDir . "*_*_{$tokenShort}.json";
    $files = glob($pattern);

    if (empty($files)) {
      return null;
    }

    foreach ($files as $file) {
      $session = json_decode(file_get_contents($file), true);

      if ($session && isset($session['token']) && $session['token'] === $token) {
        return $session;
      }
    }

    return null;
  }

  private function deleteSession($token) {
    $sessionsDir = STORAGE_PATH . '/sessions/';
    $tokenShort = substr($token, 0, 16);
    $pattern = $sessionsDir . "*_*_{$tokenShort}.json";
    $files = glob($pattern);

    foreach ($files as $file) {
      $session = json_decode(file_get_contents($file), true);
      
      if ($session && isset($session['token']) && $session['token'] === $token) {
        unlink($file);
        return;
      }
    }
  }

  private function cleanupExpiredSessions($maxFiles = 10) {
    $sessionsDir = STORAGE_PATH . '/sessions/';

    if (!is_dir($sessionsDir)) {
      return 0;
    }

    $now = time();
    $cleaned = 0;
    $checked = 0;
    $skipped = 0;

    // Obtener todos los archivos
    $files = scandir($sessionsDir);

    foreach ($files as $file) {
      if ($file === '.' || $file === '..') {
        continue;
      }

      if ($cleaned >= $maxFiles) {
        log::info('authMiddleware::cleanupExpiredSessions - Límite alcanzado', [
          'cleaned' => $cleaned,
          'max_files' => $maxFiles
        ], ['module' => 'auth', 'layer' => 'middleware']);
        break;
      }

      $filePath = $sessionsDir . $file;
      
      // Verificar si es archivo .json
      if (!is_file($filePath)) {
        continue;
      }

      if (!str_ends_with($file, '.json')) {
        $skipped++;
        continue;
      }

      $checked++;

      // Extraer timestamp del nombre
      $parts = explode('_', $file);

      if (count($parts) >= 3) {
        $expiresTimestamp = (int)$parts[0];

        // Si expiró, eliminar
        if ($expiresTimestamp < $now) {
          try {
            unlink($filePath);
            $cleaned++;

          } catch (Exception $e) {
            log::error('authMiddleware::cleanupExpiredSessions - Error eliminando', [
              'file' => $file,
              'error' => $e->getMessage()
            ], ['module' => 'auth', 'layer' => 'middleware']);
          }
        } else {
          // authMiddleware::cleanupExpiredSessions - Archivo válido, no eliminar
        }
      } else {
        log::warning('authMiddleware::cleanupExpiredSessions - Formato inválido', [
          'file' => $file,
          'parts' => $parts
        ], ['module' => 'auth', 'layer' => 'middleware']);
      }
    }

    return $cleaned;
  }
}