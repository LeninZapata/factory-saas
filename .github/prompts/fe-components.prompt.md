# Frontend — Componentes UI

> modal, toast, tabs, grouper, widget, langSelector, textareaExpander.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/components/modal.js`

```
FILE: framework/js/components/modal.js
CLASS: ogModal
TYPE: component
PROMPT: fe-components

ROLE:
  Sistema de modales apilables con efectos de entrada/salida animados y
  modo panel anclado a los bordes. Carga vistas JSON o HTML arbitrario
  dentro del modal y gestiona su ciclo de vida (open → load → close).

API:
  ogModal.open(resource, options?)      → { modalId, loadPromise }
  ogModal.openWithData(resource, opts?) → abre modal y llena form con datos
  ogModal.close(modalId, effect?)       → cierra modal específico
  ogModal.closeAll()                    → cierra todos los modales abiertos
  ogModal.getLastModalId()              → ID del modal más reciente
  ogModal.updateTitle(modalId, title, extra?, before?, after?)

OPTIONS:
  title, width, maxWidth                    width/maxWidth default: 80% / 900px
  effect           → 'slide-up'(default) | 'fade-scale' | 'slide-right'
  closeOnOverlay   → bool (default: true)
  closeOnEsc       → bool (default: true)
  showFooter       → bool (default: true)
  footer           → HTML string — reemplaza footer completo
  footerLeft       → HTML string — botones lado izquierdo del footer
  footerRight      → HTML string — botones lado derecho del footer
  beforeTitle      → HTML a la izquierda del título en el header (icono, indicador)
  afterTitle       → HTML a la derecha del título en el header (badge, estado)
  headerExtra      → texto/HTML bajo el título (sub-línea: estado, metadatos)
  html             → true — resource es HTML directo, omite carga de archivo
  afterRender(modalId, el) → callback post-render

PANEL OPTIONS (activa modo panel anclado al borde):
  panel            → 'right'(default) | 'left' | 'top' | 'bottom'
  panelSize        → ancho del panel: 'sm'(300px) | 'md'(440px, default) | 'lg'(640px) | 'full'
                     o porcentaje:    'w90' | 'w80' | 'w70' | 'w50'
  panelSpan        → CSS value — en laterales (right/left) controla el ALTO y centra verticalmente
                                — en horizontales (top/bottom) controla el ANCHO y centra horizontalmente
                     ej: '80%', '400px'

APILADO:
  Cada modal tiene z-index incremental.

REGISTRO:
  window.ogModal
  ogFramework.components.modal
```

### `framework/js/components/toast.js`

```
FILE: framework/js/components/toast.js
CLASS: ogToast
TYPE: component
PROMPT: fe-components

ROLE:
  Notificaciones no bloqueantes con cola, posición configurable y auto-dismiss.
  Máximo 5 toasts visibles simultáneamente (maxVisible). Los excedentes
  se encolan y aparecen al cerrarse los anteriores.
  Traduce automáticamente keys i18n si el mensaje empieza con 'i18n:'.

API:
  ogToast.show(message, options?)    → genérico
  ogToast.success(message, options?) → verde ✅
  ogToast.error(message, options?)   → rojo ❌
  ogToast.info(message, options?)    → azul ℹ️
  ogToast.warning(message, options?) → naranja ⚠️

   OPTIONS:
    duration    → ms hasta auto-dismiss (default: 3000, 0 = permanente)
    position    → 'top-right'(default) | 'top-left' | 'top-center'
                  'bottom-right' | 'bottom-left' | 'bottom-center'
    closable    → mostrar botón × (default: true)
  type        → 'success' | 'error' | 'info' | 'warning'

USO TÍPICO:
  ogToast.success('Usuario guardado correctamente');
  ogToast.error('i18n:errors.required_field');
  ogToast.show('Procesando...', { duration: 0 });  // permanente hasta acción

REGISTRO:
  window.ogToast
  ogFramework.components.toast
```

### `framework/js/components/tabs.js`

```
FILE: framework/js/components/tabs.js
CLASS: ogTabs
TYPE: component
PROMPT: fe-components

ROLE:
  Sistema de pestañas para vistas JSON. Renderiza el header de tabs y carga
  el contenido de cada una bajo demanda con caché por tab.
  Soporta overflow horizontal con degradado y scroll.

TIPOS DE CONTENIDO POR TAB:
  html, component, form, section, code, json_part

JSON_PART EN TAB:
  { "type": "json_part", "src": "ejemplos|parts/modal/basico" }
  Permite dividir tabs pesadas en archivos externos y cargarlos bajo demanda.

CACHE POR TAB:
  Cada tab se renderiza una sola vez y se cachea en memoria.
  preloadAllTabs: true → carga todas las tabs en background al init.

SCRIPTS/STYLES POR TAB:
  scripts[] y styles[] a nivel de tab se cargan via ogLoader la primera vez que se activa.
  scripts[] a nivel raíz (fuera de tabs) se cargan al inicializar el componente.

CALLBACKS:
  onLoad(tabIndex, tabEl)        → llamado cada vez que se activa una tab
  executePendingCallbacks()      → ejecuta callbacks que esperaban scripts

REGISTRO:
  window.ogTabs
  ogFramework.components.tabs
```

### `framework/js/components/grouper.js`

```
FILE: framework/js/components/grouper.js
CLASS: ogGrouper
TYPE: component
PROMPT: fe-components

ROLE:
  Contenedor visual que agrupa campos de formulario en dos modos:
  acordeón colapsable (linear) o pestañas horizontales (tabs).
  Se declara dentro de fields[] de un formulario, NO como componente de vista.

MODOS:
  linear → acordeón: header clicable y body colapsable. Solo un grupo abierto a la vez.
  tabs   → pestañas horizontales con contenido por tab y soporte de overflow.

CONFIG EN FORMULARIO (dentro de fields[]):
  {
    "type": "grouper",
    "mode": "linear",          // 'linear'(default) | 'tabs'
    "collapsible": true,       // solo linear — permite colapsar (default: true)
    "openFirst": true,         // solo linear — abre primer grupo (default: true)
    "activeIndex": 0,          // solo tabs   — tab activo inicial (default: 0)
    "groups": [
      {
        "title": "👤 Información Personal",
        "fields": [
          { "name": "nombre", "type": "text" },
          { "type": "group", "columns": 2, "fields": [...] }  // columnas dentro del grupo
        ]
      }
    ]
  }

ANIDACIÓN:
  Se puede anidar un grouper dentro de otro (máximo 2-3 niveles).
  Combinaciones válidas: tabs→linear, tabs→tabs, linear→tabs, linear→linear.

CONDICIONES:
  El grouper acepta condition/conditionLogic/conditionContext igual que cualquier campo.
  Permite mostrar/ocultar grupos enteros según valores de otros campos.
  Con conditionContext:'repeatable' funciona dentro de repetibles.

USO:
  await ogGrouper.render(config, containerEl);

REGISTRO:
  window.ogGrouper
  ogFramework.components.grouper
```

### `framework/js/components/widget.js`

```
FILE: framework/js/components/widget.js
CLASS: ogWidget
TYPE: component
PROMPT: fe-components

ROLE:
  Grid de widgets con drag & drop. Cada widget carga un tipo de contenido
  (html, form, view o component anidado) dentro de una celda del grid.

CONFIG (nivel componente):
  {
    "type": "component",
    "component": "widget",
    "config": {
      "columns": 2,          // número de columnas del grid (1-4+)
      "gap": "16px",         // separación entre widgets (opcional)
      "draggable": true,     // drag & drop con ⋮⋮ (default: true)
      "widgets": [ ... ]
    }
  }

WIDGET ITEM (campos del objeto en widgets[]):
  {
    "title": "Nombre del widget",
    "order": 1,              // posición en el grid
    "html":  "<div>...</div>",                        // contenido HTML directo
    "form":  "extension|forms/mi-form",               // carga un formulario JSON
    "view":  "extension|sections/mi-vista",           // carga una vista JSON
    "component": "datatable", "config": { ... }       // anida un componente
  }
  Solo uno de html / form / view / component por widget item.

DESBORDAMIENTO:
  Si hay más widgets que columnas, el excedente crea nuevas filas automáticamente.

REGISTRO:
  window.ogWidget
  ogFramework.components.widget
```

### `framework/js/components/langSelector.js`

```
FILE: framework/js/components/langSelector.js
CLASS: ogLangSelector
TYPE: component
PROMPT: fe-components

ROLE:
  Selector de idioma. Se inserta en .header (zona del header del layout)
  y crea un <select> con los idiomas disponibles de ogI18n.getAvailableLangs().
  Al cambiar llama ogI18n.setLang() que recarga la página si refreshOnChange:true.

INICIALIZACIÓN:
  ogLangSelector.init()   → crea e inserta el select en .og-header
  Auto-selecciona el idioma activo desde ogI18n.getLang().

INTEGRACIÓN TÍPICA:
  Se carga como parte de la extensión o desde ogTrigger.register('sidebar', ...)
  para insertarse después de que ogSidebar renderice el header.

REGISTRO:
  window.ogLangSelector
  ogFramework.components.langSelector
```

### `framework/js/components/textareaExpander.js`

```
FILE: framework/js/components/textareaExpander.js
CLASS: ogTextareaExpander
TYPE: component
PROMPT: fe-components

ROLE:
  Expande textareas en un modal de edición ampliada. Se auto-inicializa
  via MutationObserver al detectar nuevos elementos .textarea-expandable
  en el DOM. Útil para campos de texto largo en formularios densos.

ACTIVACIÓN:
  Agregar clase 'textarea-expandable' al textarea en el JSON de formulario:
  { "type": "textarea", "name": "descripcion", "class": "textarea-expandable" }
  El componente envuelve el textarea en .textarea-wrapper y agrega un botón
  .textarea-expand-btn de forma automática.

MODAL EXPANDIDO:
  Al hacer click en el botón, abre un modal de pantalla completa con
  una copia del textarea. Al cerrar sincroniza el contenido de vuelta
  al textarea original. Ctrl+Enter guarda y cierra el modal.

AUTO-INIT:
  MutationObserver detecta nuevos .textarea-expandable añadidos por
  ogForm.load() o cualquier render dinámico sin necesidad de llamada manual.

REGISTRO:
  window.ogTextareaExpander
  ogFramework.components.textareaExpander
```


---

### GROUPER — Referencia JSON para formularios

**Modo linear (acordeón):**
```json
{
  "type":        "grouper",
  "name":        "config_basica",
  "mode":        "linear",
  "collapsible": true,
  "openFirst":   true,
  "condition":   [{ "field": "activo", "operator": "==", "value": true }],
  "groups": [
    {
      "title": "👤 Información Personal",
      "fields": [
        { "name": "nombre", "type": "text" },
        { "type": "group", "columns": 2, "fields": [...] }
      ]
    }
  ]
}
```

**Modo tabs:**
```json
{ "type": "grouper", "mode": "tabs", "activeIndex": 0,
  "groups": [
    { "title": "⚙️ General",   "fields": [...] },
    { "title": "🔒 Seguridad", "fields": [...] }
  ]
}
```

**Propiedades del grouper:**
| Propiedad          | Modo   | Default    | Descripción |
|--------------------|--------|------------|-------------|
| `mode`             | ambos  | `"linear"` | `"linear"` (acordeón) o `"tabs"` |
| `name`             | ambos  | —          | Opcional. Para condiciones u otros fines |
| `collapsible`      | linear | `true`     | `false` = grupos siempre visibles |
| `openFirst`        | linear | `true`     | Primer grupo abierto por defecto |
| `activeIndex`      | tabs   | `0`        | Tab activa al renderizar |
| `condition`        | ambos  | —          | Muestra/oculta el grouper completo |
| `conditionContext` | ambos  | `"form"`   | `"repeatable"` si está en un repeatable |

**Anidamiento** (tabs→linear, tabs→tabs, linear→linear — máx 2-3 niveles):
```json
{ "type": "grouper", "mode": "tabs", "groups": [
    { "title": "Perfil", "fields": [
        { "type": "grouper", "mode": "linear", "collapsible": false, "groups": [...] }
    ]}
]}
```

**Grouper con repeatable dentro:**
```json
{ "type": "grouper", "mode": "linear", "groups": [
    { "title": "👥 Equipo", "fields": [
        { "name": "miembros", "type": "repeatable", "buttonPosition": "top",
          "fields": [{ "name": "nombre", "type": "text" }] }
    ]}
]}
```

**Grouper dentro de repeatable (con condición):**
```json
{ "name": "productos", "type": "repeatable", "fields": [
    { "name": "tipo", "type": "select", "options": [...] },
    { "type": "grouper", "name": "config_fisico", "mode": "linear",
      "condition": [{ "field": "tipo", "operator": "==", "value": "fisico" }],
      "conditionContext": "repeatable",
      "groups": [{ "title": "📦 Envío", "fields": [...] }]
    }
]}
```