<?php
// routes/api.php - Router híbrido: Rutas manuales + Auto-registro CRUD

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalizar path: remover slashes duplicados y prefijos
$path = preg_replace('#/+#', '/', $path);
if (preg_match('#^(/[^/]+)?(/api/.*)$#', $path, $matches)) {
  $path = $matches[2];
}
$path = rtrim($path, '/');

// Extraer el módulo: /api/user -> user
$module = null;
if (preg_match('#^/api/([^/]+)#', $path, $matches)) {
  $module = $matches[1];
}

// ✅ PASO 1: Cargar rutas manuales si existen (login, profile, etc.)
$manualRoutes = ROUTES_PATH . 'apis/' . $module . '.php';
if ($module && file_exists($manualRoutes)) {
  require_once $manualRoutes;
  // log::debug('router', "Rutas manuales cargadas: {$module}.php");
}

// ✅ PASO 2: Agregar rutas CRUD desde JSON (si no están definidas manualmente)
$router->group('/api', function($router) use ($module) {

  if (!$module) return;

  $resourceFile = BACKEND_PATH . "resources/{$module}.json";

  if (!file_exists($resourceFile)) return;

  $config = json_decode(file_get_contents($resourceFile), true);

  // Verificar si existe controller personalizado
  $controllerClass = $module . 'Controller';
  $ctrl = class_exists($controllerClass)
    ? new $controllerClass()
    : new controller($module);

  $globalMw = $config['middleware'] ?? [];

  // ✅ Rutas CRUD estándar (solo si no están definidas manualmente)
  $crudRoutes = [
    'list'   => ['get',    "/{$module}",      'list'],
    'show'   => ['get',    "/{$module}/{id}", 'show'],
    'create' => ['post',   "/{$module}",      'create'],
    'update' => ['put',    "/{$module}/{id}", 'update'],
    'delete' => ['delete', "/{$module}/{id}", 'delete']
  ];

  foreach ($crudRoutes as $key => $routeData) {
    list($method, $routePath, $action) = $routeData;

    // Obtener configuración de la ruta desde JSON
    $routeConfig = $config['routes'][$key] ?? [];

    // Si la ruta no está habilitada en JSON, saltarla
    if (isset($routeConfig['enabled']) && $routeConfig['enabled'] === false) {
      continue;
    }

    $routeMw = array_merge($globalMw, $routeConfig['middleware'] ?? []);

    // Registrar ruta CRUD
    $route = $router->$method($routePath, [$ctrl, $action]);

    if (!empty($routeMw)) {
      $route->middleware($routeMw);
    }

    // log::debug('router', "Ruta CRUD auto-registrada: {$method} {$routePath}");
  }

  // ✅ Rutas custom desde JSON (si existen)
  if (isset($config['routes']['custom'])) {
    foreach ($config['routes']['custom'] as $custom) {
      $method = strtolower($custom['method']);
      $customPath = $custom['path'];
      $actionName = $custom['name'];
      $customMw = array_merge($globalMw, $custom['middleware'] ?? []);

      preg_match_all('/\{(\w+)\}/', $customPath, $matches);
      $paramNames = $matches[1];

      $route = $router->$method($customPath, function(...$params) use ($ctrl, $actionName, $paramNames) {
        $namedParams = [];
        foreach ($paramNames as $index => $name) {
          $namedParams[$name] = $params[$index] ?? null;
        }
        $ctrl->handleCustomAction($actionName, $namedParams);
      });

      if (!empty($customMw)) {
        $route->middleware($customMw);
      }

      log::debug('router', "Ruta custom auto-registrada: {$method} {$customPath}");
    }
  }
});