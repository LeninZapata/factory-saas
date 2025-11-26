class admin {
  static API = {
    user: '/api/user'
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
      user: formData.username,
      email: formData.email,
      role: formData.role,          // ✅ Cambiado: role -> rol
      pass: formData.password || null,
      config: {                    // ✅ Cambiado: JSON.stringify -> objeto directo
        ...permsData,
        preferences: {
          theme: formData.preferences_theme || 'light',
          language: formData.preferences_language || 'es',
          notifications: formData.preferences_notifications || false
        }
      }
    };

    if (!userData.pass) delete userData.pass;  // ✅ Cambiado: password -> pass

    await this.request('create', userData);
  }

  static async request(action, data = null) {
    try {
      let response;

      switch(action) {
        case 'create':
          logger.debug('p:admin', 'Enviando data:', data);
          response = await api.post(this.API.user, data);
          
          // Verificar si la respuesta tiene success: false
          if (response.success === false) {
            logger.warn('p:admin', 'Error de validación:', response.error);
            if (window.toast) toast.error(`❌ ${response.error || 'Error al crear usuario'}`);
            return response;
          }
          
          logger.success('p:admin', 'Usuario creado:', response);
          if (window.toast) toast.success('✅ Usuario guardado');
          setTimeout(() => { modal.closeAll(); /*location.reload();*/ }, 200);
          break;

        case 'update':
          logger.debug('p:admin', 'Actualizando usuario:', data);
          response = await api.put(`${this.API.user}/${data.id}`, data);
          
          if (response.success === false) {
            logger.warn('p:admin', 'Error de validación:', response.error);
            if (window.toast) toast.error(`❌ ${response.error || 'Error al actualizar usuario'}`);
            return response;
          }
          
          logger.success('p:admin', 'Usuario actualizado:', response);
          if (window.toast) toast.success('✅ Usuario actualizado');
          setTimeout(() => { modal.closeAll(); location.reload(); }, 1000);
          break;

        case 'delete':
          logger.debug('p:admin', 'Eliminando usuario:', data);
          response = await api.delete(`${this.API.user}/${data}`);
          
          if (response.success === false) {
            logger.warn('p:admin', 'Error de validación:', response.error);
            if (window.toast) toast.error(`❌ ${response.error || 'Error al eliminar usuario'}`);
            return response;
          }
          
          logger.success('p:admin', 'Usuario eliminado');
          if (window.toast) toast.success('✅ Usuario eliminado');
          setTimeout(() => location.reload(), 1000);
          break;

        case 'get':
          logger.debug('p:admin', 'Obteniendo usuario:', data);
          response = await api.get(`${this.API.user}/${data}`);
          logger.info('p:admin', 'Usuario obtenido:', response);
          return response;
      }

      return response;

    } catch (error) {
      logger.error('p:admin', 'Error en acción:', action, error);
      if (window.toast) toast.error(`❌ Error de conexión: ${error.message}`);
    }
  }
}

window.admin = admin;