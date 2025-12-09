<?php
// authHandlers - Handlers de autenticación
class authHandlers {

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
    // self::saveSession($user, $token, $expiresAt);

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
    $token = request::bearerToken();

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

}
