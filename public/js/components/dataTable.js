class datatable {
  static tables = new Map();
  static counter = 0;

  static async render(config, container) {
    // IMPORTANTE: view.js pasa (elemento, config) pero tabs.js pasa (config, elemento)
    // Detectar cuál es cuál y corregir automáticamente
    let actualConfig = config;
    let actualContainer = container;

    // Si el primer parámetro es un elemento DOM, están invertidos
    if (config && typeof config.appendChild === 'function') {
      actualContainer = config;
      actualConfig = container || {};
      logger.debug('com:datatable', 'Parámetros invertidos detectados - corrigiendo');
    }

    if (!actualContainer || typeof actualContainer.appendChild !== 'function') {
      logger.error('com:datatable', 'Container inválido - debe ser un elemento DOM', actualContainer);
      return;
    }

    const tableId = `datatable-${++this.counter}`;
    const pluginName = actualConfig.pluginName || this.detectPluginName(actualContainer);
    const data = await this.loadData(actualConfig, pluginName);

    this.tables.set(tableId, { config: actualConfig, data, pluginName, container: actualContainer });

    const html = this.generateHtml(tableId, actualConfig, data);
    actualContainer.innerHTML = html;

    this.bindEvents(tableId);
  }

  static detectPluginName(container) {
    if (!container || typeof container.closest !== 'function') {
      logger.warn('com:datatable', 'Container inválido en detectPluginName');
      return null;
    }

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
      if (config.source) {
        const isApiEndpoint = config.source.startsWith('api/') || config.source.startsWith('/api/');

        if (isApiEndpoint) {
          const endpoint = config.source.startsWith('/') ? config.source : `/${config.source}`;
          const response = await api.get(endpoint);

          if (response.success && response.data) return response.data;
          return response;
        } else {
          // Si termina en .json, es una ruta COMPLETA (no agregar prefijo de plugin)
          let url;
          if (config.source.endsWith('.json')) {
            url = config.source.startsWith('http') 
              ? config.source 
              : window.BASE_URL + config.source;
          } else {
            // Si NO termina en .json y hay plugin, agregar prefijo del plugin
            if (pluginName && !config.source.startsWith('plugins/')) {
              url = `${window.BASE_URL}plugins/${pluginName}/${config.source}`;
            } else {
              url = window.BASE_URL + config.source;
            }
          }

          // Agregar cache buster
          const cacheBuster = window.appConfig?.cache?.views ? '' : `?t=${Date.now()}`;
          
          logger.debug('com:datatable', `Cargando datos de: ${url}`);
          
          const response = await fetch(url + cacheBuster);
          if (!response.ok) {
            logger.error('com:datatable', `Error ${response.status} al cargar: ${url}`);
            throw new Error(`Error ${response.status} loading data`);
          }
          return await response.json();
        }
      }

      logger.error('com:datatable', 'No se especificó source');
      return [];

    } catch (error) {
      logger.error('com:datatable', 'Error loading data:', error);
      return [];
    }
  }

  static generateHtml(tableId, config, data) {
    if (!Array.isArray(data) || data.length === 0) {
      return `
        <div class="datatable-container" id="${tableId}">
          <div class="datatable-empty">No hay datos para mostrar</div>
        </div>
      `;
    }

    const columns = this.processColumns(config.columns || Object.keys(data[0] || {}));
    const hasActions = config.actions && Object.keys(config.actions).length > 0;

    return `
      <div class="datatable-container" id="${tableId}" data-datatable="${tableId}">
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

  static processColumns(columns) {
    if (Array.isArray(columns)) {
      return columns.map(col => {
        if (typeof col === 'string') {
          return {
            field: col,
            headerLabel: this.formatHeader(col),
            name: col,
            sortable: false,
            width: null,
            align: 'left'
          };
        } else if (typeof col === 'object') {
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
            ...params
          };
        }
      });
    }

    if (typeof columns === 'object' && !Array.isArray(columns)) {
      return Object.entries(columns).map(([field, params]) => {
        if (typeof params === 'string') {
          return {
            field: field,
            headerLabel: this.translateLabel(params),
            name: params,
            sortable: false,
            width: null,
            align: 'left'
          };
        } else {
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

  static translateLabel(label) {
    if (!label || typeof label !== 'string') return '';

    if (!label.startsWith('i18n:')) return label;

    const key = label.replace('i18n:', '');

    // Si usa el nuevo formato i18n:plugin.key
    if (window.i18n && typeof i18n.t === 'function') {
      const translation = i18n.t(key);
      if (translation !== key) return translation;
    }

    logger.warn('com:datatable', `Traducción no encontrada: ${key}`);
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

  static renderCell(row, column) {
    let value = row[column.field] || '';

    if (column.format) {
      value = this.formatValue(value, column.format, row);
    }

    const style = [];
    if (column.width) style.push(`width: ${column.width}`);
    if (column.align) style.push(`text-align: ${column.align}`);

    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';

    return `<td${styleAttr}>${value}</td>`;
  }

  static formatValue(value, format, row) {
    if (!value) return '';

    if (typeof format === 'function') {
      return format(value, row);
    }

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

  static async refresh(tableId) {
    const table = this.tables.get(tableId);
    if (!table) {
      logger.warn('com:datatable', `Tabla ${tableId} no encontrada`);
      return;
    }

    const { config, pluginName, container } = table;
    const data = await this.loadData(config, pluginName);

    this.tables.set(tableId, { config, data, pluginName, container });

    const html = this.generateHtml(tableId, config, data);
    container.innerHTML = html;

    this.bindEvents(tableId);
  }

  static async refreshFirst() {
    const firstTable = document.querySelector('[data-datatable]');
    if (!firstTable) {
      logger.warn('com:datatable', 'No se encontró ninguna tabla');
      return;
    }

    const tableId = firstTable.getAttribute('data-datatable');
    await this.refresh(tableId);
  }
}

window.datatable = datatable;