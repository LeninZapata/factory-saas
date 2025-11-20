<?php
// authMiddleware - Verificar autenticación
class authMiddleware {
  function handle() {
    // Verificar token JWT o sesión
    $token = $this->getToken();

    if (!$token) {
      response::unauthorized('Token no proporcionado');
      return false;
    }

    // Verificar si el token es válido (ejemplo simple)
    if (!$this->validateToken($token)) {
      response::unauthorized('Token inválido o expirado');
      return false;
    }

    // Token válido, continuar
    return true;
  }

  // Obtener token del header
  private function getToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
      $auth = $headers['Authorization'];
      if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        return $matches[1];
      }
    }
    return null;
  }

  // Validar token (implementar según tu lógica)
  private function validateToken($token) {
    // Ejemplo básico - implementar con JWT o tu método de auth
    // return jwt::validate($token);

    // Por ahora, aceptar cualquier token para testing
    return !empty($token);
  }
}