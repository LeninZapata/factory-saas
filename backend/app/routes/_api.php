<?php
// app/routes/api.php - Cargar rutas de la aplicación

// Obtener $router de ogApplication
/*global $router;
if (!isset($router)) {
  throw new Exception('Router not available. This file should be loaded after ogApplication creates the router.');
}*/

// $pluginName viene del scope de bootstrap.php
if (!isset($pluginName)) {
  $pluginName = 'default';
}

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalizar path
$path = preg_replace('#/+#', '/', $path);
if (preg_match('#(/api/.*)$#', $path, $matches)) {
  $path = $matches[1];
}
$path = rtrim($path, '/');

// Extraer módulo
$module = null;
if (preg_match('#^/api/([^/]+)#', $path, $matches)) {
  $module = $matches[1];
}

// PASO 1: Auto-registrar rutas CRUD desde JSON
if ($module) {
  // Buscar schema en framework primero
  $resourceFile = OG_FRAMEWORK_PATH . "/resources/schemas/{$module}.json";

  // Si no existe en framework, buscar en app del plugin actual
  if (!file_exists($resourceFile)) {
    // Usar el plugin actual (viene del scope de bootstrap.php)
    $pluginPath = ogApp($pluginName)->getPath();
    $resourceFile = $pluginPath . "/resources/schemas/{$module}.json";
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

      // Si la ruta no está habilitada, saltarla
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

// PASO 2: Cargar rutas manuales de APP del plugin actual
if ($module) {
  // Usar el plugin actual
  $pluginPath = ogApp($pluginName)->getPath();
  $appRoutes = $pluginPath . '/routes/apis/' . $module . '.php';

  if (file_exists($appRoutes)) {
    require_once $appRoutes;
  }
}