class form {
  static schemas = new Map();
  static registeredEvents = new Set();

  static t(text) {
    if (!text || typeof text !== 'string') return text || '';
    if (!text.startsWith('i18n:')) return text;
    const key = text.replace('i18n:', '');
    return window.i18n?.t(key) || key;
  }

  static async load(formName, container = null, data = null, isCore = null, afterRender = null) {
    const cacheKey = `form_${formName.replace(/\//g, '_')}`;
    let schema = cache.get(cacheKey);

    if (!schema) {
      let url;

      if (isCore === true) {
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
      }
      else if (isCore === false) {
        const parts = formName.split('/');
        const pluginName = parts[0];
        const restPath = parts.slice(1).join('/');
        const basePath = window.appConfig?.routes?.pluginViews?.replace('{pluginName}', pluginName) || `plugins/${pluginName}/views`;
        url = `${window.BASE_URL}${basePath}/forms/${restPath}.json`;
      }
      else if (formName.startsWith('core:')) {
        formName = formName.replace('core:', '');
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
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
        } else {
          const basePath = window.appConfig?.routes?.coreViews || 'js/views';
          url = `${window.BASE_URL}${basePath}/${formName}.json`;
        }
      } else {
        const basePath = window.appConfig?.routes?.coreViews || 'js/views';
        url = `${window.BASE_URL}${basePath}/${formName}.json`;
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
        this.bindTransforms(instanceId);
        if (window.conditions) {
          conditions.init(instanceId);
        }

        if (typeof afterRender === 'function') {
          try {
            afterRender(instanceId, formEl);
          } catch (error) {
            logger.error('cor:form', 'Error en afterRender:', error);
          }
        }
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

    const transformClasses = [];
    if (field.transform) {
      const transforms = Array.isArray(field.transform) ? field.transform : [field.transform];
      transforms.forEach(t => transformClasses.push(`form-transform-${t}`));
    }

    const classNames = [
      field.className || '',
      ...transformClasses
    ].filter(c => c).join(' ');

    const common = `
      name="${path}"
      placeholder="${this.t(field.placeholder) || ''}"
      ${field.required ? 'required' : ''}
      ${field.min !== undefined ? `min="${field.min}"` : ''}
      ${field.max !== undefined ? `max="${field.max}"` : ''}
      ${field.step !== undefined ? `step="${field.step}"` : ''}
      ${classNames ? `class="${classNames}"` : ''}
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
            <span class="form-error"></span>
          </div>`;

      case 'textarea':
        return `
          <div class="form-group">
            <label ${labelI18n}>${label}${requiredAsterisk}</label>
            <textarea ${common}></textarea>
            <span class="form-error"></span>
          </div>`;

      case 'checkbox':
        return `
          <div class="form-group form-checkbox">
            <label ${labelI18n}>
              <input type="checkbox" name="${path}" ${field.required ? 'required' : ''}>
              ${label}${requiredAsterisk}
            </label>
            <span class="form-error"></span>
          </div>`;

      default:
        return `
          <div class="form-group">
            <label ${labelI18n}>${label}${requiredAsterisk}</label>
            <input type="${field.type}" ${common}>
            <span class="form-error"></span>
          </div>`;
    }
  }

  static bindEventsOnce() {
    if (this.registeredEvents.has('form-events')) {
      return;
    }

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('repeatable-add')) {
        const path = e.target.dataset.path;
        this.addRepeatableItem(path);
      }

      if (e.target.classList.contains('repeatable-remove')) {
        const item = e.target.closest('.repeatable-item');
        if (item && confirm('¿Eliminar este elemento?')) {
          item.remove();
        }
      }
    });

    this.registeredEvents.add('form-events');
  }

  static initRepeatables(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    const schema = this.schemas.get(formId);
    if (!schema) return;

    const findRepeatableFields = (fields, basePath = '') => {
      const repeatables = [];
      fields?.forEach(field => {
        if (field.type === 'repeatable') {
          const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
          repeatables.push({ field, path: fieldPath });
        } else if (field.type === 'group' && field.fields) {
          repeatables.push(...findRepeatableFields(field.fields, basePath));
        } else if (field.type === 'grouper' && field.groups) {
          field.groups.forEach(group => {
            if (group.fields) {
              repeatables.push(...findRepeatableFields(group.fields, basePath));
            }
          });
        }
      });
      return repeatables;
    };

    const repeatables = findRepeatableFields(schema.fields);

    repeatables.forEach(({ field, path }) => {
      const container = formEl.querySelector(`.repeatable-items[data-path="${path}"]`);
      if (container) {
        container.dataset.fieldSchema = JSON.stringify(field.fields);
        container.dataset.itemCount = '0';
      }
    });
  }

  static addRepeatableItem(path) {
    const container = document.querySelector(`.repeatable-items[data-path="${path}"]`);
    if (!container) return;

    const fieldSchema = JSON.parse(container.dataset.fieldSchema || '[]');
    const itemCount = parseInt(container.dataset.itemCount || '0');
    const newIndex = itemCount;

    const itemPath = `${path}[${newIndex}]`;

    const itemFields = fieldSchema.map(field => {
      const fieldPath = `${itemPath}.${field.name}`;
      return this.renderField(field, fieldPath);
    }).join('');

    const itemHtml = `
      <div class="repeatable-item" data-index="${newIndex}">
        <div class="repeatable-content">
          ${itemFields}
        </div>
        <div class="repeatable-remove">
          <button type="button" class="btn btn-sm btn-danger repeatable-remove">Eliminar</button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', itemHtml);
    container.dataset.itemCount = (newIndex + 1).toString();

    const formId = container.closest('form')?.id;
    if (formId) {
      this.bindTransforms(formId);
      if (window.conditions) {
        conditions.init(formId);
      }
    }
  }

  static getData(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return {};

    const formData = new FormData(formEl);
    const data = {};

    for (const [key, value] of formData.entries()) {
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

  static bindTransforms(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    const transforms = {
      lowercase: (value) => value.toLowerCase(),
      uppercase: (value) => value.toUpperCase(),
      trim: (value) => value.replace(/\s+/g, ''),
      alphanumeric: (value) => value.replace(/[^a-zA-Z0-9]/g, ''),
      numeric: (value) => value.replace(/[^0-9]/g, ''),
      slug: (value) => value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    };

    formEl.querySelectorAll('[class*="form-transform-"]').forEach(input => {
      const classes = input.className.split(' ');
      const transformClasses = classes.filter(c => c.startsWith('form-transform-'));

      if (transformClasses.length === 0) return;

      input.addEventListener('input', function(e) {
        let value = e.target.value;

        transformClasses.forEach(transformClass => {
          const transformName = transformClass.replace('form-transform-', '');
          if (transforms[transformName]) {
            value = transforms[transformName](value);
          }
        });

        if (e.target.value !== value) {
          const cursorPos = e.target.selectionStart;
          e.target.value = value;
          e.target.setSelectionRange(cursorPos, cursorPos);
        }
      });
    });
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
    if (!formEl) {
      return { success: false, errors: ['Formulario no encontrado'], message: 'Formulario no encontrado' };
    }

    const schema = this.schemas.get(formId);
    if (!schema) {
      return { success: true, errors: [], message: 'OK', data: this.getData(formId) };
    }

    const errors = [];
    const formData = this.getData(formId);

    formEl.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    formEl.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));

    const getValueByPath = (obj, path) => {
      const keys = path.replace(/\[/g, '.').replace(/\]/g, '').split('.');
      let current = obj;
      for (let key of keys) {
        if (current === null || current === undefined) return null;
        current = current[key];
      }
      return current;
    };

    const validateField = (field, fieldPath) => {
      if (field.type === 'button' || field.type === 'html') return;

      const value = getValueByPath(formData, fieldPath);
      const label = this.t(field.label) || field.name;
      const fieldErrors = [];

      // Validar campo requerido (propiedad booleana)
      if (field.required) {
        const isEmpty = value === null || value === undefined || value.toString().trim() === '';
        if (isEmpty) {
          fieldErrors.push(`${label} es requerido`);
        }
      }

      // Validar regla 'required' dentro del string de validation
      if (field.validation && field.validation.includes('required')) {
        const isEmpty = value === null || value === undefined || value.toString().trim() === '';
        if (isEmpty && !fieldErrors.some(err => err.includes('es requerido'))) {
          fieldErrors.push(`${label} es requerido`);
        }
      }

      // Validar otras reglas solo si hay valor
      if (field.validation && value && value.toString().trim() !== '') {
        const rules = field.validation.split('|');

        for (const rule of rules) {
          const [ruleName, ruleParam] = rule.split(':');

          // Saltar 'required' porque ya se validó arriba
          if (ruleName === 'required') continue;

          if (ruleName === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              fieldErrors.push(`${label} debe ser un email válido`);
            }
          }
          else if (ruleName === 'min') {
            if (value.toString().length < parseInt(ruleParam)) {
              fieldErrors.push(`${label} debe tener al menos ${ruleParam} caracteres`);
            }
          }
          else if (ruleName === 'max') {
            if (value.toString().length > parseInt(ruleParam)) {
              fieldErrors.push(`${label} no puede tener más de ${ruleParam} caracteres`);
            }
          }
          else if (ruleName === 'minValue') {
            if (parseFloat(value) < parseFloat(ruleParam)) {
              fieldErrors.push(`${label} debe ser mayor o igual a ${ruleParam}`);
            }
          }
          else if (ruleName === 'maxValue') {
            if (parseFloat(value) > parseFloat(ruleParam)) {
              fieldErrors.push(`${label} debe ser menor o igual a ${ruleParam}`);
            }
          }
          else if (ruleName === 'number') {
            if (isNaN(value) || !isFinite(value)) {
              fieldErrors.push(`${label} debe ser un número válido`);
            }
          }
          else if (ruleName === 'url') {
            if (!/^https?:\/\/.+/.test(value)) {
              fieldErrors.push(`${label} debe ser una URL válida`);
            }
          }
          else if (ruleName === 'alpha_num') {
            if (!/^[a-zA-Z0-9]+$/.test(value)) {
              fieldErrors.push(`${label} solo puede contener letras y números`);
            }
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);

        const input = formEl.querySelector(`[name="${fieldPath}"]`);
        if (input) {
          const formGroup = input.closest('.form-group');
          if (formGroup) {
            formGroup.classList.add('has-error');
            const errorEl = formGroup.querySelector('.form-error');
            if (errorEl) {
              errorEl.textContent = fieldErrors[0];
              errorEl.style.display = 'block';
            }
          }
        }
      }
    };

    const processFields = (fields, basePath = '') => {
      if (!fields) return;

      fields.forEach(field => {
        if (field.type === 'group' && field.fields) {
          processFields(field.fields, basePath);
        }
        else if (field.type === 'grouper' && field.groups) {
          field.groups.forEach(group => {
            if (group.fields) processFields(group.fields, basePath);
          });
        }
        else if (field.name) {
          const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
          validateField(field, fieldPath);
        }
      });
    };

    processFields(schema.fields);

    const success = errors.length === 0;
    const message = success ? 'Formulario válido' : `${errors.length} error${errors.length > 1 ? 'es' : ''} de validación`;

    return {
      success,
      errors,
      message,
      data: success ? formData : null
    };
  }

  static reset(formId) {
    const formEl = document.getElementById(formId);
    if (formEl) {
      formEl.reset();
      formEl.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
      });
      formEl.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
    }
  }
}

window.form = form;