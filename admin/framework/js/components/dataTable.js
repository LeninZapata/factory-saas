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

    // Mostrar skeleton de inmediato para evitar que el contenedor quede en blanco
    currentContainer.innerHTML = ogDatatableRender.generateSkeleton(currentConfig);

    const data = await ogDatatableSource.loadData(currentConfig, extensionName);

    ogDatatableCore.tables.set(tableId, { config: currentConfig, data, extensionName, container: currentContainer });

    const html = ogDatatableRender.generateHtml(tableId, currentConfig, data);
    currentContainer.innerHTML = html;

    ogDatatableEvents.bindEvents(tableId);

    // Feature: columnas fijas
    if (typeof ogDatatableFixedCols !== 'undefined' && (currentConfig.fixedColumns || currentConfig.fixedColumnsRight)) {
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
/**
 * @doc-start
 * FILE: framework/js/components/dataTable.js
 * CLASS: ogDatatable
 * TYPE: component
 * PROMPT: fe-components
 *
 * ROLE:
 *   Fachada principal del datatable. Orquesta la secuencia completa de render
 *   y re-expone todos los métodos de los sub-módulos bajo una sola clase.
 *   Es el único punto de entrada para renderizar tablas desde vistas y formularios.
 *
 * FLUJO render(config, container):
 *   1. Normalizar alias (list / FlatList → datatable)
 *   2. Generar tableId incremental
 *   3. Detectar extensionName del container
 *   4. generateSkeleton() → insertar placeholder inmediato
 *   5. loadData(config, extensionName) → fetch o cache
 *   6. generateHtml(tableId, config, data) → insertar tabla
 *   7. bindEvents(tableId) → search, sort, pagination, acciones
 *   8. fixedColumns: ogDatatableFixedCols.apply() si corresponde
 *   9. resizableColumns: ogDatatableResizeCols.apply() si corresponde
 *
 * CONFIG MÍNIMA:
 *   {
 *     type: 'datatable',
 *     source: 'admin|mock/users.json',
 *     columns: [ { field: 'name', label: 'Nombre' } ],
 *     actions: [ { label: 'Editar', action: 'modal:admin|forms/user-form?id={id}' } ]
 *   }
 *
 * CONFIG COMPLETA (opcional):
 *   pageSize, searchable, sortable, fixedColumns, fixedColumnsRight,
 *   resizableColumns, cacheTTL, extensionName, toolbar
 *
 * TYPE ALIASES:
 *   'list' | 'FlatList' | 'flatlist' → 'datatable' (compatibilidad React Native)
 *
 * REGISTRO:
 *   window.ogDatatable
 *   ogFramework.components.datatable
 * @doc-end
 */