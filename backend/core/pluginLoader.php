<?php
class pluginLoader {
  private static $loaded = [];
  
  // Cargar SOLO un plugin específico
  static function load($pluginName, $router) {
    // Evitar cargar dos veces
    if (isset(self::$loaded[$pluginName])) {
      return true;
    }

    $pluginPath = BASE_PATH . '/plugins/' . $pluginName;
    $configFile = $pluginPath . '/plugin.json';
    
    // Verificar que existe
    if (!file_exists($configFile)) {
      response::error("Plugin '$pluginName' not found", 404);
      return false;
    }
    
    $config = json_decode(file_get_contents($configFile), true);
    
    // Verificar que está habilitado
    if (!($config['enabled'] ?? false)) {
      response::error("Plugin '$pluginName' is disabled", 403);
      return false;
    }
    
    // Verificar que tiene backend
    if (!($config['backend'] ?? false)) {
      response::error("Plugin '$pluginName' has no backend", 400);
      return false;
    }
    
    // Autoload de clases del plugin
    spl_autoload_register(function($class) use ($pluginPath, $pluginName) {
      // Controllers
      $file = $pluginPath . '/controllers/' . $class . '.php';
      if (file_exists($file)) {
        require_once $file;
        return;
      }
      
      // Services
      $file = $pluginPath . '/services/' . $class . '.php';
      if (file_exists($file)) {
        require_once $file;
        return;
      }
      
      // Models
      $file = $pluginPath . '/models/' . $class . '.php';
      if (file_exists($file)) {
        require_once $file;
        return;
      }
    });
    
    // Cargar rutas del plugin
    $routesFile = $pluginPath . '/routes/routes.php';
    if (file_exists($routesFile)) {
      $prefix = $config['routes_prefix'] ?? "/plugin/{$pluginName}";
      
      $router->group($prefix, function($router) use ($routesFile) {
        $routesFn = require $routesFile;
        if (is_callable($routesFn)) {
          $routesFn($router);
        }
      });
    }
    
    self::$loaded[$pluginName] = $config;
    
    if (IS_DEV) {
      log::debug("Plugin loaded", ['plugin' => $pluginName]);
    }
    
    return true;
  }

  // Solo si realmente necesitas cargar todos (ejemplo: panel admin)
  static function loadAll($router) {
    $pluginsDir = BASE_PATH . '/plugins';
    
    if (!is_dir($pluginsDir)) return;
    
    foreach (scandir($pluginsDir) as $plugin) {
      if ($plugin === '.' || $plugin === '..') continue;
      self::load($plugin, $router);
    }
  }

  // Verificar si un plugin está cargado
  static function isLoaded($pluginName) {
    return isset(self::$loaded[$pluginName]);
  }

  // Obtener lista de plugins disponibles (sin cargarlos)
  static function getAvailable() {
    $pluginsDir = BASE_PATH . '/plugins';
    $plugins = [];
    
    if (!is_dir($pluginsDir)) return $plugins;
    
    foreach (scandir($pluginsDir) as $plugin) {
      if ($plugin === '.' || $plugin === '..') continue;
      
      $configFile = $pluginsDir . '/' . $plugin . '/plugin.json';
      if (file_exists($configFile)) {
        $config = json_decode(file_get_contents($configFile), true);
        $plugins[$plugin] = $config;
      }
    }
    
    return $plugins;
  }

  // Obtener config de un plugin (sin cargarlo)
  static function getConfig($pluginName) {
    if (isset(self::$loaded[$pluginName])) {
      return self::$loaded[$pluginName];
    }
    
    $configFile = BASE_PATH . '/plugins/' . $pluginName . '/plugin.json';
    if (file_exists($configFile)) {
      return json_decode(file_get_contents($configFile), true);
    }
    
    return null;
  }
}