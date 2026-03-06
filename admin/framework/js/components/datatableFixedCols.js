// Columnas fijas para scroll horizontal — via transform sincronizado con scroll
// Uso: config.fixedColumns: 1 (número) o ['id','name'] (campos → usa el length)
class ogDatatableFixedCols {
  static _listeners = new Map();

  static apply(tableId, config, parentEl) {
    requestAnimationFrame(() => this._setup(tableId, config, parentEl));
  }

  static _setup(tableId, config, parentEl) {
    const root = parentEl || document;
    const container = root.querySelector ? root.querySelector(`#${tableId}`) : document.getElementById(tableId);
    if (!container) return;

    const table = container.querySelector('table');
    const wrapper = container.querySelector('.og-table-responsive');
    if (!table || !wrapper) return;

    const fixedCount = this._resolveCount(config);
    if (fixedCount < 1) return;

    const headers = Array.from(table.querySelectorAll('thead tr th'));
    if (headers.length < fixedCount) return;

    // Si está en tab oculta, reintentar cuando sea visible
    if (headers[0].getBoundingClientRect().width === 0) {
      this._retryWhenVisible(tableId, config, parentEl);
      return;
    }

    // Limpiar listener anterior (ej: refresh del datatable)
    const prev = this._listeners.get(tableId);
    if (prev) wrapper.removeEventListener('scroll', prev);

    // Recopilar celdas fijas de todas las filas
    const cells = [];
    table.querySelectorAll('thead tr, tbody tr').forEach(row => {
      Array.from(row.querySelectorAll('th, td')).forEach((el, i) => {
        if (i < fixedCount) {
          cells.push({ el, isLast: i === fixedCount - 1, isHeader: el.tagName === 'TH' });
        }
      });
    });

    // Estilos base — position:relative para que z-index funcione
    cells.forEach(({ el, isLast, isHeader }) => {
      el.style.position = 'relative';
      el.style.zIndex = isHeader ? '3' : '1';
      el.classList.add('og-col-fixed');
      if (isLast) el.classList.add('og-col-fixed-last');
    });

    // translateX(scrollLeft) cancela el desplazamiento del scroll en cada celda fija
    const sync = () => {
      const s = wrapper.scrollLeft;
      cells.forEach(({ el }) => (el.style.transform = `translate3d(${s}px, 0, 0)`));
    };

    wrapper.addEventListener('scroll', sync, { passive: true });
    this._listeners.set(tableId, sync);
    sync(); // posición inicial

    ogLogger.info('com:fixedcols', `✅ ${fixedCount} columna(s) fija(s) en #${tableId}`);
  }

  static _retryWhenVisible(tableId, config, parentEl) {
    const root = parentEl || document;
    const container = root.querySelector ? root.querySelector(`#${tableId}`) : document.getElementById(tableId);
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        this._setup(tableId, config, parentEl);
      }
    }, { threshold: 0.1 });

    observer.observe(container);

    // Timeout de seguridad
    setTimeout(() => observer.disconnect(), 10000);
  }

  static _resolveCount(config) {
    const fc = config.fixedColumns;
    if (typeof fc === 'number') return fc;
    if (Array.isArray(fc)) return fc.length;
    return 0;
  }
}

window.ogDatatableFixedCols = ogDatatableFixedCols;
