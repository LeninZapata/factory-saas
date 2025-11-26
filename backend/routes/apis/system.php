<?php
// routes/apis/system.php - Rutas de sistema y limpieza

$router->group('/api/system', function($router) {

  // ✅ Limpiar sesiones expiradas - GET /api/system/cleanup-sessions
  $router->get('/cleanup-sessions', function() {
    $result = sessionCleanup::clean();
    response::success($result, "Limpieza completada");
  })->middleware('auth');

  // ✅ Estadísticas de sesiones - GET /api/system/sessions-stats
  $router->get('/sessions-stats', function() {
    $stats = sessionCleanup::stats();
    response::success($stats);
  })->middleware('auth');

  // ✅ Info del sistema - GET /api/system/info
  $router->get('/info', function() {
    response::success([
      'php_version' => PHP_VERSION,
      'environment' => IS_DEV ? 'development' : 'production',
      'storage_path' => STORAGE_PATH,
      'sessions_active' => sessionCleanup::stats()['active']
    ]);
  })->middleware('auth');

  // ✅ Health check - GET /api/system/health
  $router->get('/health', function() {
    response::success([
      'status' => 'ok',
      'timestamp' => date('Y-m-d H:i:s')
    ]);
  });

  // Test zona horaria (deshabilitado en producción)
  /*$router->get('/timezone-test', function() {
    response::success([
        'timezone' => date_default_timezone_get(),
        'current_time' => date('Y-m-d H:i:s'),
        'timestamp' => time(),
        'timezone_constant' => TIMEZONE
    ]);
  });*/
});