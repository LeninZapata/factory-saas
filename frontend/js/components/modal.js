class modal {
  static modals = new Map();
  static counter = 0;

  static open(resource, options = {}) {
    const modalId = `modal-${++this.counter}`;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = modalId;

    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'modal-container';
    container.style.width = options.width || '80%';
    container.style.maxWidth = options.maxWidth || '900px';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h3>${options.title || 'Modal'}</h3>
      <button class="modal-close" onclick="modal.close('${modalId}')">&times;</button>
    `;

    // Content
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = '<div class="modal-loading">Cargando...</div>';

    // Footer (opcional)
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    if (options.footer) {
      footer.innerHTML = options.footer;
    } else if (options.showFooter !== false) {
      footer.innerHTML = `
        <button class="btn btn-secondary" onclick="modal.close('${modalId}')">Cerrar</button>
      `;
    }

    // Ensamblar
    container.appendChild(header);
    container.appendChild(content);
    if (options.showFooter !== false || options.footer) {
      container.appendChild(footer);
    }
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Guardar referencia
    this.modals.set(modalId, overlay);

    // Cargar contenido
    this.loadContent(modalId, resource, options);

    return modalId;
  }

  static async loadContent(modalId, resource, options) {
    const content = document.querySelector(`#${modalId} .modal-content`);

    try {
      // HTML directo
      if (options.html) {
        content.innerHTML = resource;
        return;
      }

      // Formulario de plugin: "ejemplos|forms/login"
      if (typeof resource === 'string' && resource.includes('|forms/')) {
        const [pluginName, formPath] = resource.split('|');
        const formName = formPath.replace('forms/', '');

        await form.load(`${pluginName}/${formName}`, content);
        return;
      }

      // Vista de plugin: "user|sections/user"
      if (typeof resource === 'string' && resource.includes('|')) {
        const [plugin, viewPath] = resource.split('|');
        await view.loadView(`${viewPath}`, content);
        return;
      }

      // Vista simple: "dashboard" o "sections/user"
      if (typeof resource === 'string') {
        await view.loadView(resource, content);
        return;
      }

      // Objeto con configuración
      if (typeof resource === 'object') {
        if (resource.view) {
          await view.loadView(resource.view, content);
          return;
        }
      }

      throw new Error('Formato de recurso no válido');

    } catch (error) {
      console.error('❌ Modal: Error cargando contenido:', error);
      content.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error</h4>
          <p>No se pudo cargar el contenido: ${error.message}</p>
        </div>
      `;
    }
  }

  static close(modalId) {
    const overlay = this.modals.get(modalId);
    if (overlay) {
      overlay.remove();
      this.modals.delete(modalId);
      tabs.clearCache();
    }
  }

  static closeAll() {
    this.modals.forEach((overlay, id) => this.close(id));
  }
}

window.modal = modal;

// Cerrar modal al hacer clic en el overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const modalId = e.target.id;
    modal.close(modalId);
  }
});