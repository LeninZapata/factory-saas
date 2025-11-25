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

    // Cargar contenido (retorna Promise)
    const loadPromise = this.loadContent(modalId, resource, options);

    return { modalId, loadPromise };
  }

  static async loadContent(modalId, resource, options) {
    const content = document.querySelector(`#${modalId} .modal-content`);

    try {
      // HTML directo
      if (options.html) {
        content.innerHTML = resource;
        return;
      }

      // ✅ CORE: Formulario del core con prefijo "core:"
      if (typeof resource === 'string' && resource.startsWith('core:')) {
        const corePath = resource.replace('core:', '');
        console.log(`📋 MODAL (CORE): Cargando formulario "${corePath}"`);
        
        // ✅ Usar afterRender desde options si existe
        const afterRenderCallback = options.afterRender || null;
        
        if (afterRenderCallback) {
          console.log('📋 MODAL: Usando afterRender desde options');
        }
        
        await form.load(corePath, content, null, true, afterRenderCallback);
        return;
      }

      // ✅ Formulario de plugin con prefijo "plugin:"
      if (typeof resource === 'string' && resource.startsWith('plugin:')) {
        const pluginPath = resource.replace('plugin:', '');
        console.log(`📋 MODAL (PLUGIN): Cargando formulario "${pluginPath}"`);
        
        // ✅ Usar afterRender desde options si existe
        const afterRenderCallback = options.afterRender || null;
        
        if (afterRenderCallback) {
          console.log('📋 MODAL: Usando afterRender desde options (plugin)');
        }
        
        await form.load(pluginPath, content, null, false, afterRenderCallback);
        return;
      }

      // Formulario de plugin (legacy): "ejemplos|forms/login"
      if (typeof resource === 'string' && resource.includes('|forms/')) {
        const [pluginName, formPath] = resource.split('|');
        const formName = formPath.replace('forms/', '');
        console.log(`📋 MODAL (PLUGIN|): Cargando "${pluginName}/${formName}"`);
        // ✅ Pasar isCore=false para forzar búsqueda en plugin
        await form.load(`${pluginName}/${formName}`, content, null, false);
        return;
      }

      // Formulario del core (sin prefijo): "user/forms/user-form" o "auth/forms/login-form"
      // Aquí form.load() hará detección automática
      if (typeof resource === 'string' && resource.includes('/forms/')) {
        console.log(`📋 MODAL (AUTO): Cargando formulario "${resource}"`);
        await form.load(resource, content);
        return;
      }

      // ✅ Vista del core con prefijo "core:"
      if (typeof resource === 'string' && resource.startsWith('core:sections/')) {
        const corePath = resource.replace('core:sections/', '');
        console.log(`👁️ MODAL (CORE SECTION): Cargando vista "${corePath}"`);
        
        // ✅ Usar afterRender desde options si existe
        const afterRenderCallback = options.afterRender || null;
        
        if (afterRenderCallback) {
          console.log('👁️ MODAL: Usando afterRender para vista (core)');
        }
        
        await view.loadView(corePath, content, null, null, afterRenderCallback);
        return;
      }

      // Vista de plugin: "user|sections/user"
      if (typeof resource === 'string' && resource.includes('|')) {
        const [plugin, viewPath] = resource.split('|');
        console.log(`👁️ MODAL (PLUGIN|): Cargando vista "${plugin}/${viewPath}"`);
        
        // ✅ Usar afterRender desde options si existe
        const afterRenderCallback = options.afterRender || null;
        
        if (afterRenderCallback) {
          console.log('👁️ MODAL: Usando afterRender para vista (plugin)');
        }
        
        await view.loadView(`${viewPath}`, content, plugin, null, afterRenderCallback);
        return;
      }

      // Vista simple: "dashboard" o "sections/user"
      if (typeof resource === 'string') {
        console.log(`👁️ MODAL (AUTO): Cargando vista "${resource}"`);
        
        // ✅ Usar afterRender desde options si existe
        const afterRenderCallback = options.afterRender || null;
        
        if (afterRenderCallback) {
          console.log('👁️ MODAL: Usando afterRender para vista');
        }
        
        await view.loadView(resource, content, null, null, afterRenderCallback);
        return;
      }

      // Objeto con configuración
      if (typeof resource === 'object') {
        if (resource.view) {
          // ✅ Usar afterRender desde options si existe
          const afterRenderCallback = options.afterRender || null;
          
          if (afterRenderCallback) {
            console.log('👁️ MODAL: Usando afterRender para vista (object)');
          }
          
          await view.loadView(resource.view, content, null, null, afterRenderCallback);
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

  static async openWithData(resource, options = {}) {
    console.log('📦 MODAL: openWithData', { resource, options });
    
    // Si no hay ID, abrir modal normal
    if (!options.id) {
      console.warn('⚠️ MODAL: No se especificó ID para cargar datos');
      const result = this.open(resource, options);
      return result.modalId;
    }
    
    // Abrir el modal y obtener la promesa de carga
    const { modalId, loadPromise } = this.open(resource, options);
    
    // Detectar plugin name
    let pluginName = null;
    if (resource.includes('|')) {
      pluginName = resource.split('|')[0];
    }
    
    // Obtener configuración del dataLoader
    let dataLoaderConfig = options.dataLoader;
    
    if (!dataLoaderConfig) {
      console.log('🔍 MODAL: Buscando dataLoader en el evento...');
      const button = event?.target?.closest('[data-loader-config]');
      if (button) {
        const configStr = button.getAttribute('data-loader-config');
        dataLoaderConfig = JSON.parse(configStr.replace(/&quot;/g, '"'));
        console.log('✅ MODAL: DataLoader encontrado en botón', dataLoaderConfig);
      }
    }
    
    if (!dataLoaderConfig && pluginName) {
      const pluginConfig = window.hook?.getPluginConfig(pluginName);
      if (pluginConfig?.backend) {
        dataLoaderConfig = {
          type: 'auto',
          api: {
            enabled: pluginConfig.backend.enabled,
            endpoint: pluginConfig.backend.endpoints?.show?.path?.replace('{id}', options.id)
          },
          mock: pluginConfig.mockData
        };
        console.log('✅ MODAL: DataLoader construido desde plugin config', dataLoaderConfig);
      }
    }
    
    // Cargar datos si hay dataLoader
    if (dataLoaderConfig && window.dataLoader) {
      try {
        // Esperar a que el formulario se cargue primero
        console.log('⏳ MODAL: Esperando que termine de cargar el contenido...');
        await loadPromise;
        console.log('✅ MODAL: Contenido cargado');
        
        // Cargar datos
        console.log('⏳ MODAL: Cargando datos del registro...');
        const data = await dataLoader.loadDetail(dataLoaderConfig, options.id, pluginName);
        console.log('✅ MODAL: Datos cargados', data);
        
        // Buscar el formulario real en el DOM (tiene ID con timestamp)
        const modalContent = document.querySelector(`#${modalId} .modal-content`);
        const formElement = modalContent?.querySelector('form');
        
        if (!formElement) {
          console.error(`❌ MODAL: No se encontró ningún formulario en el modal`);
          console.log(`🔍 MODAL: Formularios en el documento:`, 
            Array.from(document.querySelectorAll('form')).map(f => f.id || 'sin-id')
          );
          if (window.toast) {
            toast.error('Error: No se encontró el formulario');
          }
          return modalId;
        }
        
        const realFormId = formElement.getAttribute('id');
        console.log(`✅ MODAL: Formulario encontrado con ID: "${realFormId}"`);
        
        // Llenar formulario
        if (window.form) {
          console.log(`📝 MODAL: Llenando formulario...`);
          form.fill(realFormId, data);
        }
        
      } catch (error) {
        console.error('❌ MODAL: Error cargando datos', error);
        if (window.toast) {
          toast.error('Error al cargar los datos');
        }
      }
    } else {
      console.warn('⚠️ MODAL: No se pudo cargar datos (sin dataLoader)');
    }
    
    return modalId;
  }

  static waitForForm(formId, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkForm = () => {
        const formElement = document.getElementById(formId);
        
        if (formElement) {
          const elapsed = Date.now() - startTime;
          console.log(`✅ MODAL: Formulario encontrado después de ${elapsed}ms`);
          resolve(formElement);
        } else if (Date.now() - startTime >= timeout) {
          console.error(`❌ MODAL: Timeout - Formulario "${formId}" no encontrado`);
          console.log(`🔍 MODAL: Formularios disponibles:`, 
            Array.from(document.querySelectorAll('form')).map(f => f.id || 'sin-id')
          );
          reject(new Error(`Formulario ${formId} no encontrado`));
        } else {
          requestAnimationFrame(checkForm);
        }
      };
      
      checkForm();
    });
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