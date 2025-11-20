class auth {
  static config = {};
  static provider = null;
  static user = null;

  static async init(config) {
    this.config = {
      enabled: true,
      provider: 'auth-jwt',
      loginView: 'auth/login',
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
      console.error('AUTH: Provider no encontrado!');
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

    // ✅ Inicializar selector de idioma (con pequeño delay para asegurar DOM)
    setTimeout(() => {
      if (window.initLangSelector) {
        window.initLangSelector();
      }
    }, 150);
  }

  static async login(credentials) {
    if (!this.provider) {
      console.error('AUTH: Provider no está definido!');
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
}

window.auth = auth;