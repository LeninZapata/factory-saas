class authJwtProvider {
  static tokenKey = 'auth_token';
  static userKey = 'auth_user';
  static config = {};

  static init(config) {
    this.config = config;
    console.log('🔐 JWT Provider: Configuración recibida:', config);
  }

  static async check() {
    console.log('🔐 JWT Provider: Verificando token...');
    const token = cache.getLocal(this.tokenKey);
    console.log('🔐 JWT Provider: Token encontrado:', token ? 'SÍ' : 'NO');
    
    if (!token) return false;
    
    if (window.appConfig?.isDevelopment) {
      console.log('🔐 JWT Provider: Modo desarrollo - token válido');
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
    console.log('🔐 JWT Provider: Login iniciado');
    console.log('🔐 JWT Provider: Modo desarrollo:', window.appConfig?.isDevelopment);
    
    if (window.appConfig?.isDevelopment) {
      console.log('🔐 JWT Provider: Usando mockLogin');
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
      return { success: false, error: error.message };
    }
  }

  static mockLogin(credentials) {
    console.log('🔐 JWT Provider: Mock login - verificando credenciales');
    console.log('🔐 JWT Provider: Email:', credentials.email);
    console.log('🔐 JWT Provider: Password:', credentials.password ? '***' : 'vacío');
    
    if (credentials.email === 'admin@test.com' && credentials.password === '123456') {
      const user = { id: 1, name: 'Admin Demo', email: credentials.email, role: 'Admin' };
      const token = 'mock-token-' + Date.now();
      
      console.log('🔐 JWT Provider: Credenciales correctas!');
      console.log('🔐 JWT Provider: Guardando token:', token);
      console.log('🔐 JWT Provider: Guardando usuario:', user);
      
      cache.setLocal(this.tokenKey, token, this.config.tokenTTL);
      cache.setLocal(this.userKey, user, this.config.tokenTTL);
      
      console.log('🔐 JWT Provider: Datos guardados en cache');
      console.log('🔐 JWT Provider: Verificando cache...');
      console.log('  - Token en cache:', cache.getLocal(this.tokenKey));
      console.log('  - Usuario en cache:', cache.getLocal(this.userKey));
      
      return { success: true, user };
    }
    
    console.log('🔐 JWT Provider: Credenciales incorrectas');
    return { success: false, error: 'Credenciales inválidas' };
  }

  static async logout() {
    console.log('🔐 JWT Provider: Logout iniciado');
    if (!window.appConfig?.isDevelopment) {
      try { await api.post(this.config.api.logout); } catch {}
    }
    cache.delete(this.tokenKey);
    cache.delete(this.userKey);
    console.log('🔐 JWT Provider: Cache limpiado');
  }

  static getToken() {
    return cache.getLocal(this.tokenKey);
  }

  static async getUser() {
    return cache.getLocal(this.userKey);
  }
}

window.authJwtProvider = authJwtProvider;