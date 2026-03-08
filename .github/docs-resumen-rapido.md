# Contexto Inicial — Framework OG

---

## BACKEND (PHP)

### Stack
PHP 8+, framework propio (NO Laravel/Symfony/cualquier otro).
Plugin WordPress o standalone. Raíz del backend: `backend/`

### Arquitectura 3 capas (prioridad: app > middle > framework)
Cada capa tiene la misma estructura interna:
- `resources/controllers/` → XxxController.php
- `resources/handlers/`    → XxxHandler.php
- `resources/schemas/`     → xxx.json (CRUD automático)
- `routes/`                → xxx.php (rutas manuales)
- `helpers/`               → helpers locales
- `services/`              → integraciones externas

`app/` sobreescribe `middle/` y `framework/`. Un archivo puede moverse entre capas sin modificación.

### Acceso global PHP
```php
ogApp()                              // singleton principal
ogApp()->helper('str')               // carga ogStr (bajo demanda)
ogApp()->service('ai')               // carga AiService
ogApp()->controller('user')          // carga UserController
ogApp()->handler('auth')             // carga AuthHandler
ogApp()->handler('folder/client')    // con subcarpeta
ogApp()->getPath('storage')          // /backend/app/storage
ogApp()->getPath('storage/json/x')   // subpath dinámico
ogApp()->db()                        // acceso a ogDb::table()
ogResource('user')                   // CRUD interno (no HTTP)
```

### Helpers pre-cargados vs bajo demanda
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

### Convenciones backend
- Controllers: `NombreController.php`, extienden `ogController`
- Handlers: `NombreHandler.php` para lógica de negocio compleja
- Helpers: prefijo `og` (ogDb, ogCache, ogStr, ogLog, ogResponse...)
- Rutas manuales: `routes/nombre.php`
- CRUD automático: `resources/schemas/nombre.json`
- Respuestas: SIEMPRE `ogResponse::success()` / `ogResponse::error()`
- DB: Usa `ogDb::table()` o `ogDb::t()`, evita queries raw
- Paths: SIEMPRE `ogApp()->getPath()`, nunca hardcodear rutas absolutas
- NO instanciar helpers directamente, usar `ogApp()->helper('nombre')`

### Middleware disponibles
`auth` | `json` | `throttle:N,M` | `dev`

### Entorno
```php
ogIsDev()        // bool — desarrollo
ogIsLocalhost()  // bool — localhost
ogIsProduction() // bool — producción
OG_IS_DEV        // constante equivalente
```

### Contexto backend — cargar con #file: cuando lo necesites
| Archivo | Cuándo usarlo |
|---------|---------------|
| `.github/prompts/bootstrap.prompt.md`         | arranque, flujo wp.php→bootstrap→api, app/config |
| `.github/prompts/core.prompt.md`              | ogRouter, ogApi, ogApplication, ogController, ogResource |
| `.github/prompts/helpers.prompt.md`           | ogDb completo (query builder, traits) |
| `.github/prompts/helpers-cache-log.prompt.md` | ogCache, ogLog, ogResponse, ogRequest, ogLang |
| `.github/prompts/helpers-utils.prompt.md`     | ogStr, ogUtils, ogFile, ogHttp, ogUrl, ogDate, ogCountry, ogLogic, ogValidation |
| `.github/prompts/middleware.prompt.md`        | middleware auth/json/throttle/dev, ogValidatesUnique |
| `.github/prompts/auth.prompt.md`              | login, sesiones, UserController, endpoints /api/auth/* |
| `.github/prompts/routes.prompt.md`            | endpoints system, logs, sessions, country |
| `.github/prompts/crud.prompt.md`              | playbook completo CRUD backend |

---

## FRONTEND (JS)

### Stack
JS Vanilla ES6+, framework propio (NO React/Vue/Angular).
Raíz: `admin/`

### Acceso global JS
```javascript
ogModule('view')         // ogFramework.core.view → window.ogView
ogModule('form')         // ogFramework.core.form
ogModule('hook')         // ogFramework.core.hook
ogModule('api')          // ogFramework.core.api
ogModule('cache')        // ogFramework.core.cache
ogModule('auth')         // ogFramework.core.auth
ogComponent('modal')     // ogFramework.components.modal
ogComponent('toast')     // ogFramework.components.toast
ogComponent('datatable') // ogFramework.components.datatable
__('core.key')           // alias global de ogI18n.t()
```

### Estructura de una extensión
```
app/extensions/{nombre}/
  index.json      → config: id, title, menu, scripts, styles, enabled
  views/
    sections/     → vistas principales (JSON)
    parts/        → fragmentos reutilizables (json_part)
  forms/          → formularios JSON
  hooks.js        → hooks que inyectan contenido en vistas de otras extensiones
  assets/
    js/           → scripts bajo demanda
    css/
  lang/           → traducciones {locale}.json
```

### Estructura de una vista JSON
```json
{
  "id":      "mi-vista",
  "title":   "Título",
  "type":    "tabs | content | html",
  "scripts": ["extensions/mi-ext/assets/js/chart.js"],
  "tabs":    [...],
  "content": [...]
}
```

Tipos de item en `content[]` (todos soportan `order`):
```json
{ "type": "html",      "content": "<p>...</p>",    "order": 10 }
{ "type": "form",      "form_json": "ext|form-id", "order": 20 }
{ "type": "component", "component": "widget",       "order": 30, "config": {} }
{ "type": "json_part", "src": "ext|parts/nombre"               }
```

### Notaciones de rutas frontend
```
'admin|sections/panel'        → extensions/admin/views/sections/panel.json
'middle:dashboard/dashboard'  → middle/views/dashboard/dashboard.json
'core:user/user-list'         → framework/js/views/user/user-list.json
```

### Scripts bajo demanda
Vista declara `scripts[]` → el sistema los carga y llama `.init()` automáticamente.
El script debe exportarse a `window` con el mismo nombre que el archivo (sin .js):
```javascript
class miModulo {
  static init() { /* llamado automáticamente */ }
}
window.miModulo = miModulo; // obligatorio
```

### Convenciones frontend
- Clases estáticas, sin instanciación
- Acceso SIEMPRE via `ogModule('nombre')`, nunca `window.ogXxx` directo
- Logging: `ogLogger?.info('core:módulo', 'msg', dato)`, nunca `console.log`
- API: SIEMPRE via `ogApi.get/post()`, nunca `fetch` directo
- Traducciones: `__('key')` en código JS, `'i18n:key'` en JSONs de vista/form
- Interpolación en strings HTML de JSON: `{i18n:key}` o `{i18n:key|param:valor}`

### CSS — usar clases del framework, evitar inline
```html
<div class="og-grid og-cols-3 og-gap-lg">...</div>
<div class="og-flex og-gap-md og-between">...</div>
<div class="og-mb-2 og-p-3">...</div>
<div class="alert alert-info alert-border">Mensaje</div>
<button class="btn btn-primary">Guardar</button>
```
Si no existe clase → `style=""` puntual con comentario:
`<!-- ⚠️ CSS inline: considerar agregar clase al framework -->`

### Contexto frontend — cargar con #file: cuando lo necesites
| Archivo | Cuándo usarlo |
|---------|---------------|
| `.github/prompts/fe-framework.prompt.md`      | og-framework, boot, logger, trigger, event, loader |
| `.github/prompts/fe-core-services.prompt.md`  | cache, api, i18n, action, dataLoader |
| `.github/prompts/fe-hooks.prompt.md`          | hook system completo |
| `.github/prompts/fe-view.prompt.md`           | view system completo |
| `.github/prompts/fe-form.prompt.md`           | form system completo |
| `.github/prompts/fe-conditions.prompt.md`     | conditions system |
| `.github/prompts/fe-components.prompt.md`     | modal, toast, tabs, grouper, widget |
| `.github/prompts/fe-datatable.prompt.md`      | datatable completo |
| `.github/prompts/fe-css.prompt.md`            | CSS framework: grid, flex, spacing, colores |
| `.github/prompts/fe-middle.prompt.md`         | auth system completo |
| `.github/prompts/fe-extensions.prompt.md`     | estructura de extensiones, index.json, hooks |
| `.github/prompts/fe-crud.prompt.md`           | playbook completo CRUD frontend |

---

## CREAR UN MÓDULO CRUD — RESUMEN RÁPIDO

Siempre hay un schema JSON. Los demás archivos solo si son necesarios.

```
{modulo}.json           → SIEMPRE — habilita 5 rutas CRUD automáticas
{Modulo}Controller.php  → Solo si ogController no alcanza (validaciones, defaults, joins)
{Modulo}Handler.php     → Solo si hay side-effects o lógica reutilizable entre módulos
routes/{modulo}.php     → Solo si hay endpoints fuera de list/show/create/update/delete
```

**Motor:** `ogApi` registra las 5 rutas desde el schema, busca `{Modulo}Controller` (app→middle→framework),
y si no existe usa `ogController` genérico que ya cubre el CRUD estándar completo.

**Reglas backend:**
- Controller: `extends ogController` + `parent::__construct('schema')` + solo sobreescribir lo que cambia
- Handler: sin extends, todos static, retorna arrays, nunca llama `ogResponse`
- Rutas custom: `$router->group('/api/{modulo}', ...)` — las 5 CRUD no van aquí
- Timestamps: `dc/tc` en create, `du/tu` en update (cuando `timestamps: true` en schema)

**Ver:** `.github/prompts/crud.prompt.md` para el playbook completo con ejemplos reales.

---

## CREAR UN CRUD FRONTEND — RESUMEN RÁPIDO

Un CRUD frontend vive en una **extensión** (`app/extensions/{nombre}/`).
Si ya existe una extensión relacionada, agregarlo como submenu o tab en ella.

```
index.json                      → SIEMPRE — registro, menu, flags
views/sections/{crud}-list.json → Vista principal: botones + datatable
views/forms/{crud}-form.json    → Formulario create/edit (modal)
assets/js/{Crud}.js             → Clase JS static con toda la lógica
lang/es.json                    → Textos i18n
assets/css/{crud}.css           → Solo si necesita estilos propios
views/parts/{crud}/             → Si views o forms son muy largos
```

**Reglas frontend:**
- Nombre archivo JS = nombre clase = nombre en `window` — idénticos
- `static currentId = null` — controla create vs update en `save()`
- `fillForm` usa `ogForm.fill()` — keys deben coincidir con `name` del form JSON
- `save()` → `this.currentId ? update() : create()` → `ogModal.closeAll()` + `this.refresh()`
- `window.Clase = Clase` siempre al final del archivo

**Ver:** `.github/prompts/fe-crud.prompt.md` para el playbook completo con ejemplos reales.