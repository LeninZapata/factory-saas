class auth {
  static config = {};
  static provider = null;
  static user = null;
  static userPermissions = null;
  static userPreferences = null;
  static sessionCheckInterval = null;

  static async init(config) {
    this.config = {
      enabled: true,
      provider: 'auth-jwt',
      loginView: 'core:auth/login',
      redirectAfterLogin: 'dashboard',
      sessionCheckInterval: 5 * 60 * 1000,
      ...config
    };

    if (!this.config.enabled) return;

    const providerUrl = `${window.BASE_URL}plugins/${this.config.provider}/provider.js`;
    await loader.loadScript(providerUrl);

    const authProviderUrl = `${window.BASE_URL}plugins/${this.config.provider}/auth-provider.js`;
    await loader.loadScript(authProviderUrl);

    const providerName = this.config.provider
      .split('-')
      .map((word, index) =>
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');

    const providerClassName = `${providerName}Provider`;
    this.provider = window[providerClassName];

    if (!this.provider) {
      logger.error('cor:auth', 'Provider no encontrado!');
      return;
    }

    if (this.provider?.init) {
      this.provider.init(this.config);
    }

    const isAuth = await this.provider?.check();

    if (isAuth) {
      this.user = await this.provider?.getUser();
      this.normalizeConfig();
      this.loadUserPermissions(); // ← Cargar ANTES de showApp
      this.startSessionMonitoring();
      await this.showApp();
    } else {
      this.showLogin();
    }
  }

  static startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      const isValid = await this.checkSession(true);
      if (!isValid) {
        this.handleExpiredSession();
      }
    }, this.config.sessionCheckInterval);
  }

  static stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  static async checkSession(silent = false) {
    if (!this.provider) return false;

    const tokenKey = this.provider.tokenKey || 'auth_token';
    
    if (cache.isExpired(tokenKey)) {
      if (!silent) logger.warn('cor:auth', 'Token expirado en cache');
      return false;
    }

    try {
      const isValid = await this.provider.check();
      if (!isValid && !silent) {
        logger.warn('cor:auth', 'Sesión inválida en servidor');
      }
      return isValid;
    } catch (error) {
      if (!silent) logger.error('cor:auth', 'Error verificando sesión:', error);
      return false;
    }
  }

  static handleExpiredSession() {
    this.stopSessionMonitoring();
    
    if (window.toast) {
      toast.show({
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        type: 'warning',
        duration: 5000
      });
    }

    setTimeout(() => {
      this.clearAppCaches();
      this.user = null;
      this.provider?.clearSession?.();
      this.showLogin();
    }, 2000);
  }

  static showLogin() {
    if (window.layout) {
      layout.init('auth');
    }

    document.body.setAttribute('data-view', 'login-view');

    if (window.view) {
      view.loadView(this.config.loginView);
    }
  }

  static async showApp() {
    const layoutExists = document.querySelector('.layout .header');
    if (!layoutExists && window.layout) {
      layout.init('app');
    }

    document.body.removeAttribute('data-view');

    // Cargar plugins
    if (window.hook?.loadPluginHooks) {
      await hook.loadPluginHooks();

      if (window.view && hook.getEnabledPlugins) {
        hook.getEnabledPlugins().forEach(plugin => {
          view.registerPlugin(plugin.name, plugin);
        });
      }
    }

    // Filtrar plugins DESPUÉS de cargarlos
    this.filterPluginsByPermissions();

    // Inicializar sidebar (ya con plugins filtrados)
    if (window.sidebar) {
      await sidebar.init();
    }

    const contentHasView = document.querySelector('#content .view-container');
    if (!contentHasView && window.view) {
      view.loadView(this.config.redirectAfterLogin);
    }

    if (window.initLangSelector) {
      window.initLangSelector();
    }
  }

  static async login(credentials) {
    if (!this.provider) {
      logger.error('cor:auth', 'Provider no está definido!');
      return { success: false, error: 'Provider no inicializado' };
    }

    const result = await this.provider.login(credentials);

    if (result.success) {
      this.user = result.user;
      this.normalizeConfig();
      this.loadUserPermissions(); // ← Cargar ANTES de showApp
      await this.showApp();
      this.startSessionMonitoring();
    }

    return result;
  }

  static async logout() {
    this.stopSessionMonitoring();
    this.clearAppCaches();
    await this.provider.logout();
    this.user = null;
    window.location.reload();
  }

  static clearAppCaches() {
    logger.info('cor:auth', 'Limpiando caches de aplicación...');

    if (window.view) {
      if (view.viewNavigationCache) view.viewNavigationCache.clear();
      view.views = {};
      view.loadedPlugins = {};
    }

    if (window.form) {
      if (form.schemas) form.schemas.clear();
      if (form.registeredEvents) form.registeredEvents.clear();
    }

    if (window.hook) {
      hook.menuItems = [];
      hook.pluginRegistry = new Map();
      hook.loadedHooks = new Set();
    }

    if (window.sidebar) {
      sidebar.menuData = { menu: [] };
    }

    if (window.events) {
      events.clear();
    }

    if (window.loader) {
      loader.loaded = new Set();
    }

    this.userPermissions = null;
    this.userPreferences = null;

    if (window.i18n?.pluginTranslations) {
      i18n.pluginTranslations.clear();
    }

    if (window.cache) {
      const keysToPreserve = ['cache_auth_token', 'cache_auth_user'];
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      
      allKeys.forEach(key => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      if (cache.memoryCache) {
        cache.memoryCache.clear();
      }
    }

    logger.success('cor:auth', 'Caches de aplicación limpiados');
  }

  static getUser() { return this.user; }
  static isAuthenticated() { return !!this.user; }
  static getToken() { return this.provider?.getToken?.(); }

  static normalizeConfig() {
    if (!this.user) return;

    const defaults = { 
      permissions: { plugins: {} }, 
      preferences: { theme: 'light', language: 'es', notifications: true }
    };

    if (!this.user.config || typeof this.user.config !== 'object' || Array.isArray(this.user.config)) {
      this.user.config = defaults;
      return;
    }

    this.user.config = {
      permissions: {
        plugins: this.user.config.permissions?.plugins || {}
      },
      preferences: {
        theme: this.user.config.preferences?.theme || 'light',
        language: this.user.config.preferences?.language || 'es',
        notifications: this.user.config.preferences?.notifications !== undefined 
          ? this.user.config.preferences.notifications 
          : true
      }
    };
  }

  // Cargar permisos SÍNCRONAMENTE (no async)
  static loadUserPermissions() {
    if (!this.user) return;

    let config = this.user.config;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (error) {
        logger.error('cor:auth', 'Error parseando config:', error);
        config = { permissions: { plugins: {} }, preferences: {} };
      }
    }

    if (!config || typeof config !== 'object') {
      config = { permissions: { plugins: {} }, preferences: {} };
    }

    this.userPermissions = config.permissions || { plugins: {} };
    this.userPreferences = config.preferences || { theme: 'light', language: 'es', notifications: true };

    logger.success('cor:auth', 'Permisos cargados:', this.userPermissions);

    this.applyUserPreferences();
  }

  static applyUserPreferences() {
    if (!this.userPreferences) return;

    if (this.userPreferences.theme) {
      document.body.dataset.theme = this.userPreferences.theme;
    }

    if (this.userPreferences.language && window.i18n) {
      i18n.setLang(this.userPreferences.language);
    }
  }

  static filterPluginsByPermissions() {
    if (this.user?.role === 'admin') {
      logger.debug('cor:auth', 'Usuario admin - sin filtros');
      return;
    }

    if (!this.userPermissions?.plugins) {
      logger.warn('cor:auth', 'Usuario sin permisos definidos - deshabilitar todos los plugins');
      
      // Si no hay permisos, deshabilitar TODOS los plugins
      if (window.hook?.pluginRegistry) {
        for (const [pluginName, plugin] of window.hook.pluginRegistry) {
          plugin.enabled = false;
          logger.debug('cor:auth', `Plugin deshabilitado por falta de permisos: ${pluginName}`);
        }
      }
      return;
    }

    if (!window.hook?.pluginRegistry) {
      logger.warn('cor:auth', 'PluginRegistry no disponible');
      return;
    }

    logger.info('cor:auth', 'Filtrando plugins por permisos...');

    for (const [pluginName, plugin] of window.hook.pluginRegistry) {
      const perms = this.userPermissions.plugins[pluginName];

      // Si el plugin NO está en permisos, deshabilitarlo
      if (!perms) {
        plugin.enabled = false;
        logger.debug('cor:auth', `Plugin deshabilitado (no en permisos): ${pluginName}`);
        continue;
      }

      // Si perms.enabled === false, deshabilitarlo
      if (perms.enabled === false) {
        plugin.enabled = false;
        logger.debug('cor:auth', `Plugin deshabilitado (enabled=false): ${pluginName}`);
        continue;
      }

      // Si perms.enabled === true, habilitarlo
      if (perms.enabled === true) {
        plugin.enabled = true;
        logger.debug('cor:auth', `Plugin habilitado: ${pluginName}`);

        // Filtrar menús si es necesario
        if (perms.menus !== '*' && plugin.menu?.items && typeof perms.menus === 'object') {
          const allowedMenuIds = Object.keys(perms.menus).filter(key => perms.menus[key] === true);
          plugin.menu.items = plugin.menu.items.filter(item => allowedMenuIds.includes(item.id));
          logger.debug('cor:auth', `Menús filtrados para ${pluginName}:`, allowedMenuIds);
        }
      }
    }

    logger.success('cor:auth', 'Filtrado de plugins completado');
  }

  static hasPermission(plugin, menu = null, view = null) {
    if (this.user?.role === 'admin') return true;

    if (!this.userPermissions?.plugins) return false;

    const perms = this.userPermissions.plugins[plugin];

    if (!perms || perms.enabled === false) return false;

    if (menu) {
      if (perms.menus === '*') return true;
      return perms.menus?.[menu] === true;
    }

    if (view) {
      if (perms.views === '*') return true;
      return perms.views?.[view] === true;
    }

    return true;
  }
}

window.auth = auth;