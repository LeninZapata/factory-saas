class view {
  static views = {};
  static loadedPlugins = {};
  static viewNavigationCache = new Map();
  static lastSessionCheck = 0;
  static SESSION_CHECK_INTERVAL = 30000; // 30 segundos

  static async loadView(viewName, container = null, pluginContext = null, menuResources = null, afterRender = null, menuId = null) {
    // ✅ NO verificar sesión aquí - se hace en auth.startSessionMonitoring()
    // La verificación cada X minutos es suficiente, no necesitamos verificar en cada clic

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
          if (typeof afterRender === 'function') {
            try {
              afterRender(cachedData.viewId, content);
            } catch (error) {
              logger.error('cor:view', 'Error en afterRender:', error);
            }
          }
          return;
        }
      }
    }

    let basePath;
    let cacheKey;

    if (pluginContext) {
      basePath = `plugins/${pluginContext}/views`;
      cacheKey = `plugin_view_${pluginContext}_${viewName.replace(/\//g, '_')}`;
    }
    else if (viewName.startsWith('core:')) {
      viewName = viewName.replace('core:', '');
      basePath = 'js/views';
      cacheKey = `core_view_${viewName.replace(/\//g, '_')}`;
    }
    else if (viewName.includes('/')) {
      const parts = viewName.split('/');
      const firstPart = parts[0];
      const isPlugin = window.hook?.isPluginEnabled?.(firstPart);
      if (isPlugin) {
        basePath = `plugins/${firstPart}/views`;
        const restPath = parts.slice(1).join('/');
        viewName = restPath || viewName;
        cacheKey = `plugin_view_${firstPart}_${viewName.replace(/\//g, '_')}`;
        pluginContext = firstPart;
      } else {
        basePath = 'js/views';
        cacheKey = `core_view_${viewName.replace(/\//g, '_')}`;
      }
    }
    else {
      basePath = 'js/views';
      cacheKey = `core_view_${viewName.replace(/\//g, '_')}`;
    }

    try {
      let viewData = cache.get(cacheKey);

      if (!viewData) {
        const cacheBuster = window.appConfig?.cache?.views ? '' : `?t=${Date.now()}`;
        const url = `${window.BASE_URL}${basePath}/${viewName}.json${cacheBuster}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (container) {
            throw new Error(`Vista no encontrada: ${viewName}`);
          }
          const found = await this.findViewInPlugins(viewName, container);
          if (!found) {
            throw new Error(`Vista no encontrada: ${viewName}`);
          }
          return;
        }

        viewData = await response.json();

        if (window.appConfig?.cache?.views) {
          cache.set(cacheKey, viewData);
        }
      }

      // ✅ Filtrar tabs según permisos ANTES de renderizar
      if (viewData.tabs && pluginContext) {
        const effectiveMenuId = menuId || viewData.id;
        viewData.tabs = this.filterTabsByPermissions(viewData.tabs, pluginContext, effectiveMenuId);
      }

      const combinedData = this.combineResources(viewData, menuResources);

      if (container) {
        this.renderViewInContainer(combinedData, container);
      } else {
        this.renderView(combinedData);
      }

      await this.loadAndInitResources(combinedData);

      if (typeof afterRender === 'function') {
        const content = container || document.getElementById('content');
        try {
          afterRender(combinedData.id, content);
        } catch (error) {
          logger.error('cor:view', 'Error en afterRender:', error);
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

    } catch (error) {
      logger.error('cor:view', `Error cargando vista ${viewName}:`, error);
      this.renderError(viewName, container);
    }
  }

  // Filtrar tabs según permisos del usuario
  static filterTabsByPermissions(tabs, pluginName, menuId) {
    if (window.auth?.user?.role === 'admin') return tabs;

    if (!window.auth?.userPermissions?.plugins) {
      logger.warn('cor:view', 'Usuario sin permisos - ocultando tabs');
      return [];
    }

    const pluginPerms = window.auth.userPermissions.plugins[pluginName];

    if (!pluginPerms || pluginPerms.enabled === false) {
      logger.warn('cor:view', `Plugin ${pluginName} sin permisos`);
      return [];
    }

    if (!pluginPerms.menus || pluginPerms.menus === '*') {
      logger.debug('cor:view', `Plugin ${pluginName} con acceso total`);
      return tabs;
    }

    const menuPerms = pluginPerms.menus[menuId];

    // Si menuPerms es boolean true, mostrar todas
    if (menuPerms === true) {
      logger.debug('cor:view', `Menú ${menuId} con acceso total`);
      return tabs;
    }

    // Si no hay permisos del menú, NO mostrar tabs
    if (!menuPerms || typeof menuPerms !== 'object') {
      logger.warn('cor:view', `Sin permisos para menú ${menuId}`);
      return [];
    }

    // Si enabled === false, no mostrar tabs
    if (menuPerms.enabled === false) {
      logger.warn('cor:view', `Menú ${menuId} deshabilitado`);
      return [];
    }

    // Si tabs === '*', mostrar todas
    if (menuPerms.tabs === '*') {
      logger.debug('cor:view', `Todas las tabs permitidas para ${menuId}`);
      return tabs;
    }

    // Si tabs no está definido o es array vacío, NO mostrar tabs
    if (!menuPerms.tabs || (Array.isArray(menuPerms.tabs) && menuPerms.tabs.length === 0)) {
      logger.warn('cor:view', `Sin permisos de tabs para ${menuId}`);
      return [];
    }

    // Si tabs es un objeto, filtrar
    if (typeof menuPerms.tabs === 'object' && !Array.isArray(menuPerms.tabs)) {
      const filteredTabs = tabs.filter(tab => menuPerms.tabs[tab.id] === true);
      logger.info('cor:view', `Tabs filtradas para ${menuId}: ${filteredTabs.length}/${tabs.length} visibles`);

      if (filteredTabs.length === 0) {
        logger.warn('cor:view', `Ninguna tab tiene permiso en ${menuId}. Permisos:`, menuPerms.tabs);
      }

      return filteredTabs;
    }

    // Default: no mostrar
    logger.warn('cor:view', `Configuración de tabs no válida para ${menuId}`);
    return [];
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
    await new Promise(resolve => setTimeout(resolve, 1));
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
        logger.error('cor:view', 'Error cargando recursos:', error);
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
          this.renderView(viewData);
          await this.loadViewResources(viewData);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  static registerPlugin(pluginName, pluginData) {
    this.loadedPlugins[pluginName] = pluginData;
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
    return `
      <div class="view-container" data-view="${viewData.id}">
        ${viewData.header ? `
          <div class="view-header">
            ${viewData.header.title ? `<h1>${viewData.header.title}</h1>` : ''}
            ${viewData.header.subtitle ? `<p>${viewData.header.subtitle}</p>` : ''}
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

      logger.debug('cor:view', `Ejecutando hooks para vista: ${viewData.id}`);

      // Ejecutar hooks (sin defaultData para obtener todos los hooks)
      const allHooks = hook.execute(hookName, []);

      if (allHooks.length > 0) {
        logger.debug('cor:view', `${allHooks.length} hooks encontrados para ${viewData.id}`);

        // Procesar hooks según su contexto
        await this.processHooksWithContext(viewData, allHooks, viewContainer);
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

  static async processHooksWithContext(viewData, hooks, viewContainer) {
    // Separar hooks por contexto
    const hooksBeforeView = hooks.filter(h => h.context === 'view' && h.position === 'before');
    const hooksAfterView = hooks.filter(h => h.context === 'view' && h.position === 'after');
    const hooksForTabs = hooks.filter(h => h.context === 'tab');
    const hooksForContent = hooks.filter(h => h.context === 'content' || !h.context);
    
    // 1. Procesar hooks ANTES de la vista (context: view, position: before)
    if (hooksBeforeView.length > 0) {
      logger.debug('cor:view', `Procesando ${hooksBeforeView.length} hooks ANTES de la vista`);
      await this.renderHooksBeforeView(hooksBeforeView, viewContainer);
    }
    
    // 2. Procesar hooks DENTRO de tabs (context: tab, target: tabId)
    if (hooksForTabs.length > 0 && Array.isArray(viewData.tabs)) {
      logger.debug('cor:view', `Procesando ${hooksForTabs.length} hooks DENTRO de tabs`);
      this.mergeHooksIntoTabs(viewData, hooksForTabs);
    }
    
    // 3. Procesar hooks DENTRO de content (context: content)
    if (hooksForContent.length > 0 && Array.isArray(viewData.content)) {
      logger.debug('cor:view', `Procesando ${hooksForContent.length} hooks DENTRO de content`);
      this.mergeHooksIntoContent(viewData, hooksForContent);
    }
    
    // 4. Procesar hooks DESPUÉS de la vista (context: view, position: after)
    if (hooksAfterView.length > 0) {
      logger.debug('cor:view', `Procesando ${hooksAfterView.length} hooks DESPUÉS de la vista`);
      // Se procesan después de que se renderice todo
      setTimeout(() => {
        this.renderHooksAfterView(hooksAfterView, viewContainer);
      }, 300);
    }
  }

  static async renderHooksBeforeView(hooks, viewContainer) {
    // Ordenar por order
    hooks.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'hooks-before-view';
    container.style.cssText = 'margin-bottom: 1rem;';
    
    // Renderizar cada hook
    for (const hookItem of hooks) {
      await this.renderHookItem(hookItem, container);
    }
    
    // Insertar al principio del viewContainer
    if (container.children.length > 0) {
      viewContainer.insertBefore(container, viewContainer.firstChild);
      logger.debug('cor:view', `${hooks.length} hooks insertados ANTES de la vista`);
    }
  }

  static async renderHooksAfterView(hooks, viewContainer) {
    // Ordenar por order
    hooks.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'hooks-after-view';
    container.style.cssText = 'margin-top: 1rem;';
    
    // Renderizar cada hook
    for (const hookItem of hooks) {
      await this.renderHookItem(hookItem, container);
    }
    
    // Agregar al final del viewContainer
    if (container.children.length > 0) {
      viewContainer.appendChild(container);
      logger.debug('cor:view', `${hooks.length} hooks insertados DESPUÉS de la vista`);
    }
  }

  static mergeHooksIntoTabs(viewData, hooks) {
    // Agrupar hooks por target (tab)
    const hooksByTab = {};
    
    hooks.forEach(hook => {
      const target = hook.target;
      if (target) {
        if (!hooksByTab[target]) {
          hooksByTab[target] = [];
        }
        hooksByTab[target].push(hook);
      }
    });
    
    // Mezclar hooks en cada tab
    viewData.tabs = viewData.tabs.map(tab => {
      const tabHooks = hooksByTab[tab.id];
      
      if (tabHooks && tabHooks.length > 0 && Array.isArray(tab.content)) {
        logger.debug('cor:view', `Mezclando ${tabHooks.length} hooks en tab "${tab.id}"`);
        
        // Preparar contenido existente con order
        const existingContent = tab.content.map(item => ({
          order: item.order || 999,
          ...item
        }));
        
        // Agregar hooks con order
        const hooksWithOrder = tabHooks.map(hook => ({
          order: hook.order || 999,
          ...hook
        }));
        
        // Mezclar y ordenar
        const mixedContent = [...hooksWithOrder, ...existingContent];
        mixedContent.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        return {
          ...tab,
          content: mixedContent
        };
      }
      
      return tab;
    });
  }

  static mergeHooksIntoContent(viewData, hooks) {
    // Preparar contenido existente con order
    const existingContent = viewData.content.map(item => ({
      order: item.order || 999,
      ...item
    }));
    
    // Agregar hooks con order
    const hooksWithOrder = hooks.map(hook => ({
      order: hook.order || 999,
      ...hook
    }));
    
    // Mezclar y ordenar
    const mixedContent = [...hooksWithOrder, ...existingContent];
    mixedContent.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    viewData.content = mixedContent;
    
    logger.debug('cor:view', `${hooks.length} hooks mezclados en content. Total: ${mixedContent.length} items`);
  }

  static async renderHookItem(hookItem, container) {
    if (!hookItem || !container) {
      logger.warn('cor:view', 'renderHookItem: hookItem o container inválido');
      return;
    }

    try {
      if (hookItem.type === 'html') {
        // Renderizar HTML
        const div = document.createElement('div');
        div.id = hookItem.id || `hook-${Date.now()}`;
        div.className = 'hook-item hook-html';
        div.innerHTML = hookItem.content || '';
        container.appendChild(div);
        logger.debug('cor:view', `Hook HTML renderizado: ${div.id}`);
      } 
      else if (hookItem.type === 'component') {
        // Renderizar componente
        const div = document.createElement('div');
        div.id = hookItem.id || `hook-component-${Date.now()}`;
        div.className = 'hook-item hook-component';
        container.appendChild(div);
        
        const componentName = hookItem.component;
        
        if (window[componentName] && typeof window[componentName].render === 'function') {
          setTimeout(async () => {
            try {
              await window[componentName].render(hookItem.config || {}, div);
              logger.debug('cor:view', `Hook component renderizado: ${componentName}`);
            } catch (error) {
              logger.error('cor:view', `Error renderizando hook component ${componentName}:`, error);
              div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error: ${componentName}</div>`;
            }
          }, 100);
        } else {
          logger.error('cor:view', `Componente ${componentName} no encontrado`);
          div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Componente ${componentName} no disponible</div>`;
        }
      }
    } catch (error) {
      logger.error('cor:view', `Error en renderHookItem:`, error);
    }
  }

  static async renderHookItem(hookItem, container) {
    if (!hookItem || !container) return;

    try {
      if (hookItem.type === 'html') {
        // Renderizar HTML
        const div = document.createElement('div');
        div.id = hookItem.id;
        div.className = 'hook-item hook-html';
        div.innerHTML = hookItem.content;
        container.appendChild(div);
      }
      else if (hookItem.type === 'component') {
        // Renderizar componente
        const div = document.createElement('div');
        div.id = hookItem.id;
        div.className = 'hook-item hook-component';
        container.appendChild(div);

        const componentName = hookItem.component;

        if (window[componentName] && typeof window[componentName].render === 'function') {
          try {
            await window[componentName].render(hookItem.config || {}, div);
            logger.debug('cor:view', `Componente hook ${componentName} renderizado`);
          } catch (error) {
            logger.error('cor:view', `Error renderizando componente hook ${componentName}:`, error);
            div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error: ${componentName}</div>`;
          }
        } else {
          logger.error('cor:view', `Componente ${componentName} no encontrado`);
          div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Componente ${componentName} no disponible</div>`;
        }
      }
      else if (hookItem.type === 'form') {
        // Renderizar formulario
        const div = document.createElement('div');
        div.id = hookItem.id;
        div.className = 'hook-item hook-form';
        container.appendChild(div);

        if (window.form && hookItem.formPath) {
          setTimeout(async () => {
            try {
              await form.load(hookItem.formPath, div);
              logger.debug('cor:view', `Formulario hook ${hookItem.formPath} renderizado`);
            } catch (error) {
              logger.error('cor:view', `Error cargando formulario hook:`, error);
              div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error cargando formulario</div>`;
            }
          }, 0);
        }
      }
      else if (hookItem.type === 'view') {
        // Renderizar vista anidada
        const div = document.createElement('div');
        div.id = hookItem.id;
        div.className = 'hook-item hook-view';
        container.appendChild(div);

        if (window.view && hookItem.viewPath) {
          setTimeout(async () => {
            try {
              await view.loadView(hookItem.viewPath, div);
              logger.debug('cor:view', `Vista hook ${hookItem.viewPath} renderizada`);
            } catch (error) {
              logger.error('cor:view', `Error cargando vista hook:`, error);
              div.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error cargando vista</div>`;
            }
          }, 0);
        }
      }
    } catch (error) {
      logger.error('cor:view', `Error renderizando hook item:`, error);
    }
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
            logger.error('cor:view', `Error ejecutando ${componentName}.init():`, error);
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

  static async reInitializeCachedView(cachedData) {
    const viewData = cachedData.viewData;
    if (!viewData) return;

    if (viewData.tabs) {
      const tabsContainer = document.querySelector('.view-tabs-container');
      if (tabsContainer) {
        await tabs.render(viewData, tabsContainer);
      }
    } else {
      await this.loadDynamicComponents(document.getElementById('content'));
    }

    setTimeout(() => this.initFormValidation(), 0);
  }

  static async loadDynamicComponents(container) {
    const dynamicForms = container.querySelectorAll('.dynamic-form');
    dynamicForms.forEach(async el => {
      const formJson = el.getAttribute('data-form-json');
      if (formJson && window.form) {
        await form.load(formJson, el);
      }
    });

    const dynamicComponents = container.querySelectorAll('.dynamic-component');
    dynamicComponents.forEach(el => {
      const componentName = el.getAttribute('data-component');
      const configStr = el.getAttribute('data-config');
      const config = configStr ? JSON.parse(configStr.replace(/&quot;/g, '"')) : {};

      if (componentName && window[componentName]) {
        if (typeof window[componentName].render === 'function') {
          window[componentName].render(config, el);
        } else if (typeof window[componentName].init === 'function') {
          window[componentName].init(el, config);
        }
      }
    });
  }

  static initFormValidation() {
    const formElements = document.querySelectorAll('form[data-validation]');
    formElements.forEach(formEl => {
      if (window.form && typeof form.validate === 'function') {
        const formId = formEl.id;
        if (formId) {
          form.initValidation?.(formId);
        }
      }
    });
  }

  static renderError(viewName, container = null) {
    const errorHTML = `
      <div class="view-error">
        <h2>Error cargando vista</h2>
        <p>No se pudo cargar la vista: <strong>${viewName}</strong></p>
      </div>
    `;

    if (container) {
      container.innerHTML = errorHTML;
    } else {
      const content = document.getElementById('content');
      if (content) {
        content.innerHTML = errorHTML;
      }
    }
  }

  static findSafeInsertionPoint(container) {
    const selectors = [
      '.view-tabs-container',
      '.tabs-component',
      '.view-header',
      '.widget-grid'
    ];

    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element && element.parentNode === container) {
        return element;
      }
    }

    return container.firstElementChild;
  }
}

window.view = view;