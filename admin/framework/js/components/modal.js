class ogModal {
  static modals = new Map();
  static counter = 0;
  static defaultEffect = 'slide-up'; // Efecto por defecto

  static open(resource, options = {}) {
    const modalId = `og-modal-${++this.counter}`;
    const overlay = document.createElement('div');
    overlay.className = 'og-modal-overlay';
    overlay.id = modalId;

    // Aplicar efecto (opción o por defecto)
    const effect = options.effect || this.defaultEffect;
    overlay.dataset.effect = effect;

    // Opciones de comportamiento
    const closeOnOverlay = options.closeOnOverlay !== false;
    const closeOnEsc = options.closeOnEsc !== false;
    if (closeOnOverlay) overlay.dataset.closeOnOverlay = '1';
    if (closeOnEsc) overlay.dataset.closeOnEsc = '1';

    const container = document.createElement('div');
    container.className = 'og-modal-container';

    // Modo panel: modal anclado a un borde (right|left|top|bottom)
    if (options.panel) {
      overlay.dataset.panel = options.panel;
      overlay.dataset.panelSize = options.panelSize || 'md';
      // panelSpan: limita la dimensión perpendicular (alto en laterales, ancho en horizontales)
      // y centra el panel en ese eje, dejándolo flotante
      if (options.panelSpan) {
        overlay.dataset.panelSpan = '1';
        container.style.setProperty('--og-panel-span', options.panelSpan);
      }
    } else {
      container.style.width = options.width || '80%';
      container.style.maxWidth = options.maxWidth || '900px';
    }

    const header = document.createElement('div');
    header.className = 'og-modal-header';
    const processedTitle = this.processI18nInString(options.title) || __('com.modal.title');
    const headerExtraHtml = options.headerExtra ? `<span class="og-modal-header-extra">${this.processI18nInString(options.headerExtra)}</span>` : '';
    const beforeTitleHtml = options.beforeTitle ? `<span class="og-modal-title-before">${this.processI18nInString(options.beforeTitle)}</span>` : '';
    const afterTitleHtml = options.afterTitle ? `<span class="og-modal-title-after">${this.processI18nInString(options.afterTitle)}</span>` : '';
    header.innerHTML = `
      <div class="og-modal-header-left">
        <div class="og-modal-title-row">${beforeTitleHtml}<h3 class="og-modal-title">${processedTitle}</h3>${afterTitleHtml}</div>
        ${headerExtraHtml}
      </div>
      <button class="og-modal-close" onclick="ogModal.close('${modalId}', '${effect}')">&times;</button>
    `;

    const content = document.createElement('div');
    content.className = 'og-modal-content';
    content.innerHTML = `<div class="og-modal-loading">${__('com.modal.loading')}</div>`;

    const footer = document.createElement('div');
    footer.className = 'og-modal-footer';

    if (options.footer) {
      footer.innerHTML = this.processI18nInString(options.footer);
    } else if (options.footerLeft || options.footerRight) {
      // Footer dividido con secciones izquierda y derecha
      const leftHtml = options.footerLeft ? this.processI18nInString(options.footerLeft) : '';
      const rightHtml = options.footerRight ? this.processI18nInString(options.footerRight) : '';
      footer.innerHTML = `<div class="og-modal-footer-left">${leftHtml}</div><div class="og-modal-footer-right">${rightHtml}</div>`;
      footer.classList.add('og-modal-footer-split');
    } else if (options.showFooter !== false) {
      footer.innerHTML = `
        <button class="btn btn-secondary" onclick="ogModal.close('${modalId}', '${effect}')">${__('com.modal.close')}</button>
      `;
    }

    container.appendChild(header);
    container.appendChild(content);

    if (options.showFooter !== false || options.footer) {
      container.appendChild(footer);
    }

    overlay.appendChild(container);
    document.body.appendChild(overlay);
    this.modals.set(modalId, overlay);

    const loadPromise = this.loadContent(modalId, resource, options);
    return { modalId, loadPromise };
  }

  static close(modalId, effect = 'slide-up') {
    const overlay = this.modals.get(modalId);

    if (overlay && !overlay.classList.contains('og-modal-closing')) {
      // Configurar velocidad (más rápido: 0.2s, 0.15s, etc.)
      const exitDuration = 0.2; // 200ms - más rápido que los 300ms de entrada
      const exitTiming = 'ease-out'; // Puede ser diferente

      overlay.classList.add('og-modal-closing');

      // Animar overlay
      overlay.style.animation = `og-modal-overlay-fadeOut ${exitDuration}s ${exitTiming} forwards`;

      const container = overlay.querySelector('.og-modal-container');
      if (container) {
        let exitAnimation;
        if (overlay.dataset.panel) {
          exitAnimation = `og-panel-slide-out-${overlay.dataset.panel}`;
        } else if (effect === 'fade-scale') {
          exitAnimation = 'og-modal-fade-scale-out';
        } else if (effect === 'slide-right') {
          exitAnimation = 'og-modal-slide-right-out';
        } else {
          exitAnimation = 'og-modal-slide-up-out';
        }

        container.style.animation = `${exitAnimation} ${exitDuration}s ${exitTiming} forwards`;
      }

      // Remover después de la animación (más rápido)
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.remove();
        }
        this.modals.delete(modalId);
      }, exitDuration * 1000); // Convertir a milisegundos
    }
  }

  static closeAll() {
    this.modals.forEach((overlay, id) => {
      const effect = overlay.dataset.effect || this.defaultEffect;
      this.close(id, effect);
    });
  }

  // ... (resto del código loadContent y demás métodos se mantiene igual)
  static async loadContent(modalId, resource, options) {
    const content = document.querySelector(`#${modalId} .og-modal-content`);

    try {
      if (options.html) {
        content.innerHTML = resource;
        return;
      }

      if (typeof resource === 'string' && resource.startsWith('core:')) {
        const corePath = resource.replace('core:', '');
        const afterRenderCallback = options.afterRender || null;
        await ogModule('form').load(corePath, content, null, true, afterRenderCallback);
        return;
      }

      // Soporte para middle: (formularios en /middle/)
      if (typeof resource === 'string' && resource.startsWith('middle:')) {
        const middlePath = resource.replace('middle:', '');
        const afterRenderCallback = options.afterRender || null;
        
        // Pasar directamente con el prefijo middle: para que form.js lo procese
        if (middlePath.includes('/forms/')) {
          await ogModule('form').load(`middle:${middlePath}`, content, null, null, afterRenderCallback);
        } else {
          // Si es una vista
          await ogModule('view').loadView(middlePath, content, null, null, afterRenderCallback, null, 'middle');
        }
        return;
      }

      if (typeof resource === 'string' && resource.startsWith('extension:')) {
        const pluginPath = resource.replace('extension:', '');
        const afterRenderCallback = options.afterRender || null;
        await ogModule('form').load(pluginPath, content, null, false, afterRenderCallback);
        return;
      }

      if (typeof resource === 'string' && resource.includes('|forms/')) {
        const [extensionName, formPath] = resource.split('|');
        const formName = formPath.replace('forms/', '');
        const afterRenderCallback = options.afterRender || null;
        await ogModule('form').load(`${extensionName}/${formName}`, content, null, false, afterRenderCallback);
        return;
      }

      if (typeof resource === 'string' && resource.includes('/forms/')) {
        const afterRenderCallback = options.afterRender || null;
        await ogModule('form').load(resource, content, null, false, afterRenderCallback);
        return;
      }

      if (typeof resource === 'string' && resource.startsWith('core:sections/')) {
        const corePath = resource.replace('core:sections/', '');
        const afterRenderCallback = options.afterRender || null;
        await ogModule('view').loadView(corePath, content, null, null, afterRenderCallback);
        return;
      }

      if (typeof resource === 'string' && resource.includes('|')) {
        const [extension, viewPath] = resource.split('|');
        const afterRenderCallback = options.afterRender || null;
        await ogModule('view').loadView(`${viewPath}`, content, extension, null, afterRenderCallback);
        return;
      }

      if (typeof resource === 'string') {
        const afterRenderCallback = options.afterRender || null;
        await ogModule('view').loadView(resource, content, null, null, afterRenderCallback);
        return;
      }

      if (typeof resource === 'object' && resource.view) {
        const afterRenderCallback = options.afterRender || null;
        await ogModule('view').loadView(resource.view, content, null, null, afterRenderCallback);
        return;
      }

      throw new Error('Formato de recurso no válido');

    } catch (error) {
      ogLogger.error('com:modal', 'Error cargando contenido:', error);
      content.innerHTML = `
        <div class="alert alert-danger">
          <h4>${__('com.modal.error')}</h4>
          <p>${__('com.modal.error_loading', { error: error.message })}</p>
        </div>
      `;
    }
  }

  static async openWithData(resource, options = {}) {
    const dataLoader = ogModule('dataLoader');
    const hook = ogModule('hook');
    const toast = ogComponent('toast');

    if (!options.id) {
      ogLogger.warn('com:modal', 'No se especificó ID para cargar datos');
      const result = this.open(resource, options);
      return result.modalId;
    }

    const { modalId, loadPromise } = this.open(resource, options);
    let extensionName = null;

    if (resource.includes('|')) {
      extensionName = resource.split('|')[0];
    }

    let dataLoaderConfig = options.dataLoader;

    if (!dataLoaderConfig) {
      const button = event?.target?.closest('[data-loader-config]');
      if (button) {
        const configStr = button.getAttribute('data-loader-config');
        dataLoaderConfig = JSON.parse(configStr.replace(/&quot;/g, '"'));
      }
    }

    if (!dataLoaderConfig && extensionName) {
      const pluginConfig = hook?.getPluginConfig(extensionName);
      if (pluginConfig?.backend) {
        dataLoaderConfig = {
          type: 'auto',
          api: {
            enabled: pluginConfig.backend.enabled,
            endpoint: pluginConfig.backend.endpoints?.show?.path?.replace('{id}', options.id)
          },
          mock: pluginConfig.mockData
        };
      }
    }

    if (dataLoaderConfig && dataLoader) {
      try {
        await loadPromise;
        const data = await dataLoader.loadDetail(dataLoaderConfig, options.id, extensionName);
        const modalContent = document.querySelector(`#${modalId} .og-modal-content`);
        const formElement = modalContent?.querySelector('form');

        if (!formElement) {
          ogLogger.error('com:modal', 'No se encontró ningún formulario en el modal');
          if (toast) {
            ogToast.error(__('com.modal.form_not_found'));
          }
          return modalId;
        }

        const realFormId = formElement.getAttribute('id');
        ogModule('form')?.fill(realFormId, data, modalContent);

      } catch (error) {
        ogLogger.error('com:modal', 'Error cargando datos', error);
        if (toast) {
          ogToast.error(__('com.modal.error_loading_data'));
        }
      }
    } else {
      ogLogger.warn('com:modal', 'No se pudo cargar datos (sin dataLoader)');
    }

    return modalId;
  }

  static waitForForm(formId, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkForm = () => {
        const formElement = document.getElementById(formId);

        if (formElement) {
          resolve(formElement);
        } else if (Date.now() - startTime >= timeout) {
          ogLogger.error('com:modal', `Timeout - Formulario "${formId}" no encontrado`);
          reject(new Error(`Formulario ${formId} no encontrado`));
        } else {
          requestAnimationFrame(checkForm);
        }
      };

      checkForm();
    });
  }

  static processI18nInString(str) {
    const i18n = ogModule('i18n');
    return i18n ? i18n.processString(str) : str;
  }

  // Método para cambiar el efecto por defecto globalmente
  static setDefaultEffect(effect) {
    this.defaultEffect = effect;
  }

  // Actualiza el título (y opcionalmente before/after/extra) de un modal abierto
  static updateTitle(modalId, title, extra = null, before = null, after = null) {
    const overlay = this.modals.get(modalId);
    if (!overlay) return;
    const titleEl = overlay.querySelector('.og-modal-title');
    if (titleEl) titleEl.textContent = this.processI18nInString(title);
    if (extra !== null) {
      let extraEl = overlay.querySelector('.og-modal-header-extra');
      if (!extraEl) {
        extraEl = document.createElement('span');
        extraEl.className = 'og-modal-header-extra';
        overlay.querySelector('.og-modal-header-left')?.appendChild(extraEl);
      }
      extraEl.innerHTML = this.processI18nInString(extra);
    }
    if (before !== null) {
      const el = overlay.querySelector('.og-modal-title-before');
      if (el) el.innerHTML = this.processI18nInString(before);
    }
    if (after !== null) {
      const el = overlay.querySelector('.og-modal-title-after');
      if (el) el.innerHTML = this.processI18nInString(after);
    }
  }

  // Obtiene el modalId del modal más reciente abierto
  static getLastModalId() {
    const keys = [...this.modals.keys()];
    return keys[keys.length - 1] || null;
  }
}

window.ogModal = ogModal;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.components.modal = ogModal;
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('og-modal-overlay') && e.target.dataset.closeOnOverlay) {
    const modalId = e.target.id;
    const effect = e.target.dataset.effect || 'slide-up';
    ogModal.close(modalId, effect);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // Cierra solo el último modal activo que tenga closeOnEsc
  const keys = [...ogModal.modals.keys()];
  for (let i = keys.length - 1; i >= 0; i--) {
    const overlay = ogModal.modals.get(keys[i]);
    if (overlay && overlay.dataset.closeOnEsc) {
      const effect = overlay.dataset.effect || ogModal.defaultEffect;
      ogModal.close(keys[i], effect);
      break;
    }
  }
});