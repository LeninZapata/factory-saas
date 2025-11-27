class adminPermissions {
  // Inicializar permisos vacíos (nuevo usuario)
  static init(formId) {
    const config = { 
      permissions: { plugins: {} }, 
      preferences: { theme: 'light', language: 'es', notifications: true }
    };
    setTimeout(() => this.render(config), 200);
  }

  // Cargar permisos existentes (editar)
  static load(formId, userData) {
    const config = typeof userData.config === 'string' 
      ? JSON.parse(userData.config) 
      : (userData.config || {});
    
    const normalized = { 
      permissions: config.permissions || { plugins: {} },
      preferences: config.preferences || { theme: 'light', language: 'es', notifications: true }
    };
    
    setTimeout(() => this.render(normalized), 200);
  }

  // Renderizar componente
  static render(config) {
    const container = document.getElementById('permissions-container');
    if (!container || !window.permissions) return;
    
    // ✅ Obtener TODOS los plugins disponibles (sin filtrar por permisos del usuario actual)
    const allPlugins = this.getAllPlugins();
    
    logger.debug('p:admin-permissions', `Renderizando selector con ${allPlugins.length} plugins`);
    
    permissions.render('permissions-container', config, allPlugins);
  }

  // Obtener TODOS los plugins disponibles en el sistema
  static getAllPlugins() {
    // ✅ Usar método especial que retorna la copia original sin filtrar
    if (window.hook?.getAllPluginsForPermissions) {
      return hook.getAllPluginsForPermissions();
    }

    // Fallback: Si no existe el método, intentar con pluginRegistry normal
    if (!window.hook?.pluginRegistry) {
      logger.warn('p:admin-permissions', 'hook.pluginRegistry no disponible');
      return [];
    }

    const plugins = [];
    for (const [name, config] of window.hook.pluginRegistry) {
      plugins.push({
        name,
        hasMenu: config.hasMenu || false,
        hasViews: config.hasViews || false,
        menu: config.menu || null,
        description: config.description || ''
      });
    }

    return plugins;
  }

  // Obtener datos del selector
  static getData() {
    const selector = document.querySelector('.permissions-selector');
    if (!selector?.id) return { permissions: { plugins: {} }};
    const input = document.getElementById(`${selector.id}-data`);
    return input?.value ? JSON.parse(input.value) : { permissions: { plugins: {} }};
  }
}

window.adminPermissions = adminPermissions;