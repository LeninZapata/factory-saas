# Frontend — Form System

> formCore, formInputs, formRender, formRepeatables, formData, formValidation, form.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/core/formCore.js`

```
FILE: framework/js/core/formCore.js
CLASS: ogFormCore
TYPE: core-form
PROMPT: fe-form

ROLE:
  Núcleo del sistema de formularios. Gestiona el ciclo de vida completo:
  fetch del JSON → resolución de json_parts → render HTML → fill de datos
  → init de repeatables → init de conditions → bind de eventos.
  Los demás módulos de form (Inputs, Render, etc.) son invocados desde aquí.

FLUJO load(formName, container?, data?, isCore?, afterRender?):
  1. Resolver URL según notación (ext|path, core:, middle:, ext/path)
  2. ogCache.get(cacheKey) o fetch JSON
  3. resolveFieldParts() → reemplaza { type:'json_part', src } con fields externos
  4. ogFormRender.render(schema) → genera HTML y lo inserta en container
  5. ogFormData.fill(formId, data) si se pasó data
  6. ogFormData.applyDefaultValues(formId)
  7. ogFormData.bindTransforms(formId)
  8. ogFormRepeatables.initRepeatables(formId)
  9. ogConditions.init(formId) si el schema tiene conditions
  10. afterRender(formId) callback opcional

NOTACIONES DE formName:
  'admin|forms/user-form'        → extensión explícita con pipe
  'middle:auth/forms/login-form' → middle
  'core:user/user-form'          → vistas del framework
  'admin/user-form'              → extensión implícita por primera parte

JSON PARTS (resolveFieldParts):
  Permite fragmentar schemas grandes. Un field con type:'json_part' y src:'parts/roles'
  se reemplaza por los fields del JSON externo antes de renderizar.

TYPE ALIASES (typeAliases):
  Mapea tipos React Native / genéricos a tipos web:
  Switch→checkbox, Picker→select, TextInput→text, FlatList→repeatable

TRANSFORMS (aplicados en tiempo real sobre inputs):
  lowercase, uppercase, trim, alphanumeric, numeric, decimal, slug
  Se activan via field.transform o automáticamente por reglas de validación.

REGISTRO:
  window.ogFormCore
  ogFramework.core.formCore
```

### `framework/js/core/formInputs.js`

```
FILE: framework/js/core/formInputs.js
CLASS: ogFormInputs
TYPE: core-form
PROMPT: fe-form

ROLE:
  Generación de HTML para cada tipo de campo individual. Llamado por
  ogFormRender.renderFields() para cada field del schema.
  Incluye carga async de selects desde API y lógica de estilos/props.

TIPOS DE CAMPO SOPORTADOS:
  text, number, email, password, date, datetime-local, time, color, range
  textarea    → con soporte de filas configurables
  select      → con carga desde API (source) o valores estáticos (options)
  checkbox    → con label inline
  button-group → grupo de botones radio-like
  radio       → radio buttons con options[]
  button      → botón de acción con data-action

CARGA DE SELECT DESDE API (loadSelectFromAPI):
  Se dispara automáticamente post-render cuando field.source está definido.
  Soporta source como URL string o config { url, valueField, labelField }.
  Usa ogApi.get() + ogCache para no repetir la llamada.

ATRIBUTOS GENERADOS:
  getValidationAttributes(field) → required, min, max, minlength, maxlength, pattern
  getTransformClasses(field)     → clases CSS og-transform-* para transforms en tiempo real
  buildStyleAttr(styleConfig)    → convierte objeto style a string inline via ogStyle
  buildPropsAttr(props)          → convierte props adicionales a atributos HTML

ACCESIBILIDAD DE ROLES:
  hasRoleAccess(field) → si field.role está definido, compara con ogAuth.user.role
  Si el usuario no tiene acceso: field.readOnly = true (no se oculta, se deshabilita)

REGISTRO:
  window.ogFormInputs
  ogFramework.core.formInputs
```

### `framework/js/core/formRender.js`

```
FILE: framework/js/core/formRender.js
CLASS: ogFormRender
TYPE: core-form
PROMPT: fe-form

ROLE:
  Generación del HTML estructural del formulario completo. Orquesta toolbar,
  fields, statusbar y agrupaciones (group, grouper). Delega cada campo
  individual a ogFormInputs.renderField().

ESTRUCTURA HTML GENERADA:
  .og-form-container
    h2 (si schema.title)
    p.og-form-desc (si schema.description)
    form#id[data-form-id][data-real-id]
      .og-form-toolbar    (si schema.toolbar)
      [fields renderizados]
      .og-form-statusbar  (si schema.statusbar)

TIPOS DE AGRUPACIÓN:
  group    → fieldset con legend, fields en grid según columns
  grouper  → sección agrupadora con modos:
             linear → acordeón colapsable con header y body
             tabs   → pestañas horizontales con contenido por tab

TOOLBAR Y STATUSBAR:
  Dividen los items en left/right por field.align.
  Se renderizan con renderFields() — pueden contener cualquier tipo de campo.

REPEATABLE (renderRepeatable):
  Genera el contenedor .og-repeatable con template oculto y botón agregar.
  ogFormRepeatables.initRepeatables() lo activa post-render.

REGISTRO:
  window.ogFormRender
  ogFramework.core.formRender
```

### `framework/js/core/formRepeatables.js`

```
FILE: framework/js/core/formRepeatables.js
CLASS: ogFormRepeatables
TYPE: core-form
PROMPT: fe-form

ROLE:
  Manejo de campos repetibles (listas dinámicas de items con mismo schema).
  Inicializa los contenedores, gestiona agregar/eliminar items,
  drag & drop para reordenar y re-indexación de paths.

FLUJO INIT (initRepeatables):
  1. Busca todos los fields type:'repeatable' en el schema (incluyendo anidados en groups/groupers)
  2. Por cada uno: initRepeatableContainer() → clona template → bindRepeatableEvents()
  3. Si field.minItems: pre-popula con items vacíos hasta el mínimo

AGREGAR ITEM (addRepeatableItem):
  Clona el template oculto (.og-repeatable-template), reemplaza [INDEX]
  por el índice correcto en todos los name/id/data-path, inserta en el DOM
  e inicializa conditions y selects del nuevo item.

DRAG & DROP (setupDragAndDrop):
  Usa HTML5 Drag API. Reordena items visualmente y llama
  reindexRepeatableItems() para actualizar todos los atributos name[N].

PATH NOTATION:
  Los campos dentro de un repeatable usan notación array en sus names:
  items[0].nombre, items[1].nombre, items[0].subitems[0].valor
  ogFormData.getData() los convierte a objetos JS anidados.

REGISTRO:
  window.ogFormRepeatables
  ogFramework.core.formRepeatables
```

### `framework/js/core/formData.js`

```
FILE: framework/js/core/formData.js
CLASS: ogFormData
TYPE: core-form
PROMPT: fe-form

ROLE:
  Lectura, escritura y transformaciones de datos en el formulario.
  getData() extrae los valores como objeto JS. fill() los inyecta de vuelta.
  Maneja rutas anidadas, arrays (repeatables), checkboxes y valores por defecto.

LECTURA (getData):
  Usa FormData nativo para recoger todos los inputs.
  setNestedValue() convierte paths como 'items[0].nombre' a objetos anidados:
  { items: [ { nombre: 'Juan' } ] }

ESCRITURA (fill):
  fill(formId, data, container?, skipRepeatables?)
  Recorre el schema y por cada field busca el input por data-path y setInputValue().
  Si el field es repeatable: fillRepeatable() crea y llena los items dinámicamente.
  pauseEvaluations() durante el fill para no disparar condiciones en cascada.

VALORES POR DEFECTO (applyDefaultValues):
  Soporta: string literal, 'today' → fecha actual, 'now' → datetime actual,
  'timestamp' → unix timestamp, '{field:otroField}' → valor de otro campo.

TRANSFORMS (bindTransforms):
  Binds eventos 'input' en todos los campos con data-transform.
  Aplica la función de transform (lowercase, numeric, etc.) en tiempo real.

REGISTRO:
  window.ogFormData
  ogFramework.core.formData
```

### `framework/js/core/formValidation.js`

```
FILE: framework/js/core/formValidation.js
CLASS: ogFormValidation
TYPE: core-form
PROMPT: fe-form

ROLE:
  Validación del formulario antes del submit. Recorre todos los fields del
  schema, valida cada uno según sus reglas y muestra/oculta mensajes de error
  inline. Retorna true/false para que el handler decida si continuar.

USO:
  const isValid = ogFormValidation.validate('user-form');
  if (!isValid) return;

REGLAS SOPORTADAS (en field.validation[]):
  required          → no vacío
  email             → formato RFC
  url               → formato URL válido
  min:{n}           → valor numérico mínimo
  max:{n}           → valor numérico máximo
  minlength:{n}     → longitud mínima
  maxlength:{n}     → longitud máxima
  numeric           → solo números
  alpha_num         → alfanumérico
  regex:{pattern}   → expresión regular custom

ERRORES INLINE:
  showFieldError(formEl, fieldPath, msg)  → crea .og-field-error bajo el input
  hideFieldError(formEl, fieldPath)       → elimina el mensaje
  clearAllErrors(formId)                  → limpia todos los errores del form
  setError(formId, fieldName, msg)        → error programático post-submit (ej: desde API)

CAMPOS OCULTOS:
  Si el field está oculto por conditions (display:none), se salta su validación.

REGISTRO:
  window.ogFormValidation
  ogFramework.core.formValidation
```

### `framework/js/core/form.js`

```
FILE: framework/js/core/form.js
CLASS: ogForm
TYPE: core-form
PROMPT: fe-form

ROLE:
  Fachada única del sistema de formularios. Re-expone todos los métodos de
  ogFormCore, ogFormRender, ogFormInputs, ogFormRepeatables, ogFormData
  y ogFormValidation bajo una sola clase. El código externo solo necesita ogForm.

USO TÍPICO DESDE EXTENSIONES:
  const form = ogModule('form');
  await form.load('admin|forms/user-form', container, userData);
  const data = form.getData('user-form');
  const ok   = form.validate('user-form');
  form.setError('user-form', 'email', 'Email ya registrado');
  form.fill('user-form', { nombre: 'Juan' });

MÉTODOS DELEGADOS:
  load, bindEventsOnce, normalizeFieldType, clearSelectCache  → ogFormCore
  render, renderFields, renderToolbar, renderStatusbar        → ogFormRender
  renderField, loadSelectFromAPI                              → ogFormInputs
  initRepeatables, addRepeatableItem                          → ogFormRepeatables
  getData, fill, applyDefaultValues, bindTransforms           → ogFormData
  validate, setError, clearError, clearAllErrors              → ogFormValidation

REGISTRO:
  window.ogForm
  ogFramework.core.form
```


---

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
  "type": "group", "columns": 3, "gap": "normal",
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
- Sin `name` — solo layout, no genera datos
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