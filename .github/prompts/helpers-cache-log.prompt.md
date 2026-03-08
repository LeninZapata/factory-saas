# Helpers — Parte 2: Cache, Log, Response, Request, Lang

> Helpers pre-cargados en el boot. Ver también: helpers.prompt.md (ogDb) y helpers-utils.prompt.md.
> Generado: 2026-03-08 14:28:20

---

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
