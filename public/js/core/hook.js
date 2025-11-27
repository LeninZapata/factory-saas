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
    const filtered = this.menuItems.filter(item => {
      const pluginConfig = this.pluginRegistry.get(item.id);
      if (!pluginConfig) return true;
      const isEnabled = pluginConfig.enabled === true;
      if (!isEnabled) {
        logger.debug('cor:hook', `Menú "${item.id}" oculto (enabled=${pluginConfig.enabled})`);
      }
      return isEnabled;
    });
    logger.debug('cor:hook', `getMenuItems: ${filtered.length}/${this.menuItems.length} menús visibles`);
    return filtered;
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
        } catch (error) {}
      }
    }
    results.sort((a, b) => a.order - b.order);
    return results;
  }
}

window.hook = hook;