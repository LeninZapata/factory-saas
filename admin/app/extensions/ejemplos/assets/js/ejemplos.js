/**
 * Plugin Ejemplos - Funciones auxiliares
 */
class ejemplos {
  static getModules() {
    return {
      modal: window.ogFramework?.components?.modal,
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
      const modalContent = document.querySelector(`#${modalId} .og-modal-content`);
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
      const url = `admin/app/extensions/ejemplos/mock/repetibles-3-niveles-mock.json`;
      const cacheBuster = `?v=${window.VERSION}`;

      const response = await ogApi.get(url + cacheBuster);

      if (!response) {
        throw new Error('Empty response');
      }

      let data;

      if (typeof response === 'object' && typeof response.json !== 'function') {
        data = response;
      } else if (response && typeof response.json === 'function') {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = await response.json();
      } else {
        data = response;
      }

      ogLogger.success('ext:ejemplos', 'Datos mock cargados:', data);

      return data;
    } catch (error) {
      ogLogger.error('ext:ejemplos', 'Error cargando mock data:', error);
      return null;
    }
  }

  /**
   * Demo de transición de estados de botón
   * Simula: Normal → Loading → Success → Normal
   */
  static demoButtonStates(buttonElement) {
    const originalText = buttonElement.textContent;
    const originalClasses = buttonElement.className;

    // Estado 1: Loading
    buttonElement.textContent = 'Guardando...';
    buttonElement.classList.add('btn-loading');
    buttonElement.disabled = true;

    setTimeout(() => {
      // Estado 2: Success
      buttonElement.classList.remove('btn-loading');
      buttonElement.classList.add('btn-success-temp');
      buttonElement.textContent = '✓ Guardado';

      setTimeout(() => {
        // Estado 3: Volver a normal
        buttonElement.classList.remove('btn-success-temp');
        buttonElement.className = originalClasses;
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
      }, 2000);
    }, 2000);
  }

  /**
   * Demo de estado de error
   */
  static demoButtonError(buttonElement) {
    const originalText = buttonElement.textContent;
    const originalClasses = buttonElement.className;

    buttonElement.textContent = 'Procesando...';
    buttonElement.classList.add('btn-loading');
    buttonElement.disabled = true;

    setTimeout(() => {
      buttonElement.classList.remove('btn-loading');
      buttonElement.classList.add('btn-error-temp');
      buttonElement.textContent = '✕ Error';

      setTimeout(() => {
        buttonElement.classList.remove('btn-error-temp');
        buttonElement.className = originalClasses;
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
      }, 2000);
    }, 1500);
  }
}

window.ejemplos = ejemplos;