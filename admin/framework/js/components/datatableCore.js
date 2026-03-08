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
/**
 * @doc-start
 * FILE: framework/js/components/datatableCore.js
 * CLASS: ogDatatableCore
 * TYPE: component-internal
 * PROMPT: fe-components
 *
 * ROLE:
 *   Estado compartido y utilidades base del sistema datatable.
 *   Mantiene el Map de tablas activas, el contador de IDs, y el registro
 *   de formatters custom. Sub-módulo de ogDatatable — no se usa directamente.
 *
 * ESTADO:
 *   tables          → Map<tableId, { config, data, extensionName, container }>
 *   counter         → entero autoincrementado para IDs únicos (datatable-1, datatable-2...)
 *   customFormatters → Map<name, fn> de formatters registrados por extensiones
 *
 * DETECCIÓN DE EXTENSIÓN (detectPluginName):
 *   Busca en orden: data-extension en ancestro → data-view en .view-container
 *   → view.currentPlugin → clase CSS 'extension-{name}' en el container.
 *
 * FORMATTERS CUSTOM (registerFormatter / unregisterFormatter):
 *   Permiten a extensiones registrar funciones de formato para columnas:
 *   ogDatatable.registerFormatter('estado', (val, row) => `<span class="${val}">${val}</span>`)
 *   Usados en column.format: 'estado' dentro del JSON de vista.
 *
 * ACCESO POR ROL (hasRoleAccess):
 *   Si action.role está definido, compara con ogAuth.user.role.
 *   Admin siempre tiene acceso. Null/undefined role → acceso libre.
 *
 * REGISTRO:
 *   window.ogDatatableCore
 *   ogFramework.components.datatableCore
 * @doc-end
 */