class auth {
  static config = {};
  static user = null;
  static userPermissions = null;
  static userPreferences = null;
  static sessionCheckInterval = null;

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  
  static async init(config) {
    this.config = {
      enabled: true,
      loginView: 'auth/login',
      redirectAfterLogin: 'dashboard',
      storageKey: 'factory_auth',
      sessionCheckInterval: 5 * 60 * 1000,
      tokenTTL: 24 * 60 * 60 * 1000,
      api: {
        login: '/api/user/login',
        logout: '/api/user/logout',
        me: '/api/user/profile'
      },
      ...config
    };

    if (!this.config.enabled) return;

    logger.debug('cor:auth', 'Inicializando autenticación...');

    // Interceptar formulario de login
    this.setupLoginHandler();

    // Verificar si hay sesión válida
    const isAuth = await this.check();

    if (isAuth) {
      this.user = await this.getUser();
      this.normalizeConfig();
      this.loadUserPermissions();
      this.startSessionMonitoring();
      await this.showApp();
    } else {
      this.showLogin();
    }
  }

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  static async check() {
    const token = this.getToken();

    if (!token) {
      logger.debug('cor:auth', 'No hay token guardado');
      return false;
    }

    // Verificar si el token está expirado localmente
    if (cache.isExpired(`${this.config.storageKey}_token`)) {
      logger.warn('cor:auth', 'Token expirado en cache local');
      this.clearSession();
      return false;
    }

    try {
      const response = await api.get(this.config.api.me);

      if (response.success && response.data) {
        // Actualizar usuario en cache
        cache.setLocal(`${this.config.storageKey}_user`, response.data, this.config.tokenTTL);
        logger.success('cor:auth', 'Sesión válida');
        return true;
      }

      logger.warn('cor:auth', 'Respuesta inesperada del servidor');
      this.clearSession();
      return false;

    } catch (error) {
      logger.warn('cor:auth', 'Token inválido o expirado:', error.message);
      this.clearSession();
      return false;
    }
  }

  static async login(credentials) {
    try {
      logger.debug('cor:auth', 'Iniciando login...');

      const response = await api.post(this.config.api.login, credentials);

      logger.debug('cor:auth', 'Respuesta del servidor:', response);

      if (response.success && response.data) {
        const { token, user, ttl_ms } = response.data;

        if (!token || !user) {
          logger.error('cor:auth', 'Respuesta incompleta del servidor');
          return {
            success: false,
            error: 'Error en la respuesta del servidor'
          };
        }

        // Usar TTL del backend o fallback
        const tokenTTL = ttl_ms || this.config.tokenTTL;

        // Guardar en cache
        cache.setLocal(`${this.config.storageKey}_token`, token, tokenTTL);
        cache.setLocal(`${this.config.storageKey}_user`, user, tokenTTL);

        // Guardar usuario en memoria
        this.user = user;

        logger.success('cor:auth', `Login exitoso para: ${user.user}`);
        logger.info('cor:auth', `Token expira en: ${Math.round(tokenTTL / 1000 / 60)} minutos`);

        // Cargar permisos y mostrar app
        this.normalizeConfig();
        this.loadUserPermissions();
        await this.showApp();
        this.startSessionMonitoring();

        return { success: true, user, token, ttl_ms: tokenTTL };
      }

      logger.warn('cor:auth', 'Credenciales incorrectas');
      return {
        success: false,
        error: response.error || 'Usuario o contraseña incorrectos'
      };

    } catch (error) {
      logger.error('cor:auth', 'Error en login:', error.message);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }

  static async logout() {
    this.stopSessionMonitoring();

    const token = this.getToken();

    if (token) {
      try {
        await api.post(this.config.api.logout);
        logger.success('cor:auth', 'Logout en backend exitoso');
      } catch (error) {
        logger.warn('cor:auth', 'Error en logout:', error.message);
      }
    }

    this.clearAppCaches();
    this.clearSession();
    this.user = null;
    
    logger.debug('cor:auth', 'Sesión cerrada');
    
    window.location.reload();
  }

  // ============================================
  // MANEJO DEL FORMULARIO DE LOGIN
  // ============================================

  static setupLoginHandler() {
    if (!window.events) {
      logger.error('cor:auth', 'events.js no está cargado');
      return;
    }

    events.on('form[data-form-id*="login-form"]', 'submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const form = this;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Validar campos requeridos
      if (!data.user || !data.pass) {
        auth.showLoginError(form, 'Usuario y contraseña son requeridos');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Ingresando...';
      }

      // Login
      const result = await auth.login(data);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }

      if (!result.success) {
        logger.warn('cor:auth', 'Login falló:', result.error);
        auth.showLoginError(form, result.error || 'Error al iniciar sesión');
      }
    }, document);

    logger.debug('cor:auth', 'Handler de login registrado');
  }

  static showLoginError(form, message) {
    let error = form.querySelector('.form-error');
    if (!error) {
      error = document.createElement('div');
      error.className = 'form-error';
      form.insertBefore(error, form.firstChild);
    }

    error.innerHTML = `
      <div style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; border: 1px solid #f5c6cb; margin-bottom: 1rem;">
        ⚠️ ${message}
      </div>
    `;

    setTimeout(() => error.remove(), 5000);
  }

  // ============================================
  // SESIÓN
  // ============================================

  static getToken() {
    return cache.getLocal(`${this.config.storageKey}_token`);
  }

  static async getUser() {
    return cache.getLocal(`${this.config.storageKey}_user`);
  }

  static clearSession() {
    cache.delete(`${this.config.storageKey}_token`);
    cache.delete(`${this.config.storageKey}_user`);
  }

  static isAuthenticated() {
    return !!this.user && !!this.getToken();
  }

  // ============================================
  // MONITOREO DE SESIÓN
  // ============================================

  static startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    const intervalSeconds = Math.round(this.config.sessionCheckInterval / 1000);
    const endpoint = this.config.api.me;
    
    logger.info('cor:auth', `⏱️ Iniciando monitoreo de sesión cada ${intervalSeconds} segundos`);
    logger.info('cor:auth', `📡 Endpoint de verificación: ${endpoint}`);

    this.sessionCheckInterval = setInterval(async () => {
      logger.debug('cor:auth', '🔍 Verificando sesión en servidor...');
      const result = await this.checkSessionWithServer();
      
      if (!result.valid) {
        logger.warn('cor:auth', 'Sesión inválida detectada');
        this.handleExpiredSession();
        return;
      }

      logger.debug('cor:auth', '✅ Sesión válida');

      if (result.updated) {
        logger.info('cor:auth', '🔄 Cambios detectados en la sesión, recargando permisos...');
        
        this.user = result.user;
        this.clearAppCaches();
        this.loadUserPermissions();
        await this.reloadAppAfterPermissionChange();
        
        toast.show({
          message: '✅ Tus permisos han sido actualizados',
          type: 'success',
          duration: 3000
        });
      }
    }, this.config.sessionCheckInterval);
  }

  static stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
      logger.debug('cor:auth', 'Monitoreo de sesión detenido');
    }
  }

  static async checkSessionWithServer() {
    try {
      const endpoint = this.config.api.me;
      const response = await api.get(endpoint);
      
      if (response.success && response.data) {
        return {
          valid: true,
          updated: false,
          user: response.data,
          expiresIn: null
        };
      }
      
      logger.warn('cor:auth', 'Respuesta inesperada del servidor:', response);
      return { valid: false };
    } catch (error) {
      if (error.status === 401 || error.response?.status === 401) {
        logger.warn('cor:auth', '❌ Sesión inválida (401 Unauthorized)');
        return { valid: false };
      }
      
      logger.error('cor:auth', 'Error verificando sesión:', {
        message: error.message,
        status: error.status
      });
      
      return { valid: true };
    }
  }

  static handleExpiredSession() {
    this.stopSessionMonitoring();
    
    if (window.toast) {
      const message = 'Tu sesión ha expirado o fue invalidada. Por favor, inicia sesión nuevamente.';
      
      toast.show({
        message: message,
        type: 'warning',
        duration: 5000
      });
      
      logger.warn('cor:auth', message);
    }

    setTimeout(() => {
      this.clearAppCaches();
      this.user = null;
      this.clearSession();
      this.showLogin();
    }, 2000);
  }

  // ============================================
  // PERMISOS
  // ============================================

  static loadUserPermissions() {
    if (!this.user || !this.user.config) {
      logger.warn('cor:auth', 'No hay configuración de usuario');
      return;
    }

    logger.info('cor:auth', '🔐 Iniciando carga de permisos del usuario...');
    logger.debug('cor:auth', '👤 Usuario:', this.user.user, '| Role:', this.user.role);

    const config = this.user.config;
    this.userPermissions = config.permissions || {};
    this.userPreferences = config.preferences || {};

    logger.success('cor:auth', '✅ Permisos cargados exitosamente');
    logger.debug('cor:auth', '📋 Config original (tipo):', typeof config);

    if (this.userPermissions.plugins) {
      const pluginsWithPerms = Object.keys(this.userPermissions.plugins);
      logger.info('cor:auth', `📋 Plugins con permisos: [${pluginsWithPerms.map(p => `"${p}"`).join(', ')}]`);
    }

    this.filterPluginsByPermissions();
  }

  static filterPluginsByPermissions() {
    if (!window.hook || !hook.pluginRegistry) {
      logger.warn('cor:auth', 'hook.pluginRegistry no disponible');
      return;
    }

    const permissions = this.userPermissions?.plugins || {};

    logger.info('cor:auth', '🔍 Iniciando filtrado de plugins por permisos...');

    for (const [pluginName, pluginConfig] of hook.pluginRegistry) {
      const pluginPerms = permissions[pluginName];

      if (!pluginPerms || pluginPerms.enabled === false) {
        pluginConfig.enabled = false;
        logger.warn('cor:auth', `❌ Plugin deshabilitado: ${pluginName}`);
        continue;
      }

      logger.success('cor:auth', `✅ Plugin habilitado: ${pluginName}`);

      if (!pluginConfig.hasMenu || !pluginConfig.menu) continue;

      const menuPerms = pluginPerms.menus;

      if (menuPerms === '*') {
        logger.info('cor:auth', `  ✨ Acceso total a menús de: ${pluginName}`);
        continue;
      }

      if (!menuPerms || typeof menuPerms !== 'object') {
        pluginConfig.menu.items = [];
        logger.warn('cor:auth', `  ⚠️ Sin permisos de menús para: ${pluginName}`);
        continue;
      }

      const originalMenus = [...(pluginConfig.menu.items || [])];
      logger.info('cor:auth', `  📂 Menús ANTES del filtrado (${originalMenus.length}): [${originalMenus.map(m => `"${m.id}"`).join(', ')}]`);

      const allowedMenuIds = Object.keys(menuPerms).filter(key => {
        const menuPerm = menuPerms[key];
        if (menuPerm === true) return true;
        if (typeof menuPerm === 'object' && menuPerm.enabled === true) return true;
        return false;
      });

      logger.info('cor:auth', `  ✅ Menús permitidos para ${pluginName}: [${allowedMenuIds.map(m => `"${m}"`).join(', ')}]`);

      const filteredMenus = originalMenus.filter(menu => {
        const isAllowed = allowedMenuIds.includes(menu.id);
        if (isAllowed) {
          logger.success('cor:auth', `    ✅ Menú "${menu.id}" permitido`);
        } else {
          logger.warn('cor:auth', `    ❌ Menú "${menu.id}" bloqueado`);
        }
        return isAllowed;
      });

      pluginConfig.menu.items = filteredMenus;

      logger.info('cor:auth', `  📊 Filtrado completado: ${originalMenus.length} → ${filteredMenus.length} menús`);
      logger.info('cor:auth', `  📂 Menús DESPUÉS del filtrado: [${filteredMenus.map(m => `"${m.id}"`).join(', ')}]`);
    }

    logger.success('cor:auth', '📊 RESUMEN DEL FILTRADO DE PLUGINS:');
    for (const [pluginName, pluginConfig] of hook.pluginRegistry) {
      if (pluginConfig.enabled && pluginConfig.hasMenu) {
        const menuCount = pluginConfig.menu.items?.length || 0;
        logger.success('cor:auth', `  ✅ ${pluginName}: ${menuCount} menú${menuCount !== 1 ? 's' : ''}`);
      } else if (!pluginConfig.enabled) {
        logger.warn('cor:auth', `  ❌ ${pluginName}: deshabilitado`);
      }
    }

    logger.success('cor:auth', '✅ Filtrado de plugins completado');
  }

  static getTabPermissions(menuId) {
    if (!this.userPermissions?.plugins) return null;

    for (const pluginName in this.userPermissions.plugins) {
      const plugin = this.userPermissions.plugins[pluginName];
      
      if (plugin.menus && plugin.menus[menuId]) {
        const menuPerm = plugin.menus[menuId];
        
        if (menuPerm === true) return '*';
        if (typeof menuPerm === 'object' && menuPerm.tabs) {
          return menuPerm.tabs;
        }
      }
    }

    return null;
  }

  static normalizeConfig() {
    if (!this.user || !this.user.config) return;

    if (typeof this.user.config === 'string') {
      try {
        this.user.config = JSON.parse(this.user.config);
        logger.debug('cor:auth', 'Config parseado de string a objeto');
      } catch (e) {
        logger.error('cor:auth', 'Error parseando config:', e);
        this.user.config = { permissions: {}, preferences: {} };
      }
    }
  }

  // ============================================
  // UI
  // ============================================

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

    document.body.setAttribute('data-view', 'app-view');

    if (window.sidebar) {
      await sidebar.init();
    }

    if (window.view) {
      const viewToLoad = this.config.redirectAfterLogin || 'dashboard';
      view.loadView(viewToLoad);
    }
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
      sidebar.menuItems = [];
    }

    logger.success('cor:auth', 'Caches de aplicación limpiados');
  }

  static async reloadAppAfterPermissionChange() {
    logger.info('cor:auth', 'Recargando aplicación con nuevos permisos...');
    
    if (window.hook?.loadPluginHooks) {
      await hook.loadPluginHooks();
      
      if (window.view && hook.getEnabledPlugins) {
        const enabledPlugins = hook.getEnabledPlugins();
        view.loadedPlugins = {};
        
        for (const plugin of enabledPlugins) {
          view.loadedPlugins[plugin.name] = true;
        }
      }
    }
    
    this.filterPluginsByPermissions();
    
    if (window.sidebar) {
      await sidebar.init();
    }
    
    logger.success('cor:auth', 'Aplicación recargada con nuevos permisos');
  }
}

window.auth = auth;