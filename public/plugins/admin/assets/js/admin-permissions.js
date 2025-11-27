class adminPermissions {
  // Inicializar permisos vacíos (nuevo usuario)
  static init(formId) {
    const config = { permissions: { plugins: {} }, preferences: { theme: 'light', language: 'es', notifications: true }};
    setTimeout(() => this.render(config), 200);
  }

  // Cargar permisos existentes (editar)
  static load(formId, userData) {
    const config = typeof userData.config === 'string' ? JSON.parse(userData.config) : (userData.config || {});
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
    permissions.render('permissions-container', config, this.getPlugins());
  }

  // Obtener plugins habilitados
  static getPlugins() {
    if (!window.hook?.pluginRegistry) return [];
    return Array.from(window.hook.pluginRegistry)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([name, cfg]) => ({ name, hasMenu: cfg.hasMenu, hasViews: cfg.hasViews, menu: cfg.menu }));
  }

  // Obtener datos del formulario
  static getData() {
    const selector = document.querySelector('.permissions-selector');
    if (!selector?.id) return { permissions: { plugins: {} }};
    const input = document.getElementById(`${selector.id}-data`);
    return input?.value ? JSON.parse(input.value) : { permissions: { plugins: {} }};
  }
}

window.adminPermissions = adminPermissions;