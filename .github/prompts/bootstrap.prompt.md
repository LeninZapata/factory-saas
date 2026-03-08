# Bootstrap & Configuración

> Flujo de arranque, entorno, configuración del framework y de la app.
> Generado: 2026-03-07 19:35:46

---

## Dos capas de configuración

El sistema tiene dos carpetas `config/` con responsabilidades distintas:

| Capa | Carpeta | Qué configura |
|------|---------|---------------|
| Framework | `framework/config/` | El SISTEMA — no se toca por proyecto |
| App | `app/config/` | LA APLICACIÓN — específico por proyecto |

### framework/config/ — configura el SISTEMA
```
environment.php  → define OG_IS_DEV (localhost = dev)
consts.php       → constantes globales (tiempos, sesión, lang, timezone)
requires.php     → carga helpers y cores críticos al boot
execute.php      → idioma por defecto + configuración de logs
init.php         → orquesta los 4 anteriores en orden estricto
```

### app/config/ — configura LA APLICACIÓN
```
database.php     → credenciales DB por entorno (localhost vs producción)
tables.php       → alias de tablas del proyecto
consts.php       → constantes del proyecto (tokens, claves externas)
execute.php      → conecta DB + tablas + error reporting
init.php         → carga framework/config/init.php + los 4 anteriores
```

**REGLA:** Si cambia por proyecto → `app/config/` | Si es del núcleo → `framework/config/`

---

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
