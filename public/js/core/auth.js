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
      sessionCheckInterval: 30 * 1000,
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
      const result = await this.checkSessionWithServer();
      
      if (!result.valid) {
        logger.warn('cor:auth', 'Sesión inválida detectada');
        this.handleExpiredSession();
        return;
      }

      // ✅ Detectar si la sesión fue actualizada (permisos cambiados)
      if (result.updated) {
        logger.info('cor:auth', '🔄 Cambios detectados en la sesión, recargando permisos...');
        
        // Actualizar datos del usuario
        this.user = result.user;
        
        // Limpiar caches
        this.clearAppCaches();
        
        // Recargar permisos
        this.loadUserPermissions();
        
        // Recargar plugins y sidebar
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
    }
  }

  static async checkSession(silent = false) {
    if (!this.provider) return false;

    const tokenKey = this.provider.tokenKey || 'auth_token';
    
    // Verificar expiración local primero
    if (cache.isExpired(tokenKey)) {
      if (!silent) logger.warn('cor:auth', 'Token expirado en cache local');
      return false;
    }

    try {
      // ✅ Verificar sesión en el servidor
      const isValid = await this.provider.check();
      
      if (!isValid) {
        if (!silent) logger.warn('cor:auth', 'Sesión inválida en servidor (puede haber sido eliminada)');
      }
      
      return isValid;
    } catch (error) {
      if (!silent) logger.error('cor:auth', 'Error verificando sesión:', error);
      return false;
    }
  }

  // ✅ Verificar sesión con el servidor y detectar cambios
  static async checkSessionWithServer() {
    try {
      // ✅ Usar /user/profile que SÍ existe en el backend
      const response = await api.get('/user/profile');
      
      if (response.success && response.data) {
        return {
          valid: true,
          updated: false, // Por ahora no detectamos cambios automáticos
          user: response.data,
          expiresIn: null
        };
      }
      
      return { valid: false };
    } catch (error) {
      // Si es 401 Unauthorized, la sesión es inválida
      if (error.status === 401 || error.response?.status === 401) {
        logger.warn('cor:auth', 'Sesión inválida (401)');
        return { valid: false };
      }
      
      logger.error('cor:auth', 'Error verificando sesión:', error);
      return { valid: false };
    }
  }

  // ✅ Recargar app después de cambio de permisos
  static async reloadAppAfterPermissionChange() {
    logger.info('cor:auth', 'Recargando aplicación con nuevos permisos...');
    
    // Recargar plugins
    if (window.hook?.loadPluginHooks) {
      await hook.loadPluginHooks();
      
      if (window.view && hook.getEnabledPlugins) {
        hook.getEnabledPlugins().forEach(plugin => {
          view.registerPlugin(plugin.name, plugin);
        });
      }
    }
    
    // Filtrar plugins por nuevos permisos
    this.filterPluginsByPermissions();
    
    // Recargar sidebar
    if (window.sidebar) {
      await sidebar.init();
    }
    
    logger.success('cor:auth', 'Aplicación recargada con nuevos permisos');
  }

  static handleExpiredSession() {
    this.stopSessionMonitoring();
    
    if (window.toast) {
      // ✅ Asegurar que message sea string
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
    logger.info('cor:auth', '🔐 Iniciando carga de permisos del usuario...');
    
    if (!this.user) {
      logger.warn('cor:auth', '❌ No hay usuario autenticado');
      return;
    }

    logger.info('cor:auth', '👤 Usuario:', this.user.user, '| Role:', this.user.role);

    let config = this.user.config;
    logger.debug('cor:auth', '📄 Config original (tipo):', typeof config);
    
    if (typeof config === 'string') {
      logger.info('cor:auth', '🔄 Config es string, parseando JSON...');
      try {
        config = JSON.parse(config);
        logger.success('cor:auth', '✅ JSON parseado correctamente');
      } catch (error) {
        logger.error('cor:auth', '❌ Error parseando config:', error);
        config = { permissions: { plugins: {} }, preferences: {} };
      }
    }

    if (!config || typeof config !== 'object') {
      logger.warn('cor:auth', '⚠️ Config no válido, usando defaults');
      config = { permissions: { plugins: {} }, preferences: {} };
    }

    this.userPermissions = config.permissions || { plugins: {} };
    this.userPreferences = config.preferences || { theme: 'light', language: 'es', notifications: true };

    logger.success('cor:auth', '✅ Permisos cargados exitosamente');
    logger.info('cor:auth', '📋 Plugins con permisos:', Object.keys(this.userPermissions.plugins));
    logger.debug('cor:auth', '🔍 Detalle de permisos:', JSON.stringify(this.userPermissions, null, 2));

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

    logger.info('cor:auth', '🔍 Iniciando filtrado de plugins por permisos...');
    logger.info('cor:auth', '📋 Permisos del usuario:', JSON.stringify(this.userPermissions.plugins, null, 2));

    for (const [pluginName, plugin] of window.hook.pluginRegistry) {
      logger.info('cor:auth', `\n🔹 Procesando plugin: ${pluginName}`);
      
      const perms = this.userPermissions.plugins[pluginName];
      logger.debug('cor:auth', `  Permisos para ${pluginName}:`, perms);

      // Si el plugin NO está en permisos, deshabilitarlo
      if (!perms) {
        plugin.enabled = false;
        logger.warn('cor:auth', `  ❌ Plugin deshabilitado (no en permisos): ${pluginName}`);
        continue;
      }

      // Si perms.enabled === false, deshabilitarlo
      if (perms.enabled === false) {
        plugin.enabled = false;
        logger.warn('cor:auth', `  ❌ Plugin deshabilitado (enabled=false): ${pluginName}`);
        continue;
      }

      // Si perms.enabled === true, habilitarlo
      if (perms.enabled === true) {
        plugin.enabled = true;
        logger.success('cor:auth', `  ✅ Plugin habilitado: ${pluginName}`);

        // Log del estado ANTES del filtrado
        if (plugin.menu?.items) {
          logger.info('cor:auth', `  📂 Menús ANTES del filtrado (${plugin.menu.items.length}):`, 
            plugin.menu.items.map(item => item.id));
        }

        // Filtrar menús si es necesario
        if (perms.menus !== '*' && plugin.menu?.items && typeof perms.menus === 'object') {
          logger.info('cor:auth', `  🔍 Filtrando menús para ${pluginName}...`);
          logger.debug('cor:auth', `  Permisos de menús:`, perms.menus);
          
          const allowedMenuIds = Object.keys(perms.menus).filter(key => {
            const menuPerm = perms.menus[key];
            logger.debug('cor:auth', `    - Evaluando menú "${key}":`, menuPerm);
            
            // Aceptar boolean true O objetos con enabled: true
            if (menuPerm === true) {
              logger.success('cor:auth', `      ✅ Menú "${key}" permitido (boolean true)`);
              return true;
            }
            if (typeof menuPerm === 'object' && menuPerm.enabled === true) {
              logger.success('cor:auth', `      ✅ Menú "${key}" permitido (enabled: true)`, menuPerm);
              return true;
            }
            logger.warn('cor:auth', `      ❌ Menú "${key}" bloqueado`, menuPerm);
            return false;
          });
          
          logger.info('cor:auth', `  ✅ Menús permitidos para ${pluginName}:`, allowedMenuIds);
          
          const itemsBeforeFilter = plugin.menu.items.length;
          plugin.menu.items = plugin.menu.items.filter(item => allowedMenuIds.includes(item.id));
          const itemsAfterFilter = plugin.menu.items.length;
          
          logger.success('cor:auth', `  📊 Filtrado completado: ${itemsBeforeFilter} → ${itemsAfterFilter} menús`);
          logger.info('cor:auth', `  📂 Menús DESPUÉS del filtrado:`, 
            plugin.menu.items.map(item => item.id));
        } else if (perms.menus === '*') {
          logger.info('cor:auth', `  ⭐ Acceso total a todos los menús de ${pluginName}`);
        } else {
          logger.info('cor:auth', `  ℹ️ Sin filtrado de menús para ${pluginName}`);
        }
      }
    }

    // Resumen final
    logger.success('cor:auth', '\n📊 RESUMEN DEL FILTRADO DE PLUGINS:');
    const summary = [];
    for (const [pluginName, plugin] of window.hook.pluginRegistry) {
      if (plugin.enabled) {
        const menuCount = plugin.menu?.items?.length || 0;
        summary.push(`  ✅ ${pluginName}: ${menuCount} menú${menuCount !== 1 ? 's' : ''}`);
      } else {
        summary.push(`  ❌ ${pluginName}: deshabilitado`);
      }
    }
    logger.info('cor:auth', summary.join('\n'));
    logger.success('cor:auth', '✅ Filtrado de plugins completado\n');
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