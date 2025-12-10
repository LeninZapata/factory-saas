class tabs {
  static tabCache = new Map();

  static async render(tabsData, container) {
    this.tabCache.clear();

    if (!tabsData || !tabsData.tabs || !container) return;

    const tabsHTML = `
      <div class="tabs-component">
        <div class="tabs-header">
          ${tabsData.tabs.map(tab => `
            <button class="tab-btn" data-tab="${tab.id}">
              ${tab.title}
            </button>
          `).join('')}
        </div>
        <div class="tab-content" id="tab-content-${tabsData.id}"></div>
      </div>
    `;

    container.innerHTML = tabsHTML;
    this.bindTabEvents(tabsData, container);

    // Detectar overflow para mostrar degradado
    this.checkOverflow(container);
    
    // Recheck on window resize
    window.addEventListener('resize', () => this.checkOverflow(container));

    const firstTab = tabsData.tabs[0];
    if (firstTab) {
      await this.loadTabContent(tabsData, firstTab.id, container);
    }

    // Precargar todas las tabs si está habilitado
    if (tabsData.preloadAllTabs === true) {
      await this.preloadAllTabs(tabsData, container);
    }
  }

  // Detectar si hay overflow y agregar clase
  static checkOverflow(container) {
    const tabsHeader = container.querySelector('.tabs-header');
    if (!tabsHeader) return;

    // Verificar si el contenido es más ancho que el contenedor
    const hasOverflow = tabsHeader.scrollWidth > tabsHeader.clientWidth;
    
    if (hasOverflow) {
      tabsHeader.classList.add('has-overflow');
    } else {
      tabsHeader.classList.remove('has-overflow');
    }

    // Actualizar en scroll para ocultar degradado cuando llega al final
    tabsHeader.addEventListener('scroll', () => {
      const isAtEnd = tabsHeader.scrollLeft + tabsHeader.clientWidth >= tabsHeader.scrollWidth - 5;
      
      if (isAtEnd) {
        tabsHeader.classList.remove('has-overflow');
      } else if (hasOverflow) {
        tabsHeader.classList.add('has-overflow');
      }
    });
  }

  static async preloadAllTabs(tabsData, container) {
    const tabsToPreload = tabsData.tabs.slice(1);
    
    for (const tab of tabsToPreload) {
      try {
        await this.loadTabContentSilent(tabsData, tab.id, container);
      } catch (error) {
        logger.error('com:tabs', `Error precargando tab ${tab.id}:`, error);
      }
    }
  }

  static async loadTabContentSilent(tabsData, tabId, container) {
    const tab = tabsData.tabs.find(t => t.id === tabId);
    if (!tab) return;

    const cacheKey = `${tabsData.id}-${tabId}`;
    
    if (this.tabCache.has(cacheKey)) {
      return;
    }

    try {
      const renderedContent = this.renderContent(tab.content);
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = renderedContent;

      await this.loadDynamicComponents(tempContainer);
      this.tabCache.set(cacheKey, tempContainer);
    } catch (error) {
      logger.error('com:tabs', `Error cargando tab ${tabId}:`, error);
    }
  }

  static bindTabEvents(tabsData, container) {
    const tabButtons = container.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tabId = btn.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Scroll suave al tab activo si está fuera de vista
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

        await this.loadTabContent(tabsData, tabId, container);
      });
    });

    if (tabButtons[0]) {
      tabButtons[0].classList.add('active');
    }
  }

  static async loadTabContent(tabsData, tabId, container) {
    const tabContent = container.querySelector('.tab-content');
    const tab = tabsData.tabs.find(t => t.id === tabId);

    if (!tab) {
      tabContent.innerHTML = '<div class="tab-error">Tab no encontrado</div>';
      return;
    }

    const cacheKey = `${tabsData.id}-${tabId}`;

    if (this.tabCache.has(cacheKey)) {
      const cachedNode = this.tabCache.get(cacheKey);
      tabContent.innerHTML = '';
      tabContent.appendChild(cachedNode);
      return;
    }

    tabContent.innerHTML = '<div class="tab-loading">Cargando...</div>';

    try {
      const renderedContent = this.renderContent(tab.content);

      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = renderedContent;

      await this.loadDynamicComponents(tempContainer);

      this.tabCache.set(cacheKey, tempContainer);

      tabContent.innerHTML = '';
      tabContent.appendChild(tempContainer);

    } catch (error) {
      logger.error('com:tabs', `Error cargando tab ${tabId}:`, error);
      tabContent.innerHTML = '<div class="tab-error">Error cargando contenido</div>';
    }
  }

  static renderContent(content) {
    if (typeof content === 'string') return content;

    if (Array.isArray(content)) {
      return content
        .filter(item => item != null)
        .map(item => this.renderContentItem(item))
        .join('');
    }

    if (content == null) return '';
    return this.renderContentItem(content);
  }

  static renderContentItem(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item;
    if (typeof item !== 'object') return '';

    const formJson = item.form_json || item.formJson;
    if (item.type === 'form' && formJson) {
      return `<div class="dynamic-form" data-form-json="${formJson}"></div>`;
    }

    if (item.type === 'component' && item.component) {
      const configJson = JSON.stringify(item.config || {}).replace(/"/g, '&quot;');
      return `<div class="dynamic-component" data-component="${item.component}" data-config="${configJson}"></div>`;
    }

    if (item.type === 'html') {
      return item.content || '';
    }

    return '';
  }

  static async loadDynamicComponents(container) {
    const formContainers = container.querySelectorAll('.dynamic-form[data-form-json]');

    for (const formContainer of formContainers) {
      const formJson = formContainer.dataset.formJson;
      try {
        await form.load(formJson, formContainer);
      } catch (error) {
        logger.error('com:tabs', 'Error cargando formulario:', error);
        formContainer.innerHTML = `<div class="error">Error: ${formJson}</div>`;
      }
    }

    // Cargar componentes dinámicos
    const componentContainers = container.querySelectorAll('.dynamic-component[data-component]');

    for (const compContainer of componentContainers) {
      const componentName = compContainer.dataset.component;
      const configStr = compContainer.dataset.config;

      try {
        const config = configStr ? JSON.parse(configStr) : {};

        if (componentName === 'datatable' && window.datatable) {
          await datatable.render(config, compContainer);
        } else if (window[componentName] && typeof window[componentName].render === 'function') {
          await window[componentName].render(config, compContainer);
        } else {
          logger.warn('com:tabs', `Componente ${componentName} no encontrado`);
          compContainer.innerHTML = `<div class="error">Componente '${componentName}' no disponible</div>`;
        }
      } catch (error) {
        logger.error('com:tabs', `Error cargando componente ${componentName}:`, error);
        compContainer.innerHTML = `<div class="error">Error en componente: ${componentName}</div>`;
      }
    }
  }

  static clearCache() {
    this.tabCache.clear();
  }
}

window.tabs = tabs;