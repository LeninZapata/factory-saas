# 🎯 Sistema Multi-Plugin Simplificado

## ✅ Concepto Clave

**Cada plugin solo apunta a `app/config/init.php` - ese archivo se encarga de TODO**

---

## 📁 Estructura de Plugin WordPress

```
wp-content/plugins/
└── factory-saas-api/
    ├── factory-saas-api.php          ← Archivo principal (solo define paths)
    ├── api.php                        ← Entry point
    ├── framework/                     ← Copia del framework
    │   ├── core/
    │   │   ├── ogApp.php
    │   │   ├── ogController.php
    │   │   └── ...
    │   ├── helpers/
    │   │   ├── ogDb.php
    │   │   ├── ogRequest.php
    │   │   └── ...
    │   └── config/
    │       └── init.php               ← Carga framework si no existe
    └── app/
        ├── config/
        │   ├── init.php               ← 🔑 ARCHIVO CLAVE (valida todo)
        │   ├── consts.php
        │   └── database.php
        ├── routes/
        └── resources/
```

---

## 🔑 Archivo Clave: `app/config/init.php`

Este archivo **SE ENCARGA DE TODO**:

```php
<?php
// APP/CONFIG/INIT.PHP - Define paths y carga framework SI NO ESTÁ CARGADO

// Calcular rutas base
if (!defined('BASE_PATH')) {
  define('BASE_PATH', realpath(dirname(dirname(dirname(__DIR__)))));
  define('BACKEND_PATH', BASE_PATH . '/backend');
  define('APP_PATH', BACKEND_PATH . '/app');
}

// 🔑 VALIDACIÓN: Cargar framework SOLO si no está cargado
if (!class_exists('ogFramework')) {
  // Definir FRAMEWORK_PATH solo si no existe
  if (!defined('FRAMEWORK_PATH')) {
    define('FRAMEWORK_PATH', BACKEND_PATH . '/framework');
  }
  
  // Cargar el framework completo
  require_once FRAMEWORK_PATH . '/config/init.php';
}

// Cargar constantes de la aplicación
require_once __DIR__ . '/consts.php';
```

---

## 🚀 Archivo Principal del Plugin: Simplificado

```php
<?php
/**
 * Plugin Name: Factory SaaS API
 * Description: API REST para Factory SaaS
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) exit;

// 1️⃣ Definir paths del plugin
define('FACTORY_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('FACTORY_APP_PATH', FACTORY_PLUGIN_PATH . 'app');

// 2️⃣ Definir BACKEND_PATH para compatibilidad
if (!defined('BACKEND_PATH')) {
  define('BACKEND_PATH', FACTORY_PLUGIN_PATH);
}

// 3️⃣ Cargar init.php (este se encarga de TODO)
require_once FACTORY_APP_PATH . '/config/init.php';

// 4️⃣ Registrar instancia del plugin
function factory_saas_init() {
  ogApp('factory-saas', FACTORY_APP_PATH);
}
add_action('plugins_loaded', 'factory_saas_init', 5);

// 5️⃣ Resto de WordPress hooks (rewrite rules, etc)
// ...
```

**Eso es TODO. El resto lo hace `init.php`.**

---

## 🔄 Flujo de Carga: 3 Plugins Activos

### **Plugin 1: factory-saas-api** (se activa primero)

```
1. factory-saas-api.php
   ↓ require_once app/config/init.php
   
2. app/config/init.php
   ↓ if (!class_exists('ogFramework'))  // ✅ NO existe
   ↓ define('FRAMEWORK_PATH', 'plugins/factory-saas-api/framework')
   ↓ require_once FRAMEWORK_PATH/config/init.php
   
3. framework/config/init.php
   ↓ Carga system.php, environment.php, consts.php
   ↓ Carga requires.php (ogApp, ogDb, ogResponse, etc)
   ↓ Carga execute.php
   
✅ Framework CARGADO desde Plugin 1
✅ ogApp('factory-saas') registrado
```

### **Plugin 2: crm-api** (se activa después)

```
1. crm-api.php
   ↓ require_once app/config/init.php
   
2. app/config/init.php
   ↓ if (!class_exists('ogFramework'))  // ❌ YA EXISTE
   ↓ NO carga framework
   
✅ Usa framework ya cargado (de Plugin 1)
✅ ogApp('crm') registrado
```

### **Plugin 3: inventory-api** (se activa después)

```
1. inventory-api.php
   ↓ require_once app/config/init.php
   
2. app/config/init.php
   ↓ if (!class_exists('ogFramework'))  // ❌ YA EXISTE
   ↓ NO carga framework
   
✅ Usa framework ya cargado (de Plugin 1)
✅ ogApp('inventory') registrado
```

---

## 💡 Uso Multi-Plugin

### **Forma Larga**
```php
ogFramework::instance()->helper('file');
ogFramework::instance('plugin1')->service('auth');
```

### **Forma Corta (Recomendada)**
```php
// Plugin por defecto
ogApp()->helper('file');
ogApp()->db('users')->get();

// Plugin específico
ogApp('factory-saas')->helper('validator');
ogApp('crm')->service('email');
ogApp('inventory')->getConfig('api_key');
```

### **Cruzar Datos Entre Plugins**
```php
// Desde factory-saas-api, acceder a config de CRM
$crmApiKey = ogApp('crm')->getConfig('api_key');

// Desde CRM, usar helper de inventory
$fileHelper = ogApp('inventory')->helper('file');

// Acceder a DB de otro plugin
$users = ogApp('factory-saas')->db('factory_users')->get();
```

### **Ver Plugins Registrados**
```php
$instances = ogFramework::getAllInstances();
print_r(array_keys($instances));
// Output: ['factory-saas', 'crm', 'inventory']
```

---

## 🎯 Entry Point de Cada Plugin

### `plugins/factory-saas-api/api.php`
```php
<?php
ob_start();

header('Content-Type: application/json; charset=utf-8');
// ... otros headers

// Cargar config (si no está cargado aún)
require_once FACTORY_APP_PATH . '/config/init.php';

// Usar instancia específica del plugin
$app = ogApp('factory-saas')->getApplication();
$app->run();
```

---

## ✅ Ventajas de Este Sistema

### 1️⃣ **Súper Simple**
- Archivo principal solo define paths
- `init.php` hace todo el trabajo
- Validación automática con `class_exists`

### 2️⃣ **Sin Duplicación**
- Framework se carga UNA sola vez
- Plugins posteriores lo reutilizan

### 3️⃣ **Multi-Plugin**
- Cada plugin tiene su instancia: `ogApp('nombre')`
- Pueden compartir datos entre ellos
- Acceso cruzado a helpers/services

### 4️⃣ **Auto-Contenido**
- Cada plugin lleva su copia del framework
- No depende de instalar "og-framework" por separado
- Funciona standalone

### 5️⃣ **WordPress Compatible**
- No importa el orden de activación
- Funciona con cualquier cantidad de plugins
- Rewrite rules independientes por plugin

---

## 📊 Comparación: Antes vs Ahora

### ❌ **ANTES (Complicado)**
```php
// En archivo principal del plugin
if (!function_exists('ogApp')) {
  require_once FRAMEWORK_PATH . '/core/ogApp.php';
  require_once FRAMEWORK_PATH . '/helpers/ogLang.php';
  require_once FRAMEWORK_PATH . '/helpers/ogLog.php';
  require_once FRAMEWORK_PATH . '/helpers/ogResponse.php';
  require_once FRAMEWORK_PATH . '/helpers/ogRequest.php';
  require_once FRAMEWORK_PATH . '/helpers/ogDb.php';
  require_once FRAMEWORK_PATH . '/core/ogController.php';
  // ... más requires
}
```

### ✅ **AHORA (Simple)**
```php
// En archivo principal del plugin
require_once FACTORY_APP_PATH . '/config/init.php';
```

**Una sola línea. El resto lo hace `init.php`.**

---

## 🔍 Debug y Utilidades

### Ver qué plugins están cargados
```php
$instances = ogFramework::getAllInstances();
foreach ($instances as $name => $instance) {
  echo "Plugin: {$name}\n";
  echo "Path: " . $instance->getPath() . "\n";
  echo "Loaded: " . implode(', ', $instance->getLoaded()) . "\n\n";
}
```

### Ver qué está cargado en un plugin específico
```php
$loaded = ogApp('factory-saas')->getLoaded();
print_r($loaded);
// Output: ['helper_validation', 'service_auth', 'helper_file']
```

### Verificar si framework está cargado
```php
if (class_exists('ogFramework')) {
  echo "Framework cargado desde: " . FRAMEWORK_PATH;
}
```

---

## 🎯 Resumen Final

| Componente | Responsabilidad |
|------------|-----------------|
| `plugin-name.php` | Definir paths, hooks WordPress |
| `app/config/init.php` | ✅ **Validar y cargar framework** |
| `framework/config/init.php` | Cargar componentes del framework |
| `ogApp()` | Acceso a instancias y componentes |

### **Regla de Oro:**
```
Cada plugin solo hace:
1. Definir paths
2. require_once app/config/init.php
3. Registrar hooks WordPress

TODO LO DEMÁS lo hace init.php automáticamente.
```

---

## 🚀 Ejemplo Completo: 2 Plugins

### Plugin 1: Factory SaaS API
```php
// plugins/factory-saas-api/factory-saas-api.php
define('FACTORY_APP_PATH', __DIR__ . '/app');
define('BACKEND_PATH', __DIR__);
require_once FACTORY_APP_PATH . '/config/init.php';
ogApp('factory-saas', FACTORY_APP_PATH);
```

### Plugin 2: CRM API
```php
// plugins/crm-api/crm-api.php
define('CRM_APP_PATH', __DIR__ . '/app');
define('BACKEND_PATH', __DIR__);
require_once CRM_APP_PATH . '/config/init.php';
ogApp('crm', CRM_APP_PATH);
```

**Ambos usan el mismo framework, pero cada uno tiene su instancia independiente.**

✅ **Así de simple.**