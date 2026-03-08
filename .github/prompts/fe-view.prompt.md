# Frontend — View System

> layout, sidebar, viewLoader, viewRender, viewComponents, view.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/core/layout.js`

```
FILE: framework/js/core/layout.js
CLASS: ogLayout
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Genera la estructura HTML base de la aplicación e inyecta dentro del
  contenedor raíz (#app). Crea el esqueleto DOM que sidebar, view y auth
  necesitan antes de poder operar. Se llama una sola vez desde bootApp().

MODOS:
  'app'   → estructura completa: header + sidebar + main#content + footer
            usada en la aplicación principal autenticada
  'auth'  → estructura mínima: solo div#content sin sidebar ni header
            usada por ogAuth para mostrar el login

ESTRUCTURA HTML GENERADA (modo app):
  .og-layout.sidebar-compact2
    header.og-header#header
    .og-sidebar-overlay#sidebar-overlay
    aside.og-sidebar#sidebar          ← ogSidebar escribe aquí
    main.og-content#content           ← ogView escribe aquí
      footer.og-footer

RESPONSIVE:
  initResponsive() activa el toggle del sidebar en pantallas ≤1024px.
  El botón #menu-toggle aparece solo en mobile.

USO:
  ogLayout.init('app', containerElement);   // desde bootApp()
  ogLayout.init('auth', containerElement);  // desde ogAuth cuando no autenticado

REGISTRO:
  window.ogLayout
  ogFramework.core.layout
```

### `framework/js/core/sidebar.js`

```
FILE: framework/js/core/sidebar.js
CLASS: ogSidebar
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Menú lateral dinámico. Lee los ítems de ogHook.getMenuItems(), los filtra
  por rol del usuario autenticado, los renderiza en #sidebar y enlaza los
  eventos de navegación. Al hacer click en un ítem llama ogView.loadView().

FLUJO INIT:
  init() → loadMenu() → hook.getMenuItems() → filterMenusByRole()
         → removeDuplicateMenus() → renderMenu() → bindMenuEvents()
         → ogTrigger.execute('sidebar')

MENÚ BASE (siempre presente):
  { id: 'dashboard', title: 'Dashboard', view: 'middle:dashboard/dashboard' }
  Se agrega antes de los ítems de extensiones.

NAVEGACIÓN AL HACER CLICK:
  Ítem sin hijos → view.loadView(menuData.view, null, extensionName, menuResources, null, menuId)
  Ítem con hijos → toggleSubmenu() (acordeón)
  Al navegar pasa menuResources (scripts/styles del ítem) para que la vista los cargue.

DETECCIÓN DE EXTENSIÓN:
  detectPluginFromMenuId(menuId) → busca en pluginRegistry la extensión cuyo nombre
  es prefijo del menuId (ej: menuId='admin-usuarios' → extensión='admin')

PRECARGA:
  preloadSiblingViews() → si un ítem hermano tiene preloadViews:true, fetchea su JSON
  en background y lo guarda en ogCache para navegación instantánea.

INYECCIÓN DE CONTENIDO:
  ogSidebar.inject('header', '<img src="logo.png">')  → zona superior
  ogSidebar.inject('footer', '<p>v1.0</p>')           → zona inferior
  Zonas válidas: 'header', 'footer', 'content'

FILTRO POR ROL:
  hasRoleAccess(menuItem) → compara menuItem.role con ogAuth.user.role
  Admin siempre ve todo. Si role es null el ítem es público.

REGISTRO:
  window.ogSidebar
  ogFramework.core.sidebar
```

### `framework/js/core/viewLoader.js`

```
FILE: framework/js/core/viewLoader.js
CLASS: ogViewLoader
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Resolución de rutas, fetch de JSONs de vista, resolución de json_parts,
  combinación de recursos y filtrado de tabs por permisos.
  Sub-módulo de ogView — no se usa directamente desde extensiones.

RESOLUCIÓN DE RUTAS (resolveViewPath):
  Prioridad:
  1. viewContext === 'middle'      → middle/views/{viewName}.json
  2. extensionContext explícito    → extensions/{ext}/views/{viewName}.json
  3. viewName empieza 'core:'      → framework/js/views/{viewName}.json
  4. viewName tiene '/' y primera parte es extensión conocida
                                  → extensions/{ext}/views/{resto}.json
  5. fallback                     → framework/js/views/{viewName}.json

JSON PARTS:
  resolveJsonParts() recorre recursivamente el viewData antes de renderizar
  y reemplaza items { type:'json_part', src:'parts/mi-parte' } con el
  contenido del JSON externo. Soporta notación 'extension|path'.

FALLBACK:
  findViewInExtensions() busca la vista en todas las extensiones activas
  cuando el fetch inicial falla y no hay container destino.

RECURSOS:
  combineResources(viewData, menuResources) → fusiona scripts/styles del
  menú con los de la vista (deduplicados con Set).
  normalizeResourcePaths() → convierte rutas relativas a rutas completas
  usando extensionsPath del config.

PERMISOS DE TABS:
  filterTabsByPermissions(tabs, ext, menuId) → filtra tabs visibles según
  ogAuth.userPermissions.extensions[ext].menus[menuId].tabs
  Admin siempre ve todas las tabs.

REGISTRO:
  window.ogViewLoader
  ogFramework.core.viewLoader
```

### `framework/js/core/viewRender.js`

```
FILE: framework/js/core/viewRender.js
CLASS: ogViewRender
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Generación de HTML y escritura en DOM. Convierte viewData (JSON) en HTML
  y lo inyecta en #content (navegación normal) o en un container arbitrario
  (modales, widgets). También gestiona los hooks de posición before/after.
  Sub-módulo de ogView — no se usa directamente desde extensiones.

RENDERIZADO PRINCIPAL:
  renderView(viewData, ext)             → escribe en #content (navegación normal)
  renderViewInContainer(viewData, el)   → escribe en container arbitrario (modal/widget)
  generateViewHTML(viewData, hooks, ext) → genera el string HTML completo

ESTRUCTURA HTML GENERADA:
  .og-view-container[data-view][data-extension-context?]
    [hooks.before]
    .og-view-header          (si viewData.header)
    .og-view-tabs-container  (si viewData.tabs)  ← ogTabs escribe aquí
    .og-view-content         (si viewData.content)
    .og-view-statusbar       (si viewData.statusbar)
    [hooks.after]

TIPOS DE ITEM EN content[]:
  html       → string HTML con soporte {i18n:key}
  component  → <div class="dynamic-component" data-component data-config>
  form       → <div class="dynamic-form" data-form-json>
  section    → contenedor con título, descripción e inner content[]
  code       → <pre><code class="language-{lang}">

I18N EN STRINGS:
  processI18nInString(str) reemplaza {i18n:key} y {i18n:key|param:val}
  en cualquier string HTML antes de insertarlo en el DOM.

HOOKS DE POSICIÓN:
  processHooksForHTML() ejecuta hook_viewId y separa los resultados por
  context (view:before, view:after, tab, content) para inyectarlos
  en el HTML generado o mergearlos en tabs/content del viewData.

REGISTRO:
  window.ogViewRender
  ogFramework.core.viewRender
```

### `framework/js/core/viewComponents.js`

```
FILE: framework/js/core/viewComponents.js
CLASS: ogViewComponents
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Carga y ejecuta los recursos JS/CSS de una vista, registra hook-components
  en el DOM y orquesta el post-render de tabs y componentes.

FLUJO POST-RENDER (setupView):
  1. renderHookComponents()    → monta componentes .hook-component en el DOM
  2a. ogTabs.render()          → si viewData.tabs (vista con pestañas)
  2b. renderContent()          → si viewData.content (vista de contenido)

CARGA DE RECURSOS (loadAndInitResources):
  1. loadViewResources()    → ogLoader.loadResources(scripts, styles) normalizados
  2. ogTabs.executePendingCallbacks()  → callbacks de tabs que esperaban scripts
  3. initViewComponents()  → llama .init() en clases JS cargadas via scripts[]

SCRIPTS BAJO DEMANDA — CONVENCIÓN:
  Si la vista declara scripts[], el sistema carga el archivo y llama .init()
  automáticamente. El script debe:
    1. Tener un método estático init()
    2. Exportarse a window con el mismo nombre que el archivo (sin extensión)

  Ejemplo — chart.js:
    class ejemploChart {
      static init() {
        // Se llama automáticamente al cargar la vista
        this.createChart('chart1', {...});
      }
    }
    window.ejemploChart = ejemploChart;   // ← obligatorio

DETECCIÓN DE CLASE JS:
  extractComponentName(scriptPath) intenta window[fileName],
  window['ejemplo'+FileName], window[FileName] para encontrar la clase.

REGISTRO:
  ogFramework.core.viewComponents (interno, no expuesto en window)
```

### `framework/js/core/view.js`

```
FILE: framework/js/core/view.js
CLASS: ogView
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Fachada principal del sistema de vistas. Orquesta la carga completa de
  una vista JSON: resolución de ruta → fetch → cache → render → componentes.
  Es el único punto de entrada para cargar vistas desde extensiones, sidebar,
  modales o código de extensión.

FIRMA PRINCIPAL:
  ogView.loadView(viewName, container?, extensionContext?, menuResources?,
                  afterRender?, menuId?, viewContext?)

NOTACIONES DE viewName:
  'admin|sections/panel'         → extensión explícita
  'middle:dashboard/dashboard'   → contexto middle
  'core:user/user-list'          → vistas del framework
  'sections/panel'               → auto-detecta extensión por primera parte

VISTA JSON (estructura top-level):
  {
    "id":          "mi-vista",
    "title":       "Mi Vista",
    "description": "texto descriptivo (opcional, no se renderiza)",
    "type":        "tabs" | "content" | "html",
    "scripts":     ["extensions/ejemplos/assets/js/chart.js"],  // bajo demanda
    "tabs":        [ ... ],    // si type: tabs
    "content":     [ ... ]     // si type: content | html
  }

TIPOS DE ITEM EN content[]:
  { "type": "html",      "content": "<p>...</p>",    "order": 10 }
  { "type": "form",      "form_json": "ext/form-id", "order": 20 }
  { "type": "component", "component": "widget",      "order": 30, "config": {...} }
  { "type": "json_part", "src": "ext|parts/nombre" }
  order → los items se ordenan por este valor antes de renderizar

FLUJO COMPLETO:
  1. Parsear notación | y :
  2. Verificar cache de navegación (viewNavigationCache) si !container
  3. ogViewLoader.resolveViewPath() → basePath + cacheKey
  4. ogCache.get(cacheKey) o ogViewLoader.fetchView()
  5. ogViewLoader.resolveJsonParts()
  6. ogViewLoader.filterTabsByPermissions()
  7. ogViewLoader.combineResources()
  8. ogViewRender.renderView() o renderViewInContainer()
  9. ogViewComponents.loadAndInitResources()
  10. ogViewComponents.setupView()
  11. afterRender(viewId, contentEl) callback opcional
  12. Guardar en viewNavigationCache si !container y cache.viewNavigation

CACHE DE NAVEGACIÓN:
  viewNavigationCache guarda el HTML ya renderizado de vistas de navegación
  (sin container). Al volver a una vista cacheada se restaura el HTML y se
  re-inicializan tabs/componentes sin hacer fetch.
  Activado con config.cache.viewNavigation = true.

USO TÍPICO:
  ogView.loadView('admin|sections/panel');                 // navegación
  ogView.loadView('admin|forms/user-form', modalEl);      // dentro de modal
  ogView.loadView('middle:dashboard/dashboard');           // vista del middle

REGISTRO:
  window.ogView
  ogFramework.core.view
```
