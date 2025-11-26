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
      sessionCheckInterval: 5 * 60 * 1000, // 5 minutos
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
      await this.loadUserPermissions();
      this.startSessionMonitoring();
    } else {
      this.showLogin();
    }
  }

  // Monitoreo periódico de sesión
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

  // Verificar validez de sesión (silenciosa o con mensaje)
  static async checkSession(silent = false) {
    if (!this.provider) return false;

    const tokenKey = this.provider.tokenKey || 'auth_token';
    
    // Verificar si el token ha expirado en cache
    if (cache.isExpired(tokenKey)) {
      if (!silent) logger.warn('cor:auth', 'Token expirado en cache');
      return false;
    }

    // Verificar con el servidor
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

  // Manejar sesión expirada
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
      await this.showApp();
      this.startSessionMonitoring();
    }

    return result;
  }

  static async logout() {
    this.stopSessionMonitoring();
    await this.provider.logout();
    this.user = null;
    this.showLogin();
  }

  static getUser() { return this.user; }
  static isAuthenticated() { return !!this.user; }
  static getToken() { return this.provider?.getToken?.(); }

  static async loadUserPermissions() {
    const currentUser = await this.provider.getUser();
    if (!currentUser || !currentUser.config) return;

    const config = typeof currentUser.config === 'string' ?
      JSON.parse(currentUser.config) :
      currentUser.config;

    this.userPermissions = config.permissions;
    this.userPreferences = config.preferences;

    logger.success('cor:auth', 'Permisos cargados');

    this.applyUserPreferences();
    this.filterMenuByPermissions();
  }

  static applyUserPreferences() {
    if (!this.userPreferences) return;

    if (this.userPreferences.theme) {
      document.body.dataset.theme = this.userPreferences.theme;
    }

    // ✅ Aplicar idioma del usuario (si existe)
    if (this.userPreferences.language && window.i18n) {
      i18n.setLang(this.userPreferences.language);
    }
  }

  static filterMenuByPermissions() {
    if (!this.userPermissions?.plugins) return;

    if (this.user?.role === 'admin') return;

    for (const [pluginName, plugin] of Object.entries(window.hooks.plugins)) {
      const perms = this.userPermissions.plugins[pluginName];

      if (!perms || perms.enabled === false) {
        plugin.enabled = false;
        continue;
      }

      if (perms.menus !== '*' && plugin.menu?.items) {
        plugin.menu.items = plugin.menu.items.filter(item => {
          return perms.menus[item.id] === true;
        });
      }
    }

    if (window.sidebar) {
      sidebar.renderMenu();
    }
  }

  static hasPermission(plugin, menu = null, view = null) {
    if (this.user?.role === 'admin') return true;

    if (!this.userPermissions?.plugins) return true;

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