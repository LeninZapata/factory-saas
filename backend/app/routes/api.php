<?php
// routes/api.php - Router híbrido: Framework + App

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalizar path: remover slashes duplicados y prefijos
$path = preg_replace('#/+#', '/', $path);
if (preg_match('#(/api/.*)$#', $path, $matches)) {
  $path = $matches[1];
}
$path = rtrim($path, '/');

// Extraer el módulo: /api/user -> user
$module = null;
if (preg_match('#^/api/([^/]+)#', $path, $matches)) {
  $module = $matches[1];
}

// PASO 1: Auto-registrar rutas CRUD desde JSON (buscar en framework primero, luego app)
if ($module) {
  // Buscar schema en framework primero
  $resourceFile = OG_FRAMEWORK_PATH . "/resources/schemas/{$module}.json";
  
  // Si no existe en framework, buscar en app
  if (!file_exists($resourceFile)) {
    $resourceFile = APP_PATH . "/resources/schemas/{$module}.json";
  }

  if (file_exists($resourceFile)) {
    $config = json_decode(file_get_contents($resourceFile), true);

    // Verificar si existe controller personalizado
    $controllerClass = ucfirst($module) . 'Controller';
    $ctrl = class_exists($controllerClass)
      ? new $controllerClass()
      : new ogController($module);

    $globalMw = $config['middleware'] ?? [];

    // Rutas CRUD estándar
    $crudRoutes = [
      'list'   => ['get',    "/api/{$module}",      'list'],
      'show'   => ['get',    "/api/{$module}/{id}", 'show'],
      'create' => ['post',   "/api/{$module}",      'create'],
      'update' => ['put',    "/api/{$module}/{id}", 'update'],
      'delete' => ['delete', "/api/{$module}/{id}", 'delete']
    ];

    foreach ($crudRoutes as $key => $routeData) {
      list($method, $routePath, $action) = $routeData;

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
  }
}

// PASO 2: Cargar rutas manuales del FRAMEWORK primero
$frameworkRoutes = OG_FRAMEWORK_PATH . '/routes/apis/' . $module . '.php';
if ($module && file_exists($frameworkRoutes)) {
  require_once $frameworkRoutes;
}

// PASO 3: Cargar rutas manuales de APP (pueden sobrescribir o extender)
$appRoutes = ROUTES_PATH . '/apis/' . $module . '.php';
if ($module && file_exists($appRoutes)) {
  require_once $appRoutes;
}