// Procesado de columnas, formatos de valor y traducción de labels
class ogDatatableColumns {
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
            field,
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
            field,
            headerLabel: this.translateLabel(params),
            name: params,
            sortable: false,
            width: null,
            align: 'left'
          };
        }
        return {
          field,
          headerLabel: this.translateLabel(params.name || field),
          name: params.name || field,
          sortable: params.sortable || false,
          width: params.width || null,
          align: params.align || 'left',
          format: params.format || null,
          ...params
        };
      });
    }

    return [];
  }

  static translateLabel(label) {
    const i18n = ogModule('i18n');
    if (!label || typeof label !== 'string') return '';
    if (!label.startsWith('i18n:')) return label;

    const key = label.replace('i18n:', '');

    if (i18n && typeof i18n.t === 'function') {
      const translation = i18n.t(key);
      if (translation !== key) return translation;
    }

    ogLogger.warn('com:datatable', `Traducción no encontrada: ${key}`);
    return this.formatHeader(key.split('.').pop());
  }

  static formatHeader(col) {
    return col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ');
  }

  static renderCell(row, column) {
    let value = row[column.field] ?? '';

    if (column.format) {
      value = this.formatValue(value, column.format, row);
    }

    const style = [];
    if (column.width) style.push(`width: ${column.width}`);
    if (column.align) style.push(`text-align: ${column.align}`);

    const styleAttr = style.length > 0 ? ` style="${style.join('; ')}"` : '';
    const classAttr = column.solid ? ' class="og-col-solid"' : '';

    return `<td${classAttr}${styleAttr}>${value}</td>`;
  }

  static formatValue(value, format, row) {
    if (!value && value !== 0) return '';

    if (typeof format === 'function') return format(value, row);

    if (typeof format === 'string' && ogDatatableCore.customFormatters.has(format)) {
      return ogDatatableCore.customFormatters.get(format)(value, row);
    }

    switch (format) {
      case 'date':      return this.formatDate(value);
      case 'datetime':  return this.formatDateTime(value);
      case 'money':     return this.formatMoney(value);
      case 'boolean':   return value ? __('com.datatable.yes') : __('com.datatable.no');
      case 'uppercase': return String(value).toUpperCase();
      case 'lowercase': return String(value).toLowerCase();
      case 'capitalize':return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      default:          return value;
    }
  }

  static formatDate(value) {
    try { return new Date(value).toLocaleDateString(); } catch { return value; }
  }

  static formatDateTime(value) {
    try { return new Date(value).toLocaleString(); } catch { return value; }
  }

  static formatMoney(value) {
    try {
      return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
    } catch { return value; }
  }
}

window.ogDatatableColumns = ogDatatableColumns;
