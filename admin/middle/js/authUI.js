/**
 * @doc-start
 * FILE: middle/js/authUI.js
 * CLASS: ogAuthUI
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Acciones de UI relacionadas con la autenticación: mostrar pantalla de login
 *   o app, limpiar caches al hacer logout, recargar la app tras cambio de
 *   permisos e inyectar el botón de logout en el sidebar.
 *   Sub-módulo de ogAuth — no se usa directamente desde extensiones.
 *
 * SHOW LOGIN (showLogin):
 *   layout.init('auth') → estructura mínima sin sidebar
 *   document.body.setAttribute('data-view', 'login-view')
 *   view.loadView('middle:auth/login')
 *
 * SHOW APP (showApp):
 *   Solo marca data-view='app-view' en body.
 *   og-framework.js es quien llama layout/hooks/sidebar/view después.
 *
 * CLEAR APP CACHES (clearAppCaches):
 *   Limpia viewNavigationCache, schemas del form, pluginRegistry del hook,
 *   menuItems del sidebar y todo el cache localStorage del slug activo.
 *   Llamado antes de logout para dejar el estado limpio.
 *
 * RELOAD APP (reloadAppAfterPermissionChange):
 *   Recarga extensiones (hook.loadPluginHooks), filtra por nuevos permisos
 *   y re-renderiza el sidebar. Útil desde el panel de administración de permisos.
 *
 * INJECT LOGOUT BUTTON (injectLogoutButton):
 *   Llamado por ogTrigger.execute('sidebar:footer').
 *   Inyecta HTML con nombre de usuario y botón de logout en la zona footer
 *   del sidebar. El botón tiene confirm() antes de llamar ogAuthCore.logout().
 *
 * REGISTRO:
 *   window.ogAuthUI
 *   ogFramework.core.authUI
 * @doc-end
 */
class ogAuthUI {

  static showLogin() {
    const layout = ogModule('layout');
    const view   = ogModule('view');

    if (layout) layout.init('auth');

    document.body.setAttribute('data-view', 'login-view');

    if (view) view.loadView('middle:auth/login');
  }

  static async showApp() {
    ogLogger?.info('core:auth', '✅ Usuario autenticado - preparando app...');
    document.body.setAttribute('data-view', 'app-view');
    // og-framework.js se encarga de layout → hooks → sidebar → defaultView
  }

  static clearAppCaches() {
    ogLogger.info('core:auth', 'Limpiando caches de aplicación...');

    const view    = ogModule('view');
    const form    = ogModule('form');
    const hook    = ogModule('hook');
    const sidebar = ogModule('sidebar');
    const cache   = ogModule('cache');

    if (view) {
      if (view.viewNavigationCache) view.viewNavigationCache.clear();
      view.views = {};
      view.loadedExtensions = {};
    }

    if (form) {
      if (form.schemas)         form.schemas.clear();
      if (form.registeredEvents) form.registeredEvents.clear();
    }

    if (hook) {
      hook.menuItems      = [];
      hook.pluginRegistry = new Map();
      hook.loadedHooks    = new Set();
    }

    if (sidebar) sidebar.menuItems = [];

    if (cache) cache.clear();

    ogLogger.success('core:auth', 'Caches de aplicación limpiados');
  }

  static async reloadAppAfterPermissionChange() {
    ogLogger.info('core:auth', 'Recargando aplicación con nuevos permisos...');

    const hook    = ogModule('hook');
    const view    = ogModule('view');
    const sidebar = ogModule('sidebar');

    if (hook?.loadPluginHooks) {
      await hook.loadPluginHooks();

      if (view && hook.getEnabledExtensions) {
        const enabled = hook.getEnabledExtensions();
        view.loadedExtensions = {};
        for (const ext of enabled) {
          view.loadedExtensions[ext.name] = true;
        }
      }
    }

    ogAuthPermissions.filterExtensionsByPermissions();

    if (sidebar) await sidebar.init();

    ogLogger.success('core:auth', 'Aplicación recargada con nuevos permisos');
  }

  static injectLogoutButton(target) {
    const config = window.ogFramework?.activeConfig || window.appConfig || {};

    if (!config.auth?.enabled) return;

    const user     = ogAuthCore.user;
    const userName = user?.user || user?.email || __('core.sidebar.user_default');

    const html = `
      <div class="sidebar-user">
        <span class="user-icon">👤</span>
        <span class="user-name">${userName}</span>
      </div>
      <button class="btn btn-logout" id="btn-logout">
        <span class="logout-icon">🚪</span>
        <span class="logout-text">${__('core.sidebar.logout')}</span>
      </button>
    `;

    const sidebar = ogModule('sidebar');
    if (sidebar?.inject) {
      const zone = target.split(':')[1];
      sidebar.inject(zone, html);

      setTimeout(() => {
        const btn = document.getElementById('btn-logout');
        if (btn) {
          btn.addEventListener('click', async () => {
            if (confirm(__('core.sidebar.logout_confirm'))) {
              await ogAuthCore.logout();
            }
          });
        }
      }, 0);
    }
  }
}

window.ogAuthUI = ogAuthUI;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.authUI = ogAuthUI;
}