class ogHook {
  static loadedHooks = new Set();
  static menuItems   = [];

  // Proxies de estado — sidebar.js y auth.js acceden a estas propiedades
  // directamente en ogHook. Las redirigimos al registry sin romper nada.
  static get pluginRegistry()            { return ogHookRegistry.pluginRegistry; }
  static get pluginRegistryOriginal()    { return ogHookRegistry.pluginRegistryOriginal; }
  static set pluginRegistry(val)         { ogHookRegistry.pluginRegistry = val; }
  static set pluginRegistryOriginal(val) { ogHookRegistry.pluginRegistryOriginal = val; }

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // DELEGACIÓN AL REGISTRY Y LOADER (API pública unificada)
  // ─────────────────────────────────────────────────────────────────

  static register(extensionName, config)    { return ogHookRegistry.register(extensionName, config); }
  static getPluginConfig(extensionName)     { return ogHookRegistry.getPluginConfig(extensionName); }
  static isExtensionEnabled(extensionName)  { return ogHookRegistry.isExtensionEnabled(extensionName); }
  static getEnabledExtensions()             { return ogHookRegistry.getEnabledExtensions(); }
  static getAllExtensionsForPermissions()   { return ogHookRegistry.getAllExtensionsForPermissions(); }
  static normalizeResourcePath(path)        { return ogHookRegistry.normalizeResourcePath(path); }
  static normalizeResources(resources)      { return ogHookRegistry.normalizeResources(resources); }

  static async loadPluginHooks()                          { return ogHookLoader.loadPluginHooks(); }
  static async loadPlugin(extensionName)                  { return ogHookLoader.loadPlugin(extensionName); }
  static async loadPluginLanguages(extensionName)         { return ogHookLoader.loadPluginLanguages(extensionName); }
  static async tryLoadPluginLang(extensionName, lang)     { return ogHookLoader.tryLoadPluginLang(extensionName, lang); }
  static async loadPluginResources(scripts, styles)       { return ogHookLoader.loadPluginResources(scripts, styles); }

  // ─────────────────────────────────────────────────────────────────
  // EJECUCIÓN DE HOOKS
  // ─────────────────────────────────────────────────────────────────

  static execute(hookName, defaultData = []) {
    let baseName  = hookName;
    let hasPrefix = false;

    if (hookName.startsWith('hook_')) {
      baseName  = hookName.replace('hook_', '');
      hasPrefix = true;
    }

    const normalizedName = this.normalizeHookName(baseName);
    const finalHookName  = hasPrefix ? `hook_${normalizedName}` : normalizedName;

    let results = [...defaultData];

    for (const extensionName of this.loadedHooks) {
      if (!ogHookRegistry.isExtensionEnabled(extensionName)) {
        ogLogger?.debug('core:hook', `⏭️ Saltando hooks de "${extensionName}" (deshabilitado)`);
        continue;
      }

      const hookClass = window[`${extensionName}Hooks`];

      if (hookClass && typeof hookClass[finalHookName] === 'function') {
        try {
          const hookResult = hookClass[finalHookName]();

          if (Array.isArray(hookResult)) {
            results = [
              ...results,
              ...hookResult.map(item => ({ order: item.order ?? 999, ...item }))
            ];
            ogLogger?.info('core:hook', `✅ Hook ejecutado: ${extensionName}.${finalHookName}() — ${hookResult.length} items`);
          } else {
            ogLogger?.warn('core:hook', `${extensionName}.${finalHookName}() no retornó un array`);
          }
        } catch (error) {
          ogLogger?.error('core:hook', `Error ejecutando ${extensionName}.${finalHookName}():`, error);
        }
      }
    }

    results.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return results;
  }

  static normalizeHookName(viewId) {
    return viewId.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  }

  // ─────────────────────────────────────────────────────────────────
  // GESTIÓN DE MENÚS
  // ─────────────────────────────────────────────────────────────────

  static getMenuItems() {
    const menuItems = [];

    for (const [extensionName, pluginConfig] of ogHookRegistry.pluginRegistry) {
      if (pluginConfig.enabled !== true) continue;

      if (pluginConfig.hasMenu && pluginConfig.menu) {
        const menuItem = {
          id:    pluginConfig.name || extensionName,
          title: pluginConfig.menu.title,
          icon:  pluginConfig.menu.icon,
          order: pluginConfig.menu.order ?? 100
        };

        if (pluginConfig.menu.role) menuItem.role = pluginConfig.menu.role;

        if (pluginConfig.menu.items?.length > 0) {
          menuItem.items = this.resolveMenuDelegates(pluginConfig.menu.items);
        } else if (pluginConfig.menu.view) {
          menuItem.view = pluginConfig.menu.view;
          if (pluginConfig.scripts) menuItem.scripts = pluginConfig.scripts;
          if (pluginConfig.styles)  menuItem.styles  = pluginConfig.styles;
        }

        menuItems.push(menuItem);
      }
    }

    menuItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    return menuItems;
  }

  static processMenuItems(items, parentPlugin = '', extensionScripts = [], extensionStyles = []) {
    return items
      .map(item => {
        // Item delegado — se resuelve en getMenuItems()
        if (item.delegate) {
          return {
            id:       item.id,
            title:    item.title,
            icon:     item.icon  || '',
            order:    item.order ?? 999,
            delegate: item.delegate
          };
        }

        const processedItem = {
          id:    item.id,
          title: item.title,
          order: item.order ?? 999
        };

        if (item.role) processedItem.role = item.role;
        if (item.icon) processedItem.icon = item.icon;

        const combinedScripts = [...extensionScripts, ...ogHookRegistry.normalizeResources(item.scripts || [])];
        const combinedStyles  = [...extensionStyles,  ...ogHookRegistry.normalizeResources(item.styles  || [])];
        if (combinedScripts.length > 0) processedItem.scripts = combinedScripts;
        if (combinedStyles.length  > 0) processedItem.styles  = combinedStyles;

        if (item.preloadViews !== undefined) processedItem.preloadViews = item.preloadViews;

        if (item.items?.length > 0) {
          processedItem.items = this.processMenuItems(item.items, parentPlugin, extensionScripts, extensionStyles);
        } else if (item.view) {
          processedItem.view = item.view;
        }

        return processedItem;
      })
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  static resolveMenuDelegates(items) {
    const resolved = [];

    for (const item of items) {
      if (item.delegate) {
        const delegateConfig = ogHookRegistry.pluginRegistry.get(item.delegate);
        if (delegateConfig?.menu?.items?.length > 0) {
          resolved.push({
            id:    item.id,
            title: item.title,
            icon:  item.icon,
            order: item.order ?? 999,
            items: this.resolveMenuDelegates(delegateConfig.menu.items)
          });
        } else {
          ogLogger?.warn('core:hook', `⚠️ delegate "${item.delegate}" no encontrado o sin items`);
        }
      } else if (item.items?.length > 0) {
        resolved.push({ ...item, items: this.resolveMenuDelegates(item.items) });
      } else {
        resolved.push(item);
      }
    }

    return resolved;
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER DE RESULTADOS DE HOOKS
  // ─────────────────────────────────────────────────────────────────

  static async renderHookResult(hookResult, container) {
    if (!hookResult || !container) return;

    if (hookResult.type === 'html') {
      const wrapper       = document.createElement('div');
      wrapper.id          = hookResult.id;
      wrapper.innerHTML   = hookResult.content;
      container.appendChild(wrapper);
    }
    else if (hookResult.type === 'component') {
      const wrapper = document.createElement('div');
      wrapper.id    = hookResult.id;
      container.appendChild(wrapper);

      const componentName = hookResult.component;

      if (window[componentName] && typeof window[componentName].render === 'function') {
        try {
          await window[componentName].render(hookResult.config, wrapper);
        } catch (error) {
          ogLogger?.error('core:hook', `Error renderizando componente "${componentName}":`, error);
          wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">${__('core.hook.error.loading_component', { component: componentName })}</div>`;
        }
      } else {
        ogLogger?.error('core:hook', `Componente "${componentName}" no encontrado`);
        wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">${__('core.hook.error.component_not_available', { component: componentName })}</div>`;
      }
    }
  }

  static async renderHooks(hookName, containerId, defaultData = []) {
    const container = document.getElementById(containerId);
    if (!container) {
      ogLogger?.error('core:hook', `Container "${containerId}" no encontrado`);
      return;
    }

    const results = this.execute(hookName, defaultData);
    for (const result of results) {
      await this.renderHookResult(result, container);
    }
  }
}

window.ogHook = ogHook;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.hook = ogHook;
}
/**
 * @doc-start
 * FILE: framework/js/core/hook.js
 * CLASS: ogHook
 * TYPE: core-hook
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Fachada del sistema de extensiones. Centraliza registro, carga, menús
 *   y ejecución de hooks. Es el único punto de acceso desde extensiones y
 *   otros módulos del framework — hookRegistry y hookLoader son internos.
 *
 * ESTADO PROPIO:
 *   loadedHooks  → Set<name> de extensiones con hooks.js cargado y ejecutable
 *   menuItems    → array (uso interno del sidebar)
 *
 * PROXIES DE ESTADO (transparentes para sidebar.js y auth.js):
 *   ogHook.pluginRegistry         → ogHookRegistry.pluginRegistry
 *   ogHook.pluginRegistryOriginal → ogHookRegistry.pluginRegistryOriginal
 *
 * EJECUCIÓN DE HOOKS (execute):
 *   Por cada extensión en loadedHooks (si enabled):
 *     busca window['{ext}Hooks'] y llama al método hook_{viewId}()
 *     El resultado debe ser un array de items con { id, type, order, ... }
 *   Los resultados se ordenan por order y se retornan como array unificado.
 *
 *   Normalización del nombre: 'admin-panel' → 'hook_adminPanel' (camelCase)
 *
 * MENÚS (getMenuItems):
 *   Recorre pluginRegistry, filtra enabled:true y hasMenu:true, construye
 *   el array de ítems resolviendo delegates. Ordenado por order.
 *
 * DELEGATES EN MENÚ:
 *   Un ítem con delegate:'otra-extension' hereda los items de esa extensión.
 *   resolveMenuDelegates() los resuelve recursivamente en getMenuItems().
 *
 * DELEGACIÓN COMPLETA DE API:
 *   Todos los métodos de hookRegistry y hookLoader están re-expuestos en ogHook
 *   para que el código externo solo necesite importar ogHook.
 *
 * USO DESDE EXTENSIONES:
 *   const hook = ogModule('hook');
 *   hook.isExtensionEnabled('admin')
 *   hook.getPluginConfig('admin')
 *   hook.execute('hook_dashboard')   // normalmente llamado por ogViewRender
 *
 * REGISTRO:
 *   window.ogHook
 *   ogFramework.core.hook
 * @doc-end
 */