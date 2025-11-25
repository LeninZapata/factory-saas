/**
 * User Management Core
 * Gestión de usuarios del sistema
 */

class user {
  static currentFormId = null;
  static pluginsData = [];
  static autoInitialized = false;

  /**
   * Inicializar formulario de usuario
   */
  static async initForm(formId) {
    console.log('👤 User: Inicializando formulario...', formId);
    this.currentFormId = formId;

    // Esperar a que el contenedor exista
    await this.waitForContainer();

    // Obtener plugins del sistema
    this.pluginsData = this.getPluginsFromHooks();
    console.log('📦 User: Plugins encontrados:', this.pluginsData);

    // Renderizar selector de permisos
    this.renderPermissionsSelector();

    // Bind eventos
    this.bindEvents();
    
    this.autoInitialized = true;
  }

  /**
   * Auto-inicializar cuando se detecta el formulario
   */
  static autoInit() {
    const checkInterval = setInterval(() => {
      const form = document.querySelector('form[data-form-id="user-form"]');
      
      if (form && !this.autoInitialized) {
        console.log('👤 User: Formulario detectado, auto-inicializando...');
        const formId = form.id;
        
        setTimeout(() => {
          this.initForm(formId);
        }, 300);
        
        clearInterval(checkInterval);
      }
    }, 100);

    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  /**
   * Esperar a que el contenedor de permisos exista
   */
  static async waitForContainer() {
    return new Promise((resolve) => {
      const check = () => {
        const container = document.getElementById('permissions-container');
        if (container) {
          console.log('👤 User: Contenedor encontrado');
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Obtener plugins desde hooks
   * ✅ CORREGIDO: Ahora usa window.hook.pluginRegistry
   */
  static getPluginsFromHooks() {
    // ✅ Intentar obtener desde hook.pluginRegistry
    if (window.hook?.pluginRegistry) {
      console.log('📦 User: Obteniendo plugins desde hook.pluginRegistry');
      const plugins = [];
      
      for (const [name, config] of window.hook.pluginRegistry) {
        if (!config.enabled) continue;

        plugins.push({
          name: name,
          hasMenu: config.hasMenu || false,
          hasViews: config.hasViews || false,
          menu: config.menu || null,
          description: config.description || ''
        });
      }

      return plugins;
    }

    // ✅ Fallback: Intentar desde view.loadedPlugins
    if (window.view?.loadedPlugins) {
      console.log('📦 User: Obteniendo plugins desde view.loadedPlugins');
      const plugins = [];
      
      for (const [name, config] of Object.entries(window.view.loadedPlugins)) {
        if (!config.enabled) continue;

        plugins.push({
          name: name,
          hasMenu: config.hasMenu || false,
          hasViews: config.hasViews || false,
          menu: config.menu || null,
          description: config.description || ''
        });
      }

      return plugins;
    }

    console.warn('⚠️ User: No se pudieron obtener plugins');
    return [];
  }

  /**
   * Renderizar selector de permisos
   * ✅ CORREGIDO: Ahora usa 'permissions' en lugar de 'permissionsSelector'
   */
  static renderPermissionsSelector(userData = null) {
    const config = userData?.config || this.getDefaultConfig();
    
    // ✅ Usar 'permissions' (nombre correcto de la clase)
    if (typeof permissions !== 'undefined') {
      console.log('👤 User: Renderizando selector de permisos...');
      permissions.render(
        'permissions-container',
        config,
        this.pluginsData
      );
    } else {
      console.error('❌ User: permissions component no está cargado');
      
      // ✅ Mostrar mensaje de error en el contenedor
      const container = document.getElementById('permissions-container');
      if (container) {
        container.innerHTML = `
          <div style="padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;">
            <strong>⚠️ Error:</strong> El componente de permisos no está cargado.
            <br><small>Verifica que permissions.js esté en main.js</small>
          </div>
        `;
      }
    }
  }

  /**
   * Configuración por defecto
   */
  static getDefaultConfig() {
    return {
      permissions: {
        plugins: {}
      },
      preferences: {
        theme: 'light',
        language: 'es',
        notifications: true
      }
    };
  }

  /**
   * Bind eventos del formulario
   */
  static bindEvents() {
    const formElement = document.getElementById(this.currentFormId);
    if (!formElement) return;

    // Actualizar preview cuando cambie cualquier campo
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.updatePreview();
      });
    });

    // Actualizar preview periódicamente
    setInterval(() => {
      this.updatePreview();
    }, 2000);
  }

  /**
   * Actualizar preview del JSON
   */
  static updatePreview() {
    const config = this.buildConfigJSON();
    const preview = document.getElementById('config-preview');
    
    if (preview) {
      preview.textContent = JSON.stringify(config, null, 2);
    }
  }

  /**
   * Construir el JSON de configuración completo
   */
  static buildConfigJSON() {
    const formElement = document.getElementById(this.currentFormId);
    if (!formElement) return {};

    // Obtener permisos del selector
    const selectorEl = document.querySelector('.permissions-selector');
    const selectorId = selectorEl?.id;
    
    // ✅ Usar 'permissions' en lugar de 'permissionsSelector'
    const permissionsData = selectorId && typeof permissions !== 'undefined' ? 
      permissions.getConfig(selectorId) : 
      { permissions: { plugins: {} } };

    // Obtener datos del formulario
    const formData = typeof form !== 'undefined' && form.getData ? 
      form.getData(this.currentFormId) : 
      {};
    
    const config = {
      ...permissionsData,
      preferences: {
        theme: formData.preferences_theme || 'light',
        language: formData.preferences_language || 'es',
        notifications: formData.preferences_notifications || false
      }
    };

    return config;
  }

  /**
   * Guardar usuario
   */
  static async save(formId) {
    const formElement = document.getElementById(formId);
    if (!formElement) return;

    // Validar
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    // Obtener datos
    const formData = typeof form !== 'undefined' && form.getData ? 
      form.getData(formId) : 
      {};
    const config = this.buildConfigJSON();

    // Validar contraseñas
    if (formData.password && formData.password !== formData.password_confirm) {
      if (typeof toast !== 'undefined') {
        toast.error('❌ Las contraseñas no coinciden');
      }
      return;
    }

    // Preparar datos para enviar
    const userData = {
      username: formData.username,
      email: formData.email || null,
      role: formData.role,
      config: JSON.stringify(config)
    };

    // Solo incluir password si se proporcionó
    if (formData.password) {
      userData.password = formData.password;
    }

    console.log('💾 User: Guardando usuario...', userData);

    try {
      // TODO: Implementar llamada al API
      // const response = await api.post('/api/users', userData);
      
      if (typeof toast !== 'undefined') {
        toast.success('✅ Usuario guardado correctamente');
      }
      
      console.log('📋 Datos guardados:', userData);
      console.log('🔐 Config JSON:', config);

      // Cerrar modal si está abierto
      if (typeof modal !== 'undefined') {
        setTimeout(() => modal.closeAll(), 500);
      }
    } catch (error) {
      console.error('❌ Error al guardar usuario:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al guardar usuario');
      }
    }
  }

  /**
   * Cargar datos de usuario existente
   */
  static async loadUser(userId) {
    console.log('👤 User: Cargando usuario...', userId);

    try {
      // TODO: Implementar llamada al API
      // const userData = await api.get(`/api/users/${userId}`);
      
      // Por ahora datos de ejemplo
      const userData = {
        id: userId,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        config: {
          permissions: {
            plugins: {
              inventario: {
                enabled: true,
                menus: '*',
                views: '*'
              },
              ejemplos: {
                enabled: true,
                menus: {
                  'ejemplos-forms': true,
                  'ejemplos-graficos': false
                },
                views: '*'
              }
            }
          },
          preferences: {
            theme: 'dark',
            language: 'es',
            notifications: true
          }
        }
      };

      this.fillForm(userData);
    } catch (error) {
      console.error('❌ Error al cargar usuario:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al cargar usuario');
      }
    }
  }

  /**
   * Llenar formulario con datos de usuario
   */
  static fillForm(userData) {
    const formElement = document.getElementById(this.currentFormId);
    if (!formElement) return;

    // Llenar campos básicos
    if (typeof form !== 'undefined' && form.fill) {
      form.fill(this.currentFormId, {
        username: userData.username,
        email: userData.email,
        role: userData.role,
        preferences_theme: userData.config?.preferences?.theme || 'light',
        preferences_language: userData.config?.preferences?.language || 'es',
        preferences_notifications: userData.config?.preferences?.notifications || false
      });
    }

    // Re-renderizar selector de permisos con los datos
    this.renderPermissionsSelector(userData);

    // Actualizar preview
    setTimeout(() => this.updatePreview(), 500);
  }

  /**
   * Eliminar usuario
   */
  static async deleteUser(userId) {
    console.log('👤 User: Eliminando usuario...', userId);

    try {
      // TODO: Implementar llamada al API
      // await api.delete(`/api/users/${userId}`);
      
      if (typeof toast !== 'undefined') {
        toast.success('✅ Usuario eliminado correctamente');
      }
      
      // Recargar la tabla
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al eliminar usuario');
      }
    }
  }

  /**
   * Exportar usuarios
   */
  static async exportUsers() {
    console.log('👤 User: Exportando usuarios...');

    try {
      // TODO: Implementar exportación
      if (typeof toast !== 'undefined') {
        toast.info('📥 Exportando usuarios... (demo)');
      }
      
      // Simulación de exportación
      setTimeout(() => {
        if (typeof toast !== 'undefined') {
          toast.success('✅ Usuarios exportados');
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error al exportar usuarios:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al exportar usuarios');
      }
    }
  }
}

window.user = user;

// ✅ NO auto-inicializar aquí
// El formulario se inicializa mediante script inline en user-form.json
// Esto evita problemas de timing cuando se carga en modal

// NOTA: Si quieres usar autoInit() en lugar del script inline,
// descomenta las siguientes líneas:
/*
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    user.autoInit();
  });
} else {
  user.autoInit();
}
*/