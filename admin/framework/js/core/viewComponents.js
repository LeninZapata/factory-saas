class ogViewComponents {

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // Helper para obtener componentes dinámicamente
  static getComponent(componentName) {
    if (window.ogFramework?.components?.[componentName]) {
      return window.ogFramework.components[componentName];
    }
    if (window[componentName]) return window[componentName];
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // SETUP DE VISTA (post-render)
  // ─────────────────────────────────────────────────────────────────

  static async setupView(viewData, container = null) {
    const tabs         = ogComponent('tabs');
    const viewContainer = container || document.getElementById('content');

    if (!viewContainer) {
      ogLogger?.error('core:viewComponents', 'Contenedor no encontrado en setupView');
      return;
    }

    await this.renderHookComponents(viewContainer);

    if (viewData.tabs) {
      const tabsContainer = viewContainer.querySelector('.og-view-tabs-container');
      if (tabsContainer) await tabs.render(viewData, tabsContainer);
    } else {
      await this.loadDynamicComponents(viewContainer);
    }

    setTimeout(() => this.initFormValidation(), 0);
  }

  // Re-inicializar una vista cacheada (restaura tabs/componentes tras recuperar HTML del cache)
  static async reInitializeCachedView(cachedData) {
    const viewData = cachedData.viewData;
    if (!viewData) return;

    if (viewData.tabs) {
      const tabs          = ogComponent('tabs');
      const tabsContainer = document.querySelector('.og-view-tabs-container');
      if (tabsContainer) await tabs.render(viewData, tabsContainer);
    } else {
      const content = document.getElementById('content');
      if (content) await this.loadDynamicComponents(content);
    }

    setTimeout(() => this.initFormValidation(), 0);
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPONENTES DINÁMICOS (.dynamic-form / .dynamic-component)
  // ─────────────────────────────────────────────────────────────────

  static async loadDynamicComponents(container) {
    const form = ogModule('form');

    // Contexto de extensión del contenedor padre
    const viewContainer    = container.closest('[data-extension-context]');
    const extensionContext = viewContainer?.getAttribute('data-extension-context') || null;

    // Formularios dinámicos
    const dynamicForms = container.querySelectorAll('.dynamic-form');
    dynamicForms.forEach(async el => {
      const formJson = el.getAttribute('data-form-json');
      if (formJson && form) {
        const formPath = (extensionContext && !formJson.includes('|'))
          ? `${extensionContext}|forms/${formJson}`
          : formJson;
        await form.load(formPath, el);
      }
    });

    // Componentes dinámicos
    const dynamicComponents = container.querySelectorAll('.dynamic-component');
    dynamicComponents.forEach(async el => {
      const componentName = el.getAttribute('data-component');
      const configStr     = el.getAttribute('data-config');
      const config        = configStr ? JSON.parse(configStr.replace(/&quot;/g, '"')) : {};
      const component     = this.getComponent(componentName);

      if (component && typeof component.render === 'function') {
        await component.render(config, el);
      } else if (component && typeof component.init === 'function') {
        await component.init(el, config);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // HOOK COMPONENTS (.hook-component)
  // ─────────────────────────────────────────────────────────────────

  static async renderHookComponents(viewContainer) {
    const componentHooks = viewContainer.querySelectorAll('.hook-component[data-component]');
    if (componentHooks.length === 0) return;

    for (const hookElement of componentHooks) {
      const componentName = hookElement.dataset.component;
      const configStr     = hookElement.dataset.config || '{}';

      try {
        const config    = JSON.parse(configStr.replace(/&quot;/g, '"'));
        const component = this.getComponent(componentName);

        if (component && typeof component.render === 'function') {
          await component.render(config, hookElement);
        } else {
          ogLogger?.warn('core:viewComponents', `Componente ${componentName} no encontrado`);
          hookElement.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Componente ${componentName} no disponible</div>`;
        }
      } catch (error) {
        ogLogger?.error('core:viewComponents', `Error renderizando hook component ${componentName}:`, error);
        hookElement.innerHTML = `<div style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;">Error: ${componentName}</div>`;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RECURSOS (scripts / styles)
  // ─────────────────────────────────────────────────────────────────

  static async loadAndInitResources(viewData) {
    await this.loadViewResources(viewData);

    // Ejecutar callbacks pendientes de tabs después de cargar scripts
    if (window.ogTabs && typeof window.ogTabs.executePendingCallbacks === 'function') {
      window.ogTabs.executePendingCallbacks();
    }

    await new Promise(resolve => setTimeout(resolve, 1));
    await this.initViewComponents(viewData);
  }

  static async loadViewResources(viewData) {
    const loader = ogModule('loader');
    if (!viewData.scripts && !viewData.styles) return;

    try {
      const normalizedScripts = ogViewLoader.normalizeResourcePaths(viewData.scripts || []);
      const normalizedStyles  = ogViewLoader.normalizeResourcePaths(viewData.styles  || []);
      await loader.loadResources(normalizedScripts, normalizedStyles);
    } catch (error) {
      ogLogger?.error('core:viewComponents', 'Error cargando recursos:', error);
    }
  }

  // Llama a .init() en los componentes JS cargados via scripts de la vista
  static async initViewComponents(viewData) {
    if (!viewData.scripts?.length) return;

    viewData.scripts.forEach(scriptPath => {
      const componentName = this.extractComponentName(scriptPath);
      const component     = this.getComponent(componentName);

      if (component && typeof component.init === 'function') {
        try {
          component.init();
        } catch (error) {
          ogLogger?.error('core:viewComponents', `Error ejecutando ${componentName}.init():`, error);
        }
      }
    });
  }

  // Deduce el nombre de clase JS a partir del path del script
  static extractComponentName(scriptPath) {
    const fileName = scriptPath.split('/').pop().replace('.js', '');
    const candidates = [
      fileName,
      `ejemplo${fileName.charAt(0).toUpperCase() + fileName.slice(1)}`,
      fileName.charAt(0).toUpperCase() + fileName.slice(1)
    ];

    for (const name of candidates) {
      if (window[name]) return name;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // VALIDACIÓN DE FORMULARIOS
  // ─────────────────────────────────────────────────────────────────

  static initFormValidation() {
    const form         = ogModule('form');
    const formElements = document.querySelectorAll('form[data-validation]');

    formElements.forEach(formEl => {
      if (form && typeof form.validate === 'function') {
        const formId = formEl.id;
        if (formId) form.initValidation?.(formId);
      }
    });
  }
}

window.ogViewComponents = ogViewComponents;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.viewComponents = ogViewComponents;
}
/**
@doc-start
FILE: framework/js/core/viewComponents.js
CLASS: ogViewComponents
TYPE: core-view
PROMPT: fe-view-hook

ROLE:
  Carga y ejecuta los recursos JS/CSS de una vista, registra hook-components
  en el DOM y orquesta el post-render de tabs y componentes.

FLUJO POST-RENDER (setupView):
  1. renderHookComponents()    → monta componentes .hook-component en el DOM
  2a. ogTabs.render()          → si viewData.tabs (vista con pestañas)
  2b. renderContent()          → si viewData.content (vista de contenido)

CARGA DE RECURSOS (loadAndInitResources):
  1. loadViewResources()    → ogLoader.loadResources(scripts, styles) normalizados
  2. ogTabs.executePendingCallbacks()  → callbacks de tabs que esperaban scripts
  3. initViewComponents()  → llama .init() en clases JS cargadas via scripts[]

SCRIPTS BAJO DEMANDA — CONVENCIÓN:
  Si la vista declara scripts[], el sistema carga el archivo y llama .init()
  automáticamente. El script debe:
    1. Tener un método estático init()
    2. Exportarse a window con el mismo nombre que el archivo (sin extensión)

  Ejemplo — chart.js:
    class ejemploChart {
      static init() {
        // Se llama automáticamente al cargar la vista
        this.createChart('chart1', {...});
      }
    }
    window.ejemploChart = ejemploChart;   // ← obligatorio

DETECCIÓN DE CLASE JS:
  extractComponentName(scriptPath) intenta window[fileName],
  window['ejemplo'+FileName], window[FileName] para encontrar la clase.

REGISTRO:
  ogFramework.core.viewComponents (interno, no expuesto en window)
@doc-end
 */