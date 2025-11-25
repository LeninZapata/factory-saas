class view {
  static views = {};
  static loadedPlugins = {};
  static viewNavigationCache = new Map();

  /**
   * Cargar vista
   * @param {string} viewName - Nombre/ruta de la vista
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {string} pluginContext - Nombre del plugin (si aplica)
   * @param {object} menuResources - Recursos adicionales del menú
   * @param {function} afterRender - Callback a ejecutar después de renderizar
   */
  static async loadView(viewName, container = null, pluginContext = null, menuResources = null, afterRender = null) {
    const navCacheKey = `nav_${pluginContext || 'core'}_${viewName}`;
    
    if (!container && window.appConfig?.cache?.viewNavigation) {
      if (this.viewNavigationCache.has(navCacheKey)) {
        const cachedData = this.viewNavigationCache.get(navCacheKey);
        const content = document.getElementById('content');
        if (content) {
          content.innerHTML = cachedData.html;
          
          document.body.setAttribute('data-view', cachedData.viewId);
          document.body.className = document.body.className
            .split(' ')
            .filter(c => !c.startsWith('layout-'))
            .join(' ');
          if (cachedData.layout) {
            document.body.classList.add(`layout-${cachedData.layout}`);
          }
          
          await this.reInitializeCachedView(cachedData);
          
          // ✅ Ejecutar afterRender si existe
          if (typeof afterRender === 'function') {
            console.log('✅ VIEW: Ejecutando afterRender (desde caché)');
            try {
              afterRender(cachedData.viewId, content);
            } catch (error) {
              console.error('❌ VIEW: Error en afterRender:', error);
            }
          }
          
          return;
        }
      }
    }

    let basePath;
    let cacheKey;

    // ✅ CASO 1: Plugin explícito (pasado como parámetro)
    if (pluginContext) {
      basePath = `plugins/${pluginContext}/views`;
      cacheKey = `plugin_view_${pluginContext}_${viewName.replace(/\//g, '_')}`;
      console.log(`👁️ VIEW (PLUGIN): ${basePath}/${viewName}.json`);
    }
    // ✅ CASO 2: Ruta con "/" → Detectar si es plugin o core
    else if (viewName.includes('/')) {
      const parts = viewName.split('/');
      const firstPart = parts[0];
      
      const isPlugin = window.hook?.isPluginEnabled?.(firstPart);
      
      if (isPlugin) {
        basePath = `plugins/${firstPart}/views`;
        const restPath = parts.slice(1).join('/');
        viewName = restPath || viewName;
        cacheKey = `plugin_view_${firstPart}_${viewName.replace(/\//g, '_')}`;
        console.log(`👁️ VIEW (AUTO-PLUGIN): ${basePath}/${restPath}.json`);
      } else {
        basePath = 'js/views';
        cacheKey = `core_view_${viewName.replace(/\//g, '_')}`;
        console.log(`👁️ VIEW (CORE): ${basePath}/${viewName}.json`);
      }
    }
    // ✅ CASO 3: Sin "/" → Vista simple (dashboard, etc)
    else {
      const pluginConfig = this.loadedPlugins[viewName];
      if (pluginConfig && pluginConfig.hasViews) {
        basePath = `plugins/${viewName}/views`;
        cacheKey = `plugin_view_${viewName}`;
        console.log(`👁️ VIEW (SIMPLE-PLUGIN): ${basePath}/${viewName}.json`);
      } else {
        basePath = 'js/views';
        cacheKey = `core_view_${viewName}`;
        console.log(`👁️ VIEW (SIMPLE-CORE): ${basePath}/${viewName}.json`);
      }
    }

    // Intentar cargar desde caché
    if (window.appConfig?.cache?.views) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`✅ VIEW: Cargada desde caché`);
        const combinedData = this.combineResources(cached, menuResources);

        if (container) {
          this.renderViewInContainer(combinedData, container);
        } else {
          this.renderView(combinedData);
        }

        await this.loadAndInitResources(combinedData);

        // ✅ Ejecutar afterRender después de cargar recursos
        if (typeof afterRender === 'function') {
          const viewContainer = container || document.getElementById('content');
          console.log('✅ VIEW: Ejecutando afterRender callback');
          try {
            afterRender(combinedData.id, viewContainer);
          } catch (error) {
            console.error('❌ VIEW: Error en afterRender callback:', error);
          }
        }

        if (!container && window.appConfig?.cache?.viewNavigation) {
          const content = document.getElementById('content');
          if (content) {
            this.viewNavigationCache.set(navCacheKey, {
              html: content.innerHTML,
              viewId: combinedData.id,
              layout: combinedData.layout,
              viewData: combinedData
            });
          }
        }

        return;
      }
    }

    // Cargar desde servidor
    try {
      const cacheBuster = window.appConfig?.cache?.views ? '' : `?t=${Date.now()}`;
      const url = `${window.BASE_URL}${basePath}/${viewName}.json${cacheBuster}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }

      const viewData = await response.json();

      // Validar estructura (solo en desarrollo)
      if (window.validator) {
        const validation = validator.validate('view', viewData, `${viewName}.json`);
        if (!validation.valid) {
          console.error(validation.message);
          if (window.appConfig?.isDevelopment) {
            this.renderError(`${validation.message}`, container);
            return;
          }
        }
      }

      const combinedData = this.combineResources(viewData, menuResources);

      // Guardar en caché
      if (window.appConfig?.cache?.views) {
        cache.set(cacheKey, viewData, window.appConfig.cache.ttl);
      }

      // Renderizar
      if (container) {
        this.renderViewInContainer(combinedData, container);
      } else {
        this.renderView(combinedData);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      await this.loadAndInitResources(combinedData);

      // ✅ Ejecutar afterRender después de cargar recursos
      if (typeof afterRender === 'function') {
        const viewContainer = container || document.getElementById('content');
        console.log('✅ VIEW: Ejecutando afterRender callback');
        try {
          afterRender(combinedData.id, viewContainer);
        } catch (error) {
          console.error('❌ VIEW: Error en afterRender callback:', error);
        }
      }

      // Guardar en caché de navegación
      if (!container && window.appConfig?.cache?.viewNavigation) {
        const content = document.getElementById('content');
        if (content) {
          this.viewNavigationCache.set(navCacheKey, {
            html: content.innerHTML,
            viewId: combinedData.id,
            layout: combinedData.layout,
            viewData: combinedData
          });
        }
      }

    } catch (error) {
      console.error('❌ VIEW: Error cargando vista:', error);
      this.renderError(viewName, container);
    }
  }

  static combineResources(viewData, menuResources) {
    if (!menuResources || (!menuResources.scripts?.length && !menuResources.styles?.length)) {
      return viewData;
    }

    const combined = { ...viewData };

    if (menuResources.scripts?.length > 0) {
      combined.scripts = [...new Set([
        ...(viewData.scripts || []),
        ...menuResources.scripts
      ])];
    }

    if (menuResources.styles?.length > 0) {
      combined.styles = [...new Set([
        ...(viewData.styles || []),
        ...menuResources.styles
      ])];
    }

    return combined;
  }

  static async loadAndInitResources(viewData) {
    if (!viewData.scripts && !viewData.styles) {
      return;
    }

    await this.loadViewResources(viewData);

    await new Promise(resolve => setTimeout(resolve, 20));

    await this.initViewComponents(viewData);
  }

  static async loadViewResources(viewData) {
    if (viewData.scripts || viewData.styles) {
      try {
        await loader.loadResources(
          viewData.scripts || [],
          viewData.styles || []
        );
      } catch (error) {
        console.error('Error cargando recursos:', error);
      }
    }
  }

  static async findViewInPlugins(viewPath, container) {
    for (const [pluginName, pluginConfig] of Object.entries(this.loadedPlugins)) {
      if (!pluginConfig.hasViews) continue;

      try {
        const basePath = `plugins/${pluginName}/views`;
        const cacheBuster = window.appConfig?.cache?.views ? '' : `?t=${Date.now()}`;
        const url = `${window.BASE_URL}${basePath}/${viewPath}.json${cacheBuster}`;

        const response = await fetch(url);

        if (response.ok) {
          const viewData = await response.json();

          if (window.appConfig?.cache?.views) {
            const cacheKey = `plugin_view_${pluginName}_${viewPath.replace(/\//g, '_')}`;
            cache.set(cacheKey, viewData, window.appConfig.cache.ttl);
          }

          if (container) {
            this.renderViewInContainer(viewData, container);
          } else {
            this.renderView(viewData);
          }
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  static registerPlugin(pluginName, pluginConfig) {
    this.loadedPlugins[pluginName] = pluginConfig;
  }

  static getLoadedPlugins() {
    return this.loadedPlugins;
  }

  static isPluginLoaded(pluginName) {
    return !!this.loadedPlugins[pluginName];
  }

  static renderView(viewData) {
    const content = document.getElementById('content');

    document.body.setAttribute('data-view', viewData.id);

    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('layout-'))
      .join(' ');

    if (viewData.layout) {
      document.body.classList.add(`layout-${viewData.layout}`);
    }

    content.innerHTML = this.generateViewHTML(viewData);
    this.setupView(viewData);
  }

  static renderViewInContainer(viewData, container) {
    container.innerHTML = this.generateViewHTML(viewData);
    this.setupView(viewData, container);
  }

  static generateViewHTML(viewData) {
    if (viewData.type === 'tabs') {
      return `
        <div class="view-container">
          <h1>${viewData.title}</h1>
          <div class="view-tabs-container" data-view-id="${viewData.id}"></div>
        </div>
      `;
    }

    return `
      <div class="view-container">
        <h1>${viewData.title}</h1>

        ${viewData.toolbar ? `
          <div class="view-toolbar">
            ${this.renderContent(viewData.toolbar)}
          </div>
        ` : ''}

        ${viewData.tabs ? `
          <div class="view-tabs-container" data-view-id="${viewData.id}"></div>
        ` : `
          <div class="view-content">
            ${this.renderContent(viewData.content)}
          </div>
        `}

        ${viewData.statusbar ? `
          <div class="view-statusbar">
            ${this.renderContent(viewData.statusbar)}
          </div>
        ` : ''}
      </div>
    `;
  }

  static async setupView(viewData, container = null) {
    const viewContainer = container || document.getElementById('content');

    if (viewData.id && window.hook) {
      const hookName = `hook_${viewData.id}`;

      const existingContent = Array.isArray(viewData.content) ?
        viewData.content.map(item => ({
          order: item.order || 999,
          ...item
        })) : [];

      const hookResults = hook.execute(hookName, existingContent);

      if (hookResults.length > existingContent.length) {
        viewData.content = hookResults;

        const contentContainer = viewContainer.querySelector('.view-content');
        if (contentContainer) {
          contentContainer.innerHTML = this.renderContent(hookResults);
        }
      }
    }

    if (viewData.tabs) {
      const tabsContainer = viewContainer.querySelector('.view-tabs-container');
      if (tabsContainer) {
        await tabs.render(viewData, tabsContainer);
      }
    } else {
      await this.loadDynamicComponents(viewContainer);
    }

    setTimeout(() => this.initFormValidation(), 0);
  }

  static async initViewComponents(viewData) {
    if (!viewData.scripts || viewData.scripts.length === 0) {
      return;
    }

    viewData.scripts.forEach((scriptPath) => {
      const componentName = this.extractComponentName(scriptPath);

      if (componentName && window[componentName]) {
        if (typeof window[componentName].init === 'function') {
          try {
            window[componentName].init();
          } catch (error) {
            console.error(`Error ejecutando ${componentName}.init():`, error);
          }
        }
      }
    });
  }

  static extractComponentName(scriptPath) {
    const fileName = scriptPath.split('/').pop().replace('.js', '');

    const possibleNames = [
      fileName,
      `ejemplo${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`,
      fileName.charAt(0).toUpperCase() + fileName.slice(1)
    ];

    for (const name of possibleNames) {
      if (window[name]) {
        return name;
      }
    }

    return null;
  }

  static renderContent(content) {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content.map(item => this.renderContentItem(item)).join('');
    }

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
        console.error('Error cargando formulario:', error);
        formContainer.innerHTML = `<div class="error">Error cargando formulario: ${formJson}</div>`;
      }
    }

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
          console.warn(`Componente ${componentName} no encontrado`);
          compContainer.innerHTML = `<div class="error">Componente '${componentName}' no disponible</div>`;
        }
      } catch (error) {
        console.error(`Error cargando componente ${componentName}:`, error);
        compContainer.innerHTML = `<div class="error">Error en componente: ${componentName}</div>`;
      }
    }
  }

  static renderError(viewName, container = null) {
    const errorHTML = `
      <div class="view-error">
        <h2>❌ Error</h2>
        <p>No se pudo cargar la vista: <strong>${viewName}</strong></p>
        <p>Verifica que el archivo exista en la ruta configurada</p>
      </div>
    `;

    if (container) {
      container.innerHTML = errorHTML;
    } else {
      const content = document.getElementById('content');
      content.innerHTML = errorHTML;
    }
  }

  static initFormValidation() {
    document.removeEventListener('blur', this.handleInputBlur, true);
    document.removeEventListener('submit', this.handleFormSubmit, true);

    document.addEventListener('blur', this.handleInputBlur, true);
    document.addEventListener('submit', this.handleFormSubmit, true);
  }

  static handleInputBlur(e) {
    if (e.target.matches('input, select, textarea')) {
      e.target.classList.add('touched');
      if (!e.target.validity.valid) {
        e.target.style.borderColor = '#dc3545';
      } else {
        e.target.style.borderColor = '';
      }
    }
  }

  static handleFormSubmit(e) {
    if (e.target.matches('form')) {
      const inputs = e.target.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.classList.add('touched');
        if (!input.validity.valid) {
          input.style.borderColor = '#dc3545';
        } else {
          input.style.borderColor = '';
        }
      });
    }
  }

  static async reInitializeCachedView(cachedData) {
    const viewData = cachedData.viewData;
    const content = document.getElementById('content');
    
    if (viewData.tabs && content) {
      const tabsContainer = content.querySelector('.view-tabs-container');
      if (tabsContainer && window.tabs) {
        await tabs.render(viewData, tabsContainer);
      }
    }
    
    await this.loadDynamicComponents(content);
  }

  static clearNavigationCache(viewName = null, pluginContext = null) {
    if (viewName) {
      const navCacheKey = `nav_${pluginContext || 'core'}_${viewName}`;
      this.viewNavigationCache.delete(navCacheKey);
    } else {
      this.viewNavigationCache.clear();
    }
  }

  static refreshView(viewName, pluginContext = null) {
    this.clearNavigationCache(viewName, pluginContext);
    this.loadView(viewName, null, pluginContext);
  }

  static getNavigationCacheStats() {
    return {
      size: this.viewNavigationCache.size,
      keys: Array.from(this.viewNavigationCache.keys())
    };
  }
}

window.view = view;