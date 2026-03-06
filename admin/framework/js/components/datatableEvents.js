// Eventos DOM, detección de overflow y actualización de tablas
class ogDatatableEvents {
  static bindEvents(tableId) {
    setTimeout(() => {
      this.checkTableOverflow(tableId);
    }, 100);

    window.addEventListener('resize', () => this.checkTableOverflow(tableId));
  }

  static checkTableOverflow(tableId) {
    const container = document.getElementById(tableId);
    if (!container) return;

    const wrapper = container.querySelector('.og-table-responsive');
    if (!wrapper) return;

    const hasOverflow = wrapper.scrollWidth > wrapper.clientWidth;

    if (hasOverflow) {
      wrapper.classList.add('has-overflow');
    } else {
      wrapper.classList.remove('has-overflow');
    }

    wrapper.addEventListener('scroll', () => {
      const isAtEnd = wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 5;

      if (isAtEnd) {
        wrapper.classList.remove('has-overflow');
      } else if (hasOverflow) {
        wrapper.classList.add('has-overflow');
      }
    }, { once: false });
  }

  static async refresh(tableId) {
    const table = ogDatatableCore.tables.get(tableId);
    if (!table) {
      ogLogger.warn('com:datatable', `Tabla ${tableId} no encontrada`);
      return;
    }

    const { config, extensionName, container } = table;
    const data = await ogDatatableSource.loadData(config, extensionName);

    ogDatatableCore.tables.set(tableId, { config, data, extensionName, container });

    const html = ogDatatableRender.generateHtml(tableId, config, data);
    container.innerHTML = html;

    this.bindEvents(tableId);

    // Feature: columnas fijas
    if (typeof ogDatatableFixedCols !== 'undefined' && config.fixedColumns) {
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
