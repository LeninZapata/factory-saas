// Columnas redimensionables via drag en el borde derecho del header
// Uso: config.resizableColumns: true
class ogDatatableResizeCols {

  static apply(tableId, config, parentEl) {
    const root = parentEl || document;
    const container = root.querySelector(`#${tableId}`) || document.getElementById(tableId);
    if (!container) return;

    const table = container.querySelector('table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead tr th'));
    if (!headers.length) return;

    headers.forEach(th => {
      if (th.querySelector('.og-resize-handle')) return;

      th.style.position = 'relative';

      const handle = document.createElement('span');
      handle.className = 'og-resize-handle';
      th.appendChild(handle);

      handle.addEventListener('mousedown', (e) => this._startDrag(e, th, table));
    });
  }

  static _startDrag(e, th, table) {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = th.offsetWidth;
    const startTableWidth = table.offsetWidth;

    // Fijar anchos de todas las columnas antes de cambiar table-layout
    const allHeaders = Array.from(table.querySelectorAll('thead tr th'));
    allHeaders.forEach(h => { h.style.width = h.offsetWidth + 'px'; });
    table.style.tableLayout = 'fixed';
    table.style.width = startTableWidth + 'px';

    document.body.classList.add('og-col-resizing');
    th.style.opacity = '0.6';

    const onMouseMove = (ev) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.max(40, startWidth + delta);
      const realDelta = newWidth - startWidth;
      // Crecer solo hacia la derecha: ajustar la tabla al mismo delta
      th.style.width = newWidth + 'px';
      table.style.width = (startTableWidth + realDelta) + 'px';
    };

    const onMouseUp = () => {
      th.style.opacity = '';
      document.body.classList.remove('og-col-resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}

window.ogDatatableResizeCols = ogDatatableResizeCols;

/**
 * @doc-start
 * FILE: framework/js/components/datatableResizeCols.js
 * CLASS: ogDatatableResizeCols
 * TYPE: component-feature
 * PROMPT: fe-components
 *
 * ROLE:
 *   Feature opcional de columnas redimensionables por el usuario.
 *   Se activa automáticamente si config.resizableColumns: true en el JSON de vista.
 *   Inserta un handle .og-resize-handle en cada th y gestiona el drag.
 *
 * IMPLEMENTACIÓN:
 *   mousedown en handle → _startDrag() → mousemove → actualiza th.style.width
 *   → mouseup → limpia listeners. Limita el ancho mínimo a 40px.
 *
 * REGISTRO:
 *   window.ogDatatableResizeCols
 *   ogFramework.components.datatableResizeCols
 * @doc-end
 */