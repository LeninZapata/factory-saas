class hook {
  static hooks = new Map();
  static loadedHooks = new Set();
  static pluginRegistry = new Map();
  static pluginRegistryOriginal = new Map(); // ← Copia sin filtrar
  static menuItems = [];

  static async loadPluginHooks() {
    const startTime = performance.now();
    this.menuItems = [];

    try {
      const registry = await api.get('plugins/index.json');

      if (!registry?.plugins || !Array.isArray(registry.plugins)) {
        logger.warn('cor:hook', 'plugins/index.json vacío o mal formado');
        return;
      }

      const pluginLoadPromises = registry.plugins.map(async (pluginInfo) => {
        const pluginConfig = await this.loadPluginConfig(pluginInfo.name);

        if (pluginConfig?.enabled) {
          this.pluginRegistry.set(pluginInfo.name, pluginConfig);

          // ✅ Guardar copia original (sin filtrar)
          this.pluginRegistryOriginal.set(pluginInfo.name, JSON.parse(JSON.stringify(pluginConfig)));

          if (pluginConfig.autoload) {
            await this.loadPluginScript(pluginInfo.name, pluginConfig.autoload);
          }

          if (pluginConfig.scripts?.length > 0) {
            await this.loadPluginResources(pluginConfig.scripts, pluginConfig.styles || []);
          }

          await this.loadPluginLanguages(pluginInfo.name);

          if (pluginConfig.name === 'dashboard') return;

          if (pluginConfig.hasMenu && pluginConfig.menu) {
            const menuItem = {
              id: pluginConfig.name,
              title: pluginConfig.menu.title,
              icon: pluginConfig.menu.icon,
              order: pluginConfig.menu.order || 100
            };

            if (pluginConfig.menu.items?.length > 0) {
              menuItem.items = this.processMenuItems(
                pluginConfig.menu.items,
                pluginConfig.name,
                pluginConfig.scripts || [],
                pluginConfig.styles || []
              );
            } else if (pluginConfig.menu.view) {
              menuItem.view = pluginConfig.menu.view;
              if (pluginConfig.scripts) menuItem.scripts = pluginConfig.scripts;
              if (pluginConfig.styles) menuItem.styles = pluginConfig.styles;
            }

            this.menuItems.push(menuItem);
          }

          if (pluginConfig.hasHooks) {
            await this.loadPluginHook(pluginInfo.name);
          }

          if (pluginConfig.menu?.preloadViews === true) {
            await this.preloadPluginViews(pluginInfo.name, pluginConfig);
          }
        }
      });

      await Promise.all(pluginLoadPromises);
      this.menuItems.sort((a, b) => (a.order || 999) - (b.order || 999));

      const endTime = performance.now();
      logger.debug('cor:hook', `${this.loadedHooks.size} plugins cargados en ${(endTime - startTime).toFixed(0)}ms`);

    } catch (error) {
      logger.error('cor:hook', 'Error cargando plugins:', error);
    }
  }

  static async loadPluginLanguages(pluginName) {
    if (!window.i18n) return;
    const currentLang = i18n.getLang();
    const loaded = await this.tryLoadPluginLang(pluginName, currentLang);
    if (loaded) {
      const pluginConfig = this.pluginRegistry.get(pluginName);
      if (pluginConfig) {
        pluginConfig.hasLanguages = true;
        pluginConfig.loadedLanguages = [currentLang];
      }
    }
  }

  static async tryLoadPluginLang(pluginName, lang) {
    const langPath = `${window.BASE_URL}plugins/${pluginName}/lang/${lang}.json`;
    const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;

    // Usar loader.loadJson con opción optional y silent
    const translations = await loader.loadJson(langPath + cacheBuster, {
      optional: true,
      silent: true
    });

    if (!translations) return false;

    // Guardar traducciones
    if (!i18n.pluginTranslations.has(pluginName)) {
      i18n.pluginTranslations.set(pluginName, new Map());
    }
    i18n.pluginTranslations.get(pluginName).set(lang, translations);
    cache.set(`i18n_plugin_${pluginName}_${lang}`, translations, 60 * 60 * 1000);

    return true;
  }

  static async preloadPluginViews(pluginName, pluginConfig) {
    if (!pluginConfig.menu?.items) return;
    const viewsToPreload = [];
    const collectViews = (items) => {
      items.forEach(item => {
        if (item.view) viewsToPreload.push(item.view);
        if (item.items?.length > 0) collectViews(item.items);
      });
    };
    collectViews(pluginConfig.menu.items);

    for (const viewPath of viewsToPreload) {
      try {
        const basePath = window.appConfig?.routes?.pluginViews?.replace('{pluginName}', pluginName) || `plugins/${pluginName}/views`;
        const fullPath = `${window.BASE_URL}${basePath}/${viewPath}.json`;
        const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
        const response = await fetch(fullPath + cacheBuster);
        if (response.ok) {
          const viewData = await response.json();
          const cacheKey = `view_${pluginName}_${viewPath.replace(/\//g, '_')}`;
          window.cache?.set(cacheKey, viewData);
        }
      } catch (error) {}
    }
  }

  static async loadPluginScript(pluginName, scriptFile) {
    try {
      const scriptPath = `plugins/${pluginName}/${scriptFile}`;
      const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
      const response = await fetch(`${window.BASE_URL}${scriptPath}${cacheBuster}`);
      if (!response.ok) return;
      const scriptContent = await response.text();
      new Function(scriptContent)();
    } catch (error) {
      logger.error('cor:hook', `Error cargando autoload ${pluginName}:`, error.message);
    }
  }

  static async loadPluginResources(scripts = [], styles = []) {
    if (window.loader && typeof loader.loadResources === 'function') {
      try {
        await loader.loadResources(scripts, styles);
      } catch (error) {}
    }
  }

  static processMenuItems(items, parentPlugin = '', pluginScripts = [], pluginStyles = []) {
    return items
      .map(item => {
        const processedItem = {
          id: item.id,
          title: item.title,
          order: item.order || 999
        };
        const itemScripts = item.scripts || [];
        const combinedScripts = [...pluginScripts, ...itemScripts];
        if (combinedScripts.length > 0) processedItem.scripts = combinedScripts;
        const itemStyles = item.styles || [];
        const combinedStyles = [...pluginStyles, ...itemStyles];
        if (combinedStyles.length > 0) processedItem.styles = combinedStyles;
        if (item.preloadViews !== undefined) processedItem.preloadViews = item.preloadViews;
        if (item.items?.length > 0) {
          processedItem.items = this.processMenuItems(item.items, parentPlugin, pluginScripts, pluginStyles);
        } else if (item.view) {
          processedItem.view = item.view;
        }
        return processedItem;
      })
      .sort((a, b) => (a.order || 100) - (b.order || 100));
  }

  // Filtrar menús solo por plugins enabled=true
  static getMenuItems() {
    const menuItems = [];

    // Reconstruir menuItems desde pluginRegistry (que ya está filtrado por auth.js)
    for (const [pluginName, pluginConfig] of this.pluginRegistry) {
      // Solo incluir plugins habilitados
      if (pluginConfig.enabled !== true) {
        logger.debug('cor:hook', `Plugin "${pluginName}" oculto (enabled=${pluginConfig.enabled})`);
        continue;
      }

      // Si el plugin tiene menú, agregarlo
      if (pluginConfig.hasMenu && pluginConfig.menu) {
        const menuItem = {
          id: pluginConfig.name || pluginName,
          title: pluginConfig.menu.title,
          icon: pluginConfig.menu.icon,
          order: pluginConfig.menu.order || 100
        };

        // Usar los items YA FILTRADOS del pluginConfig.menu
        if (pluginConfig.menu.items?.length > 0) {
          menuItem.items = pluginConfig.menu.items;
        } else if (pluginConfig.menu.view) {
          menuItem.view = pluginConfig.menu.view;
          if (pluginConfig.scripts) menuItem.scripts = pluginConfig.scripts;
          if (pluginConfig.styles) menuItem.styles = pluginConfig.styles;
        }

        menuItems.push(menuItem);
      }
    }

    // Ordenar por order
    menuItems.sort((a, b) => (a.order || 999) - (b.order || 999));

    logger.debug('cor:hook', `getMenuItems: ${menuItems.length} plugins visibles`);

    // Log detallado de items por plugin
    menuItems.forEach(item => {
      if (item.items) {
        logger.debug('cor:hook', `  - ${item.id}: ${item.items.length} submenú${item.items.length !== 1 ? 's' : ''}`);
      }
    });

    return menuItems;
  }

  // ✅ NUEVO: Obtener TODOS los plugins (sin filtrar por permisos)
  static getAllPluginsForPermissions() {
    const plugins = [];

    // Usar la copia original (sin filtrar)
    for (const [name, config] of this.pluginRegistryOriginal) {
      plugins.push({
        name,
        hasMenu: config.hasMenu || false,
        hasViews: config.hasViews || false,
        menu: config.menu || null,
        description: config.description || ''
      });
    }

    logger.debug('cor:hook', `getAllPluginsForPermissions: ${plugins.length} plugins disponibles`);
    return plugins;
  }

  static async loadPluginConfig(pluginName) {
    try {
      const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
      return await api.get(`plugins/${pluginName}/index.json${cacheBuster}`);
    } catch (error) {
      return { name: pluginName, enabled: false, hasHooks: false };
    }
  }

  static async loadPluginHook(pluginName) {
    try {
      const hookPath = `plugins/${pluginName}/hooks.js`;
      const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
      const response = await fetch(`${window.BASE_URL}${hookPath}${cacheBuster}`);
      if (!response.ok) return;
      const scriptContent = await response.text();
      new Function(scriptContent)();
      const hookClassName = `${pluginName}Hooks`;
      if (window[hookClassName]) {
        this.loadedHooks.add(pluginName);
      }
    } catch (error) {}
  }

  static getPluginConfig(pluginName) {
    return this.pluginRegistry.get(pluginName);
  }

  static isPluginEnabled(pluginName) {
    const config = this.pluginRegistry.get(pluginName);
    return config ? config.enabled === true : false;
  }

  static getEnabledPlugins() {
    const enabled = [];
    for (const [name, config] of this.pluginRegistry) {
      if (config.enabled === true) {
        enabled.push({ name, ...config });
      }
    }
    return enabled;
  }

  static hasPluginLanguages(pluginName) {
    const config = this.pluginRegistry.get(pluginName);
    return config?.hasLanguages || false;
  }

  static getPluginLanguages(pluginName) {
    const config = this.pluginRegistry.get(pluginName);
    return config?.loadedLanguages || [];
  }

  static execute(hookName, defaultData = []) {
    // Extraer el nombre base (sin el prefijo "hook_")
    let baseName = hookName;
    let hasPrefix = false;

    if (hookName.startsWith('hook_')) {
      baseName = hookName.replace('hook_', '');
      hasPrefix = true;
    }

    // Normalizar el nombre si contiene guiones
    // "admin-panel" → "adminPanel"
    const normalizedName = this.normalizeHookName(baseName);

    // Reconstruir el nombre completo del hook
    const finalHookName = hasPrefix ? `hook_${normalizedName}` : normalizedName;

    // Log solo si hubo normalización
    if (baseName !== normalizedName) {
      logger.debug('cor:hook', `Nombre normalizado: "${hookName}" → "${finalHookName}"`);
    }

    let results = [...defaultData];

    // Iterar sobre todos los plugins cargados
    for (const pluginName of this.loadedHooks) {
      if (!this.isPluginEnabled(pluginName)) continue;

      const hookClass = window[`${pluginName}Hooks`];

      if (hookClass && typeof hookClass[finalHookName] === 'function') {
        try {
          logger.debug('cor:hook', `Ejecutando ${pluginName}Hooks.${finalHookName}()`);

          const hookResult = hookClass[finalHookName]();

          if (Array.isArray(hookResult)) {
            const itemsWithOrder = hookResult.map(item => ({
              order: item.order || 999,
              ...item
            }));
            results = [...results, ...itemsWithOrder];
          } else {
            logger.warn('cor:hook', `${pluginName}.${finalHookName}() no retornó un array`);
          }
        } catch (error) {
          logger.error('cor:hook', `Error ejecutando ${pluginName}.${finalHookName}():`, error);
        }
      }
    }

    // Ordenar por campo "order"
    results.sort((a, b) => (a.order || 999) - (b.order || 999));

    if (results.length > defaultData.length) {
      logger.debug('cor:hook', `Hook "${finalHookName}" agregó ${results.length - defaultData.length} items`);
    }

    return results;
  }

  static async renderHookResult(hookResult, container) {
    if (!hookResult || !container) return;

    if (hookResult.type === 'html') {
      // Renderizar HTML directo
      const wrapper = document.createElement('div');
      wrapper.id = hookResult.id;
      wrapper.innerHTML = hookResult.content;
      container.appendChild(wrapper);
    }
    else if (hookResult.type === 'component') {
      // Renderizar componente
      const wrapper = document.createElement('div');
      wrapper.id = hookResult.id;
      container.appendChild(wrapper);

      const componentName = hookResult.component;

      // Verificar que el componente existe
      if (window[componentName] && typeof window[componentName].render === 'function') {
        try {
          await window[componentName].render(hookResult.config, wrapper);
          logger.debug('cor:hook', `Componente "${componentName}" renderizado para hook "${hookResult.id}"`);
        } catch (error) {
          logger.error('cor:hook', `Error renderizando componente "${componentName}":`, error);
          wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error cargando componente ${componentName}</div>`;
        }
      } else {
        logger.error('cor:hook', `Componente "${componentName}" no encontrado`);
        wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Componente ${componentName} no disponible</div>`;
      }
    }
  }

  // Método helper para renderizar múltiples hooks en un contenedor
  static async renderHooks(hookName, containerId, defaultData = []) {
    const container = document.getElementById(containerId);
    if (!container) {
      logger.error('cor:hook', `Container "${containerId}" no encontrado`);
      return;
    }

    const results = this.execute(hookName, defaultData);

    for (const result of results) {
      await this.renderHookResult(result, container);
    }

    logger.debug('cor:hook', `Renderizados ${results.length} hooks en "${containerId}"`);
  }

  static normalizeHookName(viewId) {
    return viewId.replace(/-([a-z0-9])/g, (match, char) => char.toUpperCase());
  }
}

window.hook = hook;