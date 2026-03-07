<?php
// jsonMiddleware - Validar y parsear JSON
class ogJsonMiddleware {
  function handle() {
    // Verificar que sea JSON
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') === false) {
      ogResponse::error(__('middleware.json.content_type_required'), 400);
      return false;
    }

    // Validar JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
      ogResponse::error(__('middleware.json.invalid_json', ['error' => json_last_error_msg()]), 400);
      return false;
    }

    // JSON válido, continuar
    return true;
  }
}

/**
 * @doc-start
 * FILE: framework/middleware/ogJsonMiddleware.php
 * ROLE: Valida que el request tenga Content-Type: application/json y body JSON válido.
 *       Retorna 400 si el Content-Type es incorrecto o el JSON está malformado.
 * @doc-end
 */