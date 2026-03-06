// Estado compartido, configuración, detección de extensión y acceso por rol
class ogDatatableCore {
  static tables = new Map();
  static counter = 0;
  static customFormatters = new Map();

  static registerFormatter(name, formatterFn) {
    if (typeof formatterFn !== 'function') {
      ogLogger.error('com:datatable', `Formatter ${name} debe ser una función`);
      return;
    }
    this.customFormatters.set(name, formatterFn);
    ogLogger.info('com:datatable', `Formatter registrado: ${name}`);
  }

  static unregisterFormatter(name) {
    this.customFormatters.delete(name);
  }

  static getComponent() {
    return {};
  }

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  static detectPluginName(container) {
    const hook = ogModule('hook');
    const view = ogModule('view');

    if (!container || typeof container.closest !== 'function') {
      ogLogger.warn('com:datatable', 'Container inválido en detectPluginName');
      return null;
    }

    const viewContainer = container.closest('[data-extension]');
    if (viewContainer?.dataset.extension) return viewContainer.dataset.extension;

    const activeView = document.querySelector('.view-container[data-view]');
    if (activeView?.dataset.view) {
      const viewPath = activeView.dataset.view;
      const parts = viewPath.split('/');
      if (parts.length > 1 && hook?.isExtensionEnabled(parts[0])) {
        return parts[0];
      }
    }

    if (view?.currentPlugin) return view.currentPlugin;

    const pluginClass = Array.from(container.classList || [])
      .find(cls => cls.startsWith('extension-'));
    if (pluginClass) return pluginClass.replace('extension-', '');

    return null;
  }

  static hasRoleAccess(action) {
    const auth = ogModule('auth');
    if (!action.role) return true;
    const userRole = auth?.user?.role;
    if (!userRole) return false;
    return userRole === action.role;
  }
}

window.ogDatatableCore = ogDatatableCore;
