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

    // ✅ Traducir schema si i18n está disponible
    if (window.__) {
      this.translateSchema(instanceSchema);
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
      } else {
        console.error('❌ Formulario no encontrado en DOM');
      }
    }, 10);
  }

  // ✅ NUEVO: Traducir valores que empiecen con "i18n:"
  static translateSchema(schema) {
    // Traducir title y description
    if (schema.title?.startsWith('i18n:')) {
      schema.title = __(schema.title.replace('i18n:', ''));
    }
    if (schema.description?.startsWith('i18n:')) {
      schema.description = __(schema.description.replace('i18n:', ''));
    }

    // Traducir fields
    if (schema.fields) {
      this.translateFields(schema.fields);
    }

    // Traducir toolbar
    if (schema.toolbar) {
      this.translateFields(schema.toolbar);
    }

    // Traducir statusbar
    if (schema.statusbar) {
      this.translateFields(schema.statusbar);
    }
  }

  static translateFields(fields) {
    fields.forEach(field => {
      // Traducir label
      if (field.label?.startsWith('i18n:')) {
        field.label = __(field.label.replace('i18n:', ''));
      }

      // Traducir placeholder
      if (field.placeholder?.startsWith('i18n:')) {
        field.placeholder = __(field.placeholder.replace('i18n:', ''));
      }

      // Traducir addText y removeText (para repetibles)
      if (field.addText?.startsWith('i18n:')) {
        field.addText = __(field.addText.replace('i18n:', ''));
      }
      if (field.removeText?.startsWith('i18n:')) {
        field.removeText = __(field.removeText.replace('i18n:', ''));
      }

      // Traducir options (para select)
      if (field.options) {
        field.options.forEach(opt => {
          if (opt.label?.startsWith('i18n:')) {
            opt.label = __(opt.label.replace('i18n:', ''));
          }
        });
      }

      // Traducir subcampos (para repetibles)
      if (field.fields) {
        this.translateFields(field.fields);
      }
    });
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
    }, document);

    events.on('.repeatable-remove', 'click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      form.removeRepeatableItem(this);
    }, document);

    this.registeredEvents.add('form-events');
  }

  static handleSubmit(formId, callback) {
    const formEl = document.getElementById(formId);
    if (!formEl) {
      console.error('❌ Formulario no encontrado:', formId);
      return;
    }

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = this.getData(formId);

      if (callback && typeof callback === 'function') {
        await callback(data, formEl);
      }
    });
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

    const itemHTML = `
      <div class="repeatable-item">
        <div class="repeatable-content">
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
    }
  }

  static findField(fields, path) {
    const parts = path.split('.');
    let current = fields;
    let result = null;

    for (const part of parts) {
      const cleanPart = part.replace(/\[\d+\]/g, '');
      result = current.find(f => f.name === cleanPart);

      if (!result) return null;
      if (result.fields) current = result.fields;
    }

    return result;
  }

  static fill(formId, data) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    Object.keys(data).forEach(key => {
      const field = formEl.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = Boolean(data[key]);
        } else {
          field.value = data[key] || '';
        }
      }
    });
  }

  static getData(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return null;

    const data = {};
    const inputs = formEl.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      if (input.name) {
        if (input.type === 'checkbox') {
          data[input.name] = input.checked;
        } else {
          data[input.name] = input.value;
        }
      }
    });

    return data;
  }
}

window.form = form;