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

// ✅ PASO 1: Auto-registrar rutas CRUD desde JSON primero
if ($module) {
  $resourceFile = BACKEND_PATH . "/resources/{$module}.json";

  if (file_exists($resourceFile)) {
    
    $config = json_decode(file_get_contents($resourceFile), true);

    // Verificar si existe controller personalizado
    $controllerClass = $module . 'Controller';
    $ctrl = class_exists($controllerClass)
      ? new $controllerClass()
      : new controller($module);

    $globalMw = $config['middleware'] ?? [];

    // ✅ Rutas CRUD estándar
    $crudRoutes = [
      'list'   => ['get',    "/api/{$module}",      'list'],
      'show'   => ['get',    "/api/{$module}/{id}", 'show'],
      'create' => ['post',   "/api/{$module}",      'create'],
      'update' => ['put',    "/api/{$module}/{id}", 'update'],
      'delete' => ['delete', "/api/{$module}/{id}", 'delete']
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
      }
    }
  }
}

// ✅ PASO 2: Cargar rutas manuales después (para que puedan sobrescribir si es necesario)
$manualRoutes = ROUTES_PATH . '/apis/' . $module . '.php';
if ($module && file_exists($manualRoutes)) {
  require_once $manualRoutes;
}