class form {
  static schemas = new Map();
  static registeredEvents = new Set();

  static t(text) {
    if (!text || typeof text !== 'string') return text || '';
    if (!text.startsWith('i18n:')) return text;
    const key = text.replace('i18n:', '');
    return window.i18n?.t(key) || key;
  }

  /**
   * Cargar formulario
   * @param {string} formName - Ruta del formulario
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {object} data - Datos para prellenar
   * @param {boolean} isCore - TRUE para forzar búsqueda en /js/views/, FALSE para plugin
   * @param {function} afterRender - Callback a ejecutar después de renderizar el formulario
   */
  static async load(formName, container = null, data = null, isCore = null, afterRender = null) {
    const cacheKey = `form_${formName.replace(/\//g, '_')}`;
    let schema = cache.get(cacheKey);

    if (!schema) {
      let url;

      if (isCore === true) {
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
        logger.debug('cor:form', `Cargando core: ${url}`);
      }
      else if (isCore === false) {
        const parts = formName.split('/');
        const pluginName = parts[0];
        const restPath = parts.slice(1).join('/');
        const basePath = window.appConfig?.routes?.pluginViews?.replace('{pluginName}', pluginName) || `plugins/${pluginName}/views`;
        url = `${window.BASE_URL}${basePath}/forms/${restPath}.json`;
        logger.debug('cor:form', `Cargando plugin: ${url}`);
      }
      else if (formName.startsWith('core:')) {
        formName = formName.replace('core:', '');
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
        logger.debug('cor:form', `Cargando core-prefix: ${url}`);
      }
      else if (formName.includes('/')) {
        const parts = formName.split('/');
        const firstPart = parts[0];

        const isPlugin = window.view?.loadedPlugins?.[firstPart] ||
                        window.hook?.isPluginEnabled?.(firstPart);

        if (isPlugin) {
          const pluginName = parts[0];
          const restPath = parts.slice(1).join('/');
          const basePath = window.appConfig?.routes?.pluginViews?.replace('{pluginName}', pluginName) || `plugins/${pluginName}/views`;
          url = `${window.BASE_URL}${basePath}/forms/${restPath}.json`;
          logger.debug('cor:form', `Cargando auto-plugin: ${url}`);
        } else {
          const basePath = window.appConfig?.routes?.coreViews || 'js/views';
          url = `${window.BASE_URL}${basePath}/${formName}.json`;
          logger.debug('cor:form', `Cargando auto-core: ${url}`);
        }
      } else {
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
        logger.debug('cor:form', `Cargando legacy: ${url}`);
      }

      const cacheBuster = window.appConfig?.cache?.forms ? '' : `?t=${Date.now()}`;
      const response = await fetch(url + cacheBuster);

      if (!response.ok) {
        throw new Error(`Form not found: ${formName} (${url})`);
      }

      schema = await response.json();

      if (window.appConfig?.cache?.forms) {
        cache.set(cacheKey, schema);
      }
    }

    const instanceId = `${schema.id}-${Date.now()}`;
    const instanceSchema = JSON.parse(JSON.stringify(schema));
    instanceSchema.id = instanceId;

    if (schema.id && window.hook) {
      const hookName = `hook_form_${schema.id.replace(/-/g, '_')}`;
      const hookFields = hook.execute(hookName, []);
      
      if (hookFields.length > 0) {
        logger.debug('cor:form', `Hook ${hookName} agregó ${hookFields.length} campos`);
        
        if (!instanceSchema.fields) instanceSchema.fields = [];
        instanceSchema.fields.push(...hookFields);
      }
    }

    this.schemas.set(instanceId, instanceSchema);

    const html = this.render(instanceSchema);
    const target = container || document.getElementById('content');
    target.innerHTML = html;

    if (data) this.fill(instanceId, data);

    this.bindEventsOnce();

    setTimeout(() => {
      const formEl = document.getElementById(instanceId);
      if (formEl) {
        this.initRepeatables(instanceId);
        if (window.conditions) {
          conditions.init(instanceId);
        }

        if (typeof afterRender === 'function') {
          logger.debug('cor:form', `Ejecutando afterRender para ${schema.id}`);
          try {
            afterRender(instanceId, formEl);
          } catch (error) {
            logger.error('cor:form', 'Error en afterRender:', error);
          }
        }
      } else {
        logger.error('cor:form', 'Formulario no encontrado en DOM');
      }
    }, 10);

    return instanceId;
  }

  static render(schema) {
    return `
      <div class="form-container">
        ${schema.title ? `<h2>${this.t(schema.title)}</h2>` : ''}
        ${schema.description ? `<p class="form-desc">${this.t(schema.description)}</p>` : ''}

        <form id="${schema.id}" data-form-id="${schema.id}" method="post">
          ${schema.toolbar ? `<div class="form-toolbar">${this.renderFields(schema.toolbar)}</div>` : ''}
          ${schema.fields ? this.renderFields(schema.fields) : ''}
          ${schema.statusbar ? `<div class="form-statusbar">${this.renderFields(schema.statusbar)}</div>` : ''}
        </form>
      </div>
    `;
  }

  static renderFields(fields, path = '') {
    return fields.map((field) => {
      const fieldPath = path ? `${path}.${field.name}` : field.name;

      if (field.type === 'repeatable') {
        return this.renderRepeatable(field, fieldPath);
      }

      if (field.type === 'group') {
        return this.renderGroup(field, path);
      }

      if (field.type === 'grouper') {
        return this.renderGrouper(field, path);
      }

      return this.renderField(field, fieldPath);
    }).join('');
  }

  static renderRepeatable(field, path) {
    const addText = this.t(field.addText) || 'Agregar';
    const buttonPosition = field.buttonPosition || 'top';

    const addButton = `
      <button type="button" class="btn btn-primary btn-sm repeatable-add" data-path="${path}">
        ${addText}
      </button>
    `;

    if (buttonPosition === 'middle') {
      return `
        <div class="form-repeatable" data-field-path="${path}">
          <div class="repeatable-header">
            <h4>${this.t(field.label)}</h4>
          </div>
          <div class="repeatable-add-container" style="margin: 0.5rem 0;">
            ${addButton}
          </div>
          <div class="repeatable-items" data-path="${path}"></div>
        </div>
      `;
    } else if (buttonPosition === 'bottom') {
      return `
        <div class="form-repeatable" data-field-path="${path}">
          <div class="repeatable-header">
            <h4>${this.t(field.label)}</h4>
          </div>
          <div class="repeatable-items" data-path="${path}"></div>
          <div class="repeatable-add-container" style="margin: 0.5rem 0; text-align: center;">
            ${addButton}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="form-repeatable" data-field-path="${path}">
          <div class="repeatable-header">
            <h4>${this.t(field.label)}</h4>
            ${addButton}
          </div>
          <div class="repeatable-items" data-path="${path}"></div>
        </div>
      `;
    }
  }

  static renderGroup(field, basePath) {
    const columns = field.columns || 2;
    const gap = field.gap || 'normal';
    
    const groupClass = `form-group-cols form-group-cols-${columns} form-group-gap-${gap}`;
    
    return `
      <div class="${groupClass}">
        ${field.fields ? field.fields.map(subField => {
          const fieldPath = basePath ? `${basePath}.${subField.name}` : subField.name;
          return this.renderField(subField, fieldPath);
        }).join('') : ''}
      </div>
    `;
  }

  static renderGrouper(field, parentPath) {
    const mode = field.mode || 'linear';
    const grouperId = `grouper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let html = '';

    if (mode === 'linear') {
      html += this.renderGrouperLinear(field, grouperId, parentPath);
    } else if (mode === 'tabs') {
      html += this.renderGrouperTabs(field, grouperId, parentPath);
    }

    setTimeout(() => {
      this.bindGrouperEvents(grouperId, mode);
    }, 100);

    return html;
  }

  static renderGrouperLinear(field, grouperId, parentPath) {
    const collapsible = field.collapsible !== false;
    const openFirst = field.openFirst !== false;
    
    let html = `<div class="grouper grouper-linear" id="${grouperId}">`;

    field.groups.forEach((group, index) => {
      const isOpen = openFirst && index === 0;
      const contentId = `${grouperId}-content-${index}`;

      html += `
        <div class="grouper-section ${isOpen ? 'open' : ''} ${!collapsible ? 'non-collapsible' : ''}" data-group-index="${index}">
          <div class="grouper-header ${collapsible ? 'collapsible' : 'non-collapsible'}" 
               ${collapsible ? `data-toggle="${contentId}"` : ''}>
            <h3 class="grouper-title">${group.title || `Grupo ${index + 1}`}</h3>
            ${collapsible ? '<span class="grouper-toggle">▼</span>' : ''}
          </div>
          <div class="grouper-content" id="${contentId}" ${!isOpen && collapsible ? 'style="display:none"' : ''}>
      `;

      if (group.fields && Array.isArray(group.fields)) {
        html += this.renderFields(group.fields, parentPath);
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  static renderGrouperTabs(field, grouperId, parentPath) {
    const activeIndex = field.activeIndex || 0;
    
    let html = `<div class="grouper grouper-tabs" id="${grouperId}">`;

    html += `<div class="grouper-tabs-header">`;
    field.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <button type="button" class="grouper-tab-btn ${isActive ? 'active' : ''}" 
                data-tab-index="${index}">
          ${group.title || `Tab ${index + 1}`}
        </button>
      `;
    });
    html += `</div>`;

    html += `<div class="grouper-tabs-content">`;
    field.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <div class="grouper-tab-panel ${isActive ? 'active' : ''}" 
             data-panel-index="${index}">
      `;

      if (group.fields && Array.isArray(group.fields)) {
        html += this.renderFields(group.fields, parentPath);
      }

      html += `</div>`;
    });
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  static bindGrouperEvents(grouperId, mode) {
    const container = document.getElementById(grouperId);
    if (!container) return;

    if (mode === 'linear') {
      container.querySelectorAll('.grouper-header.collapsible').forEach(header => {
        header.addEventListener('click', (e) => {
          const targetId = header.dataset.toggle;
          const content = document.getElementById(targetId);
          const section = header.closest('.grouper-section');

          if (!content) return;

          const isOpen = section.classList.contains('open');

          if (isOpen) {
            section.classList.remove('open');
            content.style.display = 'none';
          } else {
            section.classList.add('open');
            content.style.display = 'block';
          }
        });
      });
    } else if (mode === 'tabs') {
      const tabButtons = container.querySelectorAll('.grouper-tab-btn');
      const tabPanels = container.querySelectorAll('.grouper-tab-panel');

      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const index = parseInt(button.dataset.tabIndex);

          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabPanels.forEach(panel => panel.classList.remove('active'));

          button.classList.add('active');
          const targetPanel = container.querySelector(`[data-panel-index="${index}"]`);
          if (targetPanel) {
            targetPanel.classList.add('active');
          }
        });
      });
    }
  }

  static renderField(field, path) {
    if (field.type === 'html') {
      return field.content || '';
    }

    const label = this.t(field.label) || path;
    const labelI18n = field.label?.startsWith('i18n:') ? `data-i18n="${field.label.replace('i18n:', '')}"` : '';
    const requiredAsterisk = field.required ? '<span style="color: #e74c3c; margin-left: 2px;">*</span>' : '';

    const common = `
      name="${path}" 
      placeholder="${this.t(field.placeholder) || ''}" 
      ${field.required ? 'required' : ''}
      ${field.min !== undefined ? `min="${field.min}"` : ''}
      ${field.max !== undefined ? `max="${field.max}"` : ''}
      ${field.step !== undefined ? `step="${field.step}"` : ''}
    `.trim();

    switch(field.type) {
      case 'button':
        const buttonI18n = field.label?.startsWith('i18n:') ? `data-i18n="${field.label.replace('i18n:', '')}"` : '';
        return `<button type="${field.action || 'button'}" class="btn ${field.style === 'secondary' ? 'btn-secondary' : 'btn-primary'}" ${buttonI18n} ${field.onclick ? `onclick="${field.onclick}"` : ''}>${label}</button>`;

      case 'select':
        return `
          <div class="form-group">
            <label ${labelI18n}>${label}${requiredAsterisk}</label>
            <select ${common}>
              <option value="">Selecciona...</option>
              ${field.options?.map(opt => {
                const optI18n = opt.label?.startsWith('i18n:') ? `data-i18n="${opt.label.replace('i18n:', '')}"` : '';
                return `<option value="${opt.value}" ${optI18n}>${this.t(opt.label)}</option>`;
              }).join('') || ''}
            </select>
          </div>`;

      case 'textarea':
        return `
          <div class="form-group">
            <label ${labelI18n}>${label}${requiredAsterisk}</label>
            <textarea ${common}></textarea>
          </div>`;

      case 'checkbox':
        return `
          <div class="form-group form-checkbox">
            <label ${labelI18n}>
              <input type="checkbox" name="${path}" ${field.required ? 'required' : ''}>
              ${label}${requiredAsterisk}
            </label>
          </div>`;

      default:
        return `
          <div class="form-group">
            <label ${labelI18n}>${label}${requiredAsterisk}</label>
            <input type="${field.type}" ${common}>
          </div>`;
    }
  }

  static bindEventsOnce() {
    if (this.registeredEvents.has('form-events')) {
      return;
    }

    events.on('.repeatable-add', 'click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const formEl = this.closest('form');
      if (!formEl) {
        logger.error('cor:form', 'No se encontró el formulario padre');
        return;
      }

      const formId = formEl.id;
      const path = this.dataset.path;

      const container = formEl.querySelector(`.repeatable-items[data-path="${path}"]`);
      if (!container) {
        logger.error('cor:form', 'Container no encontrado');
        return;
      }

      form.addRepeatableItem(formId, path, container);
    });

    events.on('.repeatable-remove', 'click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      form.removeRepeatableItem(this);
    });

    this.registeredEvents.add('form-events');
  }

  static initRepeatables(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) {
      logger.error('cor:form', 'Formulario no encontrado:', formId);
      return;
    }

    const repeatables = formEl.querySelectorAll('.form-repeatable');

    repeatables.forEach((rep) => {
      const path = rep.dataset.fieldPath;
      const container = formEl.querySelector(`.repeatable-items[data-path="${path}"]`);
      this.addRepeatableItem(formId, path, container);
    });
  }

  static addRepeatableItem(formId, path, container) {
    const schema = this.schemas.get(formId);
    if (!schema) {
      logger.error('cor:form', 'Schema no encontrado para:', formId);
      return;
    }

    const fieldDef = this.findField(schema.fields, path);
    if (!fieldDef || !fieldDef.fields) {
      logger.error('cor:form', 'Field no encontrado o sin subcampos');
      return;
    }

    if (!container) {
      logger.error('cor:form', 'Container no proporcionado');
      return;
    }

    const index = container.children.length;
    const itemPath = `${path}[${index}]`;
    const removeText = this.t(fieldDef.removeText) || 'Eliminar';

    const columns = fieldDef.columns;
    const gap = fieldDef.gap || 'normal';
    
    let contentClass = 'repeatable-content';
    if (columns) {
      contentClass += ` form-group-cols form-group-cols-${columns} form-group-gap-${gap}`;
    }

    const itemHTML = `
      <div class="repeatable-item">
        <div class="${contentClass}">
          ${this.renderFields(fieldDef.fields, itemPath)}
        </div>
        <button type="button" class="btn btn-danger btn-sm repeatable-remove">
          ${removeText}
        </button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHTML);
  }

  static removeRepeatableItem(button) {
    const item = button.closest('.repeatable-item');
    const container = item.parentElement;

    if (container.children.length > 1) {
      item.remove();
    } else {
      logger.warn('cor:form', 'No se puede eliminar el último item');
    }
  }

  static findField(fields, path) {
    const parts = path.split('.');
    let current = fields;
    let result = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const cleanPart = part.replace(/\[\d+\]/g, '');
      
      result = current.find(f => f.name === cleanPart);

      if (!result) {
        logger.warn('cor:form', `Campo "${cleanPart}" no encontrado en path: ${path}`);
        return null;
      }

      if (i < parts.length - 1) {
        if (result.fields) {
          current = result.fields;
        } else {
          logger.warn('cor:form', `Campo "${cleanPart}" no tiene subcampos pero el path continúa: ${path}`);
          return null;
        }
      }
    }

    return result;
  }

  static getData(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return null;

    const formData = new FormData(formEl);
    const data = {};

    for (let [key, value] of formData.entries()) {
      this.setNestedValue(data, key, value);
    }

    return data;
  }

  static setNestedValue(obj, path, value) {
    const keys = path.replace(/\[/g, '.').replace(/\]/g, '').split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];

      if (!isNaN(nextKey)) {
        if (!Array.isArray(current[key])) {
          current[key] = [];
        }
        if (!current[key][nextKey]) {
          current[key][nextKey] = {};
        }
        current = current[key][nextKey];
        i++;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }

    current[keys[keys.length - 1]] = value;
  }

  static fill(formId, data) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    Object.entries(data).forEach(([key, value]) => {
      const input = formEl.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = !!value;
        } else {
          input.value = value;
        }
      }
    });
  }

  static validate(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return false;

    return formEl.checkValidity();
  }

  static reset(formId) {
    const formEl = document.getElementById(formId);
    if (formEl) {
      formEl.reset();
    }
  }
}

window.form = form;