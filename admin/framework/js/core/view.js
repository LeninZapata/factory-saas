class ogView {
  static views                = {};
  static loadedExtensions     = {};
  static viewNavigationCache  = new Map();
  static lastSessionCheck     = 0;
  static SESSION_CHECK_INTERVAL = 30000;

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // PUNTO DE ENTRADA PRINCIPAL
  // ─────────────────────────────────────────────────────────────────

  static async loadView(viewName, container = null, extensionContext = null, menuResources = null, afterRender = null, menuId = null, viewContext = null) {
    const cache  = ogModule('cache');
    const config = this.getConfig();

    ogLogger?.info('core:view', `📌 loadView: "${viewName}" | ext: "${extensionContext}" | ctx: "${viewContext}"`);

    // Notación extension|path → separar extensión y ruta
    if (viewName.includes('|')) {
      [extensionContext, viewName] = viewName.split('|');
    }

    // Notación context:path → separar contexto y ruta
    if (viewName.includes(':')) {
      [viewContext, viewName] = viewName.split(':');
    }

    const navCacheKey = `nav_${viewContext || extensionContext || 'core'}_${viewName}`;

    // Cache de navegación (HTML ya renderizado)
    if (!container && config.cache?.viewNavigation && this.viewNavigationCache.has(navCacheKey)) {
      ogLogger?.info('core:view', `✅ Cache viewNavigation: "${viewName}"`);
      const cachedData = this.viewNavigationCache.get(navCacheKey);
      const content    = document.getElementById('content');

      if (content) {
        content.innerHTML = cachedData.html;
        document.body.setAttribute('data-view', cachedData.viewId);
        document.body.className = document.body.className
          .split(' ').filter(c => !c.startsWith('layout-')).join(' ');
        if (cachedData.layout) document.body.classList.add(`layout-${cachedData.layout}`);

        await ogViewComponents.reInitializeCachedView(cachedData);

        if (typeof afterRender === 'function') {
          try { afterRender(cachedData.viewId, content); } catch (e) { ogLogger?.error('core:view', 'Error en afterRender:', e); }
        }
        return;
      }
    }

    // Resolver ruta → basePath + cacheKey
    const resolved = ogViewLoader.resolveViewPath(viewName, extensionContext, viewContext);
    viewName         = resolved.viewName;
    extensionContext = resolved.extensionContext;
    const { basePath, cacheKey } = resolved;

    try {
      // Intentar desde cache de datos
      let viewData = config?.cache?.views ? cache.get(cacheKey) : null;

      if (!viewData) {
        // Fetch del JSON
        let fetched = null;
        try {
          fetched = await ogViewLoader.fetchView(viewName, basePath);
        } catch {
          if (!container) {
            const found = await ogViewLoader.findViewInExtensions(viewName);
            if (found) {
              fetched          = found.viewData;
              extensionContext = found.extensionName;
            }
          }
        }

        if (!fetched) throw new Error(__('core.view.not_found', { view: viewName }));

        viewData = await ogViewLoader.resolveJsonParts(fetched, basePath);
        if (config?.cache?.views) cache.set(cacheKey, viewData);
      }

      // Filtrar tabs por permisos
      if (viewData.tabs && extensionContext) {
        const effectiveMenuId = menuId || viewData.id;
        viewData.tabs = ogViewLoader.filterTabsByPermissions(viewData.tabs, extensionContext, effectiveMenuId);
      }

      const combinedData = ogViewLoader.combineResources(viewData, menuResources);

      // Renderizar
      if (container) {
        ogViewRender.renderViewInContainer(combinedData, container, extensionContext);
      } else {
        ogViewRender.renderView(combinedData, extensionContext);
      }

      await ogViewComponents.loadAndInitResources(combinedData);
      await ogViewComponents.setupView(combinedData, container);

      // Callback post-render
      if (typeof afterRender === 'function') {
        const contentEl = container || document.getElementById('content');
        try { afterRender(combinedData.id, contentEl); } catch (e) { ogLogger?.error('core:view', 'Error en afterRender:', e); }
      }

      // Guardar en cache de navegación
      if (!container && config?.cache?.viewNavigation) {
        const contentEl = document.getElementById('content');
        if (contentEl) {
          this.viewNavigationCache.set(navCacheKey, {
            html:     contentEl.innerHTML,
            viewId:   combinedData.id,
            layout:   combinedData.layout,
            viewData: combinedData
          });
        }
      }

    } catch (error) {
      ogLogger?.error('core:view', `Error cargando vista "${viewName}":`, error);
      ogViewRender.renderError(viewName, container);
    }
  }
}

// Globales
window.ogView = ogView;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.view = ogView;
}
/**
@doc-start
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
@doc-end
*/