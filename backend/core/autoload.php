<?php
spl_autoload_register(function ($class) {
  $classLower = strtolower($class);

  // Helpers
  $helperFile = __DIR__ . '/' . $classLower . '.php';
  if (file_exists($helperFile)) {
    require_once $helperFile;
    return;
  }

  // Core
  $coreFile = __DIR__ . '/' . $class . '.php';
  if (file_exists($coreFile)) {
    require_once $coreFile;
    return;
  }

  // Middleware
  $mwFile = __DIR__ . '/../middleware/' . $class . '.php';
  if (file_exists($mwFile)) {
    require_once $mwFile;
    return;
  }

  // Services principales
  $serviceFile = __DIR__ . '/../services/' . $classLower . '.php';
  if (file_exists($serviceFile)) {
    require_once $serviceFile;
    return;
  }

  // Buscar en integrations (ai/deepseek, email/plusemail, etc)
  $servicesDir = __DIR__ . '/../services/integrations/';
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