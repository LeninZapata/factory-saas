<?php
// Response - Manejo de respuestas HTTP/JSON
class ogResponse {
  private static $logMeta = ['module' => 'Response', 'layer' => 'framework/helper'];
  // Respuesta JSON
  static function json($data, $code = 200) {
    if ($code !== 200) {
      // Limitar tamaño de datos logueados para evitar consumo excesivo de memoria
      $logData = $data;
      $dataJson = @json_encode($logData);
      if ($dataJson === false || strlen($dataJson) > 5000) {
        $logData = ['message' => 'Data too large to log', 'size' => $dataJson ? strlen($dataJson) : 'too large', 'preview' => is_string($dataJson) ? substr($dataJson, 0, 200) : 'N/A'];
      }
      ogLog::error('Response Error', ['code' => $code, 'data' => $logData], self::$logMeta);
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    $opts = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    if (OG_IS_DEV) $opts |= JSON_PRETTY_PRINT;
    echo json_encode($data, $opts);
    exit;
  }

  // Respuesta exitosa
  static function success($data = null, $msg = null, $code = 200) {
    $res = ['success' => true];
    if ($msg) $res['message'] = $msg;
    if ($data !== null) $res['data'] = $data;  // ✅ FIX: Permite arrays vacíos []
    self::json($res, $code);
  }

  // Respuesta de error
  static function error($error, $code = 400, $details = null) {
    $res = ['success' => false, 'error' => $error];
    if ($details) $res['details'] = $details;
    self::json($res, $code);
  }

  // Errores de validación
  static function validation($errors, $code = 400) {
    self::json(['success' => false, 'errors' => $errors], $code);
  }

  // Shortcuts HTTP
  static function notFound($msg = null) {
    self::json(['success' => false, 'error' => $msg ?? __('helper.response.not_found')], 404);
  }

  static function unauthorized($msg = null) {
    self::json(['success' => false, 'error' => $msg ?? __('helper.response.unauthorized')], 401);
  }

  static function forbidden($msg = null) {
    self::json(['success' => false, 'error' => $msg ?? __('helper.response.forbidden')], 403);
  }

  static function serverError($msg = null, $debug = null) {
    $res = ['success' => false, 'error' => $msg ?? __('helper.response.server_error')];
    if (OG_IS_DEV && $debug) $res['debug'] = $debug;
    self::json($res, 500);
  }

  // Responde 200 al cliente inmediatamente y deja el proceso PHP corriendo en background.
  // Usar en webhooks para evitar retransmisiones por timeout (ej: Meta/WhatsApp).
  static function flushAndContinue(array $data = []) {
    ignore_user_abort(true);
    set_time_limit(0);

    $body = json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    http_response_code(200);
    header('Content-Type: application/json; charset=utf-8');
    header('Connection: close');
    header('Content-Length: ' . strlen($body));

    echo $body;

    if (ob_get_level()) ob_end_flush();
    flush();
  }
}

/**
 * @doc-start
 * FILE: framework/helpers/ogResponse.php
 * ROLE: Helper de respuestas HTTP/JSON. Todas las respuestas terminan en exit().
 *       Errores no-200 se loguean automáticamente via ogLog.
 *
 * MÉTODOS PRINCIPALES:
 *   ogResponse::success($data, $msg, $code)
 *     → { success: true, message?, data? }
 *
 *   ogResponse::error($error, $code, $details)
 *     → { success: false, error, details? }
 *
 *   ogResponse::validation($errors)
 *     → { success: false, errors: [...] }  HTTP 400
 *
 *   ogResponse::json($data, $code)
 *     → respuesta JSON base, usada internamente por todos los métodos
 *     → OG_IS_DEV agrega JSON_PRETTY_PRINT automáticamente
 *
 * SHORTCUTS HTTP:
 *   ogResponse::notFound($msg)      → HTTP 404
 *   ogResponse::unauthorized($msg)  → HTTP 401
 *   ogResponse::forbidden($msg)     → HTTP 403
 *   ogResponse::serverError($msg)   → HTTP 500 (incluye $debug si OG_IS_DEV)
 *
 * WEBHOOKS:
 *   ogResponse::flushAndContinue($data)
 *     → responde HTTP 200 al cliente inmediatamente y continúa ejecución en background
 *     → usar en webhooks para evitar retransmisiones por timeout (ej: Meta, WhatsApp)
 *     → setea Connection: close + Content-Length antes del flush
 *
 * NOTAS:
 *   - Todos los métodos terminan en exit() excepto flushAndContinue()
 *   - Respuestas con code !== 200 se loguean (datos >5000 chars se truncan en el log)
 *   - Mensajes de error sin parámetro usan traducciones de 'helper.response.*'
 * @doc-end
 */