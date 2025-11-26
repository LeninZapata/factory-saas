class hook {
  static hooks = new Map();
  static loadedHooks = new Set();
  static pluginRegistry = new Map();
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

          if (pluginConfig.autoload) {
            await this.loadPluginScript(pluginInfo.name, pluginConfig.autoload);
          }

          // Cargar scripts globales del plugin
          if (pluginConfig.scripts?.length > 0) {
            await this.loadPluginResources(pluginConfig.scripts, pluginConfig.styles || []);
          }

          // Cargar idiomas del plugin
          if (window.i18n && pluginConfig.availableLanguages) {
            await i18n.loadPluginLang(pluginInfo.name, i18n.getLang());
          }

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

          // PreCargar vistas si está configurado
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
      } catch (error) {
        logger.warn('cor:hook', `No se pudo precargar: ${pluginName}/${viewPath}`);
      }
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
      } catch (error) {
        logger.error('cor:hook', 'Error cargando recursos:', error);
      }
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

        // Combinar scripts del plugin + scripts del item
        const itemScripts = item.scripts || [];
        const combinedScripts = [...pluginScripts, ...itemScripts];
        if (combinedScripts.length > 0) {
          processedItem.scripts = combinedScripts;
        }

        // Combinar styles del plugin + styles del item
        const itemStyles = item.styles || [];
        const combinedStyles = [...pluginStyles, ...itemStyles];
        if (combinedStyles.length > 0) {
          processedItem.styles = combinedStyles;
        }

        if (item.preloadViews !== undefined) {
          processedItem.preloadViews = item.preloadViews;
        }

        if (item.items?.length > 0) {
          processedItem.items = this.processMenuItems(item.items, parentPlugin, pluginScripts, pluginStyles);
        } else if (item.view) {
          processedItem.view = item.view;
        }

        return processedItem;
      })
      .sort((a, b) => (a.order || 100) - (b.order || 100));
  }

  static getMenuItems() {
    return this.menuItems;
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

    } catch (error) {
      logger.error('cor:hook', `Error cargando hook ${pluginName}:`, error.message);
    }
  }

  static getPluginConfig(pluginName) {
    return this.pluginRegistry.get(pluginName);
  }

  static isPluginEnabled(pluginName) {
    const config = this.pluginRegistry.get(pluginName);
    return config ? config.enabled : false;
  }

  static getEnabledPlugins() {
    const enabled = [];
    for (const [name, config] of this.pluginRegistry) {
      if (config.enabled) {
        enabled.push({ name, ...config });
      }
    }
    return enabled;
  }

  static execute(hookName, defaultData = []) {
    let results = [...defaultData];

    for (const pluginName of this.loadedHooks) {
      if (!this.isPluginEnabled(pluginName)) continue;

      const hookClass = window[`${pluginName}Hooks`];

      if (hookClass && typeof hookClass[hookName] === 'function') {
        try {
          const hookResult = hookClass[hookName]();

          if (Array.isArray(hookResult)) {
            const itemsWithOrder = hookResult.map(item => ({
              order: item.order || 999,
              ...item
            }));
            results = [...results, ...itemsWithOrder];
          }
        } catch (error) {
          logger.error('cor:hook', `Error en hook ${hookName} (${pluginName}):`, error);
        }
      }
    }

    results.sort((a, b) => a.order - b.order);
    return results;
  }
}

window.hook = hook;