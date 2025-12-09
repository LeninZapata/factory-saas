<?php
// userHandlers - Handlers personalizados para user
class userHandlers {

  // Profile optimizado - SIN consulta a BD
  static function profile($params) {
    $token = request::bearerToken();

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
    $token = request::bearerToken();
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

}