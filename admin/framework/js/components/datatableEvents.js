// Eventos DOM, detección de overflow y actualización de tablas
class ogDatatableEvents {
  static _scrollListeners = new Map();

  static bindEvents(tableId) {
    setTimeout(() => {
      this.checkTableOverflow(tableId);
    }, 100);

    window.addEventListener('resize', () => this.checkTableOverflow(tableId));
  }

  static checkTableOverflow(tableId) {
    const container = document.getElementById(tableId);
    if (!container) return;

    const wrap = container.querySelector('.og-table-scroll-wrap');
    const scrollEl = container.querySelector('.og-table-responsive');
    if (!wrap || !scrollEl) return;

    // Leer config del store para saber si hay columnas fijas (más fiable que DOM query)
    const tableData = typeof ogDatatableCore !== 'undefined' ? ogDatatableCore.tables.get(tableId) : null;
    const config = tableData?.config || {};
    const fixedLeft = typeof config.fixedColumns === 'number' ? config.fixedColumns
      : Array.isArray(config.fixedColumns) ? config.fixedColumns.length : 0;
    const fixedRight = typeof config.fixedColumnsRight === 'number' ? config.fixedColumnsRight
      : Array.isArray(config.fixedColumnsRight) ? config.fixedColumnsRight.length : 0;

    // Reglas: fijas izquierda → sin degradado izquierda; fijas derecha → sin degradado derecha
    const allowLeft = fixedLeft < 1;
    const allowRight = fixedRight < 1;

    const update = () => {
      const scrollLeft = scrollEl.scrollLeft;
      const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
      const hasHScroll = maxScroll > 1;
      wrap.classList.toggle('has-overflow-right', allowRight && hasHScroll && scrollLeft < maxScroll - 5);
      wrap.classList.toggle('has-overflow-left', allowLeft && hasHScroll && scrollLeft > 5);
    };

    // Remover listener anterior para evitar duplicados
    const prev = this._scrollListeners.get(tableId);
    if (prev) scrollEl.removeEventListener('scroll', prev);

    scrollEl.addEventListener('scroll', update, { passive: true });
    this._scrollListeners.set(tableId, update);

    update();
  }

  static async refresh(tableId) {
    const table = ogDatatableCore.tables.get(tableId);
    if (!table) {
      ogLogger.warn('com:datatable', `Tabla ${tableId} no encontrada`);
      return;
    }

    const { config, extensionName, container } = table;

    container.innerHTML = ogDatatableRender.generateSkeleton(config);

    const data = await ogDatatableSource.loadData(config, extensionName);

    ogDatatableCore.tables.set(tableId, { config, data, extensionName, container });

    const html = ogDatatableRender.generateHtml(tableId, config, data);
    container.innerHTML = html;

    this.bindEvents(tableId);

    // Feature: columnas fijas
    if (typeof ogDatatableFixedCols !== 'undefined' && (config.fixedColumns || config.fixedColumnsRight)) {
      ogDatatableFixedCols.apply(tableId, config, container);
    }

    // Feature: resize de columnas
    if (typeof ogDatatableResizeCols !== 'undefined' && config.resizableColumns) {
      ogDatatableResizeCols.apply(tableId, config, container);
    }
  }

  static async refreshFirst() {
    const firstTable = document.querySelector('[data-datatable]');
    if (!firstTable) {
      ogLogger.warn('com:datatable', 'No se encontró ninguna tabla');
      return;
    }

    const tableId = firstTable.getAttribute('data-datatable');
    await this.refresh(tableId);
  }
}

window.ogDatatableEvents = ogDatatableEvents;
/**
 * @doc-start
 * FILE: framework/js/components/datatableEvents.js
 * CLASS: ogDatatableEvents
 * TYPE: component-internal
 * PROMPT: fe-components
 *
 * ROLE:
 *   Binding de eventos interactivos del datatable: búsqueda, ordenamiento,
 *   paginación, acciones de fila y detección de overflow horizontal.
 *   Sub-módulo de ogDatatable — llamado automáticamente tras render.
 *
 * EVENTOS QUE GESTIONA:
 *   search input    → filtra filas visibles por texto en todas las columnas
 *   th click        → ordena columna (toggle asc/desc)
 *   pagination      → navega entre páginas (si config.pageSize)
 *   action buttons  → delega a ogAction.handle(action, { id, row })
 *   window scroll   → checkTableOverflow() para mostrar sombras laterales
 *
 * REFRESH:
 *   refresh(tableId)    → recarga datos del source y re-renderiza la tabla
 *   refreshFirst()      → refresca la primera tabla activa (shortcut)
 *   Útil después de crear/editar/eliminar un registro desde un modal.
 *
 * REGISTRO:
 *   window.ogDatatableEvents
 *   ogFramework.components.datatableEvents
 * @doc-end
 */