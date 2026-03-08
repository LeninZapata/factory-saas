# Frontend — Framework & Core Utils

> og-framework.js, logger, trigger, event, loader, style, validator.
> Generado: 2026-03-08 14:28:20

---

### `framework/og-framework.js`

```
FILE: framework/og-framework.js
TYPE: bootstrap
PROMPT: fe-framework

ROLE:
  Punto de entrada del framework. Se carga directamente desde index.html via <script src>.
  Gestiona múltiples instancias del framework (multi-slug), carga todos los scripts del
  core y componentes desde framework-manifest.json, y orquesta el arranque completo de
  la aplicación (layout → hooks → sidebar → defaultView).

PATTERN:
  IIFE autoejecutada — envuelve todo para no contaminar el scope global.
  ogFramework es el único objeto global que expone. El resto se accede via ogModule() y ogComponent().

BOOT SEQUENCE (orden garantizado):
  1. index.html carga og-framework.js via <script src>
  2. ogFramework.register(slug, appConfig) — llamado desde index.html
  3. loadFrameworkScripts() — fetch framework-manifest.json → fetch+eval todos los scripts
  4. loadAuthMiddle() — si auth.enabled: carga middle/js/auth.js + middle/css/auth.css
  5. initInstance() — i18n.init → auth.init → bootApp()
  6. bootApp() — layout.init → hook.loadPluginHooks → sidebar.init → view.loadView(defaultView)

MULTI-INSTANCE:
  Cada instancia tiene un slug único. ogFramework.configs[slug] guarda su config normalizada.
  ogFramework.activeConfig apunta a la instancia actualmente activa.
  setActiveContext(slug) cambia la instancia activa y resetea el prefijo del cache.

GLOBALS EXPUESTOS:
  ogModule(name)      → busca en ogFramework.core[name], fallback a window['og'+Name]
  ogComponent(name)   → busca en ogFramework.core.components[name], fallback a window['og'+Name]
  window.ogFramework  → objeto principal del framework
  window.appConfig    → alias de activeConfig (compatibilidad)

MÉTODOS PRINCIPALES:
  ogFramework.register(slug, config)   → registra config, arranca carga de scripts
  ogFramework.initInstance(slug, cfg)  → inicializa una instancia (i18n, auth, bootApp)
  ogFramework.bootApp(slug, cfg, el)   → layout → hooks → sidebar → defaultView
  ogFramework.setActiveContext(slug)   → cambia instancia activa
  ogFramework.getInstance(slug)        → retorna instancia por slug
  ogFramework.getConfig(slug)          → retorna config normalizada por slug

CONFIG (appConfig desde index.html):
  slug, version, environment, isDevelopment
  baseUrl, frameworkUrl, publicUrl, frameworkPath, extensionsPath, apiBaseUrl
  container          → selector CSS del contenedor raíz (ej: '#app')
  defaultView        → vista inicial (ej: 'middle:dashboard/dashboard')
  i18n               → { enabled, defaultLang, availableLangs }
  auth               → { enabled, loginView, redirectAfterLogin, sessionCheckInterval, api:{login,logout,me} }
  routes             → { coreViews, extensionViews }
  cache              → { views, forms }

RELATED:
  framework-manifest.json — lista de scripts a cargar (core + components)
  middle/js/auth.js       — cargado condicionalmente si auth.enabled
```

### `framework/js/core/logger.js`

```
FILE: framework/js/core/logger.js
CLASS: ogLogger
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Sistema de logging con niveles de severidad y prefijo de módulo.
  En producción suprime los mensajes debug automáticamente.
  Todos los módulos del framework lo usan como: ogLogger?.info('core:módulo', 'mensaje', dato)

NIVELES:
  debug   → solo visible en isDevelopment=true o forceDebug=true
  info    → azul  — información de flujo normal
  warn    → naranja — situación inesperada pero no crítica
  success → verde  — operación completada correctamente
  error   → rojo   — fallo que requiere atención
  log     → gris   — diagnóstico genérico

USO:
  ogLogger.info('core:view', 'Vista cargada', viewName);
  ogLogger.error('core:api', 'Error HTTP', error);
  ogLogger.setLevel('debug');   // activa debug temporalmente

PREFIJO DE MÓDULO:
  Convención: 'core:nombreArchivo' para módulos del framework
              'com:nombreComponente' para componentes UI
  El prefijo aparece en consola como [core:view] [info]

REGISTRO:
  window.ogLogger — global directo (disponible antes que ogModule)
  ogFramework.core.logger
```

### `framework/js/core/trigger.js`

```
FILE: framework/js/core/trigger.js
CLASS: ogTrigger
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Sistema de triggers nombrados por target. Permite registrar callbacks
  asociados a un identificador string y ejecutarlos todos en bloque.
  Útil para extensiones que quieren reaccionar a eventos del framework
  sin acoplarse directamente.

USO:
  ogTrigger.register('after:view:load', 'admin', 'onViewLoad');
  // → cuando se ejecute el target 'after:view:load', llama admin.onViewLoad(target)

  ogTrigger.execute('after:view:load');
  ogTrigger.list('after:view');   // debug — lista triggers del target

MÉTODOS:
  register(target, className, methodName)  → registra un trigger
  execute(targetFilter)                    → ejecuta todos los triggers que empiecen con targetFilter
  reset()                                  → limpia el registry (útil en testing)
  list(targetFilter?)                      → retorna array de strings descriptivos

REGISTRO:
  window.ogTrigger
  ogFramework.core.trigger
```

### `framework/js/core/event.js`

```
FILE: framework/js/core/event.js
CLASS: ogEvents
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Event delegation con IDs para cleanup. Envuelve addEventListener con
  soporte de delegación — el handler se dispara tanto si el target es
  el elemento exacto como si es un descendiente que hace matches(selector).

USO:
  const id = ogEvents.on('.btn-save', 'click', (e) => save(), formContainer);
  ogEvents.off(id);    // elimina el listener por ID
  ogEvents.clear();    // elimina todos

MÉTODOS:
  on(selector, eventType, handler, context?)  → retorna ID numérico del listener
  off(id)                                     → elimina listener por ID
  clear()                                     → elimina todos los listeners

NOTA:
  El context por defecto es document. Pasar el contenedor del formulario
  o vista limita el scope del evento y evita colisiones.

REGISTRO:
  window.ogEvents
  ogFramework.core.events
```

### `framework/js/core/loader.js`

```
FILE: framework/js/core/loader.js
CLASS: ogLoader
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Carga dinámica de scripts, estilos y JSON con deduplicación automática.
  Mantiene un Set interno de URLs ya cargadas para no insertar duplicados.
  Normaliza todas las rutas relativas contra baseUrl del config activo.

MÉTODOS PRINCIPALES:
  loadScript(url, opts?)          → inserta <script> en head, retorna Promise<bool>
  loadStyle(url, opts?)           → inserta <link rel=stylesheet>, retorna Promise<bool>
  loadResources(scripts, styles)  → carga arrays en paralelo con Promise.all
  loadJson(url, opts?)            → fetch + JSON.parse, retorna Promise<data|null>
  normalizeUrl(url)               → resuelve rutas relativas contra baseUrl

OPCIONES:
  optional: true  → si el recurso falla, resuelve false en vez de rechazar
  silent: true    → suprime logs de error (usado en tryLoadPluginLang)

DEDUPLICACIÓN:
  Guarda URLs normalizadas en static loaded = new Set().
  Si la URL ya está cargada, retorna true inmediatamente sin reinsertar.

USO:
  await ogLoader.loadScript('extensions/admin/assets/js/admin.js');
  await ogLoader.loadResources(['ext.js'], ['ext.css']);
  const data = await ogLoader.loadJson('extensions/admin/mock/users.json', { optional: true });

REGISTRO:
  window.ogLoader
  ogFramework.core.loader
```

### `framework/js/core/style.js`

```
FILE: framework/js/core/style.js
CLASS: ogStyle
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Sistema de design tokens. Convierte objetos de estilo con tokens abstractos
  a CSS inline (web) o a objetos StyleSheet (React Native futuro).
  Los tokens se definen una vez y se resuelven automáticamente por propiedad.

TOKENS DISPONIBLES:
  colors        → primary, secondary, success, danger, warning, info, text-primary...
  spacing       → none, xs(4px), sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px)
  fontSize      → xs(12px), sm(14px), md(16px), lg(18px), xl(20px), 2xl(24px)
  fontWeight    → light, normal, medium, semibold, bold
  borderRadius  → none, sm(4px), md(8px), lg(12px), xl(16px), full(9999px)
  shadow        → none, sm, md, lg, xl

USO:
  ogStyle.resolve({ color: 'primary', padding: 'md' })
  // → 'color: #007bff; padding: 16px'

  ogStyle.toInlineStyle({ backgroundColor: 'danger', borderRadius: 'sm' })
  // → 'background-color: #dc3545; border-radius: 4px'

  ogStyle.toReactNative({ fontSize: 'lg', fontWeight: 'bold' })
  // → { fontSize: 18, fontWeight: '700' }

REGISTRO:
  window.ogStyle
  ogFramework.core.style
```

### `framework/js/core/validator.js`

```
FILE: framework/js/core/validator.js
CLASS: ogValidator
TYPE: core-util
PROMPT: fe-framework

ROLE:
  Validación de schemas JSON de vistas y formularios. Verifica campos
  requeridos y tipos de datos antes de renderizar. Usado internamente
  por formCore y viewLoader para detectar JSONs mal formados.

SCHEMAS REGISTRADOS:
  view  → required: [id, title] | optional: [layout, scripts, styles, content, tabs, statusbar]
  form  → required: [id, fields] | optional: [title, description, toolbar, statusbar]

USO:
  const result = ogValidator.validate('view', viewData, 'sections/admin-panel.json');
  if (!result.valid) console.error(result.message);
  // result → { valid: bool, errors?: string[], message?: string }

EXTENSIBILIDAD:
  ogValidator.schemas.miTipo = { required: [...], optional: [...], types: {...} }

REGISTRO:
  window.ogValidator
  ogFramework.core.validator
```
