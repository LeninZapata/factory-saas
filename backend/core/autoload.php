<?php
// Autoload bajo demanda con SPL
spl_autoload_register(function ($class) {
  // Convertir nombre de clase a minúsculas para los helpers
  $classLower = strtolower($class);

  // Buscar en helpers
  $helperFile = __DIR__ . '/' . $classLower . '.php';
  if (file_exists($helperFile)) {
    require_once $helperFile;
    return;
  }

  // Buscar en core (resource, controller, etc)
  $coreFile = __DIR__ . '/' . $class . '.php';
  if (file_exists($coreFile)) {
    require_once $coreFile;
    return;
  }

  // Buscar en middleware
  $mwFile = __DIR__ . '/../middleware/' . $class . '.php';
  if (file_exists($mwFile)) {
    require_once $mwFile;
    return;
  }
});

// Pre-cargar solo los esenciales que se usan siempre
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/db.php';

// Al final de autoload.php (solo desarrollo)
/*if (IS_DEV) {
  register_shutdown_function(function() {
    $files = get_included_files();
    log::debug('Files loaded', ['count' => count($files), 'files' => $files]);
  });
}*/