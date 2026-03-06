// Columnas fijas para scroll horizontal — via transform sincronizado con scroll
// Uso: fixedColumns: N (izquierda), fixedColumnsRight: N (derecha)
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
    const fixedCountRight = this._resolveCountRight(config);
    if (fixedCount < 1 && fixedCountRight < 1) return;

    const headers = Array.from(table.querySelectorAll('thead tr th'));
    if (headers.length < fixedCount + fixedCountRight) return;

    // Si está en tab oculta, reintentar cuando sea visible
    if (headers[0].getBoundingClientRect().width === 0) {
      this._retryWhenVisible(tableId, config, parentEl);
      return;
    }

    // Limpiar listener anterior (ej: refresh del datatable)
    const prev = this._listeners.get(tableId);
    if (prev) wrapper.removeEventListener('scroll', prev);

    const cellsLeft = [];
    const cellsRight = [];

    table.querySelectorAll('thead tr, tbody tr').forEach(row => {
      const els = Array.from(row.querySelectorAll('th, td'));
      const total = els.length;
      els.forEach((el, i) => {
        if (fixedCount > 0 && i < fixedCount) {
          cellsLeft.push({ el, isFirst: i === 0, isLast: i === fixedCount - 1, isHeader: el.tagName === 'TH' });
        }
        if (fixedCountRight > 0 && i >= total - fixedCountRight) {
          cellsRight.push({ el, isEdge: i === total - fixedCountRight, isHeader: el.tagName === 'TH' });
        }
      });
    });

    // border-separate para que cada celda posea sus bordes
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '0';

    cellsLeft.forEach(({ el, isFirst, isLast, isHeader }) => {
      el.style.position = 'relative';
      el.style.zIndex = isHeader ? '3' : '1';
      el.classList.add('og-col-fixed');
      if (isFirst) el.classList.add('og-col-fixed-first');
      if (isLast) el.classList.add('og-col-fixed-last');
    });

    cellsRight.forEach(({ el, isEdge, isHeader }) => {
      el.style.position = 'relative';
      el.style.zIndex = isHeader ? '3' : '1';
      el.classList.add('og-col-fixed-right');
      if (isEdge) el.classList.add('og-col-fixed-right-edge');
    });

    // translateX(scrollLeft) para izquierda
    // Math.min(0, s + clientWidth - tableWidth) para derecha — mismo valor para todas las cols derechas
    const sync = () => {
      const s = wrapper.scrollLeft;
      if (cellsLeft.length) {
        cellsLeft.forEach(({ el }) => (el.style.transform = `translate3d(${s}px, 0, 0)`));
      }
      if (cellsRight.length) {
        const t = Math.min(0, s + wrapper.clientWidth - table.offsetWidth);
        cellsRight.forEach(({ el }) => (el.style.transform = `translate3d(${t}px, 0, 0)`));
      }
    };

    wrapper.addEventListener('scroll', sync, { passive: true });
    this._listeners.set(tableId, sync);
    sync();

    ogLogger.info('com:fixedcols', `✅ left:${fixedCount} right:${fixedCountRight} en #${tableId}`);
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
    setTimeout(() => observer.disconnect(), 10000);
  }

  static _resolveCount(config) {
    const fc = config.fixedColumns;
    if (typeof fc === 'number') return fc;
    if (Array.isArray(fc)) return fc.length;
    return 0;
  }

  static _resolveCountRight(config) {
    const fc = config.fixedColumnsRight;
    if (typeof fc === 'number') return fc;
    if (Array.isArray(fc)) return fc.length;
    return 0;
  }
}

window.ogDatatableFixedCols = ogDatatableFixedCols;
