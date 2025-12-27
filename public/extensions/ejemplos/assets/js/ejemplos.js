/**
 * Plugin Ejemplos - Funciones auxiliares
 */
class ejemplos {
  static getModules() {
    return {
      modal: window.ogFramework?.components?.modal, //  ogModule('modal'),
      form: window.ogFramework?.core?.form,
      toast: window.ogFramework?.components?.toast
    };
  }
  /**
   * Abrir modal de repetibles anidados con datos pre-cargados
   */
  static async openRepeatableWithData() {
    const { modal, form, toast } = this.getModules();
    try {
      // Abrir modal
      const { modalId, loadPromise } = modal.open('ejemplos|forms/formularios/form-repetibles-anidados', {
        title: '📊 Repetibles con Datos',
        width: '95%',
        maxWidth: '1200px',
        showFooter: true
      });

      // Esperar a que el formulario se cargue
      await loadPromise;

      // Cargar datos mock
      const mockData = await this.loadRepeatableMockData();

      if (!mockData) {
        ogToast.error('❌ No se pudieron cargar los datos de ejemplo');
        return;
      }

      // Encontrar el formulario en el modal
      const modalContent = document.querySelector(`#${modalId} .modal-content`);
      const formElement = modalContent?.querySelector('form');

      if (!formElement) {
        ogLogger.error('ext:ejemplos', 'Formulario no encontrado en el modal');
        ogToast.error('❌ Error: Formulario no encontrado');
        return;
      }

      const formId = formElement.getAttribute('id');
      ogLogger.info('ext:ejemplos', `Llenando formulario ${formId} con datos mock`);

      // Llenar el formulario con los datos pasando el contexto del modal
      setTimeout(() => {
        form.fill(formId, mockData, modalContent);
        ogToast.success('✅ Datos cargados correctamente');
      }, 300);

    } catch (error) {
      ogLogger.error('ext:ejemplos', 'Error abriendo modal con datos:', error);
      ogToast.error('❌ Error al cargar el formulario');
    }
  }

  /**
   * Cargar datos mock desde archivo JSON
   */
  static async loadRepeatableMockData() {
    try {
      // Usar mock COMPLETO con 3 niveles (proyectos + tareas + subtareas + miembros)
      const url = `${window.BASE_URL}extensions/ejemplos/mock/repetibles-3-niveles-mock.json`;
      const cacheBuster = `?v=${window.VERSION}`;
      
      const response = await fetch(url + cacheBuster);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      ogLogger.success('ext:ejemplos', 'Datos mock cargados:', data);
      
      return data;
    } catch (error) {
      ogLogger.error('ext:ejemplos', 'Error cargando mock data:', error);
      return null;
    }
  }
}

window.ejemplos = ejemplos;