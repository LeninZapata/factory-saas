class ogViewRender {

  // ─────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL (navegación normal — escribe en #content)
  // ─────────────────────────────────────────────────────────────────

  static renderView(viewData, extensionContext = null) {
    const content = document.getElementById('content');

    if (!content) {
      ogLogger?.error('core:viewRender', 'Contenedor #content no encontrado');
      this.renderError(viewData.id);
      return;
    }

    document.body.setAttribute('data-view', viewData.id);
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('layout-'))
      .join(' ');

    if (viewData.layout) {
      document.body.classList.add(`layout-${viewData.layout}`);
    }

    const hooksHTML = this.processHooksForHTML(viewData);
    content.innerHTML = this.generateViewHTML(viewData, hooksHTML, extensionContext);
  }

  // Render dentro de un contenedor arbitrario (modales, widgets, etc.)
  static renderViewInContainer(viewData, container, extensionContext = null) {
    const hooksHTML = this.processHooksForHTML(viewData);
    container.innerHTML = this.generateViewHTML(viewData, hooksHTML, extensionContext);
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERACIÓN DE HTML
  // ─────────────────────────────────────────────────────────────────

  static generateViewHTML(viewData, hooksHTML = null, extensionContext = null) {
    const hooksBeforeHTML = hooksHTML?.before || '';
    const hooksAfterHTML  = hooksHTML?.after  || '';
    const extensionAttr   = extensionContext ? ` data-extension-context="${extensionContext}"` : '';

    return `
      <div class="og-view-container" data-view="${viewData.id}"${extensionAttr}>
        ${hooksBeforeHTML}

        ${viewData.header ? `
          <div class="og-view-header">
            ${viewData.header.title    ? `<h1>${viewData.header.title}</h1>`    : ''}
            ${viewData.header.subtitle ? `<p>${viewData.header.subtitle}</p>`   : ''}
          </div>
        ` : ''}

        ${viewData.tabs ? `
          <div class="og-view-tabs-container" data-view-id="${viewData.id}"></div>
        ` : `
          <div class="og-view-content">
            ${this.renderContent(viewData.content)}
          </div>
        `}

        ${viewData.statusbar ? `
          <div class="og-view-statusbar">
            ${this.renderContent(viewData.statusbar)}
          </div>
        ` : ''}

        ${hooksAfterHTML}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER DE CONTENIDO (array de items)
  // ─────────────────────────────────────────────────────────────────

  static renderContent(content) {
    if (typeof content === 'string')  return content;
    if (Array.isArray(content))       return content.map(item => this.renderContentItem(item)).join('');
    return this.renderContentItem(content);
  }

  static renderContentItem(item) {
    if (item == null)               return '';
    if (typeof item === 'string')   return this.processI18nInString(item);
    if (typeof item !== 'object')   return '';

    const formJson = item.form_json || item.formJson;
    if (item.type === 'form' && formJson) {
      return `<div class="dynamic-form" data-form-json="${formJson}"></div>`;
    }

    if (item.type === 'component' && item.component) {
      const configJson = JSON.stringify(item.config || {}).replace(/"/g, '&quot;');
      return `<div class="dynamic-component" data-component="${item.component}" data-config="${configJson}"></div>`;
    }

    if (item.type === 'html') {
      return this.processI18nInString(item.content || '');
    }

    if (item.type === 'section') {
      const title = item.title       ? `<h5 class="og-section-title">${this.processI18nInString(item.title)}</h5>`         : '';
      const desc  = item.description ? `<p class="og-section-description">${this.processI18nInString(item.description)}</p>` : '';
      const inner = item.content     ? this.renderContent(item.content)                                                       : '';
      return `<div class="og-content-section">${title}${desc}${inner}</div>`;
    }

    if (item.type === 'code') {
      const lang    = item.lang || '';
      const escaped = (item.content || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="og-code-block"><code class="language-${lang}">${escaped}</code></pre>`;
    }

    return '';
  }

  // ─────────────────────────────────────────────────────────────────
  // I18N EN STRINGS
  // ─────────────────────────────────────────────────────────────────

  // Reemplaza {i18n:key} o {i18n:key|param1:value1} en strings HTML
  static processI18nInString(str) {
    const i18n = ogModule('i18n');
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{i18n:([^}]+)\}/g, (match, content) => {
      const parts  = content.split('|');
      const key    = parts[0];
      const params = {};

      for (let i = 1; i < parts.length; i++) {
        const [paramKey, paramValue] = parts[i].split(':');
        if (paramKey && paramValue) params[paramKey] = paramValue;
      }

      return i18n ? i18n.t(key, params) : key;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // HOOKS HTML
  // ─────────────────────────────────────────────────────────────────

  static processHooksForHTML(viewData) {
    const hook = ogModule('hook');
    if (!viewData.id || !hook) return null;

    const allHooks = hook.execute(`hook_${viewData.id}`, []);
    if (allHooks.length === 0) return null;

    const hooksBeforeView  = allHooks.filter(h => h.context === 'view'    && h.position === 'before');
    const hooksAfterView   = allHooks.filter(h => h.context === 'view'    && h.position === 'after');
    const hooksForTabs     = allHooks.filter(h => h.context === 'tab');
    const hooksForContent  = allHooks.filter(h => h.context === 'content' || !h.context);

    if (hooksForTabs.length    > 0 && Array.isArray(viewData.tabs))    this.mergeHooksIntoTabs(viewData, hooksForTabs);
    if (hooksForContent.length > 0 && Array.isArray(viewData.content)) this.mergeHooksIntoContent(viewData, hooksForContent);

    return {
      before: this.generateHooksHTML(hooksBeforeView),
      after:  this.generateHooksHTML(hooksAfterView)
    };
  }

  static generateHooksHTML(hooks) {
    if (!hooks || hooks.length === 0) return '';

    hooks.sort((a, b) => (a.order || 999) - (b.order || 999));

    return hooks.map(hook => {
      if (hook.type === 'html') {
        return `<div id="${hook.id}" class="hook-item hook-html">${hook.content || ''}</div>`;
      }
      if (hook.type === 'component') {
        const config = JSON.stringify(hook.config || {}).replace(/"/g, '&quot;');
        return `<div id="${hook.id}" class="hook-item hook-component" data-component="${hook.component}" data-config="${config}"></div>`;
      }
      return '';
    }).join('');
  }

  static mergeHooksIntoTabs(viewData, hooks) {
    const hooksByTab = {};

    hooks.forEach(hook => {
      if (hook.target) {
        if (!hooksByTab[hook.target]) hooksByTab[hook.target] = [];
        hooksByTab[hook.target].push(hook);
      }
    });

    viewData.tabs = viewData.tabs.map(tab => {
      const tabHooks = hooksByTab[tab.id];
      if (!tabHooks?.length || !Array.isArray(tab.content)) return tab;

      const existingIds  = new Set(tab.content.map(item => item.id).filter(Boolean));
      const newHooks     = tabHooks.filter(hook => !hook.id || !existingIds.has(hook.id));
      if (newHooks.length === 0) return tab;

      const mixed = [
        ...newHooks.map(h => ({ order: h.order || 999, ...h })),
        ...tab.content.map(i => ({ order: i.order || 999, ...i }))
      ].sort((a, b) => a.order - b.order);

      return { ...tab, content: mixed };
    });
  }

  static mergeHooksIntoContent(viewData, hooks) {
    const existingIds = new Set(viewData.content.map(item => item.id).filter(Boolean));
    const newHooks    = hooks.filter(hook => !hook.id || !existingIds.has(hook.id));
    if (newHooks.length === 0) return;

    const mixed = [
      ...newHooks.map(h => ({ order: h.order || 999, ...h })),
      ...viewData.content.map(i => ({ order: i.order || 999, ...i }))
    ].sort((a, b) => a.order - b.order);

    viewData.content = mixed;
  }

  // ─────────────────────────────────────────────────────────────────
  // ERROR
  // ─────────────────────────────────────────────────────────────────

  static renderError(viewName, container = null) {
    const errorHTML = `
      <div class="og-view-error">
        <h2>Error cargando vista</h2>
        <p>No se pudo cargar la vista: <strong>${viewName}</strong></p>
      </div>
    `;

    if (container) {
      container.innerHTML = errorHTML;
    } else {
      const content = document.getElementById('content');
      if (content) content.innerHTML = errorHTML;
    }
  }
}

window.ogViewRender = ogViewRender;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.viewRender = ogViewRender;
}
/**
 * @doc-start
 * FILE: framework/js/core/viewRender.js
 * CLASS: ogViewRender
 * TYPE: core-view
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Generación de HTML y escritura en DOM. Convierte viewData (JSON) en HTML
 *   y lo inyecta en #content (navegación normal) o en un container arbitrario
 *   (modales, widgets). También gestiona los hooks de posición before/after.
 *   Sub-módulo de ogView — no se usa directamente desde extensiones.
 *
 * RENDERIZADO PRINCIPAL:
 *   renderView(viewData, ext)             → escribe en #content (navegación normal)
 *   renderViewInContainer(viewData, el)   → escribe en container arbitrario (modal/widget)
 *   generateViewHTML(viewData, hooks, ext) → genera el string HTML completo
 *
 * ESTRUCTURA HTML GENERADA:
 *   .og-view-container[data-view][data-extension-context?]
 *     [hooks.before]
 *     .og-view-header          (si viewData.header)
 *     .og-view-tabs-container  (si viewData.tabs)  ← ogTabs escribe aquí
 *     .og-view-content         (si viewData.content)
 *     .og-view-statusbar       (si viewData.statusbar)
 *     [hooks.after]
 *
 * TIPOS DE ITEM EN content[]:
 *   html       → string HTML con soporte {i18n:key}
 *   component  → <div class="dynamic-component" data-component data-config>
 *   form       → <div class="dynamic-form" data-form-json>
 *   section    → contenedor con título, descripción e inner content[]
 *   code       → <pre><code class="language-{lang}">
 *
 * I18N EN STRINGS:
 *   processI18nInString(str) reemplaza {i18n:key} y {i18n:key|param:val}
 *   en cualquier string HTML antes de insertarlo en el DOM.
 *
 * HOOKS DE POSICIÓN:
 *   processHooksForHTML() ejecuta hook_viewId y separa los resultados por
 *   context (view:before, view:after, tab, content) para inyectarlos
 *   en el HTML generado o mergearlos en tabs/content del viewData.
 *
 * REGISTRO:
 *   window.ogViewRender
 *   ogFramework.core.viewRender
 * @doc-end
 */