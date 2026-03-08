# Frontend — Extensions (JSON index)

> Archivos index.json de extensiones con _comments: mapa de vistas, partes, mocks y ejemplos.
> Generado: 2026-03-08 14:28:20

---

### `admin/D:\laragon\www\factory-saasbackend..adminappextensionsejemplosindex.json`

```
Acerca de: Extensión de ejemplos del framework. Contiene demos funcionales de todos los componentes, utilidades y características avanzadas.
Ejemplos por componente:
  ogModal: sections/modal-demo → parts/modal/basico, medio, avanzado-paneles, avanzado-opciones, mixed
  ogTabs: sections/tabs-demo → parts/tabs/tabs-anidados, grouper-con-formularios, tabs-precarga-total, grouper-vs-tabs, onload-demo, load-scripts-demo
  ogWidget: sections/widgets-demo → parts/widgets/columns, modal, views
  ogToast: sections/toast-demo
  ogDatatable: sections/users-datatable
  ogGrouper: sections/grouper-demo
Ejemplos por utilidad:
  grids_y_layouts: sections/utils-grids → parts/grids/columnas, gaps, flexbox, cheatsheet
  alertas: sections/utils-alerts
  botones: sections/utils-buttons
Ejemplos por feature:
  formularios: sections/formularios/main → forms/formularios/* (inputs, required, grouped, repeatable, conditions...)
  conditions: forms/formularios/conditions-simple, conditions-multiple, conditions-groups, conditions-advanced, conditions-repeatable
  repeatables: forms/formularios/form-repetibles-demo, form-repetibles-anidados, form-repeatable-accordion
  grouper_en_forms: forms/form-grouper-linear, form-grouper-tabs, form-grouper-condicionales
  json_parts: sections/caracteristicas-json-parts → parts/json-parts-demo/parte-1, parte-2
  hooks: sections/hooks-caso1, hooks-caso2 — ver también hooks.js
  scripts_demanda: sections/script-bajo-demanda
  react_native: sections/react-native/main → forms/react-native/*
Estructura de parts:
  parts/modal/: basico · medio · avanzado-paneles · avanzado-opciones · mixed
  parts/tabs/: tabs-anidados · grouper-con-formularios · tabs-precarga-total · grouper-vs-tabs · onload-demo · load-scripts-demo
  parts/widgets/: columns · modal · views
  parts/grids/: columnas · gaps · flexbox · cheatsheet
  parts/formularios/: form-parts-demo-a · form-parts-demo-b
  parts/table/: columnas · filas · fundamentos
  parts/json-parts-demo/: parte-1 · parte-2
  Acerca de: Los archivos grandes de sections/ se dividen en parts/ para mantenerlos livianos. Cada tab carga su part via json_part.
Mock data:
  users-mock.json: lista de usuarios para datatable
  products-wide.json: tabla con muchas columnas (fixed cols, resize)
  format-demo.json: distintos formatos de celda (date, money, badge...)
  repetibles-simple-mock.json: un nivel de repetibles
  repetibles-2-niveles-mock.json: repetibles anidados 2 niveles
  repetibles-3-niveles-mock.json: repetibles anidados 3 niveles
  Acerca de: Datos de prueba en mock/ para simular respuestas de API sin backend.
Cómo usar estos ejemplos:
  en_chat: Pide el archivo específico: 'ejemplos|parts/modal/avanzado-paneles' o 'ejemplos|sections/tabs-demo'
  en_copilot: Usa #file: con la ruta relativa del json que necesites ver como referencia
  nota: Todos los ejemplos son funcionales y reflejan el uso real del framework
```
