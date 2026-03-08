# Backend Documentation

> Generado automáticamente desde bloques `@doc-start`/`@doc-end`
> Fecha: 2026-03-07 19:35:47

---

## Índice

- [Bootstrap & Configuración](#bootstrap-configuraci-n)
- [Core del Framework](#core-del-framework)
- [Helpers — Parte 1: ogDb](#helpers-parte-1-ogdb)
- [Helpers — Parte 2: Cache, Log, Response, Request, Lang](#helpers-parte-2-cache-log-response-request-lang)
- [Helpers — Parte 3: Utils, File, Http, Str, Url, Date, Country, Logic, Validation](#helpers-parte-3-utils-file-http-str-url-date-country-logic-validation)
- [Middleware & Traits](#middleware-traits)
- [Módulo Auth & Users (No aplica para WordPress)](#m-dulo-auth-users-no-aplica-para-wordpress)
- [Rutas del Framework](#rutas-del-framework)

---

## Bootstrap & Configuración

> ⚠️ `backend/../funcs.php` — sin bloque `@doc-start`/`@doc-end`

### `backend/bootstrap.php`

```
FILE: backend/bootstrap.php
ROLE: Orquestador del arranque. Inicializa el framework, registra la instancia
      ogApp y despacha la request según el entorno (WordPress o standalone).

ENTRYPOINT:
  Todo comienza desde wp.php (raíz del proyecto), que es el archivo inicial
  tanto para WordPress como para standalone.

FLUJO COMPLETO DE ARRANQUE:

  wp.php
  ├── Detecta entorno: $isWP = defined('ABSPATH')
  ├── Carga funcs.php (ogIsLocalhost, ogIsDev, ogValidatePhpVersion, get_file_data)
  ├── Lee metadata del plugin desde wp.php header (Plugin ID, Version, RequiresPHP...)
  └── Carga bootstrap.php

  bootstrap.php
  ├── Valida versión PHP mínima (RequiresPHP del header de wp.php)
  ├── Carga app/config/init.php
  │   ├── Carga framework/config/init.php (si no está cargado)
  │   │   └── Inicializa núcleo: helpers, cores, middleware, rutas del framework
  │   ├── Carga app/config/consts.php  (constantes del proyecto, ej: WEBHOOK_META_VERIFY_TOKEN)
  │   └── Carga app/config/execute.php
  │       ├── Configura error reporting según OG_IS_DEV
  │       ├── Carga app/config/database.php → ogDb::setConfig()
  │       └── Carga app/config/tables.php   → ogDb::setTables()
  ├── Registra instancia: ogApp($pluginName, $appPath, $isWP)
  └── Guarda paths en memoria volátil (ogCache::memorySet):
      'path_middle'    → /backend/middle
      'path_framework' → /backend/framework
      'path_backend'   → /backend

  STANDALONE → api.php
  ├── Headers CORS + Content-Type: application/json
  ├── Maneja OPTIONS preflight
  └── $app = new ogApplication(); $app->run();
      └── ogApi carga rutas: framework/ + middle/ + app/

  WORDPRESS → hooks de WP (add_action, rewrite rules)
  └── intercepta /api/* → ejecuta api.php

ARQUITECTURA DE 3 CAPAS:
  El sistema busca recursos en las 3 capas en orden: app → middle → framework
  Todas las capas comparten la misma estructura de carpetas interna:

  {capa}/
  ├── resources/
  │   ├── controllers/   → XxxController.php
  │   ├── handlers/      → XxxHandler.php
  │   └── schemas/       → xxx.json (CRUD automático)
  ├── routes/            → xxx.php (rutas manuales)
  ├── lang/es/           → xxx.php (traducciones)
  ├── helpers/           → helpers locales de la capa
  └── services/          → servicios e integraciones

  PORTABILIDAD: un archivo puede moverse entre capas sin modificación.
  Si AuthHandler.php está en middle/ y se mueve a app/, el sistema
  lo encontrará automáticamente porque busca en las 3 capas.
  Esto permite promover código de framework → middle → app según
  cuánto sea específico del proyecto.

  PRIORIDAD: app/ siempre gana sobre middle/ y framework/.
  Si el mismo archivo existe en dos capas, se usa el de app/.
  Esto permite override sin tocar el código original.

CAPAS DE RUTAS (cargadas por ogApi en cada request):
  1. framework/routes/  → system, logs, sessions, country
  2. middle/routes/     → auth, user, sessions, cleanup
  3. app/routes/        → bot, sale, webhook, product, client, etc.

CONFIGURACIÓN DE LA APP (app/config/):
  consts.php   → constantes del proyecto (tokens, claves externas)
  database.php → credenciales DB por entorno (localhost vs producción)
  tables.php   → alias de tablas: ['bots'=>'bots', 'sales'=>'sales', ...]
  execute.php  → configura DB + tablas + error reporting
  init.php     → punto de entrada de app/config/, carga los 4 anteriores

FUNCIONES GLOBALES (funcs.php — nivel raíz del proyecto):
  ogIsLocalhost()              → bool
  ogIsDev()                    → bool
  ogIsProduction()             → bool
  ogValidatePhpVersion($v)     → valida PHP mínimo, muestra error en WP o standalone
  get_file_data($file,$headers)→ extrae metadata del header de wp.php
```

### `framework/config/init.php`

```
FILE: framework/config/init.php
ROLE: Orquesta el arranque del framework en orden estricto:
  1. environment.php → define OG_IS_DEV
  2. consts.php      → constantes globales
  3. requires.php    → carga helpers y cores críticos
  4. execute.php     → idioma + config de logs
Cargado desde app/config/init.php vía require_once (solo 1 vez).
```

### `framework/config/environment.php`

```
FILE: framework/config/environment.php
ROLE: Define OG_IS_DEV basado en ogIsLocalhost().
      Punto único de control del modo desarrollo/producción.
      Todo el framework usa OG_IS_DEV para condicionar comportamiento.
```

### `framework/config/consts.php`

```
FILE: framework/config/consts.php
ROLE: Constantes globales del framework. Genéricas y reutilizables por cualquier proyecto.

TIEMPO:
  OG_TIME_SECOND | OG_TIME_MINUTE | OG_TIME_HOUR
  OG_TIME_DAY | OG_TIME_WEEK | OG_TIME_MONTH | OG_TIME_YEAR

SESIONES:
  OG_SESSION_TTL    → duración en segundos (default: 1 día)
  OG_SESSION_TTL_MS → duración en milisegundos

API:
  OG_API_DEFAULT_TIMEOUT   → 60 segundos
  OG_API_MAX_PAYLOAD_SIZE  → 1MB

OTROS:
  OG_TIMEZONE    → 'America/Guayaquil' (se aplica con date_default_timezone_set)
  OG_DEFAULT_LANG → 'es'
  OG_SERVICES_PATH → OG_FRAMEWORK_PATH . '/services'
```

### `framework/config/requires.php`

```
FILE: framework/config/requires.php
ROLE: Carga inicial de helpers y cores críticos del framework.

Se cargan automáticamente en el boot (vía init.php):
- Helpers: lang, log, response, request, db, cache
- Cores: app, controller, application

El resto de helpers se cargan bajo demanda desde controllers u otros archivos.
Agregar aquí solo lo que toda request necesita desde el primer ciclo.

TABLA DE HELPERS:
| Helper        | Pre-Cargado | Cómo Usar                       |
|---------------|-------------|---------------------------------|
| ogResponse    | YES         | ogResponse::success()           |
| ogRequest     | YES         | ogRequest::data()               |
| ogLog         | YES         | ogLog::error()                  |
| ogDb          | YES         | ogDb::table() / ogDb::t()       |
| ogLang        | YES         | __('key')                       |
| ogCache       | YES         | ogCache::memorySet/Get()        |
| ogCache arch. | YES         | ogApp()->helper('cache')::set() |
| ogValidation  | NO          | ogApp()->helper('validation')   |
| ogFile        | NO          | ogApp()->helper('file')         |
| ogHttp        | NO          | ogApp()->helper('http')         |
| ogStr         | NO          | ogApp()->helper('str')          |
| ogUtils       | NO          | ogApp()->helper('utils')        |
| ogUrl         | NO          | ogApp()->helper('url')          |
| ogDate        | NO          | ogApp()->helper('date')         |
| ogCountry     | NO          | ogApp()->helper('country')      |
| ogLogic       | NO          | ogApp()->helper('logic')        |
```

### `framework/config/execute.php`

```
FILE: framework/config/execute.php
ROLE: Ejecuta configuraciones iniciales del framework en cada request.

Responsabilidades:
- Carga el idioma por defecto (OG_DEFAULT_LANG = 'es')
- Configura el sistema de logs con template diario por módulo

Log config:
- template: storage/logs/{year}/{month}/{day}/{module}.log
- level: 'debug' en desarrollo, 'info' en producción (basado en OG_IS_DEV)
- max_size: 1MB por archivo

Alternativas de idioma disponibles (comentadas en el archivo):
- Detección automática desde header HTTP_ACCEPT_LANGUAGE
- Detección desde query param ?lang=
```

> ⚠️ `backend/app/config/init.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/app/config/execute.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/app/config/database.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/app/config/tables.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/app/config/consts.php` — sin bloque `@doc-start`/`@doc-end`

---

## Core del Framework

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

---

## Helpers — Parte 1: ogDb

### `framework/helpers/ogDb.php`

```
FILE: framework/helpers/ogDb.php
ROLE: Entry point estático del query builder. Gestiona la conexión PDO (singleton)
      y expone los métodos de acceso a la base de datos.
      La lógica está separada en helpers/ogDb/:
      - ogDbBuilder.php → construcción y ejecución de queries
      - ogRawExpr.php   → wrapper para expresiones SQL crudas

CONFIGURACIÓN (en app/config/database.php):
  ogDb::setConfig(['host'=>'', 'name'=>'', 'user'=>'', 'pass'=>'']);
  ogDb::setTables(['users' => 'prefix_users']); // alias de tablas (opcional)

ACCESO PRINCIPAL:
  ogDb::table('users')       → inicia query builder sobre tabla
  ogDb::t('users')           → igual pero usando alias configurado en setTables()
  ogDb::t('users', true)     → retorna solo el nombre de la tabla (sin query builder)

QUERY BUILDER (métodos encadenables):
  ->select(['id', 'name'])
  ->distinct()
  ->where('status', 'active')
  ->where('age', '>', 18)
  ->orWhere('role', 'admin')
  ->whereIn('id', [1,2,3])
  ->whereNotIn('id', [4,5])
  ->whereNull('deleted_at')
  ->whereNotNull('email')
  ->whereBetween('created_at', ['2025-01-01', '2025-12-31'])
  ->whereFilters($array)     → filtros dinámicos desde array (soporta IN, LIKE, BETWEEN...)
  ->join('orders', 'users.id', '=', 'orders.user_id')
  ->leftJoin('orders', 'users.id', 'orders.user_id')
  ->orderBy('created_at', 'DESC')
  ->groupBy('status')
  ->having('total', '>', 100)
  ->limit(10)->offset(20)
  ->paginate($page, $perPage)

EJECUCIÓN:
  ->get()           → array de resultados
  ->first()         → primer resultado o null
  ->find($id)       → buscar por id
  ->count()         → total de registros
  ->exists()        → bool
  ->pluck('name')   → array de valores de una columna
  ->value('name')   → valor de una columna del primer resultado
  ->chunk(100, fn)  → procesar en lotes (callback retorna false para detener)

ESCRITURA:
  ->insert(['name' => 'Juan'])              → retorna lastInsertId
  ->insert([['name'=>'A'], ['name'=>'B']])  → insert batch, retorna rowCount
  ->update(['name' => 'Juan'])              → retorna rowCount
  ->delete()                               → retorna rowCount

RAW SQL:
  ogDb::raw('NOW()')                        → ogRawExpr (para usar en insert/update)
  ogDb::raw('SELECT * FROM users', [])      → ejecuta query, retorna array
  ->update(['updated_at' => ogDb::raw('NOW()')])

TRANSACCIONES:
  ogDb::table('users')->transaction(function($db) {
    $db->table('users')->insert([...]);
    $db->table('orders')->insert([...]);
  });

DEBUGGING:
  ->toSql()   → SQL sin valores interpolados
  ->getSql()  → SQL con valores interpolados (solo dev)

ESTILO DE ESCRITURA:
  Inline cuando hay 1 o 2 where (query simple):
    $res = ogDb::t('assets')->where('product_id', $id)->get();
    $res = ogDb::t('assets')->where('product_id', $id)->where('status', 1)->first();
  Multilínea cuando hay 3 o más where:
    $res = ogDb::t('assets')
      ->where('product_id', $id)
      ->where('status', 1)
      ->where('is_active', 1)
      ->get();

NOTAS:
  - Conexión PDO singleton (se resetea al llamar setConfig())
  - Columnas con prefijo '_' son ignoradas en where() (ej: _delay, _debug)
  - En OG_IS_DEV el exec() interpola valores para facilitar debugging
```

> ⚠️ `backend/framework/helpers/ogDb/ogDbBuilder.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/framework/helpers/ogDb/ogDbWhere.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/framework/helpers/ogDb/ogDbQuery.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/framework/helpers/ogDb/ogDbExecute.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/framework/helpers/ogDb/ogRawExpr.php` — sin bloque `@doc-start`/`@doc-end`

---

## Helpers — Parte 2: Cache, Log, Response, Request, Lang

### `framework/helpers/ogCache.php`

```
FILE: framework/helpers/ogCache.php
ROLE: Sistema híbrido de cache. Archivo, sesión PHP y memoria volátil (runtime).

REGLA: prefijo 'global_' → sesión PHP | sin prefijo → archivo

MÉTODOS ARCHIVO/SESIÓN:
  set/get/has/forget/pull/remember/rememberOnce

CONFIG PERSONALIZADA:
  setConfig(['dir','ext','format'], 'key') | setConfigDefault()

FORMATO ARCHIVO:
  variables {expires},{hash},{key},{key:N},{var1}...
  Default: '{expires}_{hash}.cache'

MEMORIA VOLÁTIL (runtime, se pierde al terminar la request):
  memorySet('key', $value)
  memoryGet('key', $default)   → retorna $default si la clave no existe
  memoryHas('key')             → bool
  memoryForget('key')
  memoryRemember('key', fn)
  memoryClear()

USO TÍPICO EN BOOTSTRAP:
  ogCache::memorySet('path_middle', $path)
  ogCache::memorySet('db_tables', $tables)
  ogCache::memoryGet('db_tables', [])      → [] si no existe

LIMPIEZA:
  cleanup() | cleanup('session') | cleanupAll()
  Lee timestamp del nombre del archivo sin abrirlo.
```

### `framework/helpers/ogLog.php`

```
FILE: framework/helpers/ogLog.php
ROLE: Sistema de logging con formato TSV, lazy loading por módulo, rotación
      por tamaño y soporte de custom vars para filtros avanzados.

FORMATO TSV (10 columnas):
  [timestamp.microseconds] sequence level layer module message context file:line user_id tags
  [2025-12-10 15:30:00.000000] 1 INFO app auth Login exitoso {"user":"admin"} Handler.php:42 3 auth,login

USO:
  ogLog::info('Mensaje')
  ogLog::info('Login exitoso', ['user' => 'admin'])
  ogLog::info('Mensaje', ['data' => 'x'], ['module' => 'auth', 'tags' => ['login']])
  ogLog::debug()    → solo en OG_IS_DEV
  ogLog::warning()
  ogLog::error()
  ogLog::throwError($msg) → ogLog::error() + throw Exception
  ogLog::sql($sql, $bindings) → solo en OG_IS_DEV

CONFIGURACIÓN (en execute.php):
  ogLog::setConfig([
    'format'   => 'custom',   // single | monthly | daily | custom
    'template' => '{year}/{month}/{day}/{module}.log',
    'level'    => OG_IS_DEV ? 'debug' : 'info',
    'max_size' => 1048576,    // 1MB por archivo
    'enabled'  => true
  ]);

CUSTOM VARS (se agregan al context Y sirven como filtros en API):
  ogLog::info('Msg', ['text' => 'Hola'], ['module' => 'whatsapp', 'number' => '593987', 'bot_id' => 10]);
  → filtrable via GET /api/logs/today?bot_id=10&number=593987

USER ID AUTOMÁTICO:
  Si existe $GLOBALS['auth_user_id'] se incluye en columna user_id automáticamente

API DE CONSULTA:
  GET /api/logs/today          → logs de hoy
  GET /api/logs/latest         → últimos N logs
  GET /api/logs/2025/12/10     → logs por fecha
  GET /api/logs/search?from=2025-12-01&to=2025-12-10
  Filtros: ?level=ERROR &module=auth &tags=login &user_id=5 &search=texto &bot_id=10

ESTILO DE ESCRITURA:
  Siempre inline (1 línea) cuando tenga 0, 1, 2 o 3 parámetros:
    ogLog::info('Mensaje');
    ogLog::info('Login exitoso', ['user' => 'admin'], ['module' => 'auth']);
  Solo multilínea cuando tenga 4 o más elementos en contexto o meta:
    ogLog::info('Mensaje', [
      'user'   => 'admin',
      'action' => 'login',
      'ip'     => '192.168.1.1',
      'agent'  => 'Mozilla'
    ], ['module' => 'auth']);

ROTACIÓN:
  Al superar max_size crea app_1.log, app_2.log, etc. en el mismo directorio
  Protección anti-recursión y anti-OOM (no loguea si quedan <50MB de memoria)
```

### `framework/helpers/ogResponse.php`

```
FILE: framework/helpers/ogResponse.php
ROLE: Helper de respuestas HTTP/JSON. Todas las respuestas terminan en exit().
      Errores no-200 se loguean automáticamente via ogLog.

MÉTODOS PRINCIPALES:
  ogResponse::success($data, $msg, $code)
    → { success: true, message?, data? }

  ogResponse::error($error, $code, $details)
    → { success: false, error, details? }

  ogResponse::validation($errors)
    → { success: false, errors: [...] }  HTTP 400

  ogResponse::json($data, $code)
    → respuesta JSON base, usada internamente por todos los métodos
    → OG_IS_DEV agrega JSON_PRETTY_PRINT automáticamente

SHORTCUTS HTTP:
  ogResponse::notFound($msg)      → HTTP 404
  ogResponse::unauthorized($msg)  → HTTP 401
  ogResponse::forbidden($msg)     → HTTP 403
  ogResponse::serverError($msg)   → HTTP 500 (incluye $debug si OG_IS_DEV)

WEBHOOKS:
  ogResponse::flushAndContinue($data)
    → responde HTTP 200 al cliente inmediatamente y continúa ejecución en background
    → usar en webhooks para evitar retransmisiones por timeout (ej: Meta, WhatsApp)
    → setea Connection: close + Content-Length antes del flush

NOTAS:
  - Todos los métodos terminan en exit() excepto flushAndContinue()
  - Respuestas con code !== 200 se loguean (datos >5000 chars se truncan en el log)
  - Mensajes de error sin parámetro usan traducciones de 'helper.response.*'
```

### `framework/helpers/ogRequest.php`

```
FILE: framework/helpers/ogRequest.php
ROLE: Helper de lectura de la request HTTP entrante. Acceso a datos, headers,
      método, IP y token de autenticación.

MÉTODOS:
  ogRequest::data()
    → body del request (JSON o form data)
    → detecta Content-Type automáticamente

  ogRequest::method()        → 'GET', 'POST', 'PUT', 'DELETE'
  ogRequest::isAjax()        → bool (detecta X-Requested-With)
  ogRequest::ip()            → IP real del cliente (soporta proxies y CDN)
  ogRequest::userAgent()     → string del User-Agent
  ogRequest::path()          → path de la URL sin query string
  ogRequest::query($key)     → valor de $_GET[$key]
  ogRequest::post($key)      → valor de $_POST[$key]

  ogRequest::bearerToken()
    → extrae token del header Authorization: Bearer {token}
    → intenta 3 métodos: HTTP_AUTHORIZATION, getallheaders(), apache_request_headers()
    → retorna null si no encuentra token

NOTAS:
  - ip() prioriza headers de proxy en orden: HTTP_CLIENT_IP →
    HTTP_X_FORWARDED_FOR → ... → REMOTE_ADDR
  - data() retorna [] si el body está vacío o es inválido
```

### `framework/helpers/ogLang.php`

```
FILE: framework/helpers/ogLang.php
ROLE: Helper de traducciones con lazy loading por módulo. Carga archivos de
      idioma bajo demanda la primera vez que se accede a cada módulo.

USO PRINCIPAL (helper global):
  __('auth.login_failed')
  __('core.controller.not_found', ['resource' => 'user'])
  __('services.email.sent')

MÉTODOS:
  ogLang::load('es')              → establece locale (NO carga archivos)
  ogLang::get($key, $replace)     → obtiene traducción con dot notation
  ogLang::setLocale('en')         → cambia idioma y limpia cache en runtime
  ogLang::getLocale()             → retorna locale actual
  ogLang::getLoadedModules()      → array de módulos cargados (debug)
  ogLang::getCacheStats()         → locale, módulos cargados, memory usage (debug)

ESTRUCTURA DE ARCHIVOS:
  framework/lang/es/{module}.php          → traducciones base del framework
  framework/lang/es/services/{service}.php → traducciones de servicios
  app/lang/es/{module}.php                → sobreescribe/extiende framework

MÓDULOS DISPONIBLES EN FRAMEWORK:
  api, auth, core, country, helper, log, middleware, session, validation
  services: ai, chatapi, email, evolution, storage, webhook

LAZY LOADING:
  - Al llamar __('auth.x') → carga framework/lang/es/auth.php + app/lang/es/auth.php
  - Merge app sobre framework (app tiene prioridad)
  - Módulo 'services' carga todos los archivos de la carpeta services/
  - Cada módulo se carga una sola vez por request

VARIABLES EN TRADUCCIONES:
  Archivo: 'not_found' => 'Recurso {resource} no encontrado'
  Uso:     __('core.not_found', ['resource' => 'user'])

NOTAS:
  - helper __() protegido con function_exists() para multi-plugin
  - Si key no existe retorna la key original (nunca falla)
  - Fallback locale: 'es'
```

---

## Helpers — Parte 3: Utils, File, Http, Str, Url, Date, Country, Logic, Validation

### `framework/helpers/ogStr.php`

```
FILE: framework/helpers/ogStr.php
ROLE: Helper de manipulación de strings. Normalización, conversión de casos
      y utilidades de comparación.

MÉTODOS:
  ogStr::normalize($text)
    → minúsculas + remueve tildes (á→a, é→e, ñ→n, ç→c, etc.)
    → útil para comparaciones case-insensitive sin tildes
    → ogStr::normalize('Ñoño') → 'nono'

  ogStr::containsAllWords($needle, $haystack)
    → true si TODAS las palabras de $needle están en $haystack
    → normaliza ambos strings antes de comparar
    → ogStr::containsAllWords('juan perez', 'Juan Pérez García') → true

  ogStr::isJson($string)
    → true si el string es JSON válido
    → retorna false si está vacío o no es string

  ogStr::toCamelCase($string)
    → convierte kebab-case o snake_case a camelCase
    → ogStr::toCamelCase('my-module')  → 'myModule'
    → ogStr::toCamelCase('my_module')  → 'myModule'
    → usado en ogApi.php para normalizar módulos de URL
```

### `framework/helpers/ogUtils.php`

```
FILE: framework/helpers/ogUtils.php
ROLE: Utilidades generales de uso frecuente. Generación de tokens, formato
      de datos y helpers de texto.

MÉTODOS:
  ogUtils::get($arr, $key, $default)
    → acceso seguro a array con valor default
    → ogUtils::get($data, 'name', 'sin nombre')

  ogUtils::uuid()
    → genera UUID v4 aleatorio
    → 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  ogUtils::token($length)
    → token hexadecimal criptográficamente seguro (default: 32 chars)
    → usa random_bytes() internamente

  ogUtils::money($amount, $currency)
    → formatea número como moneda con 2 decimales
    → ogUtils::money(1234.5) → '$1,234.50'

  ogUtils::timeAgo($datetime)
    → tiempo transcurrido en español
    → acepta timestamp unix o string de fecha
    → retorna: 'hace X segundos/minutos/horas/días' o 'dd/mm/yyyy'

  ogUtils::slug($text)
    → convierte texto a slug URL-friendly
    → ogUtils::slug('Héroe del año') → 'heroe-del-ano'
    → retorna 'n-a' si el resultado está vacío

  ogUtils::truncate($text, $len, $suffix)
    → trunca texto a $len caracteres añadiendo $suffix (default: '...')
    → no trunca si el texto es menor o igual a $len

  ogUtils::bytes($bytes)
    → formatea bytes a unidad legible
    → ogUtils::bytes(1536) → '1.5 KB'
```

### `framework/helpers/ogFile.php`

```
FILE: framework/helpers/ogFile.php
ROLE: Helper de archivos. Lectura y escritura de JSON, gestión de directorios
      y eliminación de archivos con logging de errores.

MÉTODOS:
  ogFile::saveJson($path, $data, $module, $action)
    → guarda $data bajo clave 'data' en JSON con metadata (created, module, action)

  ogFile::saveJsonItems($path, $items, $module, $action)
    → igual que saveJson pero guarda bajo clave 'items' (para arrays/colecciones)

  ogFile::getJson($path, $reconstructCallback)
    → lee y retorna 'data' o 'items' del JSON
    → si el archivo no existe ejecuta $reconstructCallback (opcional)

  ogFile::ensureDir($path)
    → crea el directorio si no existe (mkdir recursivo 0755)

  ogFile::delete($path)
    → elimina un archivo, retorna true si no existe o si se eliminó correctamente

  ogFile::deletePattern($pattern)
    → elimina archivos por patrón glob → retorna cantidad eliminada
    → ogFile::deletePattern($dir . '/*.cache')

NOTAS:
  - Crea directorios automáticamente si no existen (saveJson, saveJsonItems)
  - Todos los errores se loguean via ogLog con module 'file'
```

### `framework/helpers/ogHttp.php`

```
FILE: framework/helpers/ogHttp.php
ROLE: Helper de peticiones HTTP salientes via cURL. Wrapper simple para
      consumir APIs externas con decodificación JSON automática.

MÉTODOS:
  ogHttp::get($url, $options)
  ogHttp::post($url, $data, $options)
  ogHttp::put($url, $data, $options)
  ogHttp::delete($url, $options)

RESPUESTA (siempre retorna array, nunca lanza excepción):
  [
    'success'  => bool,        // true si httpCode 200-299
    'data'     => mixed,       // JSON decodificado o string raw
    'raw'      => string,      // respuesta sin decodificar
    'httpCode' => int,         // código HTTP
    'error'    => string|null  // mensaje de error si falló
  ]

OPCIONES DISPONIBLES:
  'timeout'    => 30       // segundos (default: 30)
  'headers'    => []       // array de headers: ['Authorization: Bearer token']
  'ssl_verify' => false    // verificar SSL (default: false)
  'auto_json'  => true     // decodificar respuesta JSON automáticamente

EJEMPLOS:
  $res = ogHttp::get('https://api.example.com/users');
  $res = ogHttp::post('https://api.example.com/users', ['name' => 'Juan'], [
    'headers' => ['Content-Type: application/json', 'Authorization: Bearer token']
  ]);
  if ($res['success']) { $data = $res['data']; }

NOTAS:
  - URLs normalizadas automáticamente via ogUrl::normalizeUrl()
  - Si Content-Type es application/json y $data es array → json_encode automático
  - Errores cURL se loguean via ogLog con module 'http'
```

### `framework/helpers/ogUrl.php`

```
FILE: framework/helpers/ogUrl.php
ROLE: Helper de manipulación de URLs. Normalización, construcción y validación.

MÉTODOS:
  ogUrl::normalizeUrl($url)
    → elimina slashes duplicados y trailing slash
    → preserva el protocolo (https://, http://)
    → usado internamente por ogHttp antes de cada request
    → ogUrl::normalizeUrl('https://api.com//users/') → 'https://api.com/users'

  ogUrl::addQueryParams($url, $params)
    → agrega array de parámetros como query string
    → detecta si ya hay '?' para usar '&'
    → ogUrl::addQueryParams('https://api.com/users', ['page' => 1]) → 'https://api.com/users?page=1'

  ogUrl::isValid($url)
    → valida URL via FILTER_VALIDATE_URL
    → retorna bool

  ogUrl::getDomain($url)
    → extrae el dominio de una URL
    → ogUrl::getDomain('https://api.example.com/users') → 'api.example.com'

  ogUrl::join(...$segments)
    → une segmentos de URL eliminando slashes duplicados
    → ogUrl::join('https://api.com', 'users', '42') → 'https://api.com/users/42'
```

### `framework/helpers/ogDate.php`

```
FILE: framework/helpers/ogDate.php
ROLE: Helper de fechas. Rangos predefinidos, formateo, diferencias y utilidades
      para MySQL.

RANGOS PREDEFINIDOS (getDateRange):
  'today'          → hoy 00:00:00 - 23:59:59
  'yesterday'      → ayer 00:00:00 - 23:59:59
  'yesterday_today'→ ayer - hoy
  'last_3_days'    → 3 días atrás SIN incluir hoy
  'last_7_days'    → 7 días atrás SIN incluir hoy
  'last_15_days'   → 15 días atrás SIN incluir hoy
  'last_30_days'   → 30 días atrás SIN incluir hoy
  'this_week'      → lunes de esta semana - hoy
  'this_month'     → primer día - último día del mes actual
  'last_month'     → primer día - último día del mes anterior

MÉTODOS:
  ogDate::getDateRange('last_7_days')        → ['start' => '...', 'end' => '...']
  ogDate::diffDays('2025-01-01')             → días desde esa fecha hasta hoy
  ogDate::addDays('2025-01-01', 7)           → '2025-01-08'
  ogDate::subDays('2025-01-01', 7)           → '2024-12-25'
  ogDate::isToday('2025-01-01')              → bool
  ogDate::isYesterday('2025-01-01')          → bool
  ogDate::toMysql()                          → '2025-01-01 15:30:00'
  ogDate::toMysqlDate()                      → '2025-01-01'
  ogDate::timestamp('2025-01-01')            → unix timestamp
  ogDate::formatEs('2025-01-01')             → '01/01/2025'
```

### `framework/helpers/ogCountry.php`

```
FILE: framework/helpers/ogCountry.php
ROLE: Helper de países. Datos estáticos de países (nombre, región, moneda,
      timezone, offset) con utilidades de conversión horaria.

COBERTURA:
  América del Sur, América Central y Caribe, América del Norte,
  Europa Occidental y del Este. Indexado por código ISO 3166-1 alpha-2.

MÉTODOS:
  ogCountry::get('EC')
    → ['name'=>'Ecuador', 'region'=>'america', 'currency'=>'USD',
       'timezone'=>'America/Guayaquil', 'offset'=>'UTC-5']

  ogCountry::all()
    → array completo de países

  ogCountry::exists('EC')
    → bool

  ogCountry::now('EC')
    → '2025-01-01 15:30:45'  (hora actual en timezone del país)

  ogCountry::now('EC', 'H:i')
    → '15:30'

  ogCountry::convert('2025-01-01 10:00:00', 'EC', 'ES')
    → '2025-01-01 16:00:00'  (convierte entre timezones de dos países)

NOTAS:
  - Códigos en mayúsculas (get/exists normalizan automáticamente)
  - Retorna null si el código no existe o hay error de timezone
```

### `framework/helpers/ogLogic.php`

```
FILE: framework/helpers/ogLogic.php
ROLE: Motor de lógica basado en JSON (JsonLogic). Evalúa reglas de negocio
      definidas como estructuras JSON contra datos en runtime.
      Útil para reglas dinámicas en ads, scoring, validaciones condicionales.

MÉTODOS PRINCIPALES:
  OgLogic::apply($logic, $data)
    → evalúa lógica y retorna el resultado directo

  OgLogic::evaluate($logic, $data)
    → igual que apply pero retorna detalles de evaluación
    → ['result' => bool, 'details' => [...], 'matched_rules' => [...]]
    → útil para saber QUÉ condiciones se cumplieron

  OgLogic::addOp($name, $callable)
    → registra operador personalizado
    → OgLogic::addOp('between', fn($a,$min,$max) => $a >= $min && $a <= $max)

  OgLogic::usesData($logic)
    → retorna array de variables que usa la lógica

OPERADORES DISPONIBLES:
  Comparación:  ==, ===, !=, !==, >, >=, <, <=
  Lógicos:      and, or, if, ?:, !, !!
  Arrays:       in, merge, filter, map, reduce, all, some, none
  Variables:    var, missing, missing_some
  Matemáticos:  +, -, *, /, %, max, min
  String:       cat, substr

EJEMPLO:
  $logic = ['or' => [
    ['and' => [
      ['<=', [['var' => 'cost_per_result'], 18]],
      ['>=', [['var' => 'results'], 1]]
    ]],
    ['>=', [['var' => 'roas'], 2.5]]
  ]];
  $data = ['cost_per_result' => 0.31, 'results' => 4, 'roas' => 4.88];

  OgLogic::apply($logic, $data);     → true
  OgLogic::evaluate($logic, $data);  → ['result'=>true, 'matched_rules'=>[...]]

NOTAS:
  - var con dot notation: ['var' => 'user.role'] accede a $data['user']['role']
  - Operadores if/and/or usan evaluación lazy (no evalúan lo innecesario)
  - evaluate() detalla qué rama del OR/AND cumplió (útil para auditoría de ads)
```

### `framework/helpers/ogValidation.php`

```
FILE: framework/helpers/ogValidation.php
ROLE: Helper de validación y sanitización de datos de entrada.

VALIDACIÓN:
  ogValidation::email($email)           → bool, valida formato email
  ogValidation::phone($phone)           → bool, acepta +, -, espacios, ()
  ogValidation::url($url)               → bool, valida formato URL
  ogValidation::numeric($val)           → bool, equivale a is_numeric()
  ogValidation::range($val, $min, $max) → bool, verifica rango numérico

CAMPOS REQUERIDOS:
  ogValidation::required($data, ['name', 'email'])
    → ['valid' => bool, 'errors' => [...]]
    → valida que los campos existan y no estén vacíos
    → usado internamente por ogController en create()

SANITIZACIÓN:
  ogValidation::sanitizeText($text)
    → strip_tags + htmlspecialchars + trim (UTF-8)
    → usar antes de guardar texto libre en DB

  ogValidation::sanitizeEmail($email)
    → FILTER_SANITIZE_EMAIL + trim
    → elimina caracteres no válidos en emails

NOTAS:
  - required() es el método más usado, llamado desde ogController::create()
  - Para validaciones únicas en DB ver trait ogValidatesUnique
```

---

## Middleware & Traits

### `framework/middleware/ogAuthMiddleware.php`

```
FILE: framework/middleware/ogAuthMiddleware.php
ROLE: Valida sesión activa via Bearer token en cada request protegida.

FLUJO:
  1. Extrae Bearer token del header Authorization
  2. Busca archivo de sesión en storage/sessions/ por los primeros 16 chars del token
  3. Verifica que no esté expirada
  4. Inyecta user_id y user en $GLOBALS y ogCache::memory
  5. Limpieza oportunista de sesiones expiradas (máx 10 archivos por request)

SESIONES:
  Formato de archivo: {expires}_{userId}_{token16}.json
  $GLOBALS['auth_user_id'] y $GLOBALS['auth_user'] quedan disponibles globalmente
  ogCache::memoryGet('auth_user_id') disponible en el resto del ciclo

ERRORES:
  401 → token ausente, inválido o expirado
  500 → versión de PHP insuficiente (solo OG_IS_DEV, verifica 1 vez por sesión)
```

### `framework/middleware/ogJsonMiddleware.php`

```
FILE: framework/middleware/ogJsonMiddleware.php
ROLE: Valida que el request tenga Content-Type: application/json y body JSON válido.
      Retorna 400 si el Content-Type es incorrecto o el JSON está malformado.
```

### `framework/middleware/ogThrottleMiddleware.php`

```
FILE: framework/middleware/ogThrottleMiddleware.php
ROLE: Rate limiting por IP y ruta. Limita el número de requests en una ventana
      de tiempo. Persiste contadores en storage/middleware/throttle_data.json.

USO EN RUTAS:
  ->middleware(['throttle:60,1'])   → max 60 requests por minuto
  ->middleware(['throttle:10,5'])   → max 10 requests cada 5 minutos

HEADERS DE RESPUESTA:
  X-RateLimit-Limit     → máximo permitido
  X-RateLimit-Remaining → requests restantes
  X-RateLimit-Reset     → timestamp de reset (si fue bloqueado)
  Retry-After           → segundos para reintentar (si fue bloqueado)

ERRORES:
  429 → límite excedido (loguea IP, path y contadores via ogLog::warning)

NOTAS:
  - Key única por MD5(ip + path)
  - Limpieza automática de entradas con más de 1 hora al guardar
```

### `framework/middleware/ogDevMiddleware.php`

```
FILE: framework/middleware/ogDevMiddleware.php
ROLE: Restringe el acceso a rutas solo para entorno local (localhost).
      Retorna 403 si la request no viene de localhost.
```

### `framework/traits/ogValidatesUnique.php`

```
FILE: framework/traits/ogValidatesUnique.php
ROLE: Trait de validación de unicidad en DB. Usado por ogController y
      controllers personalizados que extiendan validaciones de campos únicos.

MÉTODOS:
  validateUnique($table, $field, $value, $errorKey)
    → valida que $value no exista en $table.$field (para create)
    → ogResponse::error() HTTP 400 si ya existe

  validateUniqueExcept($table, $field, $value, $excludeId, $errorKey)
    → igual pero excluye el registro actual por id (para update)

  validateEmail($email, $table, $excludeId)
    → valida formato email via ogValidation
    → si se pasa $table también valida unicidad
    → si se pasa $excludeId usa validateUniqueExcept (para update)

USO EN CONTROLLER:
  class UserController extends ogController {
    function create() {
      $data = ogRequest::data();
      $this->validateEmail($data['email'], 'users');
      $this->validateUnique('users', 'phone', $data['phone']);
    }
    function update($id) {
      $data = ogRequest::data();
      $this->validateEmail($data['email'], 'users', $id);
    }
  }
```

---

## Módulo Auth & Users (No aplica para WordPress)

### `middle/resources/handlers/AuthHandler.php`

```
FILE: middle/resources/handlers/AuthHandler.php
ROLE: Núcleo del módulo de autenticación. Maneja login, logout, perfil
      y gestión de sesiones via archivos JSON usando ogCache.

CAPA: middle/ — solo para sistemas standalone. En WordPress esta capa
      no se carga ya que el login lo maneja el propio WordPress.

ARCHIVOS DEL MÓDULO:
  middle/resources/handlers/AuthHandler.php   → lógica de auth y sesiones
  middle/resources/controllers/UserController → CRUD de usuarios (extiende ogController)
  middle/resources/handlers/UserHandler.php   → acciones extra de usuario (updateConfig)
  middle/resources/schemas/user.json          → schema CRUD del recurso user
  middle/routes/auth.php                      → rutas /api/auth/*
  middle/routes/user.php                      → rutas extra /api/user/*
  middle/routes/sessions.php                  → rutas /api/sessions/*

FLUJO DE LOGIN:
  1. POST /api/auth/login → AuthHandler::login()
  2. Valida credenciales contra tabla users (user o email + bcrypt)
  3. Genera token de 64 chars via ogUtils::token()
  4. Guarda sesión en storage/sessions/{expires}_{userId}_{token16}.json
  5. Retorna token + datos del usuario (sin password)

FLUJO DE REQUEST AUTENTICADA:
  1. ogAuthMiddleware extrae Bearer token del header Authorization
  2. Busca archivo de sesión por primeros 16 chars del token
  3. Verifica expiración
  4. Inyecta $GLOBALS['auth_user_id'] y ogCache::memory('auth_user_id')

SESIONES (via ogCache config 'session'):
  Archivo: {expires}_{userId}_{token16}.json
  Ejemplo: 1767200468_3_3f1101d2254c65f5.json
  TTL: OG_SESSION_TTL (default: 1 día)
  Limpieza: ogApp()->helper('cache')::cleanup('session')
           o DELETE /api/sessions/cleanup

ENDPOINTS AUTH:
  POST /api/auth/login    → login [json, throttle:10,1]
  POST /api/auth/logout   → logout [auth]
  GET  /api/auth/profile  → perfil usuario autenticado [auth]
  GET  /api/auth/me       → alias de profile [auth]

ENDPOINTS SESIONES:
  GET    /api/sessions              → listar sesiones activas y expiradas [auth]
  GET    /api/sessions/stats        → estadísticas de sesiones [auth]
  GET    /api/sessions/user/{id}    → sesiones de un usuario [auth]
  DELETE /api/sessions/cleanup      → limpiar sesiones expiradas [auth]
  DELETE /api/sessions/user/{id}    → invalidar sesiones de un usuario

ENDPOINTS USER (CRUD automático via user.json):
  GET    /api/user         → listar usuarios [auth, throttle:100,1]
  GET    /api/user/{id}    → ver usuario [auth]
  POST   /api/user         → crear usuario [json, throttle:100,1]
  PUT    /api/user/{id}    → actualizar usuario [auth, json]
  DELETE /api/user/{id}    → eliminar usuario [auth]
  PUT    /api/user/{id}/config → actualizar config [auth, json]
```

> ⚠️ `backend/middle/resources/handlers/UserHandler.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/resources/controllers/UserController.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/helpers/ogLogReader.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/routes/auth.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/routes/user.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/routes/sessions.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/middle/routes/cleanup.php` — sin bloque `@doc-start`/`@doc-end`

---

## Rutas del Framework

### `framework/routes/system.php`

```
FILE: framework/routes/system.php
ROLE: Rutas internas de administración y diagnóstico del sistema.

ENDPOINTS:
  GET  /api/system/health          → estado del sistema (status + timestamp)
  GET  /api/system/info            → PHP version, entorno, storage, sesiones activas [auth]
  GET  /api/system/routes          → lista todos los endpoints registrados
    ?method=GET                    → filtrar por método HTTP
    ?source=middle                 → filtrar por origen
    ?grouped=true                  → agrupar por recurso
  GET  /api/system/tables          → estructura de tablas de la DB
    ?names=users,products          → filtrar tablas específicas
    ?format=mini|json|html         → formato de respuesta (default: mini/text)
  GET  /api/system/cache/stats     → estadísticas de archivos en storage/cache
  GET  /api/system/logs-test       → genera un log de prueba (debug)
  DELETE /api/system/cache/cleanup → elimina cache y sesiones expiradas
```

### `framework/routes/logs.php`

```
FILE: framework/routes/logs.php
ROLE: Endpoints de consulta y filtrado de logs del sistema.
      Lógica de lectura delegada a helper logReader.
      En producción todos los endpoints requieren middleware 'auth'.

ENDPOINTS:
  GET /api/logs/today              → logs de hoy (default: 100)
  GET /api/logs/latest             → últimos N logs (default: 50)
  GET /api/logs/{year}/{month}     → logs de un mes completo
  GET /api/logs/{year}/{month}/{day} → logs de una fecha específica
  GET /api/logs/search             → búsqueda con rango de fechas
    ?from=2025-12-01&to=2025-12-10 → rango (default: últimos 7 días)
  GET /api/logs/stats              → estadísticas de logs de hoy

FILTROS DISPONIBLES (todos los endpoints):
  ?level=ERROR                     → DEBUG, INFO, WARNING, ERROR
  ?module=integrations/whatsapp    → módulo específico
  ?tags=whatsapp,error             → tags separados por coma
  ?search=login                    → busca en mensaje y contexto
  ?user_id=5                       → filtrar por usuario
  ?limit=100                       → límite de resultados
  ?number=593987654321             → custom var: número de teléfono
  ?bot_id=10                       → custom var: ID de bot
  ?client_id=3                     → custom var: ID de cliente
  ?[custom_var]=valor              → cualquier custom var registrada en el log

EJEMPLOS COMBINADOS:
  GET /api/logs/today?module=integrations/whatsapp&number=593987654321&tags=error
  GET /api/logs/search?bot_id=10&level=ERROR&from=2025-12-01&to=2025-12-08
  GET /api/logs/2025/12/08?tags=whatsapp,telegram&level=WARNING
  GET /api/logs/today?user_id=5&level=INFO
```

### `framework/routes/sessions.php`

```
FILE: framework/routes/sessions.php
ROLE: Endpoints de gestión de sesiones.

ENDPOINTS:
  DELETE /api/sessions/user/{user_id} → invalida todas las sesiones de un usuario

NOTAS:
  - Puede ejecutarse desde CRON para limpieza programada
  - Delega la lógica a UserController::invalidateSessions()
```

### `framework/routes/country.php`

```
FILE: framework/routes/country.php
ROLE: Endpoints de consulta de países usando ogCountry.

ENDPOINTS:
  GET  /api/country/all            → todos los países
    ?region=america|europa         → filtrar por región
    ?codes=EC,CO,PE                → filtrar por códigos ISO
    ?sort=name|currency            → ordenar por campo (default: name)
    ?order=asc|desc                → dirección (default: asc)
  GET  /api/country/{code}         → datos de un país por código ISO
    ?time=1                        → incluir hora actual del país
  POST /api/country/convert        → convertir fecha entre timezones de dos países
    { "datetime": "2025-01-12 10:00:00", "from": "EC", "to": "ES" }
    → requiere middleware 'json'
```

---

## Resumen

- **Documentados:** 37
- **Sin documentación:** 18

### Archivos sin bloque @doc-start

- `backend/../funcs.php`
- `backend/app/config/init.php`
- `backend/app/config/execute.php`
- `backend/app/config/database.php`
- `backend/app/config/tables.php`
- `backend/app/config/consts.php`
- `backend/framework/helpers/ogDb/ogDbBuilder.php`
- `backend/framework/helpers/ogDb/ogDbWhere.php`
- `backend/framework/helpers/ogDb/ogDbQuery.php`
- `backend/framework/helpers/ogDb/ogDbExecute.php`
- `backend/framework/helpers/ogDb/ogRawExpr.php`
- `backend/middle/resources/handlers/UserHandler.php`
- `backend/middle/resources/controllers/UserController.php`
- `backend/middle/helpers/ogLogReader.php`
- `backend/middle/routes/auth.php`
- `backend/middle/routes/user.php`
- `backend/middle/routes/sessions.php`
- `backend/middle/routes/cleanup.php`