class form {
  static schemas = new Map();
  static registeredEvents = new Set();

  static async load(formName, container = null, data = null) {
    const cacheKey = `form_${formName.replace(/\//g, '_')}`;
    let schema = cache.get(cacheKey);

    if (!schema) {
      let url;

      if (formName.includes('/')) {
        const parts = formName.split('/');
        const firstPart = parts[0];

        const isPlugin = window.view?.loadedPlugins?.[firstPart] ||
                        window.hook?.isPluginEnabled?.(firstPart);

        if (isPlugin) {
          const pluginName = parts[0];
          const restPath = parts.slice(1).join('/');
          const basePath = window.appConfig?.routes?.pluginForms?.replace('{pluginName}', pluginName);
          url = `${window.BASE_URL}${basePath}/${restPath}.json`;
        } else {
          const basePath = window.appConfig?.routes?.coreForms || 'js/views/forms';
          url = `${window.BASE_URL}${basePath}/${formName}.json`;
        }
      } else {
        const basePath = window.appConfig?.routes?.coreForms || 'js/views/forms';
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
      } else {
        console.error('❌ Formulario no encontrado en DOM');
      }
    }, 10);
  }

  static render(schema) {
    return `
      <div class="form-container">
        ${schema.title ? `<h2>${schema.title}</h2>` : ''}
        ${schema.description ? `<p class="form-desc">${schema.description}</p>` : ''}

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

      return this.renderField(field, fieldPath);
    }).join('');
  }

  static renderRepeatable(field, path) {
    const addText = field.addText || 'Agregar';

    return `
      <div class="form-repeatable" data-field-path="${path}">
        <div class="repeatable-header">
          <h4>${field.label}</h4>
          <button type="button" class="btn btn-primary btn-sm repeatable-add" data-path="${path}">
            ${addText}
          </button>
        </div>
        <div class="repeatable-items" data-path="${path}"></div>
      </div>
    `;
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

  static renderField(field, path) {
    const common = `name="${path}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} ${field.min ? `min="${field.min}"` : ''} ${field.step ? `step="${field.step}"` : ''}`;

    switch(field.type) {
      case 'button':
        return `<button type="${field.action || 'button'}" class="btn ${field.style === 'secondary' ? 'btn-secondary' : 'btn-primary'}" ${field.onclick ? `onclick="${field.onclick}"` : ''}>${field.label}</button>`;

      case 'select':
        return `
          <div class="form-group">
            <label>${field.label}</label>
            <select ${common}>
              <option value="">Selecciona...</option>
              ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('') || ''}
            </select>
          </div>`;

      case 'textarea':
        return `
          <div class="form-group">
            <label>${field.label}</label>
            <textarea ${common}></textarea>
          </div>`;

      case 'checkbox':
        return `
          <div class="form-group form-checkbox">
            <label>
              <input type="checkbox" name="${path}" ${field.required ? 'required' : ''}>
              ${field.label}
            </label>
          </div>`;

      default:
        return `
          <div class="form-group">
            <label>${field.label}</label>
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
        console.error('❌ No se encontró el formulario padre');
        return;
      }

      const formId = formEl.id;
      const path = this.dataset.path;

      const container = formEl.querySelector(`.repeatable-items[data-path="${path}"]`);
      if (!container) {
        console.error('❌ Container no encontrado');
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
      console.error('❌ Formulario no encontrado:', formId);
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
      console.error('❌ Schema no encontrado para:', formId);
      return;
    }

    const fieldDef = this.findField(schema.fields, path);
    if (!fieldDef || !fieldDef.fields) {
      console.error('❌ Field no encontrado o sin subcampos');
      return;
    }

    if (!container) {
      console.error('❌ Container no proporcionado');
      return;
    }

    const index = container.children.length;
    const itemPath = `${path}[${index}]`;
    const removeText = fieldDef.removeText || 'Eliminar';

    // ✅ NUEVO: Soporte para columns en repeatable
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
      console.warn('⚠️  No se puede eliminar el último item');
    }
  }

  static findField(fields, targetPath) {
    for (const field of fields) {
      if (field.name === targetPath) {
        return field;
      }

      if (field.type === 'repeatable' && field.fields) {
        const found = this.findField(field.fields, targetPath);
        if (found) return found;
      }
    }
    return null;
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