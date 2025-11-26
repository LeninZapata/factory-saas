class admin {
  static API = {
    users: '/api/users'
  };

  static currentFormId = null;

  static initFormUser(formId) {
    this.currentFormId = formId;
    
    setTimeout(() => {
      const container = document.getElementById('permissions-container');
      if (!container) {
        console.warn('⚠️ Admin: permissions-container no encontrado');
        return;
      }

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

  static async saveUser(formId) {
    const formData = form.getData(formId);
    if (!formData || !formData.username || !formData.email || !formData.role) {
      if (window.toast) toast.error('❌ Completa los campos requeridos');
      return;
    }

    const selectorEl = document.querySelector('.permissions-selector');
    const selectorId = selectorEl?.id;
    let permsData = { permissions: { plugins: {} } };
    
    if (selectorId) {
      const hiddenInput = document.getElementById(`${selectorId}-data`);
      if (hiddenInput?.value) {
        try {
          permsData = JSON.parse(hiddenInput.value);
        } catch (error) {
          console.warn('⚠️ Admin: Error parseando permisos:', error);
        }
      }
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.password || null,
      config: JSON.stringify({
        ...permsData,
        preferences: {
          theme: formData.preferences_theme || 'light',
          language: formData.preferences_language || 'es',
          notifications: formData.preferences_notifications || false
        }
      })
    };

    if (!userData.password) delete userData.password;

    await this.request('create', userData);
  }

  static async request(action, data = null) {
    try {
      let response;
      
      switch(action) {
        case 'create':
          response = await api.post(this.API.users, data);
          if (window.toast) toast.success('✅ Usuario guardado');
          setTimeout(() => { modal.closeAll(); location.reload(); }, 1000);
          break;
          
        case 'update':
          response = await api.put(`${this.API.users}/${data.id}`, data);
          if (window.toast) toast.success('✅ Usuario actualizado');
          setTimeout(() => { modal.closeAll(); location.reload(); }, 1000);
          break;
          
        case 'delete':
          response = await api.delete(`${this.API.users}/${data}`);
          if (window.toast) toast.success('✅ Usuario eliminado');
          setTimeout(() => location.reload(), 1000);
          break;
          
        case 'get':
          response = await api.get(`${this.API.users}/${data}`);
          return response;
      }
      
      console.log('✅ Admin:', action, response);
      return response;
      
    } catch (error) {
      console.error('❌ Admin:', action, error);
      if (window.toast) toast.error(`❌ Error: ${action}`);
    }
  }
}

window.admin = admin;