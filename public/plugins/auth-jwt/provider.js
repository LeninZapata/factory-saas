class authJwtProvider {
  static tokenKey = 'auth_token';
  static userKey = 'auth_user';
  static config = {};

  static init(config) {
    this.config = config;
    logger.debug('p:auth-provider', 'Configuración inicializada');
  }

  // Verificar si hay sesión válida
  static async check() {
    const token = cache.getLocal(this.tokenKey);

    if (!token) {
      logger.debug('p:auth-provider', 'No hay token guardado');
      return false;
    }

    try {
      const response = await api.get(this.config.api.me);

      if (response.success && response.data) {
        cache.setLocal(this.userKey, response.data, this.config.tokenTTL);
        logger.success('p:auth-provider', 'Sesión válida');
        return true;
      }

      logger.warn('p:auth-provider', 'Respuesta inesperada del servidor');
      this.clearSession();
      return false;

    } catch (error) {
      logger.warn('p:auth-provider', 'Token inválido o expirado:', error.message);
      this.clearSession();
      return false;
    }
  }

  // Login - SIEMPRE contra backend real (sin mock)
  static async login(credentials) {
    try {
      logger.debug('p:auth-provider', 'Iniciando login con:', { user: credentials.user });

      const response = await api.post(this.config.api.login, credentials);

      logger.debug('p:auth-provider', 'Respuesta del servidor:', response);

      if (response.success === true && response.data) {
        const { token, user, ttl_ms } = response.data;

        if (!token || !user) {
          logger.error('p:auth-provider', 'Respuesta incompleta del servidor');
          return {
            success: false,
            error: 'Error en la respuesta del servidor'
          };
        }

        // Usar TTL que viene del backend (en milisegundos)
        const tokenTTL = ttl_ms || this.config.tokenTTL; // Fallback al config si no viene

        // Guardar token y usuario con el TTL del backend
        cache.setLocal(this.tokenKey, token, tokenTTL);
        cache.setLocal(this.userKey, user, tokenTTL);

        logger.success('p:auth-provider', `Login exitoso para: ${user.user} (TTL: ${tokenTTL}ms)`);
        return { success: true, user };
      }

      logger.warn('p:auth-provider', 'Credenciales incorrectas');
      return {
        success: false,
        error: response.error || 'Usuario o contraseña incorrectos'
      };

    } catch (error) {
      logger.error('p:auth-provider', 'Error en login:', error.message);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  // Logout - SIEMPRE contra backend real
  static async logout() {
    const token = this.getToken();

    if (token) {
      try {
        await api.post(this.config.api.logout);
        logger.success('p:auth-provider', 'Logout en backend exitoso');
      } catch (error) {
        logger.warn('p:auth-provider', 'Error en logout:', error.message);
      }
    }

    this.clearSession();
    logger.debug('p:auth-provider', 'Sesión local limpiada');
  }

  // Obtener token
  static getToken() {
    return cache.getLocal(this.tokenKey);
  }

  // Obtener usuario
  static async getUser() {
    return cache.getLocal(this.userKey);
  }

  // Limpiar sesión
  static clearSession() {
    cache.delete(this.tokenKey);
    cache.delete(this.userKey);
  }
}

window.authJwtProvider = authJwtProvider;