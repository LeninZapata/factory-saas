class admin {
  static API = { user: '/api/user' };
  static currentFormId = null;

  static initFormUser(formId) {
    this.currentFormId = formId;

    setTimeout(() => {
      const container = document.getElementById('permissions-container');
      if (!container) return;

      const pluginsData = this.getPlugins();
      const defaultConfig = {
        permissions: { plugins: {} },
        preferences: { theme: 'light', language: 'es', notifications: true }
      };

      if (window.permissions) {
        permissions.render('permissions-container', defaultConfig, pluginsData);
      }
    }, 200);
  }

  static getPlugins() {
    const plugins = [];

    if (window.hook?.pluginRegistry) {
      for (const [name, config] of window.hook.pluginRegistry) {
        if (config.enabled) {
          plugins.push({
            name,
            hasMenu: config.hasMenu || false,
            hasViews: config.hasViews || false,
            menu: config.menu || null,
            description: config.description || ''
          });
        }
      }
    }

    return plugins;
  }

  static getPermissionsData() {
    const selectorEl = document.querySelector('.permissions-selector');
    if (!selectorEl?.id) return { permissions: { plugins: {} } };

    const hiddenInput = document.getElementById(`${selectorEl.id}-data`);
    if (!hiddenInput?.value) return { permissions: { plugins: {} } };

    try {
      return JSON.parse(hiddenInput.value);
    } catch (error) {
      logger.warn('p:admin', 'Error parseando permisos');
      return { permissions: { plugins: {} } };
    }
  }

  static async saveUser(formId) {
    const formData = form.getData(formId);
    
    // Validar campos requeridos
    const rules = { username: 'required', email: 'required|email', role: 'required' };
    if (!this.validateForm(formData, rules)) return;

    const permsData = this.getPermissionsData();

    const userData = {
      user: formData.username,
      email: formData.email,
      role: formData.role,
      pass: formData.password || null,
      config: {
        ...permsData,
        preferences: {
          theme: formData.preferences_theme || 'light',
          language: formData.preferences_language || 'es',
          notifications: formData.preferences_notifications || false
        }
      }
    };

    if (!userData.pass) delete userData.pass;

    await this.request('create', userData);
  }

  static validateForm(data, rules) {
    const required = ['username', 'email', 'role'];
    for (const field of required) {
      if (!data[field]) {
        if (window.toast) toast.error(`❌ El campo ${field} es requerido`);
        return false;
      }
    }
    return true;
  }

  static async request(action, data = null) {
    const actions = {
      create: { method: 'post', url: this.API.user, success: 'Usuario guardado' },
      update: { method: 'put', url: `${this.API.user}/${data.id}`, success: 'Usuario actualizado' },
      delete: { method: 'delete', url: `${this.API.user}/${data}`, success: 'Usuario eliminado' },
      get: { method: 'get', url: `${this.API.user}/${data}`, success: null }
    };

    const config = actions[action];
    if (!config) return;

    try {

      let response;
      if (config.method === 'get') {
        response = await api.get(config.url);
      } else if (config.method === 'post') {
        response = await api.post(config.url, data);
      } else if (config.method === 'put') {
        response = await api.put(config.url, data);
      } else if (config.method === 'delete') {
        response = await api.delete(config.url);
      }

      if (response.success === false) {
        logger.warn('p:admin', 'Error de validación', response.error);
        if (window.toast) toast.error(`❌ ${response.error || 'Error en la operación'}`);
        return response;
      }

      logger.success('p:admin', `${action} exitoso`);
      if (config.success && window.toast) toast.success(`✅ ${config.success}`);

      if (action !== 'get') {
        setTimeout(() => {
          modal.closeAll();
          if (action !== 'create') location.reload();
        }, action === 'create' ? 200 : 1000);
      }

      return response;

    } catch (error) {
      logger.error('p:admin', 'Error en acción', error);
      if (window.toast) toast.error(`❌ Error de conexión: ${error.message}`);
    }
  }
}

window.admin = admin;