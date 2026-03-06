// ====================================================================
// OGDATATABLE - FACHADA PRINCIPAL
// Integra todos los módulos de datatable en una sola interfaz
// ====================================================================

class ogDatatable {
  // ========== STATE (delegado a Core) ==========
  static get tables() { return ogDatatableCore.tables; }
  static get counter() { return ogDatatableCore.counter; }
  static get customFormatters() { return ogDatatableCore.customFormatters; }

  // ========== CORE ==========
  static getConfig() { return ogDatatableCore.getConfig(); }
  static getComponent() { return ogDatatableCore.getComponent(); }
  static detectPluginName(container) { return ogDatatableCore.detectPluginName(container); }
  static hasRoleAccess(action) { return ogDatatableCore.hasRoleAccess(action); }
  static registerFormatter(name, fn) { return ogDatatableCore.registerFormatter(name, fn); }
  static unregisterFormatter(name) { return ogDatatableCore.unregisterFormatter(name); }

  // ========== SOURCE ==========
  static async loadData(config, extensionName) { return ogDatatableSource.loadData(config, extensionName); }
  static normalizeData(response) { return ogDatatableSource.normalizeData(response); }
  static getCached(source) { return ogDatatableSource.getCached(source); }
  static findInCache(source, id, idField) { return ogDatatableSource.findInCache(source, id, idField); }
  static filterInCache(source, filterFn) { return ogDatatableSource.filterInCache(source, filterFn); }
  static clearCache(source) { return ogDatatableSource.clearCache(source); }

  // ========== COLUMNS ==========
  static processColumns(columns) { return ogDatatableColumns.processColumns(columns); }
  static translateLabel(label) { return ogDatatableColumns.translateLabel(label); }
  static formatHeader(col) { return ogDatatableColumns.formatHeader(col); }
  static renderCell(row, column) { return ogDatatableColumns.renderCell(row, column); }
  static formatValue(value, format, row) { return ogDatatableColumns.formatValue(value, format, row); }

  // ========== RENDER ==========
  static generateHtml(tableId, config, data) { return ogDatatableRender.generateHtml(tableId, config, data); }
  static renderRow(row, columns, actions) { return ogDatatableRender.renderRow(row, columns, actions); }
  static renderActions(row, actions) { return ogDatatableRender.renderActions(row, actions); }
  static replaceVars(str, row) { return ogDatatableRender.replaceVars(str, row); }

  // ========== EVENTS ==========
  static bindEvents(tableId) { return ogDatatableEvents.bindEvents(tableId); }
  static checkTableOverflow(tableId) { return ogDatatableEvents.checkTableOverflow(tableId); }
  static async refresh(tableId) { return ogDatatableEvents.refresh(tableId); }
  static async refreshFirst() { return ogDatatableEvents.refreshFirst(); }

  // ========== RENDER PRINCIPAL ==========
  static async render(config, container) {
    // IMPORTANTE: view.js pasa (elemento, config) pero tabs.js pasa (config, elemento)
    let currentConfig = config;
    let currentContainer = container;

    if (config && typeof config.appendChild === 'function') {
      currentContainer = config;
      currentConfig = container || {};
    }

    // Normalizar alias (list, FlatList → datatable)
    if (currentConfig && currentConfig.type) {
      const typeAliases = {
        'list': 'datatable',
        'FlatList': 'datatable',
        'flatlist': 'datatable'
      };

      const normalizedType = typeAliases[currentConfig.type.toLowerCase()];

      if (normalizedType) {
        currentConfig = { ...currentConfig, type: normalizedType };

        if (currentConfig.data && !currentConfig.source) {
          let source = currentConfig.data;
          if (!source.startsWith('extensions/') && !source.startsWith('api/')) {
            source = `extensions/${source}`;
          }
          currentConfig.source = source;
        }

        delete currentConfig.renderItem;
        delete currentConfig.keyExtractor;
      }
    }

    if (!currentContainer || typeof currentContainer.appendChild !== 'function') {
      ogLogger.error('com:datatable', 'Container invalido - debe ser un elemento DOM', currentContainer);
      return;
    }

    const tableId = `datatable-${++ogDatatableCore.counter}`;
    const extensionName = currentConfig.extensionName || ogDatatableCore.detectPluginName(currentContainer);
    const data = await ogDatatableSource.loadData(currentConfig, extensionName);

    ogDatatableCore.tables.set(tableId, { config: currentConfig, data, extensionName, container: currentContainer });

    const html = ogDatatableRender.generateHtml(tableId, currentConfig, data);
    currentContainer.innerHTML = html;

    ogDatatableEvents.bindEvents(tableId);

    // Feature: columnas fijas
    if (typeof ogDatatableFixedCols !== 'undefined' && currentConfig.fixedColumns) {
      ogDatatableFixedCols.apply(tableId, currentConfig, currentContainer);
    }

    // Feature: resize de columnas
    if (typeof ogDatatableResizeCols !== 'undefined' && currentConfig.resizableColumns) {
      ogDatatableResizeCols.apply(tableId, currentConfig, currentContainer);
    }
  }
}

// Exponer globalmente
window.ogDatatable = ogDatatable;

// Registrar en ogFramework
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.components.datatable = ogDatatable;
}