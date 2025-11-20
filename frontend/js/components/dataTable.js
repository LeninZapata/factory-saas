class datatable {
  static tables = new Map();
  static counter = 0;

  static async render(config, container) {
    const tableId = `datatable-${++this.counter}`;
    
    // Cargar datos
    const data = await this.loadData(config.source);
    
    // Guardar referencia
    this.tables.set(tableId, { config, data });
    
    // Renderizar
    const html = this.generateHtml(tableId, config, data);
    container.innerHTML = html;
    
    // Bind events
    this.bindEvents(tableId);
  }

  static async loadData(source) {
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error('Error loading data');
      return await response.json();
    } catch (error) {
      console.error('DataTable: Error loading data', error);
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
      return `<button class="btn btn-sm btn-secondary" onclick="${onclick}">${action.name}</button>`;
    }).join(' ');
  }

  static replaceVars(str, row) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return row[key] !== undefined ? `'${row[key]}'` : match;
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