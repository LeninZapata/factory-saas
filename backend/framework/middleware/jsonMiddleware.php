<?php
// jsonMiddleware - Validar y parsear JSON
class jsonMiddleware {
  function handle() {
    // Verificar que sea JSON
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') === false) {
      response::error('Content-Type debe ser application/json', 400);
      return false;
    }

    // Validar JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
      response::error('JSON inválido: ' . json_last_error_msg(), 400);
      return false;
    }

    // JSON válido, continuar
    return true;
  }
}