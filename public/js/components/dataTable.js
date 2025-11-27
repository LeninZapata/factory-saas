class datatable {
  static tables = new Map();
  static counter = 0;

  static async render(config, container) {
    const tableId = `datatable-${++this.counter}`;
    const pluginName = config.pluginName || this.detectPluginName(container);
    const data = await this.loadData(config, pluginName);

    this.tables.set(tableId, { config, data, pluginName });

    const html = this.generateHtml(tableId, config, data);
    container.innerHTML = html;

    this.bindEvents(tableId);
  }

  static detectPluginName(container) {
    const viewContainer = container.closest('[data-plugin]');
    if (viewContainer?.dataset.plugin) return viewContainer.dataset.plugin;

    const activeView = document.querySelector('.view-container[data-view]');
    if (activeView?.dataset.view) {
      const viewPath = activeView.dataset.view;
      const parts = viewPath.split('/');
      if (parts.length > 1 && window.hook?.isPluginEnabled(parts[0])) {
        return parts[0];
      }
    }

    if (window.view?.currentPlugin) return window.view.currentPlugin;

    const pluginClass = Array.from(container.classList || [])
      .find(cls => cls.startsWith('plugin-'));
    if (pluginClass) return pluginClass.replace('plugin-', '');

    return null;
  }

  static async loadData(config, pluginName) {
    try {
      if (config.dataSource) {
        return await dataLoader.loadList(config.dataSource, pluginName);
      }

      if (config.source) {
        const isApiEndpoint = config.source.startsWith('api/') || config.source.startsWith('/api/');
        
        if (isApiEndpoint) {
          const endpoint = config.source.startsWith('/') ? config.source : `/${config.source}`;
          const response = await api.get(endpoint);
          
          if (response.success && response.data) return response.data;
          return response;
        } else {
          const url = config.source.endsWith('.json')
            ? window.BASE_URL + config.source
            : config.source;

          const response = await fetch(url);
          if (!response.ok) throw new Error('Error loading data');
          return await response.json();
        }
      }

      logger.error('com:datatable', 'No se especificó dataSource ni source');
      return [];

    } catch (error) {
      logger.error('com:datatable', 'Error loading data:', error);
      return [];
    }
  }

  static generateHtml(tableId, config, data) {
    const columns = this.processColumns(config.columns || Object.keys(data[0] || {}));
    const hasActions = config.actions && Object.keys(config.actions).length > 0;

    return `
      <div class="datatable-container" id="${tableId}">
        <table class="table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.headerLabel}</th>`).join('')}
              ${hasActions ? '<th>Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => this.renderRow(row, columns, config.actions)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Procesar columnas - Sistema flexible y extensible
   * 
   * Formatos soportados:
   * 
   * 1. String simple:
   *    ["id", "username", "email"]
   * 
   * 2. Objeto con parámetros:
   *    {
   *      "user": {
   *        "name": "i18n:admin:user.field.username",
   *        "sortable": true,
   *        "width": "200px",
   *        "align": "left"
   *      }
   *    }
   * 
   * 3. Mixto:
   *    [
   *      "id",
   *      { "user": { "name": "i18n:core.username" } },
   *      "email"
   *    ]
   */
  static processColumns(columns) {
    // Si es array simple de strings
    if (Array.isArray(columns)) {
      return columns.map(col => {
        if (typeof col === 'string') {
          // Formato simple: "username"
          return {
            field: col,
            headerLabel: this.formatHeader(col),
            name: col,
            sortable: false,
            width: null,
            align: 'left'
          };
        } else if (typeof col === 'object') {
          // Formato objeto: { "user": { "name": "...", ... } }
          const field = Object.keys(col)[0];
          const params = col[field];
          
          return {
            field: field,
            headerLabel: this.translateLabel(params.name || field),
            name: params.name || field,
            sortable: params.sortable || false,
            width: params.width || null,
            align: params.align || 'left',
            format: params.format || null,
            // Guardar todos los parámetros extra
            ...params
          };
        }
      });
    }

    // Si es objeto directo: { "user": {...}, "email": {...} }
    if (typeof columns === 'object' && !Array.isArray(columns)) {
      return Object.entries(columns).map(([field, params]) => {
        if (typeof params === 'string') {
          // Formato: { "user": "Username" }
          return {
            field: field,
            headerLabel: this.translateLabel(params),
            name: params,
            sortable: false,
            width: null,
            align: 'left'
          };
        } else {
          // Formato: { "user": { "name": "...", ... } }
          return {
            field: field,
            headerLabel: this.translateLabel(params.name || field),
            name: params.name || field,
            sortable: params.sortable || false,
            width: params.width || null,
            align: params.align || 'left',
            format: params.format || null,
            ...params
          };
        }
      });
    }

    return [];
  }

  /**
   * Traducir label con soporte para i18n
   * 
   * Formatos:
   * - "Username" → Retorna tal cual
   * - "i18n:core.username" → Busca en traducciones core
   * - "i18n:admin:user.name" → Busca en plugin "admin"
   */
  static translateLabel(label) {
    if (!label || typeof label !== 'string') return '';

    // Si no tiene i18n:, retornar tal cual
    if (!label.startsWith('i18n:')) return label;

    // Remover prefijo i18n:
    const key = label.replace('i18n:', '');

    // Detectar si es de plugin: "admin:user.name"
    if (key.includes(':')) {
      const [pluginName, pluginKey] = key.split(':', 2);
      return this.translateFromPlugin(pluginName, pluginKey);
    }

    // Es de core: "core.username"
    return this.translateFromCore(key);
  }

  /**
   * Traducir desde traducciones core
   */
  static translateFromCore(key) {
    if (window.i18n && typeof i18n.t === 'function') {
      const translation = i18n.t(key);
      // Si la traducción es igual a la key, significa que no se encontró
      if (translation !== key) return translation;
    }

    // Fallback: formatear la key
    logger.warn('com:datatable', `Traducción no encontrada: ${key}`);
    return this.formatHeader(key.split('.').pop());
  }

  /**
   * Traducir desde traducciones de plugin
   */
  static translateFromPlugin(pluginName, key) {
    // Intentar obtener traducción del plugin
    if (window.i18n && window.i18n.pluginTranslations) {
      const pluginLangs = i18n.pluginTranslations.get(pluginName);
      if (pluginLangs) {
        const currentLang = i18n.getLang();
        const translations = pluginLangs.get(currentLang);
        
        if (translations && translations[key]) {
          return translations[key];
        }
      }
    }

    // Fallback: formatear la key
    logger.warn('com:datatable', `Traducción de plugin no encontrada: ${pluginName}:${key}`);
    return this.formatHeader(key.split('.').pop());
  }

  static renderRow(row, columns, actions) {
    const hasActions = actions && Object.keys(actions).length > 0;

    return `
      <tr>
        ${columns.map(col => this.renderCell(row, col)).join('')}
        ${hasActions ? `<td>${this.renderActions(row, actions)}</td>` : ''}
      </tr>
    `;
  }

  /**
   * Renderizar celda con soporte para formato personalizado
   */
  static renderCell(row, column) {
    let value = row[column.field] || '';

    // Aplicar formato si existe
    if (column.format) {
      value = this.formatValue(value, column.format, row);
    }

    // Aplicar estilos
    const style = [];
    if (column.width) style.push(`width: ${column.width}`);
    if (column.align) style.push(`text-align: ${column.align}`);

    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';

    return `<td${styleAttr}>${value}</td>`;
  }

  /**
   * Formatear valor según tipo
   * 
   * Formatos soportados:
   * - "date" → Formatear fecha
   * - "datetime" → Formatear fecha y hora
   * - "money" → Formatear moneda
   * - "boolean" → Sí/No
   * - function → Función personalizada
   */
  static formatValue(value, format, row) {
    if (!value) return '';

    // Si format es una función
    if (typeof format === 'function') {
      return format(value, row);
    }

    // Formatos predefinidos
    switch (format) {
      case 'date':
        return this.formatDate(value);
      
      case 'datetime':
        return this.formatDateTime(value);
      
      case 'money':
        return this.formatMoney(value);
      
      case 'boolean':
        return value ? 'Sí' : 'No';
      
      case 'uppercase':
        return String(value).toUpperCase();
      
      case 'lowercase':
        return String(value).toLowerCase();
      
      case 'capitalize':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      
      default:
        return value;
    }
  }

  static formatDate(value) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return value;
    }
  }

  static formatDateTime(value) {
    try {
      const date = new Date(value);
      return date.toLocaleString();
    } catch {
      return value;
    }
  }

  static formatMoney(value) {
    try {
      return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    } catch {
      return value;
    }
  }

  static renderActions(row, actions) {
    return Object.entries(actions).map(([key, action]) => {
      const onclick = this.replaceVars(action.onclick, row);

      let dataAttrs = '';
      if (action.dataLoader) {
        const loaderConfig = JSON.stringify(action.dataLoader).replace(/"/g, '&quot;');
        dataAttrs = ` data-loader-config="${loaderConfig}" data-row-id="${row.id || row.ID || ''}"`;
      }

      return `<button class="btn btn-sm btn-secondary" onclick="${onclick}"${dataAttrs}>${action.name}</button>`;
    }).join(' ');
  }

  static replaceVars(str, row) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      if (row[key] === undefined) {
        logger.warn('com:datatable', `Key "${key}" no encontrada en row`);
        return match;
      }

      const value = String(row[key])
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');

      return value;
    });
  }

  static formatHeader(col) {
    return col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ');
  }

  static bindEvents(tableId) {
    // Eventos futuros
  }

  static refresh(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return;

    const container = document.getElementById(tableId).parentElement;
    this.render(table.config, container);
  }
}

window.datatable = datatable;