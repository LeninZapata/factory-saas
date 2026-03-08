class ogHookRegistry {
  static hooks                  = new Map();
  static pluginRegistry         = new Map();
  static pluginRegistryOriginal = new Map();

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // REGISTRO
  // ─────────────────────────────────────────────────────────────────

  static register(extensionName, config) {
    if (!extensionName || !config) {
      ogLogger?.error('core:hookRegistry', 'register() requiere extensionName y config');
      return;
    }

    ogLogger?.info('core:hookRegistry', `📝 Registrando extension: ${extensionName}`);

    const normalizedConfig = {
      name:         extensionName,
      enabled:      config.enabled !== false,
      hasMenu:      config.hasMenu      || false,
      hasViews:     config.hasViews     || false,
      hasLanguages: config.hasLanguages || false,
      backend:      config.backend      || { enabled: false },
      description:  config.description  || '',
      version:      config.version      || '1.0.0',
      ...config
    };

    // Procesar menú si existe
    if (normalizedConfig.hasMenu && normalizedConfig.menu) {
      const extensionScripts = this.normalizeResources(config.scripts || []);
      const extensionStyles  = this.normalizeResources(config.styles  || []);

      normalizedConfig.menu = {
        title: config.menu.title || extensionName,
        icon:  config.menu.icon  || '📦',
        order: config.menu.order ?? 100,
        role:  config.menu.role  || null,
        items: config.menu.items
          ? ogHook.processMenuItems(config.menu.items, extensionName, extensionScripts, extensionStyles)
          : [],
        view: config.menu.view || null
      };
    }

    this.pluginRegistry.set(extensionName, normalizedConfig);
    this.pluginRegistryOriginal.set(extensionName, { ...normalizedConfig });

    ogLogger?.success('core:hookRegistry', `✅ Extension "${extensionName}" registrado con ${normalizedConfig.menu?.items?.length || 0} menús`);

    return normalizedConfig;
  }

  // ─────────────────────────────────────────────────────────────────
  // CONSULTAS
  // ─────────────────────────────────────────────────────────────────

  static getPluginConfig(extensionName) {
    return this.pluginRegistry.get(extensionName);
  }

  static isExtensionEnabled(extensionName) {
    const config = this.pluginRegistry.get(extensionName);
    return config ? config.enabled === true : false;
  }

  static getEnabledExtensions() {
    const enabled = [];
    for (const [name, config] of this.pluginRegistry) {
      if (config.enabled === true) enabled.push({ name, ...config });
    }
    return enabled;
  }

  static getAllExtensionsForPermissions() {
    const extensions = [];
    for (const [name, config] of this.pluginRegistryOriginal) {
      extensions.push({
        name,
        hasMenu:     config.hasMenu     || false,
        hasViews:    config.hasViews    || false,
        menu:        config.menu        || null,
        description: config.description || ''
      });
    }
    return extensions;
  }

  // ─────────────────────────────────────────────────────────────────
  // NORMALIZACIÓN DE RUTAS
  // ─────────────────────────────────────────────────────────────────

  static normalizeResourcePath(path) {
    if (!path) return path;
    if (path.startsWith('extensions/')) return path;
    return `extensions/${path}`;
  }

  static normalizeResources(resources = []) {
    return resources.map(path => this.normalizeResourcePath(path));
  }
}

window.ogHookRegistry = ogHookRegistry;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.hookRegistry = ogHookRegistry;
}
/**
 * @doc-start
 * FILE: framework/js/core/hookRegistry.js
 * CLASS: ogHookRegistry
 * TYPE: core-hook
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Estado y registro de extensiones. Almacena la configuración normalizada
 *   de cada extensión en dos Maps: pluginRegistry (activo, filtrable por
 *   permisos) y pluginRegistryOriginal (sin filtrar, para el sistema de permisos).
 *   Sub-módulo de ogHook — accedido via ogHook como proxy transparente.
 *
 * ESTADO:
 *   pluginRegistry         → Map<name, config> con extensiones activas
 *   pluginRegistryOriginal → Map<name, config> copia sin modificar (para permisos)
 *
 * REGISTRO (register):
 *   Normaliza la config, procesa el menú llamando a ogHook.processMenuItems()
 *   y guarda en ambos Maps. Retorna la config normalizada.
 *
 * CONFIG NORMALIZADA:
 *   { name, enabled, hasMenu, hasViews, hasLanguages, hasHooks,
 *     backend: { enabled }, description, version, menu?, scripts?, styles? }
 *
 * CONSULTAS:
 *   getPluginConfig(name)          → config completa de una extensión
 *   isExtensionEnabled(name)       → bool
 *   getEnabledExtensions()         → array de extensiones con enabled:true
 *   getAllExtensionsForPermissions() → array simplificado para el panel de permisos
 *
 * NORMALIZACIÓN DE RUTAS:
 *   normalizeResourcePath(path)  → agrega 'extensions/' si no tiene prefijo
 *   normalizeResources(paths[])  → aplica normalizeResourcePath a cada item
 *
 * NOTA:
 *   ogHook expone pluginRegistry y pluginRegistryOriginal como getters/setters
 *   que delegan aquí — sidebar.js y auth.js acceden via ogHook.pluginRegistry
 *   sin saber que vive en este archivo.
 *
 * REGISTRO:
 *   window.ogHookRegistry
 *   ogFramework.core.hookRegistry
 * @doc-end
 */