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

      if (!registry || !registry.plugins || !Array.isArray(registry.plugins)) {
        console.warn('plugins/index.json vacío o mal formado');
        return;
      }

      const pluginLoadPromises = registry.plugins.map(async (pluginInfo) => {
        const pluginConfig = await this.loadPluginConfig(pluginInfo.name);

        if (pluginConfig && pluginConfig.enabled) {
          this.pluginRegistry.set(pluginInfo.name, pluginConfig);

          if (pluginConfig.autoload) {
            await this.loadPluginScript(pluginInfo.name, pluginConfig.autoload);
          }

          // ✅ Cargar idiomas del plugin si tiene
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
              menuItem.items = this.processMenuItems(pluginConfig.menu.items, pluginConfig.name);
            } else if (pluginConfig.menu.view) {
              menuItem.view = pluginConfig.menu.view;
            }

            this.menuItems.push(menuItem);
          }

          if (pluginConfig.hasHooks) {
            await this.loadPluginHook(pluginInfo.name);
          }
        }
      });

      await Promise.all(pluginLoadPromises);

      this.menuItems.sort((a, b) => (a.order || 999) - (b.order || 999));

      const endTime = performance.now();
      console.log(`Hooks: ${this.loadedHooks.size} plugins cargados en ${(endTime - startTime).toFixed(0)}ms`);

    } catch (error) {
      console.error('Hooks: Error cargando plugins:', error);
    }
  }

  static async loadPluginScript(pluginName, scriptFile) {
    try {
      const scriptPath = `plugins/${pluginName}/${scriptFile}`;
      const cacheBuster = window.appConfig?.isDevelopment
        ? `?v=${Date.now()}`
        : `?v=${window.appConfig.version}`;

      const response = await fetch(`${window.BASE_URL}${scriptPath}${cacheBuster}`);
      if (!response.ok) {
        console.warn(`Autoload no encontrado: ${scriptPath}`);
        return;
      }

      const scriptContent = await response.text();
      new Function(scriptContent)();

    } catch (error) {
      console.error(`Error cargando autoload ${pluginName}:`, error.message);
    }
  }

  static processMenuItems(items, parentPlugin = '') {
    return items
      .map(item => {
        const processedItem = {
          id: item.id,
          title: item.title,
          order: item.order || 999
        };

        if (item.scripts) {
          processedItem.scripts = item.scripts;
        }

        if (item.styles) {
          processedItem.styles = item.styles;
        }

        if (item.items?.length > 0) {
          processedItem.items = this.processMenuItems(item.items, parentPlugin);
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
      const cacheBuster = window.appConfig?.isDevelopment
        ? `?v=${Date.now()}`
        : `?v=${window.appConfig.version}`;
      return await api.get(`plugins/${pluginName}/index.json${cacheBuster}`);
    } catch (error) {
      return { name: pluginName, enabled: false, hasHooks: false };
    }
  }

  static async loadPluginHook(pluginName) {
    try {
      const hookPath = `plugins/${pluginName}/hooks.js`;
      const cacheBuster = window.appConfig?.isDevelopment
        ? `?v=${Date.now()}`
        : `?v=${window.appConfig.version}`;

      const response = await fetch(`${window.BASE_URL}${hookPath}${cacheBuster}`);
      if (!response.ok) return;

      const scriptContent = await response.text();
      new Function(scriptContent)();

      const hookClassName = `${pluginName}Hooks`;
      if (window[hookClassName]) {
        this.loadedHooks.add(pluginName);
      }

    } catch (error) {
      console.error(`Hook ${pluginName}:`, error.message);
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
          console.error(`Hook ${hookName} en ${pluginName}:`, error);
        }
      }
    }

    results.sort((a, b) => a.order - b.order);
    return results;
  }
}

window.hook = hook;