/**
 * @doc-start
 * FILE: middle/js/auth.js
 * CLASS: ogAuth
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Fachada del sistema de autenticación. Re-expone todos los métodos de
 *   ogAuthCore, ogAuthSession, ogAuthPermissions, ogAuthLoginForm y ogAuthUI
 *   bajo una sola clase. El código externo (og-framework, extensiones) solo
 *   necesita ogAuth — los sub-módulos son internos.
 *
 * ORDEN DE CARGA (en framework-manifest.json o en auth.css):
 *   authLoginForm.js → authSession.js → authPermissions.js → authUI.js
 *   → authCore.js → auth.js (fachada)
 *
 * MÉTODOS DELEGADOS:
 *   init, check, login, logout                              → ogAuthCore
 *   getToken, getUser, clearSession, isAuthenticated,
 *   normalizeConfig, startSessionMonitoring,
 *   stopSessionMonitoring, handleSessionExpired             → ogAuthSession
 *   loadUserPermissions, filterExtensionsByPermissions,
 *   getTabPermissions                                       → ogAuthPermissions
 *   setupLoginHandler, showLoginError                       → ogAuthLoginForm
 *   showLogin, showApp, clearAppCaches,
 *   reloadAppAfterPermissionChange, injectLogoutButton      → ogAuthUI
 *
 * PROPIEDADES PROXY:
 *   ogAuth.user              → ogAuthCore.user
 *   ogAuth.userPermissions   → ogAuthCore.userPermissions
 *   ogAuth.userPreferences   → ogAuthCore.userPreferences
 *   ogAuth.config            → ogAuthCore.config
 *
 * USO TÍPICO:
 *   ogAuth.isAuthenticated()
 *   ogAuth.login({ user: 'admin', pass: '1234' })
 *   ogAuth.logout()
 *   ogAuth.getTabPermissions('admin-usuarios')
 *   ogAuth.reloadAppAfterPermissionChange()
 *
 * REGISTRO:
 *   window.ogAuth
 *   ogFramework.core.auth
 * @doc-end
 */
class ogAuth {
  // ── Propiedades proxy ──────────────────────────────────────────────────────
  static get user()             { return ogAuthCore.user; }
  static set user(v)            { ogAuthCore.user = v; }
  static get userPermissions()  { return ogAuthCore.userPermissions; }
  static get userPreferences()  { return ogAuthCore.userPreferences; }
  static get config()           { return ogAuthCore.config; }

  // ── ogAuthCore ─────────────────────────────────────────────────────────────
  static async init()                    { return ogAuthCore.init(); }
  static async check()                   { return ogAuthCore.check(); }
  static async login(creds)              { return ogAuthCore.login(creds); }
  static async logout()                  { return ogAuthCore.logout(); }

  // ── ogAuthSession ──────────────────────────────────────────────────────────
  static getToken()                      { return ogAuthSession.getToken(); }
  static async getUser()                 { return ogAuthSession.getUser(); }
  static clearSession()                  { return ogAuthSession.clearSession(); }
  static isAuthenticated()               { return ogAuthSession.isAuthenticated(); }
  static normalizeConfig()               { return ogAuthSession.normalizeConfig(); }
  static startSessionMonitoring()        { return ogAuthSession.startSessionMonitoring(); }
  static stopSessionMonitoring()         { return ogAuthSession.stopSessionMonitoring(); }
  static handleSessionExpired()          { return ogAuthSession.handleSessionExpired(); }

  // ── ogAuthPermissions ──────────────────────────────────────────────────────
  static loadUserPermissions()           { return ogAuthPermissions.loadUserPermissions(); }
  static filterExtensionsByPermissions() { return ogAuthPermissions.filterExtensionsByPermissions(); }
  static getTabPermissions(menuId)       { return ogAuthPermissions.getTabPermissions(menuId); }

  // ── ogAuthLoginForm ────────────────────────────────────────────────────────
  static setupLoginHandler()             { return ogAuthLoginForm.setupLoginHandler(); }
  static showLoginError(form, msg)       { return ogAuthLoginForm.showLoginError(form, msg); }

  // ── ogAuthUI ───────────────────────────────────────────────────────────────
  static showLogin()                     { return ogAuthUI.showLogin(); }
  static async showApp()                 { return ogAuthUI.showApp(); }
  static clearAppCaches()                { return ogAuthUI.clearAppCaches(); }
  static async reloadAppAfterPermissionChange() { return ogAuthUI.reloadAppAfterPermissionChange(); }
  static injectLogoutButton(target)      { return ogAuthUI.injectLogoutButton(target); }
}

// Exponer globalmente
window.ogAuth = ogAuth;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.auth = ogAuth;
}

// Trigger para inyectar logout en sidebar footer
if (typeof window.ogTrigger !== 'undefined') {
  ogTrigger.register('sidebar:footer', 'ogAuth', 'injectLogoutButton');
}