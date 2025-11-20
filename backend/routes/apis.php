<?php
// Auto-registro de recursos con carga LAZY (solo el schema necesario)
$router->group('/api', function($router) {

  // Obtener path actual para determinar qué recurso cargar
  $path = $_SERVER['REQUEST_URI'];
  $path = parse_url($path, PHP_URL_PATH);

  // Extraer recurso: /api/client/123 -> client
  preg_match('#^/api/([^/]+)#', $path, $matches);
  $requestedResource = $matches[1] ?? null;

  // Cargar SOLO el schema del recurso solicitado
  if ($requestedResource && $requestedResource !== 'system' && $requestedResource !== 'health') {
    $resourceFile = BASE_PATH . "/resources/{$requestedResource}.json";

    if (file_exists($resourceFile)) {
      $config = json_decode(file_get_contents($resourceFile), true);
      $ctrl = new controller($requestedResource);

      // Middleware global del recurso (aplica a todas las rutas)
      $globalMw = $config['middleware'] ?? [];

      // Rutas CRUD estándar
      $crudRoutes = [
        'list' => ['get', "/{$requestedResource}", 'list'],
        'show' => ['get', "/{$requestedResource}/{id}", 'show'],
        'create' => ['post', "/{$requestedResource}", 'create'],
        'update' => ['put', "/{$requestedResource}/{id}", 'update'],
        'delete' => ['delete', "/{$requestedResource}/{id}", 'delete']
      ];

      foreach ($crudRoutes as $key => $routeData) {
        list($method, $routePath, $action) = $routeData;

        // Middleware: global + específico de ruta
        $routeConfig = $config['routes'][$key] ?? [];
        $routeMw = array_merge($globalMw, $routeConfig['middleware'] ?? []);

        $route = $router->$method($routePath, [$ctrl, $action]);
        if (!empty($routeMw)) $route->middleware($routeMw);
      }

      // Rutas custom
      if (isset($config['routes']['custom'])) {
        foreach ($config['routes']['custom'] as $custom) {
          $method = strtolower($custom['method']);
          $customPath = $custom['path'];
          $actionName = $custom['name'];

          // Middleware: global + específico de ruta custom
          $customMw = array_merge($globalMw, $custom['middleware'] ?? []);

          // Extraer parámetros del path
          preg_match_all('/\{(\w+)\}/', $customPath, $matches);
          $paramNames = $matches[1];

          $route = $router->$method($customPath, function(...$params) use ($ctrl, $actionName, $paramNames) {
            $namedParams = [];
            foreach ($paramNames as $index => $name) {
              $namedParams[$name] = $params[$index] ?? null;
            }
            $ctrl->handleCustomAction($actionName, $namedParams);
          });

          if (!empty($customMw)) $route->middleware($customMw);
        }
      }
    }
  }

  // ========================================
  // RUTAS MANUALES/PERSONALIZADAS
  // ========================================

  // Versión del sistema
  $router->get('/system', function() {
    response::success([
      'name' => 'Mi API',
      'version' => '1.0.0',
      'php' => PHP_VERSION,
      'timestamp' => time(),
      'date' => date('Y-m-d H:i:s')
    ]);
  });

  // Health check
  $router->get('/health', function() {
    response::success(['status' => 'healthy', 'uptime' => time()]);
  });

  // Stats del sistema (con auth)
  $router->get('/stats', function() {
    $stats = [
      'clients' => db::table('client')->count(),
      'products' => db::table('products')->count(),
      'orders' => db::table('orders')->count()
    ];
    response::success($stats);
  })->middleware('auth');
});

// En apis.php (solo desarrollo)
/*if (IS_DEV && $requestedResource) {
  log::debug("Loading resource", ['resource' => $requestedResource]);
}*/