/**
 * @doc-start
 * FILE: middle/js/authCore.js
 * CLASS: ogAuthCore
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Estado central y ciclo de vida principal de la autenticación.
 *   Gestiona init, check de sesión activa, login y logout.
 *   Sub-módulo de ogAuth — no se usa directamente desde extensiones.
 *
 * ESTADO:
 *   config             → config auth normalizada (de appConfig.auth)
 *   user               → objeto usuario autenticado (null si no hay sesión)
 *   userPermissions    → permisos del usuario (extensions, menus, tabs)
 *   userPreferences    → preferencias del usuario (tema, idioma, etc.)
 *   sessionCheckInterval → referencia al setInterval del monitoreo
 *
 * FLUJO init():
 *   1. Normaliza config con defaults (loginView, api endpoints, TTLs)
 *   2. setupLoginHandler() → registra el handler del formulario de login
 *   3. check() → verifica token en localStorage contra /api/auth/profile
 *   4a. Autenticado: getUser() → loadUserPermissions() → startSessionMonitoring() → showApp()
 *   4b. No autenticado: showLogin()
 *
 * LOGIN (login(formIdOrCredentials)):
 *   Acepta formId (string) o credenciales directas (objeto {user, pass}).
 *   POST a config.api.login → guarda token y user en ogCache.setLocal().
 *   Recarga la página para que og-framework reinicie todo desde cero.
 *
 * LOGOUT (logout()):
 *   stopSessionMonitoring() → POST a config.api.logout → clearAppCaches()
 *   → clearSession() → window.location.reload()
 *
 * CHECK (check()):
 *   GET a config.api.me con el token actual.
 *   Si responde 200 → sesión válida, refresca el user en cache.
 *   Si falla → clearSession() y retorna false.
 *
 * CONFIG POR DEFECTO:
 *   loginView: 'middle:auth/login'
 *   redirectAfterLogin: 'middle:dashboard/dashboard'
 *   storageKey: 'auth'
 *   sessionCheckInterval: 5 min
 *   tokenTTL: 24 horas
 *   api: { login: '/api/auth/login', logout: '/api/auth/logout', me: '/api/auth/profile' }
 *
 * REGISTRO:
 *   window.ogAuthCore
 *   ogFramework.core.authCore
 * @doc-end
 */
class ogAuthCore {
  static config = {};
  static user = null;
  static userPermissions = null;
  static userPreferences = null;
  static sessionCheckInterval = null;

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  static async init() {
    const config = this.getConfig();

    this.config = {
      enabled: true,
      loginView: 'middle:auth/login',
      redirectAfterLogin: 'middle:dashboard/dashboard',
      storageKey: 'auth',
      sessionCheckInterval: 5 * 60 * 1000,
      tokenTTL: 24 * 60 * 60 * 1000,
      api: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        me: '/api/auth/profile'
      },
      ...config.auth
    };

    if (!this.config.enabled) {
      ogLogger.warn('core:auth', 'Auth deshabilitado en configuración');
      return;
    }

    ogLogger.info('core:auth', 'Inicializando autenticación...');

    ogAuthLoginForm.setupLoginHandler();

    const isAuth = await this.check();

    if (isAuth) {
      this.user = await ogAuthSession.getUser();
      ogAuthSession.normalizeConfig();
      ogAuthPermissions.loadUserPermissions();
      ogAuthSession.startSessionMonitoring();
      await ogAuthUI.showApp();
    } else {
      ogLogger.info('core:auth', 'No hay sesión activa - mostrando login');
      ogAuthUI.showLogin();
    }
  }

  static async check() {
    const token = ogAuthSession.getToken();

    if (!token) return false;

    try {
      const api = ogModule('api');
      const response = await api.get(this.config.api.me);

      if (response.success && response.data) {
        const cache = ogModule('cache');
        cache.setLocal(`${this.config.storageKey}_user`, response.data, this.config.tokenTTL);
        ogLogger.success('core:auth', 'Sesión válida');
        return true;
      }

      ogLogger.warn('core:auth', 'Respuesta inesperada del servidor');
      ogAuthSession.clearSession();
      return false;

    } catch (error) {
      ogLogger.warn('core:auth', 'Token inválido o expirado:', error.message);
      ogAuthSession.clearSession();
      return false;
    }
  }

  static async login(formIdOrCredentials) {
    try {
      ogLogger.info('core:auth', 'Iniciando login...');
      const form = ogModule('form');
      const api = ogModule('api');
      const cache = ogModule('cache');

      let credentials;
      if (typeof formIdOrCredentials === 'string') {
        const validation = form.validate(formIdOrCredentials);
        if (!validation.success) {
          ogComponent('toast')?.error(validation.message);
          return { success: false, error: validation.message };
        }
        credentials = validation.data;
      } else {
        credentials = formIdOrCredentials;
      }

      const response = await api.post(this.config.api.login, credentials, { skipAuth: true });

      if (response.success && response.data) {
        const { token, user, ttl_ms } = response.data;

        if (!token || !user) {
          ogLogger.error('core:auth', 'Respuesta incompleta del servidor');
          return { success: false, error: __('core.auth.error.server_response') };
        }

        cache.setLocal(`${this.config.storageKey}_token`, token, ttl_ms);
        cache.setLocal(`${this.config.storageKey}_user`, user, ttl_ms);

        this.user = user;

        ogLogger.success('core:auth', `Login exitoso para: ${user.user}`);

        ogAuthSession.normalizeConfig();
        ogAuthPermissions.loadUserPermissions();
        ogAuthSession.startSessionMonitoring();

        window.location.reload();

        return { success: true, user, token, ttl_ms };
      }

      ogLogger.warn('core:auth', 'Credenciales incorrectas');
      return { success: false, error: response.error || __('core.auth.error.invalid_credentials') };

    } catch (error) {
      ogLogger.error('core:auth', 'Error en login:', error.message);
      return { success: false, error: __('core.auth.error.connection') };
    }
  }

  static async logout() {
    ogAuthSession.stopSessionMonitoring();

    const token = ogAuthSession.getToken();

    if (token) {
      try {
        const api = ogModule('api');
        await api.post(this.config.api.logout);
        ogLogger.success('core:auth', 'Logout en backend exitoso');
      } catch (error) {
        ogLogger.warn('core:auth', 'Error en logout:', error.message);
      }
    }

    ogAuthUI.clearAppCaches();
    ogAuthSession.clearSession();
    this.user = null;

    ogLogger.info('core:auth', 'Sesión cerrada');
    window.location.reload();
  }
}

window.ogAuthCore = ogAuthCore;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.authCore = ogAuthCore;
}