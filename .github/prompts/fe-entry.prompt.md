# Frontend — Entry Point & Arranque

> index.html, appConfig, modos standalone vs multi-instancia (WordPress), secuencia de arranque.
> Generado: 2026-03-08 14:28:20

---

## MODOS DE ARRANQUE: STANDALONE vs MULTI-INSTANCIA

El framework soporta dos modos de uso. La diferencia está en cuántas veces
se llama a `ogFramework.register()` y desde dónde.

```
MODO               Cuándo usarlo                         Instancias
─────────────────  ────────────────────────────────────  ──────────
standalone         App SPA única (backoffice, admin)     1
multi-instancia    WordPress — cada plugin es una app    N (una por plugin)
```

### MODO STANDALONE — 1 instancia, 1 index.html

```
public/
└── admin/
    ├── index.html          ← único entry point
    └── framework/
        └── og-framework.js
```

`index.html` llama una sola vez a `ogFramework.register('mi-slug', appConfig)`.
El framework carga todos los scripts del core, inicializa auth, layout,
sidebar y navega a `defaultView`. No hay más instancias.

```html
<!-- index.html — Standalone -->
<script>
  var appConfig = {
    slug: 'backsystem',
    ...
  };

  (function() {
    const script = document.createElement('script');
    script.src = 'framework/og-framework.js?v=' + appConfig.version;
    script.onload = async function() {
      await ogFramework.register('backsystem', appConfig);
    };
    document.head.appendChild(script);
  })();
</script>
```

### MODO MULTI-INSTANCIA — N instancias, N index.html (WordPress)

Cada plugin de WordPress tiene su propio `index.html` con su propio `slug`
y su propio `appConfig`. Todos comparten el mismo `og-framework.js` del
servidor, pero cada instancia vive en su contenedor independiente.

```
wordpress-plugin-crm/
└── admin/
    ├── index.html          ← entry point del plugin CRM
    └── framework/ → (symlink o copia de og-framework.js)

wordpress-plugin-billing/
└── admin/
    ├── index.html          ← entry point del plugin Billing
    └── framework/ → (mismo og-framework.js)
```

```js
// Plugin CRM
await ogFramework.register('crm', { slug: 'crm', defaultView: '...', ... });

// Plugin Billing (mismo ogFramework, distinto slug)
await ogFramework.register('billing', { slug: 'billing', defaultView: '...', ... });
```

`ogFramework` detecta si ya está inicializado y no se re-ejecuta:
```js
if (window.ogFramework && window.ogFramework._initialized) { return; }
```

Los scripts del core se cargan **una sola vez** (la primera instancia los
evalúa; las siguientes reutilizan los módulos ya en memoria). Cada instancia
tiene su propio `activeConfig` que se activa con `setActiveContext(slug)`.

---

## ESTRUCTURA DE index.html

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema</title>
  <link rel="stylesheet" href="framework/css/main.css" />
</head>
<body class="onlygrow-active">
<div id="app"></div>   <!-- contenedor raíz — debe coincidir con config.container -->

<script>
  // 1. Detección dev/prod
  // 2. Normalización de rutas (pathname)
  // 3. Declaración de appConfig
  // 4. Carga de og-framework.js y llamada a register()
</script>
</body>
</html>
```

**`class="onlygrow-active"`** en `<body>` — requerido para activar el CSS del framework.
**`<div id="app">`** — el contenedor donde el framework inyecta el layout. El selector
debe coincidir con `config.container` (default: `'#app'`).

---

## DETECCIÓN DEV VS PRODUCCIÓN (ogIsDev)

```js
var ogIsDev = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|.*\.local|192\.168\.|10\.)/.test(window.location.hostname)
           || ['3000', '5173', '8080'].includes(window.location.port);
```

Se usa para:
- `version`: en dev usa `dev-{timestamp}` (cache busting agresivo), en prod usa el número fijo
- `environment`: `'development'` | `'production'`
- `cache.views` y `cache.forms`: `false` en dev, `true` en prod

---

## NORMALIZACIÓN DE RUTAS (pathname)

Necesaria cuando el admin vive en una subcarpeta (ej: `/mi-proyecto/admin/`).

```js
var pathname = window.location.pathname;
var isAdmin  = pathname.includes('/admin');

// Quitar index.html si está en la URL
if (pathname.endsWith('/index.html')) {
  pathname = pathname.replace('/index.html', '/');
}

// Garantizar que /admin/ tenga slash final
if (isAdmin && !pathname.endsWith('/admin/')) {
  pathname = pathname.split('/admin')[0] + '/admin/';
}

if (!pathname.endsWith('/')) { pathname += '/'; }
```

Esto garantiza que `baseUrl`, `frameworkUrl` y `extensionsPath` sean correctos
independientemente de si el usuario accede via `/admin`, `/admin/`, o `/admin/index.html`.

---

## appConfig — REFERENCIA COMPLETA

```js
var appConfig = {

  // ── Identidad ─────────────────────────────────────────────
  slug:        'backsystem',   // único por instancia — usado en ogFramework.instances[slug]
  version:     ogIsDev ? `dev-${Date.now()}` : '0.4.43',
  environment: ogIsDev ? 'development' : 'production',
  isDevelopment: ogIsDev,

  // ── Rutas ─────────────────────────────────────────────────
  baseUrl:        pathname,                        // /admin/ o /mi-plugin/admin/
  frameworkUrl:   pathname + 'framework/',         // donde viven los scripts del core
  publicUrl:      window.location.origin + pathname,
  frameworkPath:  'framework',                     // path relativo (usado en manifest fetch)
  extensionsPath: pathname + 'app/extensions/',    // donde viven las extensiones
  apiBaseUrl:     pathname.replace(/\/admin\/?$/, '/'), // base para llamadas al backend

  // ── DOM ───────────────────────────────────────────────────
  container:   '#app',                             // selector del contenedor raíz
  defaultView: 'middle:dashboard/dashboard',       // vista que se carga tras el login

  // ── i18n ──────────────────────────────────────────────────
  i18n: {
    enabled:        true,
    defaultLang:    'es',
    availableLangs: ['es', 'en']
  },

  // ── Auth ──────────────────────────────────────────────────
  auth: {
    enabled:               true,
    loginView:             'auth/login',
    redirectAfterLogin:    'dashboard/dashboard',
    sessionCheckInterval:  1 * 60 * 1000,          // ms — ping periódico al servidor
    api: {
      login:  '/api/auth/login',
      logout: '/api/auth/logout',
      me:     '/api/auth/profile'
    }
  },

  // ── Rutas de vistas ───────────────────────────────────────
  routes: {
    coreViews:      'framework/js/views',
    extensionViews: 'extensions/{extensionName}/views'
  },

  // ── Cache ─────────────────────────────────────────────────
  cache: {
    views: !ogIsDev,   // false en dev (siempre recarga), true en prod
    forms: !ogIsDev
  }

};
```

---

## CONVENCIÓN DE VISTAS EN defaultView

```js
defaultView: 'middle:dashboard/dashboard'
//            ──────┬──── ──────────┬────
//                  │               └── ruta relativa dentro de /middle/views/
//                  └── prefijo 'middle:' = buscar en /admin/middle/views/
```

| Prefijo | Dónde busca el archivo |
|---------|------------------------|
| *(ninguno)* | `admin/app/extensions/{ext}/views/` |
| `middle:` | `admin/middle/views/` |

Ejemplos:
```js
defaultView: 'middle:dashboard/dashboard'  // → admin/middle/views/dashboard/dashboard.json
defaultView: 'admin:sections/home'         // → admin/app/extensions/admin/views/sections/home.json
```

---

## SECUENCIA DE ARRANQUE COMPLETA

```
index.html se carga en el browser
│
├── 1. og-framework.js se carga via <script src>
│       ogFramework se declara en window, _initialized = false
│
├── 2. ogFramework.register(slug, appConfig)
│       → normalizeConfig(appConfig)
│       → configs[slug] = normalizedConfig
│
├── 3. loadFrameworkScripts()
│       → fetch framework-manifest.json
│       → fetch+eval todos los scripts de core[] en orden
│       → fetch+eval todos los scripts de components[] en orden
│       → (si auth.enabled) loadAuthMiddle() — carga middle/js/*.js + middle/css/auth.css
│
├── 4. initInstance(slug, config)
│       → (si i18n.enabled) i18n.init()
│       → (si auth.enabled) auth.init()
│           ├── NO autenticado → renderiza loginView, STOP
│           └── Autenticado → sigue a bootApp()
│
└── 5. bootApp(slug, config, container)
        → layout.init('#app', container)
        → hook.loadPluginHooks()         ← carga extensiones registradas
        → auth.filterExtensionsByPermissions()
        → sidebar.init()
        → view.loadView(defaultView)     ← renderiza la primera vista
```

---

## CARGA DE SCRIPTS — framework-manifest.json

`og-framework.js` no bundlea nada. Lee `framework-manifest.json` y hace
fetch + eval de cada archivo en el orden exacto declarado.

```json
{
  "core":       ["js/core/logger.js", "js/core/trigger.js", ...],
  "components": ["js/components/toast.js", "js/components/modal.js", ...],
  "middle":     ["middle/js/authLoginForm.js", ..., "middle/js/auth.js"]
}
```

- `core`: módulos internos — se cargan primero, en orden estricto por dependencias
- `components`: componentes UI — se cargan después del core
- `middle`: condicional — solo si `auth.enabled = true`

Los scripts de `core` y `components` usan paths relativos a `frameworkUrl`.
Los scripts de `middle` usan paths relativos a `baseUrl`.

**Para agregar un archivo nuevo:** incluirlo en la sección correcta del manifiesto,
respetando el orden de dependencia. El framework lo cargará automáticamente.

---

## MULTI-INSTANCIA — DETALLE TÉCNICO

```js
// ogFramework guarda todas las instancias:
ogFramework.configs['crm']     → config normalizada del plugin CRM
ogFramework.configs['billing'] → config normalizada del plugin Billing
ogFramework.activeConfig       → la instancia activa en ese momento

// Cambiar instancia activa:
ogFramework.setActiveContext('billing')
// → activeConfig = configs['billing']
// → window.appConfig = configs['billing']  (compatibilidad)
// → ogCache.resetPrefix()                  (aísla el cache por instancia)
```

Los módulos del core (ogModule, ogComponent) son compartidos entre instancias.
El aislamiento entre instancias se logra via `activeConfig` y el prefijo de cache.

---

## NOTAS PARA EL DESARROLLADOR

```
✅ body.onlygrow-active   — obligatorio para que el CSS del framework active
✅ <div id="app">         — debe existir ANTES de que og-framework.js se ejecute
✅ slug único por app      — si dos instancias tienen el mismo slug, la segunda sobreescribe
✅ version en dev          — usar dev-{Date.now()} para forzar recarga de scripts en dev
✅ apiBaseUrl              — debe apuntar a la raíz del backend, no a /admin/
✅ auth.enabled: false     — para apps sin login (dashboards públicos, kioscos)
⚠️ No usar import/export  — el framework usa eval() para cargar scripts, no ES modules
⚠️ frameworkUrl con /     — siempre debe terminar en '/' (lo normaliza normalizeConfig)
```