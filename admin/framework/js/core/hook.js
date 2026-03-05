class ogHook {
  static hooks = new Map();
  static loadedHooks = new Set();
  static pluginRegistry = new Map();
  static pluginRegistryOriginal = new Map();
  static menuItems = [];

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ============================================
  // REGISTRO DE EXTENSIONS
  // ============================================

  /**
   * Registrar un extension manualmente
   * @param {string} extensionName - Nombre del extension
   * @param {object} config - Configuración del extension
   */
  static register(extensionName, config) {
    if (!extensionName || !config) {
      ogLogger?.error('core:hook', 'register() requiere extensionName y config');
      return;
    }

    ogLogger?.info('core:hook', `📝 Registrando extension: ${extensionName}`);

    // Normalizar config básica
    const normalizedConfig = {
      name: extensionName,
      enabled: config.enabled !== false,
      hasMenu: config.hasMenu || false,
      hasViews: config.hasViews || false,
      hasLanguages: config.hasLanguages || false,
      backend: config.backend || { enabled: false },
      description: config.description || '',
      version: config.version || '1.0.0',
      ...config
    };

    // Procesar menú si existe
    if (normalizedConfig.hasMenu && normalizedConfig.menu) {
      const extensionScripts = this.normalizeResources(config.scripts || []);
      const extensionStyles = this.normalizeResources(config.styles || []);

      normalizedConfig.menu = {
        title: config.menu.title || extensionName,
        icon: config.menu.icon || '📦',
        order: config.menu.order ?? 100,
        role: config.menu.role || null,
        items: config.menu.items
          ? this.processMenuItems(config.menu.items, extensionName, extensionScripts, extensionStyles)
          : [],
        view: config.menu.view || null
      };
    }

    // Guardar en ambos registros
    this.pluginRegistry.set(extensionName, normalizedConfig);
    this.pluginRegistryOriginal.set(extensionName, { ...normalizedConfig });

    ogLogger?.success('core:hook', `✅ Extension "${extensionName}" registrado con ${normalizedConfig.menu?.items?.length || 0} menús`);

    return normalizedConfig;
  }

  // ============================================
  // CARGA DE EXTENSIONS
  // ============================================

  static async loadPluginHooks() {
    const config = this.getConfig();

    try {
      const extensionsBase = config.extensionsPath || `${config.baseUrl}extensions/`;
      const indexUrl = `${extensionsBase}index.json?v=${config.version || '1.0.0'}`;

      ogLogger?.info('core:hook', `📦 Cargando index de extensions desde: ${indexUrl}`);

      const response = await fetch(indexUrl);

      if (!response.ok) {
        ogLogger?.error('core:hook', `❌ No se pudo cargar index.json: ${response.status}`);
        return;
      }

      const indexData = await response.json();
      const extensions = indexData.extensions || [];

      ogLogger?.info('core:hook', `✅ Extensions encontradas: ${extensions.length}`);

      for (const ext of extensions) {
        await this.loadPlugin(ext.name);
      }

    } catch (error) {
      ogLogger?.error('core:hook', '❌ Error cargando extensions:', error);
    }
  }

  static async loadPlugin(extensionName) {
    const config = this.getConfig();

    try {
      const extensionsBase = config.extensionsPath || `${config.baseUrl}extensions/`;

      // 1. Cargar index.json del extension (configuración y menú)
      const indexUrl = `${extensionsBase}${extensionName}/index.json?v=${config.version || '1.0.0'}`;
      ogLogger?.info('core:hook', `📦 Cargando config de: ${extensionName}`);

      const indexResponse = await fetch(indexUrl);

      if (indexResponse.ok) {
        const extensionConfig = await indexResponse.json();

        // Registrar el extension con su configuración
        this.register(extensionName, extensionConfig);
      } else {
        ogLogger?.warn('core:hook', `⚠️ No se encontró index.json para ${extensionName}`);
        // Registrar con config básico
        this.register(extensionName, {
          enabled: true,
          hasMenu: false
        });
      }

      // 2. Cargar hooks.js SOLO si hasHooks es true
      const pluginConfig = this.pluginRegistry.get(extensionName);
      
      if (pluginConfig?.hasHooks) {
        const hooksUrl = `${extensionsBase}${extensionName}/hooks.js?v=${config.version || '1.0.0'}`;
        const hooksResponse = await fetch(hooksUrl);

        if (hooksResponse.ok) {
          const script = await hooksResponse.text();
          new Function(script)();

          // Marcar que los hooks fueron cargados
          this.loadedHooks.add(extensionName);
          ogLogger?.success('core:hook', `✅ Hooks de ${extensionName} cargados`);
        } else {
          ogLogger?.warn('core:hook', `⚠️ hasHooks=true pero no se encontró hooks.js para ${extensionName}`);
        }
      } else {
        ogLogger?.info('core:hook', `⏭️ Skipping hooks para ${extensionName} (hasHooks=false)`);
      }

      // ✅ 3. NUEVO: Cargar idioma del extension
      const i18n = ogModule('i18n');
      if (i18n) {
        const currentLang = i18n.getLang();
        ogLogger?.info('core:hook', `🌐 Cargando idioma ${currentLang} para ${extensionName}`);
        await i18n.loadExtensionLang(extensionName, currentLang);
      }

    } catch (error) {
      ogLogger?.error('core:hook', `❌ Error cargando ${extensionName}:`, error);
    }
  }

  // ============================================
  // GESTIÓN DE MENÚS
  // ============================================

  static processMenuItems(items, parentPlugin = '', extensionScripts = [], extensionStyles = []) {
    return items
      .map(item => {
        // Si delega a otra extensión, marcar para resolución en getMenuItems()
        if (item.delegate) {
          return {
            id: item.id,
            title: item.title,
            icon: item.icon || '',
            order: item.order ?? 999,
            delegate: item.delegate
          };
        }

        const processedItem = {
          id: item.id,
          title: item.title,
          order: item.order ?? 999
        };

        if (item.role) {
          processedItem.role = item.role;
        }
        if (item.icon) {
          processedItem.icon = item.icon;
        }

        const itemScripts = this.normalizeResources(item.scripts || []);
        const combinedScripts = [...extensionScripts, ...itemScripts];
        if (combinedScripts.length > 0) processedItem.scripts = combinedScripts;

        const itemStyles = this.normalizeResources(item.styles || []);
        const combinedStyles = [...extensionStyles, ...itemStyles];
        if (combinedStyles.length > 0) processedItem.styles = combinedStyles;

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

  // Resolver items con delegate al momento de construir el menú
  static resolveMenuDelegates(items) {
    const resolved = [];
    for (const item of items) {
      if (item.delegate) {
        const delegateConfig = this.pluginRegistry.get(item.delegate);
        if (delegateConfig?.menu?.items?.length > 0) {
          resolved.push({
            id: item.id,
            title: item.title,
            icon: item.icon,
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

  static getMenuItems() {
    const menuItems = [];

    for (const [extensionName, pluginConfig] of this.pluginRegistry) {
      // Solo incluir extensions habilitados
      if (pluginConfig.enabled !== true) {
        continue;
      }

      // Si el extension tiene menú, agregarlo
      if (pluginConfig.hasMenu && pluginConfig.menu) {
        const menuItem = {
          id: pluginConfig.name || extensionName,
          title: pluginConfig.menu.title,
          icon: pluginConfig.menu.icon,
          order: pluginConfig.menu.order ?? 100
        };

        if (pluginConfig.menu.role) {
          menuItem.role = pluginConfig.menu.role;
        }

        if (pluginConfig.menu.items?.length > 0) {
          menuItem.items = this.resolveMenuDelegates(pluginConfig.menu.items);
        } else if (pluginConfig.menu.view) {
          menuItem.view = pluginConfig.menu.view;
          if (pluginConfig.scripts) menuItem.scripts = pluginConfig.scripts;
          if (pluginConfig.styles) menuItem.styles = pluginConfig.styles;
        }

        menuItems.push(menuItem);
      }
    }

    menuItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    return menuItems;
  }

  static getAllExtensionsForPermissions() {
    const extensions = [];

    for (const [name, config] of this.pluginRegistryOriginal) {
      extensions.push({
        name,
        hasMenu: config.hasMenu || false,
        hasViews: config.hasViews || false,
        menu: config.menu || null,
        description: config.description || ''
      });
    }

    return extensions;
  }

  // ============================================
  // EJECUCIÓN DE HOOKS (CON VALIDACIÓN DE PERMISOS)
  // ============================================

  static execute(hookName, defaultData = []) {
    let baseName = hookName;
    let hasPrefix = false;

    if (hookName.startsWith('hook_')) {
      baseName = hookName.replace('hook_', '');
      hasPrefix = true;
    }

    const normalizedName = this.normalizeHookName(baseName);
    const finalHookName = hasPrefix ? `hook_${normalizedName}` : normalizedName;

    let results = [...defaultData];

    // Iterar sobre todos los extensions cargados
    for (const extensionName of this.loadedHooks) {
      // ✅ VALIDAR: Solo ejecutar hooks de extensions habilitados
      if (!this.isExtensionEnabled(extensionName)) {
        ogLogger?.debug('core:hook', `⏭️ Saltando hooks de "${extensionName}" (deshabilitado)`);
        continue;
      }

      const hookClass = window[`${extensionName}Hooks`];

      if (hookClass && typeof hookClass[finalHookName] === 'function') {
        try {
          const hookResult = hookClass[finalHookName]();

          if (Array.isArray(hookResult)) {
            const itemsWithOrder = hookResult.map(item => ({
              order: item.order ?? 999,
              ...item
            }));
            results = [...results, ...itemsWithOrder];

            ogLogger?.info('core:hook', `✅ Hook ejecutado: ${extensionName}.${finalHookName}() - ${hookResult.length} items`);
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
    return viewId.replace(/-([a-z0-9])/g, (match, char) => char.toUpperCase());
  }

  // ============================================
  // HELPERS
  // ============================================

  static normalizeResourcePath(path) {
    if (!path) return path;
    if (path.startsWith('extensions/')) return path;
    return `extensions/${path}`;
  }

  static normalizeResources(resources = []) {
    return resources.map(path => this.normalizeResourcePath(path));
  }

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
      if (config.enabled === true) {
        enabled.push({ name, ...config });
      }
    }
    return enabled;
  }

  // ============================================
  // RECURSOS Y LENGUAJES (sin cambios)
  // ============================================

  static async loadPluginLanguages(extensionName) {
    const i18n = ogModule('i18n');
    if (!window.ogFramework?.core?.i18n) return;
    const currentLang = i18n.getLang();
    const loaded = await this.tryLoadPluginLang(extensionName, currentLang);
    if (loaded) {
      const pluginConfig = this.pluginRegistry.get(extensionName);
      if (pluginConfig) {
        pluginConfig.hasLanguages = true;
        pluginConfig.loadedLanguages = [currentLang];
      }
    }
  }

  static async tryLoadPluginLang(extensionName, lang) {
    const loader = ogModule('loader');
    const i18n = ogModule('i18n');
    const cache = ogModule('cache');
    const config = this.getConfig();

    try {
      const langPath = `${config.baseUrl || "/"}extensions/${extensionName}/lang/${lang}.json`;
      const cacheBuster = `?v=${config.version || "1.0.0"}`;

      const translations = await loader.loadJson(langPath + cacheBuster, {
        optional: true,
        silent: true
      });

      if (!translations) return false;

      if (!i18n.exntesionTranslations.has(extensionName)) {
        i18n.exntesionTranslations.set(extensionName, new Map());
      }
      i18n.exntesionTranslations.get(extensionName).set(lang, translations);
      cache.set(`i18n_extension_${extensionName}_${lang}_v${config.version || "1.0.0"}`, translations, 60 * 60 * 1000);

      ogModule('logger')?.success('core:hook', `✅ Idioma ${lang} cargado para ${extensionName}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async loadPluginResources(scripts = [], styles = []) {
    const loader = ogModule('loader');
    if (loader && typeof loader.loadResources === 'function') {
      try {
        await loader.loadResources(scripts, styles);
      } catch (error) {}
    }
  }

  static async renderHookResult(hookResult, container) {
    if (!hookResult || !container) return;

    if (hookResult.type === 'html') {
      const wrapper = document.createElement('div');
      wrapper.id = hookResult.id;
      wrapper.innerHTML = hookResult.content;
      container.appendChild(wrapper);
    }
    else if (hookResult.type === 'component') {
      const wrapper = document.createElement('div');
      wrapper.id = hookResult.id;
      container.appendChild(wrapper);

      const componentName = hookResult.component;

      if (window[componentName] && typeof window[componentName].render === 'function') {
        try {
          await window[componentName].render(hookResult.config, wrapper);
        } catch (error) {
          ogModule('logger')?.error('core:hook', `Error renderizando componente "${componentName}":`, error);
          wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">${__('core.hook.error.loading_component', { component: componentName })}</div>`;
        }
      } else {
        ogModule('logger')?.error('core:hook', `Componente "${componentName}" no encontrado`);
        wrapper.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">${__('core.hook.error.component_not_available', { component: componentName })}</div>`;
      }
    }
  }

  static async renderHooks(hookName, containerId, defaultData = []) {
    const container = document.getElementById(containerId);
    if (!container) {
      ogModule('logger')?.error('core:hook', `Container "${containerId}" no encontrado`);
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