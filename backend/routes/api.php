<?php
// routes/api.php - Router principal con carga bajo demanda

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalizar path: remover slashes duplicados y prefijos
$path = preg_replace('#/+#', '/', $path); // //api -> /api
if (preg_match('#^(/[^/]+)?(/api/.*)$#', $path, $matches)) {
  $path = $matches[2]; // /factory-saas/api/user -> /api/user
}
$path = rtrim($path, '/'); // /api/user/ -> /api/user

$manualRouteLoaded = false;

// Extraer el módulo: /api/system -> system, /api/user/123 -> user
if (preg_match('#^/api/([^/]+)#', $path, $matches)) {
  $module = $matches[1];
  $manualRoutes = ROUTES_PATH . 'apis/' . $module . '.php';

  if (file_exists($manualRoutes)) {
    require_once $manualRoutes;
    $manualRouteLoaded = true;
  }
}

// Si no hay ruta manual, usar auto-registro de recursos (CRUD)
if (!$manualRouteLoaded) {
  $router->group('/api', function($router) use ($path) {

    preg_match('#^/api/([^/]+)#', $path, $matches);
    $requestedResource = $matches[1] ?? null;

    if ($requestedResource) {
      $resourceFile = BACKEND_PATH . "resources/{$requestedResource}.json";

      if (file_exists($resourceFile)) {
        $config = json_decode(file_get_contents($resourceFile), true);

        // Verificar si existe controller personalizado
        $controllerClass = $requestedResource . 'Controller';
        $ctrl = class_exists($controllerClass) ? new $controllerClass() : new controller($requestedResource);

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

            if (!empty($customMw)) $route->middleware($customMw);
          }
        }
      }
    }
  });
}