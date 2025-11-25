/**
 * Admin Panel Helper
 * Funciones auxiliares para el panel de administración
 */

class admin {
  static initialized = false;

  /**
   * Inicializar panel de administración
   */
  static init() {
    if (this.initialized) {
      console.log('⚙️ Admin: Ya inicializado');
      return;
    }

    console.log('⚙️ Admin: Inicializando panel...');
    
    // Aquí puedes agregar inicializaciones adicionales
    // Por ejemplo: cargar configuración actual, etc.
    
    this.initialized = true;
    console.log('✅ Admin: Panel inicializado');
  }

  /**
   * Guardar configuración del sistema
   */
  static async saveConfig() {
    console.log('⚙️ Admin: Guardando configuración...');
    
    // Obtener datos del formulario de configuración
    const configForm = document.querySelector('form[data-form-id*="config"]');
    let formData = {};
    
    if (configForm && typeof form !== 'undefined' && form.getData) {
      const formId = configForm.id;
      formData = form.getData(formId);
    }
    
    console.log('📋 Datos de configuración:', formData);
    
    try {
      // TODO: Implementar llamada al API
      // await api.post('/api/config', formData);
      
      if (typeof toast !== 'undefined') {
        toast.success('✅ Configuración guardada correctamente');
      }
    } catch (error) {
      console.error('❌ Error al guardar configuración:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al guardar configuración');
      }
    }
  }

  /**
   * Restaurar configuración a valores por defecto
   */
  static async resetConfig() {
    if (!confirm('¿Restaurar la configuración a los valores por defecto?')) {
      return;
    }

    console.log('⚙️ Admin: Restaurando configuración...');

    try {
      // TODO: Implementar llamada al API
      // await api.post('/api/config/reset');
      
      if (typeof toast !== 'undefined') {
        toast.success('✅ Configuración restaurada');
      }
      
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('❌ Error al restaurar configuración:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al restaurar configuración');
      }
    }
  }

  /**
   * Limpiar caché del sistema
   */
  static async clearCache() {
    console.log('⚙️ Admin: Limpiando caché...');

    try {
      // Limpiar caché local
      if (typeof cache !== 'undefined') {
        cache.clear();
      }

      // TODO: Limpiar caché del servidor
      // await api.post('/api/cache/clear');
      
      if (typeof toast !== 'undefined') {
        toast.success('✅ Caché limpiada correctamente');
      }
      
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('❌ Error al limpiar caché:', error);
      if (typeof toast !== 'undefined') {
        toast.error('❌ Error al limpiar caché');
      }
    }
  }
}

window.admin = admin;

// Auto-inicializar cuando se carga el script
console.log('📦 Admin: Script cargado');
admin.init();