class datatable {
  static tables = new Map();
  static counter = 0;

  static async render(config, container) {
    const tableId = `datatable-${++this.counter}`;

    // Detectar plugin name
    const pluginName = config.pluginName || this.detectPluginName(container);

    // Cargar datos usando dataLoader
    const data = await this.loadData(config, pluginName);

    // Guardar referencia
    this.tables.set(tableId, { config, data, pluginName });

    // Renderizar
    const html = this.generateHtml(tableId, config, data);
    container.innerHTML = html;

    // Bind events
    this.bindEvents(tableId);
  }

  static detectPluginName(container) {
    // Estrategia 1: Buscar data-plugin en el contenedor o ancestros
    const viewContainer = container.closest('[data-plugin]');
    if (viewContainer?.dataset.plugin) {
      return viewContainer.dataset.plugin;
    }

    // Estrategia 2: Buscar en el DOM la vista activa
    const activeView = document.querySelector('.view-container[data-view]');
    if (activeView?.dataset.view) {
      const viewPath = activeView.dataset.view;
      const parts = viewPath.split('/');
      if (parts.length > 1 && window.hook?.isPluginEnabled(parts[0])) {
        return parts[0];
      }
    }

    // Estrategia 3: Buscar en view.currentPlugin
    if (window.view?.currentPlugin) {
      return window.view.currentPlugin;
    }

    // Estrategia 4: Buscar clases CSS con patrón plugin-*
    const pluginClass = Array.from(container.classList || [])
      .find(cls => cls.startsWith('plugin-'));
    if (pluginClass) {
      return pluginClass.replace('plugin-', '');
    }

    return null;
  }

  static async loadData(config, pluginName) {
    try {
      // Si tiene dataSource, usar dataLoader
      if (config.dataSource) {
        return await dataLoader.loadList(config.dataSource, pluginName);
      }

      // Fallback al método antiguo (source directo)
      if (config.source) {
        // Validación minimalista: .json = archivo local, resto = API
        const url = config.source.endsWith('.json')
          ? window.BASE_URL + config.source
          : config.source;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error loading data');
        return await response.json();
      }

      logger.error('com:datatable', 'No se especificó dataSource ni source');
      return [];

    } catch (error) {
      logger.error('com:datatable', 'Error loading data:', error);
      return [];
    }
  }

  static generateHtml(tableId, config, data) {
    const columns = config.columns || Object.keys(data[0] || {});
    const hasActions = config.actions && Object.keys(config.actions).length > 0;

    return `
      <div class="datatable-container" id="${tableId}">
        <table class="table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${this.formatHeader(col)}</th>`).join('')}
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

  static renderRow(row, columns, actions) {
    const hasActions = actions && Object.keys(actions).length > 0;

    return `
      <tr>
        ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
        ${hasActions ? `<td>${this.renderActions(row, actions)}</td>` : ''}
      </tr>
    `;
  }

  static renderActions(row, actions) {

    return Object.entries(actions).map(([key, action]) => {
      const onclick = this.replaceVars(action.onclick, row);

      // Agregar data-loader-config si existe
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

      // Escapar comillas simples, dobles y otros caracteres especiales
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
    // Eventos futuros si son necesarios
  }

  static refresh(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return;

    const container = document.getElementById(tableId).parentElement;
    this.render(table.config, container);
  }
}

window.datatable = datatable;