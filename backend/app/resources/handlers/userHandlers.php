<?php
// userHandlers - Handlers personalizados para user
class userHandlers {

  // Login
  static function login($params) {
    $data = request::data();

    if (!isset($data['user']) || !isset($data['pass'])) {
      return ['success' => false, 'error' => 'Usuario y contraseña requeridos'];
    }

    // Buscar usuario por username o email
    $user = db::table('user')
      ->where('user', $data['user'])
      ->orWhere('email', $data['user'])
      ->first();

    if (!$user || !password_verify($data['pass'], $user['pass'])) {
      log::warning('Login fallido', ['user' => $data['user']], ['module' => 'auth']);
      return ['success' => false, 'error' => 'Credenciales inválidas'];
    }

    // Generar token
    $token = utils::token(64);

    // Usar constante SESSION_TTL
    $expiresAt = date('Y-m-d H:i:s', time() + SESSION_TTL);

    // Parsear config si es JSON string
    if (isset($user['config']) && is_string($user['config'])) {
      $user['config'] = json_decode($user['config'], true);
    }

    // Ocultar contraseña
    unset($user['pass']);

    // Guardar sesión CON datos del usuario
    self::saveSession($user, $token, $expiresAt);

    // Actualizar último acceso
    db::table('user')->where('id', $user['id'])->update([
      'du' => date('Y-m-d H:i:s'),
      'tu' => time()
    ]);

    log::info('Login exitoso', ['user' => $user['user'], 'id' => $user['id']], ['module' => 'auth']);

    return [
      'success' => true,
      'message' => 'Login exitoso',
      'data' => [
        'user' => $user,
        'token' => $token,
        'expires_at' => $expiresAt,
        'ttl' => SESSION_TTL, // Segundos
        'ttl_ms' => SESSION_TTL_MS // Milisegundos para frontend
      ]
    ];
  }

  // Logout
  static function logout($params) {
    $token = self::getTokenFromRequest();

    if (!$token) {
      return ['success' => false, 'error' => 'Token no proporcionado'];
    }

    // Eliminar sesión
    $sessionFile = STORAGE_PATH . "/sessions/{$token}.json";
    if (file_exists($sessionFile)) {
      unlink($sessionFile);
      log::info('Logout exitoso', ['token' => substr($token, 0, 10) . '...'], ['module' => 'auth']);
    }

    return ['success' => true, 'message' => 'Logout exitoso'];
  }

  // Profile optimizado - SIN consulta a BD
  static function profile($params) {
    $token = self::getTokenFromRequest();

    if (!$token) {
      return ['success' => false, 'error' => 'Token no proporcionado'];
    }

    // Obtener datos directamente del archivo de sesión
    $session = self::getSessionFromToken($token);

    if (!$session) {
      return ['success' => false, 'error' => 'Token inválido o expirado'];
    }

    // Verificar expiración
    if (strtotime($session['expires_at']) < time()) {
      self::deleteSession($token);
      return ['success' => false, 'error' => 'Token expirado'];
    }

    // El usuario ya está en la sesión (desde login)
    $user = $session['user'];

    return ['success' => true, 'data' => $user];
  }

  // Actualizar config del usuario
  static function updateConfig($params) {
    $id = $params['id'];
    $data = request::data();

    if (!isset($data['config'])) {
      return ['success' => false, 'error' => 'Config requerido'];
    }

    // Validar JSON
    $config = is_string($data['config']) ? $data['config'] : json_encode($data['config']);

    if (json_decode($config) === null) {
      return ['success' => false, 'error' => 'Config JSON inválido'];
    }

    $affected = db::table('user')->where('id', $id)->update([
      'config' => $config,
      'du' => date('Y-m-d H:i:s'),
      'tu' => time()
    ]);

    // Actualizar también en la sesión activa
    $token = self::getTokenFromRequest();
    if ($token) {
      self::updateSessionUserData($token, ['config' => json_decode($config, true)]);
    }

    return [
      'success' => true,
      'message' => 'Configuración actualizada',
      'affected' => $affected
    ];
  }

  // ============ MÉTODOS PRIVADOS HELPERS ============

  // Guardar sesión con datos completos del usuario
  private static function saveSession($user, $token, $expiresAt) {
    $sessionFile = STORAGE_PATH . "/sessions/{$token}.json";

    if (!is_dir(dirname($sessionFile))) {
      mkdir(dirname($sessionFile), 0755, true);
    }

    file_put_contents($sessionFile, json_encode([
      'user_id' => $user['id'],
      'user' => $user, // Guardamos el usuario completo
      'token' => $token,
      'expires_at' => $expiresAt,
      'ip_address' => request::ip(),
      'user_agent' => request::userAgent(),
      'created_at' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE));
  }

  // Obtener sesión completa desde archivo
  private static function getSessionFromToken($token) {
    $sessionFile = STORAGE_PATH . "/sessions/{$token}.json";

    if (!file_exists($sessionFile)) {
      return null;
    }

    $session = json_decode(file_get_contents($sessionFile), true);

    if (!$session || !isset($session['user_id'])) {
      return null;
    }

    return $session;
  }

  // Actualizar datos del usuario en sesión
  private static function updateSessionUserData($token, $updates) {
    $session = self::getSessionFromToken($token);

    if (!$session) return false;

    // Actualizar campos específicos del usuario
    foreach ($updates as $key => $value) {
      $session['user'][$key] = $value;
    }

    $sessionFile = STORAGE_PATH . "/sessions/{$token}.json";
    file_put_contents($sessionFile, json_encode($session, JSON_UNESCAPED_UNICODE));

    return true;
  }

  // Eliminar sesión
  private static function deleteSession($token) {
    $sessionFile = STORAGE_PATH . "/sessions/{$token}.json";
    if (file_exists($sessionFile)) {
      unlink($sessionFile);
    }
  }

  // Obtener token del header Authorization
  private static function getTokenFromRequest() {
    // Método 1: HTTP_AUTHORIZATION
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
      if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
        return $matches[1];
      }
    }

    // Método 2: getallheaders()
    if (function_exists('getallheaders')) {
      $headers = getallheaders();
      if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
          return $matches[1];
        }
      }
    }

    // Método 3: apache_request_headers()
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

  // Validar token y obtener user_id (sin BD)
  private static function getUserIdFromToken($token) {
    $session = self::getSessionFromToken($token);

    if (!$session) return null;

    // Verificar expiración
    if (strtotime($session['expires_at']) < time()) {
      self::deleteSession($token);
      return null;
    }

    return $session['user_id'];
  }
}