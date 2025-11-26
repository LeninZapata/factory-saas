class authJwtProvider {
  static tokenKey = 'auth_token';
  static userKey = 'auth_user';
  static config = {};

  static init(config) {
    this.config = config;
    logger.debug('p:auth-provider', 'Configuración inicializada');
  }

  static async check() {
    const token = cache.getLocal(this.tokenKey);

    if (!token) return false;

    if (window.appConfig?.isDevelopment) {
      return true;
    }

    try {
      const response = await api.get(this.config.api.me);
      if (response.user) {
        cache.setLocal(this.userKey, response.user, this.config.tokenTTL);
        return true;
      }
    } catch {}
    return false;
  }

  static async login(credentials) {
    if (window.appConfig?.isDevelopment) {
      return this.mockLogin(credentials);
    }

    try {
      const response = await api.post(this.config.api.login, credentials);

      if (response.token) {
        cache.setLocal(this.tokenKey, response.token, this.config.tokenTTL);
        cache.setLocal(this.userKey, response.user, this.config.tokenTTL);
        return { success: true, user: response.user };
      }

      return { success: false, error: response.error || 'Credenciales inválidas' };
    } catch (error) {
      logger.error('p:auth-provider', 'Error en login:', error.message);
      return { success: false, error: error.message };
    }
  }

  static mockLogin(credentials) {
    if (credentials.email === 'admin@test.com' && credentials.password === '123456') {
      const user = { id: 1, name: 'Admin Demo', email: credentials.email, role: 'Admin' };
      const token = 'mock-token-' + Date.now();

      cache.setLocal(this.tokenKey, token, this.config.tokenTTL);
      cache.setLocal(this.userKey, user, this.config.tokenTTL);

      logger.success('p:auth-provider', 'Login mock exitoso');
      return { success: true, user };
    }

    logger.warn('p:auth-provider', 'Credenciales mock incorrectas');
    return { success: false, error: 'Credenciales inválidas' };
  }

  static async logout() {
    if (!window.appConfig?.isDevelopment) {
      try { await api.post(this.config.api.logout); } catch {}
    }
    cache.delete(this.tokenKey);
    cache.delete(this.userKey);
    logger.debug('p:auth-provider', 'Logout completado');
  }

  static getToken() {
    return cache.getLocal(this.tokenKey);
  }

  static async getUser() {
    return cache.getLocal(this.userKey);
  }
}

window.authJwtProvider = authJwtProvider;