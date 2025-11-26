<?php
// authMiddleware - Verificar autenticación con sesiones
class authMiddleware {
  function handle() {
    $token = $this->getToken();

    if (!$token) {
      response::unauthorized('Token no proporcionado');
      return false;
    }

    $userId = $this->validateToken($token);

    if (!$userId) {
      response::unauthorized('Token inválido o expirado');
      return false;
    }

    // Guardar user_id en globals para usarlo en controllers si es necesario
    $GLOBALS['auth_user_id'] = $userId;

    return true;
  }

  // Obtener token del header Authorization
  private function getToken() {
    // Método 1: getallheaders() (más compatible)
    if (function_exists('getallheaders')) {
      $headers = getallheaders();
      if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
          return $matches['1'];
        }
      }
    }

    // Método 2: $_SERVER (fallback)
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
      if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
        return $matches[1];
      }
    }

    // Método 3: apache_request_headers (algunos servidores)
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

  // Validar token contra sesiones guardadas
  private function validateToken($token) {
    $sessionFile = STORAGE_PATH . "sessions/{$token}.json";

    if (!file_exists($sessionFile)) {
      log::warning('authMiddleware', "Token no encontrado: {$token}");
      return null;
    }

    $session = json_decode(file_get_contents($sessionFile), true);

    if (!$session || !isset($session['user_id'])) {
      log::error('authMiddleware', 'Sesión corrupta');
      return null;
    }

    // Verificar expiración
    if (strtotime($session['expires_at']) < time()) {
      log::info('authMiddleware', 'Token expirado');
      unlink($sessionFile); // Eliminar sesión expirada
      return null;
    }

    return $session['user_id'];
  }
}