<?php
class ogAuthMiddleware {
  private $logMeta = ['module' => 'ogAuthMiddleware', 'layer' => 'framework/middleware'];
  function handle() {

    // Validar version PHP (solo 1 vez por sesion)
    if (OG_IS_DEV && !$this->validatePhpVersion()) {
      return false;
    }

    $token = $this->getToken();

    if (!$token) {
      ogResponse::unauthorized(__('middleware.auth.token_missing'));
      return false;
    }

    $session = $this->getSessionFromToken($token);

    if (!$session) {
      ogResponse::unauthorized(__('middleware.auth.token_invalid'));
      return false;
    }

    // Verificar expiracion
    if ($session['expires_timestamp'] < time()) {
      $this->deleteSession($token);
      $this->cleanupExpiredSessions(10);

      ogResponse::unauthorized(__('middleware.auth.token_expired'));
      return false;
    }

    // Limpieza oportunista
    $cleaned = $this->cleanupExpiredSessions(10);

    if ($cleaned > 0) {
      ogLog::info('authMiddleware - Limpieza oportunista ejecutada', [ 'cleaned' => $cleaned, 'user_id' => $session['user_id'] ], $this->logMeta);
    }

    $GLOBALS['auth_user_id'] = ogCache::memorySet('auth_user_id', $session['user_id']);
    $GLOBALS['auth_user'] = ogCache::memorySet('auth_user', $session['user']);

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
    $sessionsDir = ogApp()->getPath('storage') . '/sessions/';
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
      $data = json_decode(file_get_contents($file), true);

      // FIX: Extraer el 'value' del wrapper de ogCache
      $session = $data['value'] ?? $data;

      if ($session && isset($session['token']) && $session['token'] === $token) {
        return $session;
      }
    }

    return null;
  }

  private function deleteSession($token) {
    $sessionsDir = ogApp()->getPath('storage') . '/sessions/';
    $tokenShort = substr($token, 0, 16);
    $pattern = $sessionsDir . "*_*_{$tokenShort}.json";
    $files = glob($pattern);

    foreach ($files as $file) {
      $data = json_decode(file_get_contents($file), true);

      // FIX: Extraer el 'value' del wrapper de ogCache
      $session = $data['value'] ?? $data;

      if ($session && isset($session['token']) && $session['token'] === $token) {
        unlink($file);
        return;
      }
    }
  }

  private function cleanupExpiredSessions($maxFiles = 10) {
    $sessionsDir = ogApp()->getPath('storage') . '/sessions/';

    if (!is_dir($sessionsDir)) {
      return 0;
    }

    $now = time();
    $cleaned = 0;

    $files = scandir($sessionsDir);

    foreach ($files as $file) {
      if ($file === '.' || $file === '..') {
        continue;
      }

      if ($cleaned >= $maxFiles) {
        break;
      }

      $filePath = $sessionsDir . $file;

      if (!is_file($filePath) || !str_ends_with($file, '.json')) {
        continue;
      }

      // Extraer timestamp del nombre
      $parts = explode('_', $file);

      if (count($parts) >= 3) {
        $expiresTimestamp = (int)$parts[0];

        if ($expiresTimestamp < $now) {
          try {
            unlink($filePath);
            $cleaned++;
          } catch (Exception $e) {
            ogLog::error('cleanupExpiredSessions - Error', [ 'file' => $file, 'error' => $e->getMessage() ], $this->logMeta);
          }
        }
      }
    }

    return $cleaned;
  }

  private function validatePhpVersion() {
    $required = '8.1.0';

    $cache = ogApp()->helper('cache');

    $isValid = $cache::remember('global_php_version_valid', function() use ($required) {
      return version_compare(PHP_VERSION, $required, '>=');
    });

    if (!$isValid) {
      ogResponse::error(
        __('middleware.auth.php_version_required', [
          'required' => $required,
          'current' => PHP_VERSION
        ]),
        500
      );
      return false;
    }

    return true;
  }
}

/**
 * @doc-start
 * FILE: framework/middleware/ogAuthMiddleware.php
 * ROLE: Valida sesión activa via Bearer token en cada request protegida.
 *
 * FLUJO:
 *   1. Extrae Bearer token del header Authorization
 *   2. Busca archivo de sesión en storage/sessions/ por los primeros 16 chars del token
 *   3. Verifica que no esté expirada
 *   4. Inyecta user_id y user en $GLOBALS y ogCache::memory
 *   5. Limpieza oportunista de sesiones expiradas (máx 10 archivos por request)
 *
 * SESIONES:
 *   Formato de archivo: {expires}_{userId}_{token16}.json
 *   $GLOBALS['auth_user_id'] y $GLOBALS['auth_user'] quedan disponibles globalmente
 *   ogCache::memoryGet('auth_user_id') disponible en el resto del ciclo
 *
 * ERRORES:
 *   401 → token ausente, inválido o expirado
 *   500 → versión de PHP insuficiente (solo OG_IS_DEV, verifica 1 vez por sesión)
 * @doc-end
 */