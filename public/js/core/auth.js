class auth {
  static config = {};
  static provider = null;
  static user = null;
  static userPermissions = null;
  static userPreferences = null;

  static async init(config) {
    this.config = {
      enabled: true,
      provider: 'auth-jwt',
      loginView: 'core:auth/login',
      redirectAfterLogin: 'dashboard',
      ...config
    };

    if (!this.config.enabled) return;

    // Cargar provider.js
    const providerUrl = `${window.BASE_URL}plugins/${this.config.provider}/provider.js`;
    await loader.loadScript(providerUrl);

    // Cargar auth-provider.js
    const authProviderUrl = `${window.BASE_URL}plugins/${this.config.provider}/auth-provider.js`;
    await loader.loadScript(authProviderUrl);

    // Convertir 'auth-jwt' → 'authJwt' → 'authJwtProvider'
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

    // Inicializar provider con config
    if (this.provider?.init) {
      this.provider.init(this.config);
    }

    // Verificar sesión
    const isAuth = await this.provider?.check();

    if (isAuth) {
      this.user = await this.provider?.getUser();

      // Cargar permisos del usuario
      await this.loadUserPermissions();
    } else {
      this.showLogin();
    }
  }

  static showLogin() {
    // Inicializar layout auth (sin header/sidebar)
    if (window.layout) {
      layout.init('auth');
    }

    // Agregar data-view al body
    document.body.setAttribute('data-view', 'login-view');

    // Cargar vista de login
    if (window.view) {
      view.loadView(this.config.loginView);
    }
  }

  static async showApp() {
    // Re-inicializar layout completo (solo si no existe)
    const layoutExists = document.querySelector('.layout .header');
    if (!layoutExists && window.layout) {
      layout.init('app');
    }

    // Remover data-view
    document.body.removeAttribute('data-view');

    // Cargar hooks ANTES de sidebar
    if (window.hook?.loadPluginHooks) {
      await hook.loadPluginHooks();

      if (window.view && hook.getEnabledPlugins) {
        hook.getEnabledPlugins().forEach(plugin => {
          view.registerPlugin(plugin.name, plugin);
        });
      }
    }

    // Inicializar sidebar (con los menús cargados)
    if (window.sidebar) {
      await sidebar.init();
    }

    // Cargar dashboard (solo si no hay vista cargada)
    const contentHasView = document.querySelector('#content .view-container');
    if (!contentHasView && window.view) {
      view.loadView(this.config.redirectAfterLogin);
    }

    // ✅ Inicializar selector de idioma DESPUÉS de todo
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
    }

    return result;
  }

  static async logout() {
    await this.provider.logout();
    this.user = null;
    this.showLogin();
  }

  static getUser() { return this.user; }
  static isAuthenticated() { return !!this.user; }
  static getToken() { return this.provider?.getToken?.(); }

  /**
   * Cargar permisos del usuario después del login
   */
  static async loadUserPermissions() {
    const currentUser = await this.provider.getUser();
    if (!currentUser || !currentUser.config) return;

    // Parse config
    const config = typeof currentUser.config === 'string' ?
      JSON.parse(currentUser.config) :
      currentUser.config;

    this.userPermissions = config.permissions;
    this.userPreferences = config.preferences;

    logger.success('cor:auth', 'Permisos cargados');

    // Aplicar preferencias
    this.applyUserPreferences();

    // Filtrar menú según permisos
    this.filterMenuByPermissions();
  }

  /**
   * Aplicar preferencias del usuario
   */
  static applyUserPreferences() {
    if (!this.userPreferences) return;

    // Tema
    if (this.userPreferences.theme) {
      document.body.dataset.theme = this.userPreferences.theme;
    }

    // Idioma
    if (this.userPreferences.language && window.i18n) {
      i18n.setLanguage(this.userPreferences.language);
    }
  }

  /**
   * Filtrar menú según permisos del usuario
   */
  static filterMenuByPermissions() {
    if (!this.userPermissions?.plugins) return;

    // Admin tiene acceso a todo
    if (this.user?.role === 'admin') return;

    for (const [pluginName, plugin] of Object.entries(window.hooks.plugins)) {
      const perms = this.userPermissions.plugins[pluginName];

      // Plugin deshabilitado para este usuario
      if (!perms || perms.enabled === false) {
        plugin.enabled = false;
        continue;
      }

      // Filtrar menús si no tiene acceso a todos
      if (perms.menus !== '*' && plugin.menu?.items) {
        plugin.menu.items = plugin.menu.items.filter(item => {
          return perms.menus[item.id] === true;
        });
      }
    }

    // Reconstruir menú
    if (window.sidebar) {
      sidebar.renderMenu();
    }
  }

  /**
   * Verificar si el usuario tiene permiso
   */
  static hasPermission(plugin, menu = null, view = null) {
    // Admin siempre tiene permiso
    if (this.user?.role === 'admin') return true;

    if (!this.userPermissions?.plugins) return true;

    const perms = this.userPermissions.plugins[plugin];

    // Plugin deshabilitado
    if (!perms || perms.enabled === false) return false;

    // Verificar menú específico
    if (menu) {
      if (perms.menus === '*') return true;
      return perms.menus?.[menu] === true;
    }

    // Verificar vista específica
    if (view) {
      if (perms.views === '*') return true;
      return perms.views?.[view] === true;
    }

    return true;
  }
}

window.auth = auth;