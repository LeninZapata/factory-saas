# Backend – Copilot Instructions

## Stack
PHP 8+, framework propio (NO Laravel/Symfony/cualquier otro).
Plugin WordPress o standalone. Raíz del backend: `backend/`

## Arquitectura 3 capas (prioridad: app > middle > framework)
Cada capa tiene la misma estructura interna:
- `resources/controllers/` → XxxController.php
- `resources/handlers/`    → XxxHandler.php
- `resources/schemas/`     → xxx.json (CRUD automático)
- `routes/`                → xxx.php (rutas manuales)
- `helpers/`               → helpers locales
- `services/`              → integraciones externas

`app/` sobreescribe `middle/` y `framework/`. Un archivo puede moverse entre capas sin modificación.

## Acceso global
```php
ogApp()                              // singleton principal
ogApp()->helper('str')               // carga ogStr (bajo demanda)
ogApp()->helper('cache')             // carga ogCache
ogApp()->service('ai')               // carga AiService
ogApp()->controller('user')          // carga UserController
ogApp()->handler('auth')             // carga AuthHandler
ogApp()->handler('folder/client')    // con subcarpeta
ogApp()->getPath('storage')          // /backend/app/storage
ogApp()->getPath('storage/json/x')   // subpath dinámico
ogApp()->db()                         // acceso a ogDb::table()
ogResource('user')                   // CRUD interno (no HTTP)
```

## Helpers pre-cargados vs bajo demanda
| Helper       | Pre-Cargado | Cómo Usar                        |
|--------------|-------------|----------------------------------|
| ogResponse   | YES         | `ogResponse::success()`          |
| ogRequest    | YES         | `ogRequest::data()`              |
| ogLog        | YES         | `ogLog::error()`                 |
| ogDb         | YES         | `ogDb::table()` / `ogDb::t()`    |
| ogLang       | YES         | `__('key')`                      |
| ogCache      | YES         | `ogCache::memorySet/Get()`       |
| ogValidation | NO          | `ogApp()->helper('validation')`  |
| ogFile       | NO          | `ogApp()->helper('file')`        |
| ogHttp       | NO          | `ogApp()->helper('http')`        |
| ogStr        | NO          | `ogApp()->helper('str')`         |
| ogUtils      | NO          | `ogApp()->helper('utils')`       |
| ogUrl        | NO          | `ogApp()->helper('url')`         |
| ogDate       | NO          | `ogApp()->helper('date')`        |
| ogCountry    | NO          | `ogApp()->helper('country')`     |
| ogLogic      | NO          | `ogApp()->helper('logic')`       |

## Convenciones estrictas para el backend/framework
- Controllers: `NombreController.php`, extienden `ogController`
- Handlers: `NombreHandler.php` para lógica de negocio compleja
- Helpers: prefijo `og` (ogDb, ogCache, ogStr, ogLog, ogResponse...)
- Rutas manuales: `routes/nombre.php`
- CRUD automático: `resources/schemas/nombre.json`
- Respuestas: SIEMPRE `ogResponse::success()` / `ogResponse::error()`
- DB: Usa `ogDb::table()` o `ogDb::t()`, evita queries raw directas (solo si el query es muy complejo o no encaja en el builder)
- Paths: SIEMPRE `ogApp()->getPath()`, nunca hardcodear rutas absolutas
- NO instanciar helpers directamente, usar `ogApp()->helper('nombre')` para los No pre-cargados.

## Estilo de código
- **ogLog**: inline si tiene ≤3 parámetros, multilínea si tiene ≥4 elementos en contexto o meta
- **ogDb**: inline si tiene ≤2 where, multilínea si tiene ≥3 where
- **return arrays**: inline si tiene ≤3 keys, multilínea si tiene ≥4 keys:
  ```php
  return ['success' => true, 'id' => $id, 'affected' => $n];  // inline (3 keys)
  return [                                                        // multilínea (4+ keys)
    'success'  => true,
    'id'       => $id,
    'affected' => $n,
    'message'  => 'ok',
  ];
  ```

## Middleware disponibles
`auth` | `json` | `throttle:N,M` | `dev`

## Entorno
```php
ogIsDev()        // bool — desarrollo
ogIsLocalhost()  // bool — localhost
ogIsProduction() // bool — producción
OG_IS_DEV        // constante equivalente
```

## Contexto adicional — cargar con #file: cuando lo necesites
| Archivo | Cuándo usarlo |
|---------|---------------|
| `.github/prompts/bootstrap.prompt.md`      | arranque, flujo wp.php→bootstrap→api, app/config |
| `.github/prompts/core.prompt.md`           | ogRouter, ogApi, ogApplication, ogController, ogResource |
| `.github/prompts/helpers.prompt.md`        | ogDb completo (query builder, traits) |
| `.github/prompts/helpers-cache-log.prompt.md` | ogCache, ogLog, ogResponse, ogRequest, ogLang |
| `.github/prompts/helpers-utils.prompt.md`  | ogStr, ogUtils, ogFile, ogHttp, ogUrl, ogDate, ogCountry, ogLogic, ogValidation |
| `.github/prompts/middleware.prompt.md`     | middleware auth/json/throttle/dev, ogValidatesUnique |
| `.github/prompts/auth.prompt.md`           | login, sesiones, UserController, endpoints /api/auth/* |
| `.github/prompts/routes.prompt.md`         | endpoints system, logs, sessions, country |
| `docs.md`                                  | documentación completa de todo el backend |