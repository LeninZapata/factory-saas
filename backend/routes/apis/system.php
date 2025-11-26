<?php
// routes/apis/system.php - Rutas manuales del sistema

$router->group('/api', function($router) {
  
  // Versión del sistema
  $router->get('/system', function() {
    response::success([
      'name' => 'Factory SaaS API',
      'version' => '1.0.0',
      'php' => PHP_VERSION,
      'timestamp' => time(),
      'date' => date('Y-m-d H:i:s')
    ]);
  });

  // Health check
  $router->get('/system/health', function() {
    response::success(['status' => 'healthy', 'uptime' => time()]);
  });

  // Stats del sistema (con auth)
  $router->get('/system/stats', function() {
    $stats = [
      'clients' => db::table('client')->count(),
      'users' => db::table('user')->count()
    ];
    response::success($stats);
  })->middleware('auth');
});