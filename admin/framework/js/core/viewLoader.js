class ogViewLoader {

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // RESOLUCIÓN DE RUTAS
  // ─────────────────────────────────────────────────────────────────

  static resolveViewPath(viewName, extensionContext, viewContext) {
    const config  = this.getConfig();
    const frameworkPath = config?.frameworkPath || 'framework';

    let basePath, cacheKey;

    if (viewContext === 'middle') {
      basePath  = 'middle/views';
      cacheKey  = `middle_view_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
    }
    else if (extensionContext) {
      const extensionsBase = config.extensionsPath || `${config.baseUrl}app/extensions/`;
      basePath  = `${extensionsBase}${extensionContext}/views`;
      cacheKey  = `extension_view_${extensionContext}_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
    }
    else if (viewName.startsWith('core:')) {
      viewName  = viewName.replace('core:', '');
      basePath  = config.routes?.coreViews || `${frameworkPath}/js/views`;
      cacheKey  = `core_view_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
    }
    else if (viewName.includes('/')) {
      const parts     = viewName.split('/');
      const firstPart = parts[0];
      const hook      = ogModule('hook');
      const isExtension = hook?.isExtensionEnabled?.(firstPart);

      if (isExtension) {
        const extensionsBase = config.extensionsPath || `${config.baseUrl}app/extensions/`;
        basePath         = `${extensionsBase}${firstPart}/views`;
        viewName         = parts.slice(1).join('/') || viewName;
        cacheKey         = `extension_view_${firstPart}_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
        extensionContext = firstPart;
      } else {
        basePath = config.routes?.coreViews || `${frameworkPath}/js/views`;
        cacheKey = `core_view_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
      }
    }
    else {
      basePath = config.routes?.coreViews || `${frameworkPath}/js/views`;
      cacheKey = `core_view_${viewName.replace(/\//g, '_')}_v${config.version || '1.0.0'}`;
    }

    return { viewName, basePath, cacheKey, extensionContext };
  }

  // ─────────────────────────────────────────────────────────────────
  // FETCH DEL JSON DE VISTA
  // ─────────────────────────────────────────────────────────────────

  static async fetchView(viewName, basePath) {
    const config      = this.getConfig();
    const cacheBuster = `?t=${config.version || '1.0.0'}`;
    const url = basePath.startsWith('/')
      ? `${basePath}/${viewName}.json${cacheBuster}`
      : `${config.baseUrl || '/'}${basePath}/${viewName}.json${cacheBuster}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${url}`);
    }
    return response.json();
  }

  // Fallback: buscar la vista en todas las extensiones activas
  static async findViewInExtensions(viewName) {
    const config     = this.getConfig();
    const extensions = Object.keys(window.hook?.extensions || {});

    for (const extensionName of extensions) {
      try {
        const url = `${config.baseUrl || '/'}extensions/${extensionName}/views/${viewName}.json?t=${config.version || '1.0.0'}`;
        const response = await fetch(url);
        if (response.ok) {
          return { viewData: await response.json(), extensionName };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // JSON PARTS
  // ─────────────────────────────────────────────────────────────────

  // Resuelve recursivamente todos los items de tipo json_part antes de renderizar
  static async resolveJsonParts(viewData, basePath) {
    const config = this.getConfig();

    const resolveItems = async (items) => {
      if (!Array.isArray(items)) return items;
      const out = [];
      for (const item of items) {
        if (item?.type === 'json_part' && item.src) {
          const partData = await this.loadJsonPart(item.src, basePath);
          if (partData) {
            const parts = Array.isArray(partData)          ? partData
                        : Array.isArray(partData.content)  ? partData.content
                        : [partData];
            out.push(...await resolveItems(parts));
          }
        } else {
          if (Array.isArray(item?.content))           item.content = await resolveItems(item.content);
          if (Array.isArray(item?.tabs)) {
            for (const tab of item.tabs) {
              if (Array.isArray(tab.content))          tab.content = await resolveItems(tab.content);
            }
          }
          if (Array.isArray(item?.config?.tabs)) {
            for (const tab of item.config.tabs) {
              if (Array.isArray(tab.content))          tab.content = await resolveItems(tab.content);
            }
          }
          out.push(item);
        }
      }
      return out;
    };

    if (Array.isArray(viewData.content)) viewData.content = await resolveItems(viewData.content);
    if (Array.isArray(viewData.tabs)) {
      for (const tab of viewData.tabs) {
        if (Array.isArray(tab.content)) tab.content = await resolveItems(tab.content);
      }
    }
    return viewData;
  }

  // Carga un archivo JSON de parte — soporta notación "extension|path" o ruta relativa al basePath
  static async loadJsonPart(src, basePath) {
    const config = this.getConfig();
    let partBasePath = basePath;
    let partPath     = src;

    if (src.includes('|')) {
      const [extName, path] = src.split('|');
      const extensionsBase  = config.extensionsPath || `${config.baseUrl}app/extensions/`;
      partBasePath = `${extensionsBase}${extName}/views`;
      partPath     = path;
    }

    try {
      const cacheBuster = `?t=${config.version || '1.0.0'}`;
      const url = (partBasePath.startsWith('/') || partBasePath.startsWith('http'))
        ? `${partBasePath}/${partPath}.json${cacheBuster}`
        : `${config.baseUrl || '/'}${partBasePath}/${partPath}.json${cacheBuster}`;

      const response = await fetch(url);
      if (!response.ok) {
        ogLogger?.warn('core:viewLoader', `json_part no encontrado: ${url}`);
        return null;
      }
      return response.json();
    } catch (e) {
      ogLogger?.error('core:viewLoader', `Error cargando json_part "${src}":`, e);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RECURSOS (scripts / styles)
  // ─────────────────────────────────────────────────────────────────

  static combineResources(viewData, menuResources) {
    if (!menuResources || (!menuResources.scripts?.length && !menuResources.styles?.length)) {
      return viewData;
    }

    const combined = { ...viewData };

    if (menuResources.scripts?.length > 0) {
      combined.scripts = [...new Set([...(viewData.scripts || []), ...menuResources.scripts])];
    }
    if (menuResources.styles?.length > 0) {
      combined.styles  = [...new Set([...(viewData.styles  || []), ...menuResources.styles])];
    }

    return combined;
  }

  static normalizeResourcePaths(resources = []) {
    const config = this.getConfig();
    return resources.map(path => {
      if (!path) return path;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (config.extensionsPath && path.startsWith(config.extensionsPath)) return path;

      const extensionsBase = config.extensionsPath || `${config.baseUrl}extensions/`;
      if (path.startsWith('extensions/')) return path.replace('extensions/', extensionsBase);
      return `${extensionsBase}${path}`;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PERMISOS DE TABS
  // ─────────────────────────────────────────────────────────────────

  static filterTabsByPermissions(tabs, extensionName, menuId) {
    // Admin siempre ve todo
    if (window.ogAuth?.user?.role === 'admin') return tabs;

    if (!window.ogAuth?.userPermissions?.extensions) {
      ogLogger?.warn('core:viewLoader', 'Usuario sin permisos — ocultando tabs');
      return [];
    }

    const extensionPerms = window.ogAuth.userPermissions.extensions[extensionName];

    if (!extensionPerms || extensionPerms.enabled === false) {
      ogLogger?.warn('core:viewLoader', `Extension ${extensionName} sin permisos`);
      return [];
    }

    if (!extensionPerms.menus || extensionPerms.menus === '*') return tabs;

    const menuPerms = extensionPerms.menus[menuId];

    if (menuPerms === true)                              return tabs;
    if (!menuPerms || typeof menuPerms !== 'object')    return [];
    if (menuPerms.enabled === false)                    return [];
    if (menuPerms.tabs === '*')                         return tabs;
    if (!menuPerms.tabs || (Array.isArray(menuPerms.tabs) && menuPerms.tabs.length === 0)) return [];

    if (typeof menuPerms.tabs === 'object' && !Array.isArray(menuPerms.tabs)) {
      return tabs.filter(tab => menuPerms.tabs[tab.id] === true);
    }

    ogLogger?.warn('core:viewLoader', `Configuración de tabs no válida para ${menuId}`);
    return [];
  }
}

window.ogViewLoader = ogViewLoader;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.viewLoader = ogViewLoader;
}
/**
 * @doc-start
 * FILE: framework/js/core/viewLoader.js
 * CLASS: ogViewLoader
 * TYPE: core-view
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Resolución de rutas, fetch de JSONs de vista, resolución de json_parts,
 *   combinación de recursos y filtrado de tabs por permisos.
 *   Sub-módulo de ogView — no se usa directamente desde extensiones.
 *
 * RESOLUCIÓN DE RUTAS (resolveViewPath):
 *   Prioridad:
 *   1. viewContext === 'middle'      → middle/views/{viewName}.json
 *   2. extensionContext explícito    → extensions/{ext}/views/{viewName}.json
 *   3. viewName empieza 'core:'      → framework/js/views/{viewName}.json
 *   4. viewName tiene '/' y primera parte es extensión conocida
 *                                   → extensions/{ext}/views/{resto}.json
 *   5. fallback                     → framework/js/views/{viewName}.json
 *
 * JSON PARTS:
 *   resolveJsonParts() recorre recursivamente el viewData antes de renderizar
 *   y reemplaza items { type:'json_part', src:'parts/mi-parte' } con el
 *   contenido del JSON externo. Soporta notación 'extension|path'.
 *
 * FALLBACK:
 *   findViewInExtensions() busca la vista en todas las extensiones activas
 *   cuando el fetch inicial falla y no hay container destino.
 *
 * RECURSOS:
 *   combineResources(viewData, menuResources) → fusiona scripts/styles del
 *   menú con los de la vista (deduplicados con Set).
 *   normalizeResourcePaths() → convierte rutas relativas a rutas completas
 *   usando extensionsPath del config.
 *
 * PERMISOS DE TABS:
 *   filterTabsByPermissions(tabs, ext, menuId) → filtra tabs visibles según
 *   ogAuth.userPermissions.extensions[ext].menus[menuId].tabs
 *   Admin siempre ve todas las tabs.
 *
 * REGISTRO:
 *   window.ogViewLoader
 *   ogFramework.core.viewLoader
 * @doc-end
 */