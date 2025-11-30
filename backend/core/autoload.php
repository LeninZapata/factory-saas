<?php
spl_autoload_register(function ($class) {
  $classLower = strtolower($class);

  // Mapa estático de clases más utilizadas (búsqueda O(1) ultra rápida)
  static $classMap = [
    // Helpers
    'db' => BACKEND_PATH . '/helpers/db.php',
    'log' => BACKEND_PATH . '/helpers/log.php',
    'request' => BACKEND_PATH . '/helpers/request.php',
    'response' => BACKEND_PATH . '/helpers/response.php',
    'utils' => BACKEND_PATH . '/helpers/utils.php',
    'validation' => BACKEND_PATH . '/helpers/validation.php',
    'sessioncleanup' => BACKEND_PATH . '/helpers/sessionCleanup.php',

    // Core
    'controller' => BACKEND_PATH . '/core/controller.php',
    'router' => BACKEND_PATH . '/core/router.php',
    'resource' => BACKEND_PATH . '/core/resource.php',
    'pluginloader' => BACKEND_PATH . '/core/pluginLoader.php',

    // Middleware comunes
    'authmiddleware' => BACKEND_PATH . '/middleware/authMiddleware.php',
    'corsmiddleware' => BACKEND_PATH . '/middleware/corsMiddleware.php',
    'jsonmiddleware' => BACKEND_PATH . '/middleware/jsonMiddleware.php',
    'logmiddleware' => BACKEND_PATH . '/middleware/logMiddleware.php',
    'throttlemiddleware' => BACKEND_PATH . '/middleware/throttleMiddleware.php',

    // Controllers comunes
    'usercontroller' => BACKEND_PATH . '/resources/controllers/userController.php',

    // Handlers comunes
    'userhandlers' => BACKEND_PATH . '/resources/handlers/userHandlers.php',
    'clienthandlers' => BACKEND_PATH . '/resources/handlers/clientHandlers.php',
  ];

  // Búsqueda rápida en el mapa estático
  if (isset($classMap[$classLower])) {
    require_once $classMap[$classLower];
    return;
  }

  // Búsqueda dinámica (fallback para plugins y clases no mapeadas)

  // Helpers
  $helperFile = BACKEND_PATH . '/helpers/' . $classLower . '.php';
  if (file_exists($helperFile)) {
    require_once $helperFile;
    return;
  }

  // Core
  $coreFile = BACKEND_PATH . '/core/' . $class . '.php';
  if (file_exists($coreFile)) {
    require_once $coreFile;
    return;
  }

  // Controllers personalizados (resources/controllers/)
  $controllerFile = BACKEND_PATH . '/resources/controllers/' . $class . '.php';
  if (file_exists($controllerFile)) {
    require_once $controllerFile;
    return;
  }

  // Handlers personalizados (resources/handlers/)
  $handlerFile = BACKEND_PATH . '/resources/handlers/' . $class . '.php';
  if (file_exists($handlerFile)) {
    require_once $handlerFile;
    return;
  }

  // Middleware
  $mwFile = BACKEND_PATH . '/middleware/' . $class . '.php';
  if (file_exists($mwFile)) {
    require_once $mwFile;
    return;
  }

  // Services principales
  $serviceFile = BACKEND_PATH . '/services/' . $classLower . '.php';
  if (file_exists($serviceFile)) {
    require_once $serviceFile;
    return;
  }

  // Buscar en integrations (ai/deepseek, email/plusemail, etc)
  $servicesDir = BACKEND_PATH . '/services/integrations/';
  if (is_dir($servicesDir)) {
    foreach (scandir($servicesDir) as $category) {
      if ($category === '.' || $category === '..') continue;

      $integrationFile = $servicesDir . $category . '/' . $classLower . '/' . $classLower . '.php';
      if (file_exists($integrationFile)) {
        require_once $integrationFile;
        return;
      }
    }
  }
});