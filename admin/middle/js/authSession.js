/**
 * @doc-start
 * FILE: middle/js/authSession.js
 * CLASS: ogAuthSession
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Gestión del token y monitoreo periódico de sesión.
 *   Lee/escribe el token en ogCache.localStorage y verifica la sesión
 *   contra el servidor en intervalos configurables.
 *   Sub-módulo de ogAuth — no se usa directamente desde extensiones.
 *
 * SESIÓN:
 *   getToken()       → lee token de ogCache.getLocal(storageKey_token)
 *   getUser()        → lee user de ogCache.getLocal(storageKey_user)
 *   clearSession()   → elimina token y user del cache
 *   isAuthenticated() → !!user && !!getToken()
 *   normalizeConfig() → parsea user.config si viene como JSON string
 *
 * MONITOREO (startSessionMonitoring):
 *   setInterval cada config.sessionCheckInterval (default 5min).
 *   Cada tick llama checkSessionWithServer() → GET config.api.me.
 *   Si falla con 401 → handleSessionExpired() → reload tras 1.5s.
 *
 * EXPIRACIÓN (handleSessionExpired):
 *   stopSessionMonitoring() → clearSession() → toast warning
 *   → setTimeout 1500ms → window.location.reload()
 *
 * REGISTRO:
 *   window.ogAuthSession
 *   ogFramework.core.authSession
 * @doc-end
 */
class ogAuthSession {

  static getToken() {
    const cache = ogModule('cache');
    return cache.getLocal(`${ogAuthCore.config.storageKey}_token`);
  }

  static async getUser() {
    const cache = ogModule('cache');
    return cache.getLocal(`${ogAuthCore.config.storageKey}_user`);
  }

  static clearSession() {
    const cache = ogModule('cache');
    cache.delete(`${ogAuthCore.config.storageKey}_token`);
    cache.delete(`${ogAuthCore.config.storageKey}_user`);
  }

  static isAuthenticated() {
    return !!ogAuthCore.user && !!this.getToken();
  }

  static normalizeConfig() {
    if (!ogAuthCore.user || !ogAuthCore.user.config) return;

    if (typeof ogAuthCore.user.config === 'string') {
      try {
        ogAuthCore.user.config = JSON.parse(ogAuthCore.user.config);
      } catch (e) {
        ogLogger.error('core:auth', 'Error parseando config:', e);
        ogAuthCore.user.config = { permissions: {}, preferences: {} };
      }
    }
  }

  static startSessionMonitoring() {
    if (ogAuthCore.sessionCheckInterval) {
      clearInterval(ogAuthCore.sessionCheckInterval);
    }

    const intervalMs = ogAuthCore.config.sessionCheckInterval;
    ogLogger.info('core:auth', `⏱️ Monitoreo de sesión cada ${Math.round(intervalMs / 1000)}s`);

    ogAuthCore.sessionCheckInterval = setInterval(async () => {
      await this.checkSessionWithServer();
    }, intervalMs);
  }

  static stopSessionMonitoring() {
    if (ogAuthCore.sessionCheckInterval) {
      clearInterval(ogAuthCore.sessionCheckInterval);
      ogAuthCore.sessionCheckInterval = null;
      ogLogger.info('core:auth', '⏱️ Monitoreo de sesión detenido');
    }
  }

  static async checkSessionWithServer() {
    const token = this.getToken();

    if (!token) {
      this.handleSessionExpired();
      return;
    }

    try {
      const api = ogModule('api');
      const response = await api.get(ogAuthCore.config.api.me);

      if (!response.success || !response.data) {
        this.handleSessionExpired();
      }

    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Token')) {
        this.handleSessionExpired();
      } else {
        ogLogger.error('core:auth', 'Error en verificación de sesión:', error.message);
      }
    }
  }

  static handleSessionExpired() {
    this.stopSessionMonitoring();
    this.clearSession();
    ogAuthCore.user = null;

    ogComponent('toast')?.warning(__('core.auth.session.expired'));
    ogLogger.warn('core:auth', '⚠️ Sesión expirada, redirigiendo al login...');

    setTimeout(() => window.location.reload(), 1500);
  }
}

window.ogAuthSession = ogAuthSession;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.authSession = ogAuthSession;
}