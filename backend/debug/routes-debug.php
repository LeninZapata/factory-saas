<?php
require_once __DIR__ . '/../config/consts.php';
require_once __DIR__ . '/../core/autoload.php';
require_once __DIR__ . '/../core/router.php';

$router = new router();
require_once __DIR__ . '/../routes/api.php';

// Ver todas las rutas registradas
$reflection = new ReflectionClass($router);
$routesProperty = $reflection->getProperty('routes');
$routesProperty->setAccessible(true);
$routes = $routesProperty->getValue($router);

echo "<pre>";
echo "=== RUTAS POST ===\n";
if (isset($routes['POST'])) {
    foreach ($routes['POST'] as $path => $route) {
        echo "✅ POST {$path}\n";
    }
}
echo "</pre>";