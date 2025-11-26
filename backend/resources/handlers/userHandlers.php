<?php
// userHandlers - Handlers personalizados para user
class userHandlers {

  // Login
  static function login($params) {
    $data = request::data();

    if (!isset($data['user']) || !isset($data['pass'])) {
      return ['success' => false, 'error' => 'Usuario y contraseña requeridos'];
    }

    $user = db::table('user')
      ->where('user', $data['user'])
      ->first();

    if (!$user || !password_verify($data['pass'], $user['pass'])) {
      return ['success' => false, 'error' => 'Credenciales inválidas'];
    }

    // Generar token (simple, puedes usar JWT)
    $token = utils::token(64);

    // Actualizar último acceso
    db::table('user')->where('id', $user['id'])->update([
      'du' => date('Y-m-d H:i:s'),
      'tu' => time()
    ]);

    // Ocultar contraseña
    unset($user['pass']);

    return [
      'success' => true,
      'data' => [
        'user' => $user,
        'token' => $token
      ]
    ];
  }

  // Perfil del usuario actual
  static function profile($params) {
    // Aquí deberías obtener el ID del token/sesión
    // Por ahora ejemplo simple
    $userId = 1; // TODO: Obtener del token

    $user = db::table('user')->find($userId);

    if (!$user) {
      return ['success' => false, 'error' => 'Usuario no encontrado'];
    }

    unset($user['pass']);

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

    return ['success' => true, 'affected' => $affected];
  }
}