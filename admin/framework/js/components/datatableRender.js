// Generación de HTML: tabla, filas, celdas y botones de acción
class ogDatatableRender {
  static generateHtml(tableId, config, data) {
    const columns = ogDatatableColumns.processColumns(config.columns || []);
    const hasActions = config.actions && Object.keys(config.actions).length > 0;
    const isEmpty = !Array.isArray(data) || data.length === 0;
    const totalColumns = columns.length + (hasActions ? 1 : 0);

    let tableClass = 'og-table';
    if (config.tableClass) {
      const baseClass = config.tableClass.replace('table-', 'og-table-');
      tableClass = `og-table ${baseClass}`;
    }

    return `
      <div class="og-datatable-container" id="${tableId}" data-datatable="${tableId}">
        <div class="og-table-responsive">
          <table class="${tableClass}">
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.headerLabel}</th>`).join('')}
                ${hasActions ? `<th>${__('com.datatable.actions')}</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${isEmpty
                ? `<tr><td colspan="${totalColumns}" style="text-align: center; padding: 2rem; color: #6b7280;">${__('com.datatable.no_data')}</td></tr>`
                : data.map(row => this.renderRow(row, columns, config.actions)).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  static renderRow(row, columns, actions) {
    const hasActions = actions && Object.keys(actions).length > 0;

    return `
      <tr>
        ${columns.map(col => ogDatatableColumns.renderCell(row, col)).join('')}
        ${hasActions ? `<td>${this.renderActions(row, actions)}</td>` : ''}
      </tr>
    `;
  }

  static renderActions(row, actions) {
    return Object.entries(actions).map(([key, action]) => {
      if (!ogDatatableCore.hasRoleAccess(action)) return '';

      const actionLabel = ogDatatableColumns.translateLabel(action.name);

      let clickHandler = '';
      if (action.action) {
        const actionStr = this.replaceVars(action.action, row);
        const escapedAction = actionStr.replace(/'/g, "\\'");
        clickHandler = `actionHandler.handle('${escapedAction}')`;
      } else if (action.onclick) {
        clickHandler = this.replaceVars(action.onclick, row);
      } else {
        clickHandler = `console.warn('No action defined for ${key}')`;
      }

      let dataAttrs = '';
      if (action.dataLoader) {
        const loaderConfig = JSON.stringify(action.dataLoader).replace(/"/g, '&quot;');
        dataAttrs = ` data-loader-config="${loaderConfig}" data-row-id="${row.id || row.ID || ''}"`;
      }

      return `<button class="btn btn-sm btn-secondary" onclick="${clickHandler}"${dataAttrs}>${actionLabel}</button>`;
    }).join(' ').trim();
  }

  static replaceVars(str, row) {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      if (row[key] === undefined) {
        ogLogger.warn('com:datatable', `Key "${key}" no encontrada en row`);
        return match;
      }

      return String(row[key])
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
    });
  }
}

window.ogDatatableRender = ogDatatableRender;
