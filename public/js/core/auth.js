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
      await this.loadUserPermissions();
      this.startSessionMonitoring();
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

    if (window.hook?.loadPluginHooks) {
      await hook.loadPluginHooks();

      if (window.view && hook.getEnabledPlugins) {
        hook.getEnabledPlugins().forEach(plugin => {
          view.registerPlugin(plugin.name, plugin);
        });
      }
    }

    this.filterPluginsByPermissions();

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
      await this.showApp();
      this.startSessionMonitoring();
    }

    return result;
  }

  static async logout() {
    this.stopSessionMonitoring();
    
    // Limpiar caches de app (NO token/user, eso lo hace provider)
    this.clearAppCaches();
    
    await this.provider.logout();
    this.user = null;
    
    // Recargar página para reset completo
    window.location.reload();
  }

  // Limpiar caches de aplicación (vistas, forms, plugins)
  static clearAppCaches() {
    logger.info('cor:auth', 'Limpiando caches de aplicación...');

    // 1. Vistas
    if (window.view) {
      if (view.viewNavigationCache) {
        view.viewNavigationCache.clear();
      }
      view.views = {};
      view.loadedPlugins = {};
    }

    // 2. Formularios
    if (window.form) {
      if (form.schemas) {
        form.schemas.clear();
      }
      if (form.registeredEvents) {
        form.registeredEvents.clear();
      }
    }

    // 3. Hooks/Plugins
    if (window.hook) {
      hook.menuItems = [];
      hook.pluginRegistry = new Map();
      hook.loadedHooks = new Set();
    }

    // 4. Sidebar
    if (window.sidebar) {
      sidebar.menuData = { menu: [] };
    }

    // 5. Eventos delegados
    if (window.events) {
      events.clear();
    }

    // 6. Scripts/styles cargados
    if (window.loader) {
      loader.loaded = new Set();
    }

    // 7. Permisos y preferencias
    this.userPermissions = null;
    this.userPreferences = null;

    // 8. Traducciones de plugins
    if (window.i18n?.pluginTranslations) {
      i18n.pluginTranslations.clear();
    }

    // 9. Limpiar cache general (vistas, forms, etc) pero NO token/user
    if (window.cache) {
      const keysToPreserve = ['cache_auth_token', 'cache_auth_user'];
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      
      allKeys.forEach(key => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Limpiar memoria cache
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

  static async loadUserPermissions() {
    const currentUser = await this.provider.getUser();
    if (!currentUser) return;

    let config = currentUser.config;
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

    logger.success('cor:auth', 'Permisos cargados');

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
      logger.warn('cor:auth', 'Usuario sin permisos definidos');
      return;
    }

    if (!window.hook?.pluginRegistry) {
      logger.warn('cor:auth', 'PluginRegistry no disponible');
      return;
    }

    for (const [pluginName, plugin] of window.hook.pluginRegistry) {
      const perms = this.userPermissions.plugins[pluginName];

      if (!perms || perms.enabled === false) {
        plugin.enabled = false;
        logger.debug('cor:auth', `Plugin deshabilitado: ${pluginName}`);
        continue;
      }

      if (perms.menus !== '*' && plugin.menu?.items && typeof perms.menus === 'object') {
        const allowedMenuIds = Object.keys(perms.menus).filter(key => perms.menus[key] === true);
        plugin.menu.items = plugin.menu.items.filter(item => allowedMenuIds.includes(item.id));
        logger.debug('cor:auth', `Menús filtrados para ${pluginName}:`, allowedMenuIds);
      }
    }
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