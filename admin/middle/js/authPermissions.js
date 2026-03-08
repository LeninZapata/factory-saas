/**
 * @doc-start
 * FILE: middle/js/authPermissions.js
 * CLASS: ogAuthPermissions
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Carga y aplicación de permisos del usuario sobre extensiones y menús.
 *   Lee los permisos desde user.config.permissions, los normaliza y los
 *   aplica sobre pluginRegistry para deshabilitar lo que el usuario no puede ver.
 *   Sub-módulo de ogAuth — no se usa directamente desde extensiones.
 *
 * ESTRUCTURA DE PERMISOS (userPermissions):
 *   {
 *     extensions: {
 *       admin: {
 *         enabled: true,
 *         menus: {
 *           'admin-usuarios': { enabled: true, tabs: ['basicos', 'permisos'] },
 *           'admin-config':   true
 *         }
 *       }
 *     }
 *   }
 *
 * FILTRADO (filterExtensionsByPermissions):
 *   Admin → no filtra nada.
 *   Por cada extensión en pluginRegistry:
 *     - Sin permisos o enabled:false → pluginConfig.enabled = false
 *     - menus:'*' → acceso total a todos los menús
 *     - menus:{} → filtra pluginConfig.menu.items por allowedMenuIds
 *
 * TABS (getTabPermissions):
 *   Retorna la lista de tabs permitidas para un menuId específico.
 *   '*' → todas las tabs. Array → solo esas. null → sin restricción registrada.
 *   Usado por ogViewLoader.filterTabsByPermissions().
 *
 * NORMALIZACIÓN:
 *   Soporta tanto 'plugins' como 'extensions' como key del objeto de permisos.
 *   Si viene 'plugins', lo renombra a 'extensions' automáticamente.
 *
 * REGISTRO:
 *   window.ogAuthPermissions
 *   ogFramework.core.authPermissions
 * @doc-end
 */
class ogAuthPermissions {

  static loadUserPermissions() {
    if (!ogAuthCore.user || !ogAuthCore.user.config) {
      ogLogger.warn('core:auth', 'No hay configuración de usuario');
      return;
    }

    const config = ogAuthCore.user.config;
    const permissions = config.permissions || {};

    // Normalizar plugins → extensions
    if (permissions.plugins && !permissions.extensions) {
      permissions.extensions = permissions.plugins;
      delete permissions.plugins;
    }

    ogAuthCore.userPermissions  = permissions;
    ogAuthCore.userPreferences  = config.preferences || {};

    ogLogger.success('core:auth', '✅ Permisos cargados exitosamente');

    this.filterExtensionsByPermissions();
  }

  static filterExtensionsByPermissions() {
    const hook = ogModule('hook');

    if (ogAuthCore.user?.role === 'admin') {
      ogLogger.info('core:auth', '👑 Usuario admin - sin filtrado de permisos');
      return;
    }

    if (!hook || !hook.pluginRegistry) {
      ogLogger.warn('core:auth', 'hook.pluginRegistry no disponible');
      return;
    }

    const permissions = ogAuthCore.userPermissions?.extensions || {};

    for (const [extensionName, pluginConfig] of hook.pluginRegistry) {
      const extensionPerms = permissions[extensionName];

      if (!extensionPerms || extensionPerms.enabled === false) {
        pluginConfig.enabled = false;
        ogLogger.warn('core:auth', `❌ Extension deshabilitada: ${extensionName}`);
        continue;
      }

      ogLogger.success('core:auth', `✅ Extension habilitada: ${extensionName}`);

      if (!pluginConfig.hasMenu || !pluginConfig.menu) continue;

      const menuPerms = extensionPerms.menus;

      if (menuPerms === '*') continue;

      if (!menuPerms || typeof menuPerms !== 'object') {
        pluginConfig.menu.items = [];
        continue;
      }

      const allowedMenuIds = Object.keys(menuPerms).filter(key => {
        const p = menuPerms[key];
        return p === true || (typeof p === 'object' && p.enabled === true);
      });

      pluginConfig.menu.items = (pluginConfig.menu.items || [])
        .filter(menu => allowedMenuIds.includes(menu.id));
    }

    ogLogger.success('core:auth', '✅ Filtrado de extensions completado');
  }

  static getTabPermissions(menuId) {
    if (!ogAuthCore.userPermissions?.extensions) return null;

    for (const extensionName in ogAuthCore.userPermissions.extensions) {
      const extension = ogAuthCore.userPermissions.extensions[extensionName];

      if (extension.menus && extension.menus[menuId]) {
        const menuPerm = extension.menus[menuId];
        if (menuPerm === true) return '*';
        if (typeof menuPerm === 'object' && menuPerm.tabs) return menuPerm.tabs;
      }
    }

    return null;
  }
}

window.ogAuthPermissions = ogAuthPermissions;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.authPermissions = ogAuthPermissions;
}