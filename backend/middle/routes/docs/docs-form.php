<?php
// middle/routes/docs-form.php
// Módulos de formularios: fe-form, fe-conditions, fe-components
// Retorna array $modulesForm para ser mergeado en docsFrontend()

function docsFormModules($adminPath) {

  $feFormExtra = <<<'FE_FORM_EXTRA_END'
### ESTRUCTURA JSON DE UN FORMULARIO

```json
{
  "id":          "mi-form",
  "title":       "Título del formulario",
  "description": "Texto descriptivo (visible bajo el título)",
  "fields": [...],
  "statusbar": [
    { "name": "submit", "type": "submit", "label": "Guardar",  "class": "btn-primary" },
    { "name": "cancel", "type": "button", "label": "Cancelar", "class": "btn-secondary",
      "onclick": "event.preventDefault(); ..." },
    { "name": "save",   "type": "button", "label": "Guardar",  "action": "submit",
      "onclick": "event.preventDefault(); const data = ogModule('form').getData(this.closest('form').id);" }
  ]
}
```

`statusbar`: barra inferior. `action: 'submit'` dispara submit programáticamente.
`onclick` acepta JS inline. `class`: `btn-primary`, `btn-secondary`, `btn-danger`, etc.

---

### TIPOS DE CAMPO — REFERENCIA COMPLETA

```json
{ "name": "titulo",   "type": "text",     "placeholder": "..." }
{ "name": "correo",   "type": "email",    "required": true }
{ "name": "clave",    "type": "password" }
{ "name": "tel",      "type": "tel",      "placeholder": "+593 99 999 9999" }
{ "name": "web",      "type": "url" }
{ "name": "bio",      "type": "textarea", "rows": 4 }
{ "name": "edad",     "type": "number",   "min": 0, "step": 1 }
{ "name": "precio",   "type": "number",   "min": 0, "step": 0.01 }
{ "name": "fecha",    "type": "date" }
{ "name": "hora",     "type": "time" }
{ "name": "dt",       "type": "datetime-local" }
{ "name": "color",    "type": "color",    "value": "#667eea" }
{ "name": "rango",    "type": "range",    "min": 0, "max": 100 }
{ "type": "separator","label": "Información de Pago" }
{ "type": "html",     "content": "<div class='alert alert-info'>...</div>" }
```

**Select:**
```json
{ "name": "pais", "type": "select", "defaultValue": "mx",
  "options": [{ "value": "mx", "label": "🇲🇽 México" }] }
```
Select múltiple: `"multiple": true`
Carga desde API: `"source": "/api/paises"` o `{ "url": "...", "valueField": "id", "labelField": "nombre" }`

**Checkbox y Radio:**
```json
{ "name": "acepta", "type": "checkbox", "checkboxLabel": "Acepto términos" }
{ "name": "activo", "type": "checkbox", "defaultValue": true }
{ "name": "opcion", "type": "radio",
  "options": [{ "value": "r1", "label": "Opción 1", "checked": true }] }
```
`checkboxLabel`: texto inline junto al checkbox (distinto de `label` que va arriba).

**button_group — radio buttons estilizados:**
```json
{ "name": "plan", "type": "button_group", "hint": "Elige tu plan", "size": "sm",
  "options": [
    { "value": "basic", "label": "Básico" },
    { "value": "pro",   "label": "Pro", "checked": true }
  ]
}
```

**button_set — opciones compactas (tallas):**
```json
{ "name": "talla", "type": "button_set", "hint": "Selecciona tu talla",
  "options": [{ "value": "s", "label": "S" }, { "value": "m", "label": "M", "checked": true }] }
```

---

### PROPIEDADES COMUNES DE CAMPO

| Propiedad      | Descripción |
|----------------|-------------|
| `required`     | Campo obligatorio |
| `readonly`     | Visible pero no editable |
| `maxlength`    | Longitud máxima |
| `step`         | Incremento para number |
| `rows`         | Filas visibles en textarea |
| `help`         | Texto de ayuda gris bajo el campo |
| `hint`         | Texto de ayuda para button_group/button_set |
| `focus: true`  | Autofocus al renderizar (útil en modales) |
| `defaultValue` | Valor inicial — soporta tokens especiales |
| `validation`   | Reglas: `"required|min:2|email"` |
| `transform`    | Transform: `"lowercase"`, `"numeric"`, etc. |
| `role`         | Si el usuario no tiene el rol → campo readonly |

---

### TOKENS DE defaultValue

```json
{ "defaultValue": "Juan"               }  // valor literal
{ "defaultValue": "{hash:10}"          }  // hash aleatorio de N caracteres
{ "defaultValue": "CODE-{hash:6}"      }  // texto + hash → CODE-abc123
{ "defaultValue": "{uuid}"             }  // UUID v4 completo
{ "defaultValue": "{timestamp}"        }  // milisegundos desde epoch
{ "defaultValue": "{date}"             }  // fecha actual YYYY-MM-DD
{ "defaultValue": "{time}"             }  // hora actual HH:MM:SS
{ "defaultValue": "{random:1:100}"     }  // número aleatorio en rango
{ "defaultValue": "REF-{date}-{hash:8}" }  // tokens combinables
```
En **repeatables**: cada item nuevo genera tokens frescos e independientes.
`"readonly": true` + token = campo ID generado no editable.

---

### GROUP — campos en columnas

```json
{
  "name": "group-location", "type": "group", "columns": 3, "gap": "normal",
  "label": "Encabezado opcional",
  "fields": [
    { "name": "ciudad", "type": "text" },
    { "name": "prov",   "type": "text" },
    { "name": "cp",     "type": "text" }
  ]
}
```
- `columns`: `2`, `3` o `4` — `cols` también aceptado
- `gap`: `"normal"` | `"large"`
- `name`: **obligatorio** — sin él las condiciones basadas en contexto no funcionan
- Usable dentro de `grouper.groups[].fields[]` y `repeatable.fields[]`

---

### JSON PARTS en formularios

```json
{
  "id": "form-grande",
  "fields": [
    { "type": "json_part", "src": "parts/formularios/seccion-a" },
    { "type": "json_part", "src": "parts/formularios/seccion-b" }
  ]
}
```
Cada part es `{ "fields": [...] }` — solo contiene fields.
`src` relativo (sin prefijo) o con notación ext: `"ejemplos|parts/formularios/demo-a"`
Permite dividir formularios grandes en secciones reutilizables.

---

### REPEATABLE — campos dinámicos repetibles

```json
{
  "name": "contactos", "type": "repeatable",
  "label": "Contactos",
  "description": "Texto descriptivo bajo el label",
  "addText": "➕ Agregar", "removeText": "🗑️ Eliminar",
  "buttonPosition": "top",
  "initialItems": 1,
  "fields": [...]
}
```
`buttonPosition`: `"top"` (defecto) | `"bottom"` | `"middle"`
`initialItems`: items pre-poblados al cargar el formulario

**Acordeón:**
```json
{
  "name": "tareas", "type": "repeatable",
  "accordion":          true,
  "accordionSingle":    true,
  "accordionOpenFirst": true,
  "accordionOpenAll":   false,
  "hasHeader":          true,
  "headerTitle":        "Tarea #{index}",
  "sortable":           true,
  "fields": [...]
}
```

| Propiedad              | Descripción |
|------------------------|-------------|
| `hasHeader: true`      | Header visual por item (siempre visible, sin acordeón) |
| `accordion: true`      | Header clickeable para colapsar/expandir |
| `accordionSingle: true` | Solo un item abierto a la vez |
| `accordionOpenFirst: true` | El primer item inicia abierto |
| `accordionOpenAll: true` | Todos los items inician abiertos |
| `headerTitle: "Item #{index}"` | Plantilla — `{index}` = número del item |
| `sortable: true`       | Drag & drop ⋮⋮ para reordenar |

**Anidamiento hasta 3 niveles:**
```json
{ "name": "proyectos", "type": "repeatable", "fields": [
    { "name": "tareas", "type": "repeatable", "fields": [
        { "name": "subtareas", "type": "repeatable", "fields": [...] }
    ]}
]}
```
Repeatables también pueden vivir dentro de `grouper.groups[].fields[]`.
FE_FORM_EXTRA_END;

  $feConditionsExtra = <<<'FE_CONDITIONS_EXTRA_END'
### CONDICIONES — REFERENCIA JSON

```json
{
  "name": "campo",
  "condition": [
    { "field": "tipo",   "operator": "==", "value": "empresa" },
    { "field": "activo", "operator": "==", "value": true }
  ],
  "conditionLogic":   "AND",
  "conditionContext": "form"
}
```

`condition`: array de reglas. `conditionLogic` omitido = AND implícito.

**conditionContext:**
| Valor          | Cuándo usarlo |
|----------------|---------------|
| `"form"`       | Default. Busca el campo fuente en todo el formulario |
| `"repeatable"` | Busca el campo fuente dentro del mismo item del repeatable |
| `"view"`       | Contexto de vista (fuera de formulario) |
| `"group"`      | Dentro de un group |

**Condition en grouper** (oculta/muestra el grouper completo):
```json
{ "type": "grouper", "condition": [...], "conditionContext": "form", "groups": [...] }
```

**Condition en repeatable** (oculta/muestra el repeatable completo):
```json
{ "name": "fases", "type": "repeatable",
  "condition": [{ "field": "tiene_fases", "operator": "==", "value": true }],
  "conditionContext": "repeatable",
  "fields": [...]
}
```

**Condiciones encadenadas** (campo_c depende de campo_b que depende de campo_a) — funcionan sin configuración extra.

**Operadores disponibles:**
```
==, !=             → igualdad / desigualdad
>, <, >=, <=       → comparación numérica
any                → valor está en lista CSV: "value": "ec,co,pe"
not-any            → valor NO está en lista CSV
empty              → vacío (null, '', [], undefined)
not-empty          → no vacío
contains           → string contiene valor
not-contains       → string no contiene
starts-with        → empieza con
ends-with          → termina con
```
FE_CONDITIONS_EXTRA_END;

  $feComponentsExtra = <<<'FE_COMPONENTS_EXTRA_END'
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
        { "name": "group-basic", "type": "group", "columns": 2, "fields": [...] }
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
FE_COMPONENTS_EXTRA_END;

  return [

    'fe-form' => [
      'title' => 'Frontend — Form System',
      'desc'  => 'formCore, formInputs, formRender, formRepeatables, formData, formValidation, form.',
      'files' => [
        $adminPath . '/framework/js/core/formCore.js',
        $adminPath . '/framework/js/core/formInputs.js',
        $adminPath . '/framework/js/core/formRender.js',
        $adminPath . '/framework/js/core/formRepeatables.js',
        $adminPath . '/framework/js/core/formData.js',
        $adminPath . '/framework/js/core/formValidation.js',
        $adminPath . '/framework/js/core/form.js',
      ],
      'extra' => $feFormExtra,
    ],

    'fe-conditions' => [
      'title' => 'Frontend — Conditions System',
      'desc'  => 'formConditionsCore, formConditionsOperators, formConditionsEvaluator, conditions.',
      'files' => [
        $adminPath . '/framework/js/core/formConditionsCore.js',
        $adminPath . '/framework/js/core/formConditionsOperators.js',
        $adminPath . '/framework/js/core/formConditionsEvaluator.js',
        $adminPath . '/framework/js/core/conditions.js',
      ],
      'extra' => $feConditionsExtra,
    ],

    'fe-components' => [
      'title' => 'Frontend — Componentes UI',
      'desc'  => 'modal, toast, tabs, grouper, widget, langSelector, textareaExpander.',
      'files' => [
        $adminPath . '/framework/js/components/modal.js',
        $adminPath . '/framework/js/components/toast.js',
        $adminPath . '/framework/js/components/tabs.js',
        $adminPath . '/framework/js/components/grouper.js',
        $adminPath . '/framework/js/components/widget.js',
        $adminPath . '/framework/js/components/langSelector.js',
        $adminPath . '/framework/js/components/textareaExpander.js',
      ],
      'extra' => $feComponentsExtra,
    ],

  ];
}