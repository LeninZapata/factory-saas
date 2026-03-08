# Frontend — DataTable

> datatableCore, datatableSource, datatableColumns, datatableRender, datatableEvents, dataTable, datatableFixedCols, datatableResizeCols.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/components/datatableCore.js`

```
FILE: framework/js/components/datatableCore.js
CLASS: ogDatatableCore
TYPE: component-internal
PROMPT: fe-components

ROLE:
  Estado compartido y utilidades base del sistema datatable.
  Mantiene el Map de tablas activas, el contador de IDs, y el registro
  de formatters custom. Sub-módulo de ogDatatable — no se usa directamente.

ESTADO:
  tables          → Map<tableId, { config, data, extensionName, container }>
  counter         → entero autoincrementado para IDs únicos (datatable-1, datatable-2...)
  customFormatters → Map<name, fn> de formatters registrados por extensiones

DETECCIÓN DE EXTENSIÓN (detectPluginName):
  Busca en orden: data-extension en ancestro → data-view en .view-container
  → view.currentPlugin → clase CSS 'extension-{name}' en el container.

FORMATTERS CUSTOM (registerFormatter / unregisterFormatter):
  Permiten a extensiones registrar funciones de formato para columnas:
  ogDatatable.registerFormatter('estado', (val, row) => `<span class="${val}">${val}</span>`)
  Usados en column.format: 'estado' dentro del JSON de vista.

ACCESO POR ROL (hasRoleAccess):
  Si action.role está definido, compara con ogAuth.user.role.
  Admin siempre tiene acceso. Null/undefined role → acceso libre.

REGISTRO:
  window.ogDatatableCore
  ogFramework.components.datatableCore
```

### `framework/js/components/datatableSource.js`

```
FILE: framework/js/components/datatableSource.js
CLASS: ogDatatableSource
TYPE: component-internal
PROMPT: fe-components

ROLE:
  Carga y normalización de datos para el datatable. Soporta múltiples
  formatos de source y mantiene una caché propia por source URL.
  Sub-módulo de ogDatatable — no se usa directamente.

FORMATOS DE SOURCE:
  'api/users'                  → GET relativo via ogApi
  'https://...'                → fetch externo directo
  '/ruta/absoluta.json'        → relativo a baseUrl
  'extensions/admin/mock.json' → ruta desde baseUrl
  'admin|mock/users.json'      → notación extensión con pipe
  'js/views/mock/data.json'    → ruta framework

NORMALIZACIÓN (normalizeData):
  Acepta respuestas del backend en cualquier formato:
  { success, data: [] }  →  extrae data
  { data: [] }           →  extrae data
  []                     →  usa directamente
  Siempre retorna un array plano.

CACHÉ:
  getCached(source)               → retorna datos cacheados por source
  findInCache(source, id, field)  → busca un ítem por ID en cache (para modales de edición)
  filterInCache(source, fn)       → filtra items en cache (para búsquedas locales)
  clearCache(source)              → invalida cache de un source específico

REGISTRO:
  window.ogDatatableSource
  ogFramework.components.datatableSource
```

### `framework/js/components/datatableColumns.js`

```
FILE: framework/js/components/datatableColumns.js
CLASS: ogDatatableColumns
TYPE: component-internal
PROMPT: fe-components

ROLE:
  Procesamiento y renderizado de columnas y celdas.
  Traduce labels, aplica formatos de valor y genera el HTML de cada celda.
  Sub-módulo de ogDatatable — no se usa directamente.

PROCESAMIENTO (processColumns):
  Normaliza cada columna: traduce label, aplica defaults (sortable, visible, width).
  Retorna array de columnas listas para renderizar.

FORMATOS DE CELDA (formatValue):
  date        → DD/MM/YYYY
  datetime    → DD/MM/YYYY HH:mm
  money       → número con separador de miles y 2 decimales
  boolean     → ✅ / ❌
  badge       → <span class="og-badge og-badge-{value}">{value}</span>
  custom      → usa formatter registrado via ogDatatable.registerFormatter()
  {template}  → replaceVars() reemplaza {field} con valores del row

RENDERIZADO DE CELDA (renderCell):
  Aplica format, custom formatter y también soporta column.render
  como función inline definida en el JSON de vista.

REGISTRO:
  window.ogDatatableColumns
  ogFramework.components.datatableColumns
```

### `framework/js/components/datatableRender.js`

```
FILE: framework/js/components/datatableRender.js
CLASS: ogDatatableRender
TYPE: component-internal
PROMPT: fe-components

ROLE:
  Generación del HTML completo de la tabla: skeleton de carga, estructura
  de tabla, filas y botones de acción. Sub-módulo de ogDatatable.

SKELETON (generateSkeleton):
  Genera un placeholder visual inmediato antes de que lleguen los datos,
  evitando que el contenedor quede vacío durante el fetch.

ESTRUCTURA HTML (generateHtml):
  #tableId.og-datatable-container
    .og-table-toolbar      (si config.searchable o config.toolbar)
    .og-table-responsive
      table.og-table
        thead > tr > th    (por cada columna visible)
        tbody > tr         (por cada fila de datos)
    .og-table-footer       (info de resultados + paginación)

ACCIONES (renderActions):
  Por cada action en config.actions[] genera un botón si el usuario
  tiene rol de acceso. Soporta data-action para ogAction.handle().
  replaceVars(str, row) sustituye {id}, {nombre}, etc. en los strings de acción.

REGISTRO:
  window.ogDatatableRender
  ogFramework.components.datatableRender
```

### `framework/js/components/datatableEvents.js`

```
FILE: framework/js/components/datatableEvents.js
CLASS: ogDatatableEvents
TYPE: component-internal
PROMPT: fe-components

ROLE:
  Binding de eventos interactivos del datatable: búsqueda, ordenamiento,
  paginación, acciones de fila y detección de overflow horizontal.
  Sub-módulo de ogDatatable — llamado automáticamente tras render.

EVENTOS QUE GESTIONA:
  search input    → filtra filas visibles por texto en todas las columnas
  th click        → ordena columna (toggle asc/desc)
  pagination      → navega entre páginas (si config.pageSize)
  action buttons  → delega a ogAction.handle(action, { id, row })
  window scroll   → checkTableOverflow() para mostrar sombras laterales

REFRESH:
  refresh(tableId)    → recarga datos del source y re-renderiza la tabla
  refreshFirst()      → refresca la primera tabla activa (shortcut)
  Útil después de crear/editar/eliminar un registro desde un modal.

REGISTRO:
  window.ogDatatableEvents
  ogFramework.components.datatableEvents
```

### `framework/js/components/dataTable.js`

```
FILE: framework/js/components/dataTable.js
CLASS: ogDatatable
TYPE: component
PROMPT: fe-components

ROLE:
  Fachada principal del datatable. Orquesta la secuencia completa de render
  y re-expone todos los métodos de los sub-módulos bajo una sola clase.
  Es el único punto de entrada para renderizar tablas desde vistas y formularios.

FLUJO render(config, container):
  1. Normalizar alias (list / FlatList → datatable)
  2. Generar tableId incremental
  3. Detectar extensionName del container
  4. generateSkeleton() → insertar placeholder inmediato
  5. loadData(config, extensionName) → fetch o cache
  6. generateHtml(tableId, config, data) → insertar tabla
  7. bindEvents(tableId) → search, sort, pagination, acciones
  8. fixedColumns: ogDatatableFixedCols.apply() si corresponde
  9. resizableColumns: ogDatatableResizeCols.apply() si corresponde

CONFIG MÍNIMA:
  {
    type: 'datatable',
    source: 'admin|mock/users.json',
    columns: [ { field: 'name', label: 'Nombre' } ],
    actions: [ { label: 'Editar', action: 'modal:admin|forms/user-form?id={id}' } ]
  }

CONFIG COMPLETA (opcional):
  pageSize, searchable, sortable, fixedColumns, fixedColumnsRight,
  resizableColumns, cacheTTL, extensionName, toolbar

TYPE ALIASES:
  'list' | 'FlatList' | 'flatlist' → 'datatable' (compatibilidad React Native)

REGISTRO:
  window.ogDatatable
  ogFramework.components.datatable
```

### `framework/js/components/datatableFixedCols.js`

```
FILE: framework/js/components/datatableFixedCols.js
CLASS: ogDatatableFixedCols
TYPE: component-feature
PROMPT: fe-components

ROLE:
  Feature opcional de columnas fijas durante el scroll horizontal.
  Se activa automáticamente si config.fixedColumns o config.fixedColumnsRight
  están definidos en el JSON de vista del datatable.

IMPLEMENTACIÓN:
  Usa transform: translateX() sincronizado con el evento 'scroll' del wrapper,
  en lugar de position:sticky, para mayor compatibilidad con tablas complejas.

CONFIG:
  fixedColumns: 1        → congela N columnas desde la izquierda
  fixedColumnsRight: 1   → congela N columnas desde la derecha (acciones)

CASOS ESPECIALES:
  Si el header tiene ancho 0 (tabla en tab oculta), usa _retryWhenVisible()
  con MutationObserver para aplicar el fix cuando la tab se active.
  En refresh del datatable limpia el scroll listener anterior antes de reasignar.

REGISTRO:
  window.ogDatatableFixedCols
  ogFramework.components.datatableFixedCols
```

### `framework/js/components/datatableResizeCols.js`

```
FILE: framework/js/components/datatableResizeCols.js
CLASS: ogDatatableResizeCols
TYPE: component-feature
PROMPT: fe-components

ROLE:
  Feature opcional de columnas redimensionables por el usuario.
  Se activa automáticamente si config.resizableColumns: true en el JSON de vista.
  Inserta un handle .og-resize-handle en cada th y gestiona el drag.

IMPLEMENTACIÓN:
  mousedown en handle → _startDrag() → mousemove → actualiza th.style.width
  → mouseup → limpia listeners. Limita el ancho mínimo a 40px.

REGISTRO:
  window.ogDatatableResizeCols
  ogFramework.components.datatableResizeCols
```
