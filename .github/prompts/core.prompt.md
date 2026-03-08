# Core del Framework

> ogApp, ogRouter, ogApi, ogApplication, ogController, ogResource.
> Generado: 2026-03-08 14:28:20

---

### `framework/core/ogApp.php`

```
FILE: framework/core/ogApp.php
ROLE: Singleton principal del framework. Punto central de acceso a helpers,
      services, controllers, handlers, cores y middleware.

ACCESO GLOBAL:
  ogApp()                  → instancia default
  ogApp('pluginName')      → instancia de un plugin específico

MULTI-PLUGIN SAFE:
  ogApp() y ogResource() están protegidas con function_exists()
  para evitar redeclaración si el framework es cargado por múltiples plugins.

CARGA BAJO DEMANDA:
  ogApp()->helper('str')         → instancia ogStr (helpers/)
  ogApp()->service('ai')         → instancia AiService (services/)
  ogApp()->controller('user')    → instancia UserController
  ogApp()->handler('auth')       → instancia AuthHandler
  ogApp()->core('router')        → instancia ogRouter
  ogApp()->loadHelper('str')     → solo carga el archivo (sin instanciar)

SUBCARPETAS: todos los métodos aceptan rutas con subcarpetas:
  ogApp()->handler('integrations/whatsapp') → busca integrations/WhatsappHandler.php
  ogApp()->controller('admin/product')      → busca admin/ProductController.php
  ogApp()->helper('utils/formatter')        → busca utils/FormatterHelper.php
  ogApp()->service('integrations/ads')      → busca integrations/AdsService.php

NOTA: loadController/loadHandler aceptan nombre con o sin sufijo:
  ogApp()->loadController('user')           → busca UserController
  ogApp()->loadController('UserController') → también funciona
  ogApp()->loadHandler('auth')              → busca AuthHandler
  ogApp()->loadHandler('AuthHandler')       → también funciona

BÚSQUEDA DE ARCHIVOS (orden por capa):
  app → middle → framework
  Prefijos intentados por capa: sin prefijo → prefijo config → 'og'

RUTAS PREDEFINIDAS (getPath):
  ogApp()->getPath()                         → /backend/app
  ogApp()->getPath('storage')                → /backend/app/storage
  ogApp()->getPath('sessions')               → /backend/app/storage/sessions
  ogApp()->getPath('backend')                → /backend
  ogApp()->getPath('storage/json/bots/data') → /backend/app/storage/json/bots/data
  getPath() acepta cualquier subpath relativo, no solo rutas predefinidas.

OTROS:
  ogApp()->db()                  → acceso directo a ogDb::table()
  ogApp()->isWordPress()         → bool
  ogApp()->getPrefix()           → prefijo del plugin (si aplica)
```

### `framework/core/ogRouter.php`

```
FILE: framework/core/ogRouter.php
ROLE: Enrutador minimalista. Registra rutas HTTP, ejecuta middleware por ruta
      y despacha el handler correspondiente.

REGISTRO DE RUTAS:
  $router->get('/api/user', [UserController::class, 'list']);
  $router->post('/api/user', [UserController::class, 'create']);
  $router->put('/api/user/{id}', [UserController::class, 'update']);
  $router->delete('/api/user/{id}', [UserController::class, 'delete']);

MIDDLEWARE POR RUTA:
  $router->get('/api/user', $handler)->middleware(['auth', 'throttle:60,1']);

GRUPOS:
  $router->group('/api/admin', function($r) {
    $r->get('/stats', $handler);   // → /api/admin/stats
  });

MIDDLEWARE DISPONIBLES (alias):
  'auth'      → ogAuthMiddleware
  'json'      → ogJsonMiddleware
  'throttle'  → ogThrottleMiddleware
  'dev'       → ogDevMiddleware

PARÁMETROS DINÁMICOS:
  {id}        → captura segmento simple  → /api/user/42
  {path:.*}   → captura todo incluyendo slashes → /api/file/a/b/c

HANDLERS SOPORTADOS:
  [$controller, 'method']     → array callable
  'Controller@method'         → string (carga bajo demanda via ogApp)
  function() {}               → closure

CLASES:
  ogRouter   → enrutador principal
  ogRoute    → objeto de ruta individual (handler + middleware)
```

### `framework/core/ogApi.php`

```
FILE: framework/core/ogApi.php
ROLE: Compositor de rutas. Se ejecuta en cada request y construye el stack
      de rutas combinando schemas JSON (CRUD automático) + rutas manuales
      de las 3 capas (framework, middle, app).

FLUJO DE EJECUCIÓN (4 pasos en orden):
  1. Auto-registrar rutas CRUD desde schema JSON del módulo
  2. Cargar rutas manuales de framework/routes/{module}.php
  3. Cargar rutas manuales de middle/routes/{module}.php
  4. Cargar rutas manuales de app/routes/{module}.php

DETECCIÓN DE MÓDULO:
  Extrae el módulo desde la URL → /api/{module}/...
  Convierte kebab-case a camelCase automáticamente:
  /api/my-module → /api/myModule  (loguea advertencia)

CRUD AUTOMÁTICO (si existe schema JSON):
  Busca schema: app → middle → framework
  GET    /api/{module}        → list
  GET    /api/{module}/{id}   → show
  POST   /api/{module}        → create
  PUT    /api/{module}/{id}   → update
  DELETE /api/{module}/{id}   → delete

  Si existe {Module}Controller personalizado → lo usa
  Si no → instancia ogController genérico

  Rutas pueden deshabilitarse en el schema:
  { "routes": [{ "name": "delete", "enabled": false }] }

MIDDLEWARE EN SCHEMA:
  Middleware global del módulo + middleware por ruta se fusionan:
  { "middleware": ["auth"], "routes": [{ "name": "list", "middleware": ["throttle:60,1"] }] }

DEV TOOLS:
  ?_delay=N  → simula latencia N segundos (solo OG_IS_DEV)
```

### `framework/core/ogApplication.php`

```
FILE: framework/core/ogApplication.php
ROLE: Maneja el ciclo de vida completo de la request. Inicializa el router,
      carga las rutas y controla el output hasta enviar la respuesta final.

CICLO DE VIDA:
  1. __construct() → instancia ogRouter + guarda en ogApp + carga ogApi.php
  2. run()         → captura output previo → dispatch() → sendResponse()

USO (desde api.php):
  $app = new ogApplication();
  $app->run();

MANEJO DE OUTPUT:
  - Captura cualquier output previo al routing (warnings, var_dumps, etc.)
  - En OG_IS_DEV: loguea output capturado como advertencia
  - Valida que la respuesta final sea JSON válido
  - Si el output contiene HTML/tags PHP → llama handlePhpWarning()
  - Si el output está vacío → responde { success: true }

MANEJO DE ERRORES:
  OG_IS_DEV  → expone mensaje, archivo, línea y trace (5 niveles)
  Producción → responde { success: false, error: 'api.server_error' }

RESPUESTAS DE ERROR:
  500 → excepción no capturada en dispatch()
  500 → output con HTML/warnings de PHP detectados
  500 → output que no es JSON válido
```

### `framework/core/ogController.php`

```
FILE: framework/core/ogController.php
ROLE: Controller CRUD genérico basado en schema JSON. Se instancia
      automáticamente desde ogApi.php cuando no existe controller personalizado.

USO DIRECTO (en rutas manuales):
  $ctrl = new ogController('user');
  $router->get('/api/user', [$ctrl, 'list']);

ACCIONES DISPONIBLES:
  list($id)    → GET    /api/{module}       filtros dinámicos desde ?campo=valor
  show($id)    → GET    /api/{module}/{id}
  create()     → POST   /api/{module}       valida campos required del schema
  update($id)  → PUT    /api/{module}/{id}
  delete($id)  → DELETE /api/{module}/{id}

TIMESTAMPS AUTOMÁTICOS:
  timestamps: true  → created_at / updated_at
  timestamps: false → dc / tc (create) y du / tu (update)

BÚSQUEDA DE SCHEMA (orden):
  app/resources/schemas/{module}.json
  middle/resources/schemas/{module}.json
  framework/resources/schemas/{module}.json

BÚSQUEDA DE HANDLER PERSONALIZADO (orden):
  app/resources/handlers/{Module}Handler.php
  middle/resources/handlers/{Module}Handler.php
  framework/resources/handlers/og{Module}Handler.php

PAGINACIÓN (list):
  ?page=1&per_page=50&sort=id&order=ASC

TRAITS:
  ogValidatesUnique → validación de campos únicos en DB
```

### `framework/core/ogResource.php`

```
FILE: framework/core/ogResource.php
ROLE: Helper de acceso a datos basado en schema JSON. Wrapper fluido sobre
      ogDb para usar dentro de controllers, handlers o services.

USO:
  $user = ogResource('user');         // vía helper global
  $user = new ogResource('user');     // vía instancia directa

MÉTODOS:
  $user->get()                        → todos los registros
  $user->get(42)                      → por ID
  $user->get(['status' => 'active'])  → por condiciones
  $user->first(['email' => $email])   → primer resultado
  $user->where('status', 'active')    → query builder fluido (retorna ogDb)
  $user->insert(['name' => 'Juan'])   → crea registro
  $user->update(42, ['name' => 'X'])  → actualiza por ID
  $user->update(['email' => $e], $d)  → actualiza por condiciones
  $user->delete(42)                   → elimina por ID
  $user->count(['status' => 'active'])→ cuenta registros
  $user->exists(['email' => $email])  → bool

TIMESTAMPS AUTOMÁTICOS (igual que ogController):
  timestamps: true  → created_at / updated_at
  timestamps: false → dc / tc (insert) y du / tu (update)

BÚSQUEDA DE SCHEMA (orden):
  app/resources/schemas/{module}.json
  middle/resources/schemas/{module}.json
  framework/resources/schemas/{module}.json

DIFERENCIA CON ogController:
  ogController → uso en rutas HTTP (request/response)
  ogResource   → uso interno en lógica de negocio
```
