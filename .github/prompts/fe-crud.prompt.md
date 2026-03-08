# Frontend — Playbook CRUD & Extensiones

> Cómo crear un módulo CRUD en el frontend. Qué archivos crear, dónde van, cómo se conectan.
> Generado: 2026-03-08 14:28:20

---

## QUÉ ES UNA EXTENSIÓN

Un CRUD frontend vive dentro de una **extensión** en `app/extensions/{nombre}/`.
Si ya existe una extensión relacionada, el CRUD puede ir como submenu o tab dentro de ella.
Si es un módulo completamente nuevo, se crea una carpeta nueva.

```
app/extensions/{nombre}/
├── index.json               ← SIEMPRE — registro, menu, flags
├── hooks.js                 ← Solo si hay lógica de hooks
├── lang/
│   └── es.json              ← Textos y traducciones
├── views/
│   ├── sections/
│   │   └── {crud}-list.json ← Vista principal con datatable
│   ├── forms/
│   │   └── {crud}-form.json ← Formulario create/edit
│   └── parts/               ← Fragmentos para dividir views/forms grandes
│       └── {crud}/
│           └── parte-1.json
└── assets/
    ├── js/
    │   └── {Crud}.js        ← Clase JS del CRUD (static, estándar)
    └── css/
        └── {crud}.css       ← Estilos específicos (solo si los necesita)
```

---

## ÁRBOL DE DECISIÓN

```
¿Ya existe una extensión relacionada?
│
├── SÍ → Agregar el CRUD dentro de esa extensión
│         ¿Cómo integrarlo?
│         ├── Como submenu en index.json (ítem nuevo en menu.items[])
│         └── Como tab dentro de una vista existente (type: "tabs")
│
└── NO → Crear carpeta nueva en app/extensions/{nombre}/
          Crear index.json con hasMenu:true y el menu completo

¿La vista principal es simple (solo datatable + botones)?
├── SÍ → Un solo {crud}-list.json en sections/
└── NO → Usar type:"tabs" para dividir en pestañas
          Cada tab carga su sección via json_part o sections/ separadas

¿El form JSON es largo (más de ~100 líneas)?
├── NO → Un solo {crud}-form.json en forms/
└── SÍ → Dividir en parts/: el form principal referencia partes via json_part
```

---

## index.json — REGISTRO DE EXTENSIÓN

```json
{
  "name":        "categoria",
  "version":     "1.0.0",
  "enabled":     true,
  "hasViews":    true,
  "hasMenu":     true,
  "hasHooks":    false,
  "description": "Gestión de Categorías",
  "menu": {
    "title": "Categorías",
    "icon":  "📂",
    "order": 30,
    "items": [
      {
        "id":    "categoria-list",
        "title": "Categorías",
        "view":  "sections/categoria-list",
        "order": 1
      }
    ]
  }
}
```

**Flags importantes:**
```
hasMenu: false  → extensión sin sidebar (invisible, rol de servicio)
hasHooks: true  → carga hooks.js de la extensión
hasViews: true  → la extensión tiene vistas JSON
enabled: false  → extensión deshabilitada globalmente
```

**Para agregar submenu en extensión existente** — solo agregar ítem a `menu.items[]`:
```json
{ "id": "categoria-list", "title": "Categorías", "view": "sections/categoria-list", "order": 5 }
```

---

## VISTA PRINCIPAL — sections/{crud}-list.json

Vista estándar de un CRUD: botones de acción + datatable.

```json
{
  "id":      "categoriaList",
  "title":   "{i18n:categoria.list.title}",
  "type":    "content",
  "scripts": ["categoria/assets/js/Categoria.js"],
  "content": [
    {
      "type":    "html",
      "order":   0,
      "content": "<h4>{i18n:categoria.list.header}</h4>"
    },
    {
      "type":    "html",
      "order":   1,
      "content": "<div class='og-flex og-gap-sm og-my-2'><button class='btn btn-primary' onclick='ogModal.open(\\"categoria|forms/categoria-form\\", {title: \\"{i18n:categoria.modal.new.title}\\", width: \\"600px\\", showFooter: false, afterRender: function(formId){Categoria.openNew(formId);}})'> ➕ {i18n:core.add}</button></div>"
    },
    {
      "type":      "component",
      "component": "datatable",
      "order":     2,
      "config": {
        "source":  "api/categoria",
        "columns": [
          { "id":     { "name": "i18n:categoria.col.id",     "width": "50px", "sortable": true } },
          { "name":   { "name": "i18n:categoria.col.name",   "sortable": true } },
          { "status": { "name": "i18n:categoria.col.status", "format": "status-badge", "width": "100px" } }
        ],
        "actions": {
          "edit":   { "name": "i18n:core.edit",   "onclick": "ogModal.open('categoria|forms/categoria-form', {title: '{i18n:categoria.modal.edit.title}', width: '600px', showFooter: false, afterRender: function(formId){Categoria.openEdit(formId, {id}); }})" },
          "delete": { "name": "i18n:core.delete", "onclick": "if(confirm('{i18n:categoria.confirm.delete}')) Categoria.delete({id})" }
        }
      }
    }
  ]
}
```

**Claves:**
- `scripts[]` → ruta relativa a `app/extensions/`. El framework carga el JS y llama `Categoria.init()` si existe.
- `"categoria|forms/categoria-form"` → notación `extension|path` para abrir un form en modal.
- `{id}`, `{name}` en `onclick` → el datatable interpola los valores de la fila.
- `source: "api/categoria"` → endpoint del backend, sin slash inicial.

---

## VISTA CON TABS — sections/{crud}-panel.json

Cuando un módulo tiene múltiples secciones (lista + estadísticas + config...):

```json
{
  "id":    "categoriaPanel",
  "title": "{i18n:categoria.panel.title}",
  "type":  "tabs",
  "tabs": [
    {
      "id":      "tab-list",
      "title":   "{i18n:categoria.tab.list}",
      "order":   1,
      "content": [
        { "type": "json_part", "src": "categoria|parts/categoria/lista" }
      ]
    },
    {
      "id":      "tab-stats",
      "title":   "{i18n:categoria.tab.stats}",
      "order":   2,
      "content": [
        { "type": "json_part", "src": "categoria|parts/categoria/stats" }
      ]
    }
  ]
}
```

`json_part` carga el fragmento `parts/categoria/lista.json` dentro del tab.
Esto permite dividir views grandes sin duplicar lógica.

---

## FORMULARIO — forms/{crud}-form.json

```json
{
  "id": "categoria-form",
  "fields": [
    {
      "type":    "group",
      "columns": 2,
      "gap":     "normal",
      "fields": [
        {
          "name":       "name",
          "label":      "i18n:categoria.field.name",
          "type":       "text",
          "validation": "required|min:2|max:100",
          "placeholder":"i18n:categoria.field.name.placeholder"
        },
        {
          "name":    "parent_id",
          "label":   "i18n:categoria.field.parent",
          "type":    "select",
          "source":  "/api/categoria?status=1",
          "sourceValue": "id",
          "sourceLabel": "name",
          "options": [{ "value": "", "label": "i18n:core.form.select.placeholder" }]
        }
      ]
    },
    {
      "name":  "description",
      "label": "i18n:categoria.field.description",
      "type":  "textarea",
      "rows":  2
    },
    {
      "name":    "status",
      "label":   "i18n:core.status.active",
      "type":    "checkbox",
      "default": true
    },
    { "name": "cancel", "type": "button", "label": "i18n:core.cancel",  "action": "cancel" },
    { "name": "submit", "type": "button", "label": "i18n:core.save",    "action": "submit", "onclick": "Categoria.save('{form_id}')" }
  ]
}
```

**Campos clave del form:**
```
type: text | textarea | select | checkbox | repeatable | grouper | html | button | url | time
validation: "required|min:2|max:100|decimal|email"
source: "/api/recurso"    → select dinámico desde API
sourceValue / sourceLabel → campos del objeto API para value y label
"config.campo"            → notación punto para campos anidados (se mapean a objeto config)
default: valor            → valor inicial del campo
hint: "i18n:..."         → texto de ayuda bajo el campo
className: "..."         → clases CSS extra al input
```

**group** — agrupar campos en columnas:
```json
{ "type": "group", "columns": 3, "gap": "normal", "fields": [...] }
```

**grouper** — pestañas dentro del form (para forms muy largos):
```json
{ "name": "config.messages", "type": "grouper", "mode": "tabs", "activeIndex": 0, "groups": [
  { "name": "tab1", "title": "i18n:...", "fields": [...] },
  { "name": "tab2", "title": "i18n:...", "fields": [...] }
]}
```

**repeatable** — lista dinámica de campos:
```json
{
  "name": "config.items", "type": "repeatable",
  "accordion": true, "sortable": true,
  "addText": "i18n:core.add", "removeText": "i18n:core.remove",
  "fields": [
    { "name": "title", "type": "text", "label": "i18n:..." },
    { "name": "value", "type": "text", "label": "i18n:..." }
  ]
}
```

---

## PARTS — Dividir views o forms grandes

Los `parts/` permiten partir cualquier JSON largo en fragmentos reutilizables.

**Referenciar un part desde una vista o tab:**
```json
{ "type": "json_part", "src": "categoria|parts/categoria/lista" }
```

**El part mismo** (`parts/categoria/lista.json`) — es un fragmento de content[]:
```json
[
  { "type": "html",      "content": "<h5>Lista</h5>", "order": 0 },
  { "type": "component", "component": "datatable",    "order": 1, "config": { ... } }
]
```

Organización recomendada para CRUD con múltiples parts:
```
parts/categoria/
├── lista.json       ← datatable + botones
├── stats.json       ← gráficas o métricas
└── config.json      ← configuración del módulo
```

---

## JS DEL CRUD — assets/js/{Crud}.js

El framework carga el JS declarado en `scripts[]` de la vista y llama `{Clase}.init()` si existe.
El nombre de la clase debe coincidir con el nombre del archivo (sin extensión).

**Cómo lo resuelve el framework:**
```
scripts: ["categoria/assets/js/Categoria.js"]
→ Carga el archivo
→ Busca window["Categoria"] (nombre del archivo sin .js)
→ Si tiene .init() → lo ejecuta automáticamente al cargar la vista
→ window.Categoria queda disponible globalmente para el onclick del HTML
```

**Plantilla estándar del JS de CRUD:**
```js
class Categoria {
  // APIs del módulo
  static apis = {
    list:   '/api/categoria',
    single: '/api/categoria'   // mismo endpoint, GET /{id}
  };

  static currentId = null;   // ID del registro en edición

  // Llamado automáticamente por el framework al cargar la vista
  static init() {
    this.initFormatters();
    // Inicializaciones extras si son necesarias
  }

  // Registrar formatters personalizados del datatable
  static initFormatters() {
    ogDatatable.registerFormatter('categoria-status', (value) => {
      const isActive  = value == 1;
      const text  = isActive ? __('core.status.active') : __('core.status.inactive');
      const color = isActive ? '#16a34a' : '#dc2626';
      const bg    = isActive ? '#dcfce7'  : '#fee2e2';
      return `<span style="padding:0.25rem 0.75rem;border-radius:0.375rem;font-size:0.875rem;font-weight:500;color:${color};background:${bg};">${text}</span>`;
    });
  }

  // Llamado desde afterRender del modal al crear
  static openNew(formId) {
    this.currentId = null;
    const realId = document.getElementById(formId)?.getAttribute('data-real-id') || formId;
    ogForm.clearAllErrors(realId);
  }

  // Llamado desde afterRender del modal al editar
  static async openEdit(formId, id) {
    this.currentId = id;
    const realId = document.getElementById(formId)?.getAttribute('data-real-id') || formId;
    ogForm.clearAllErrors(realId);
    const data = await this.get(id);
    if (data) this.fillForm(formId, data);
  }

  // Llenar formulario con datos existentes
  static fillForm(formId, data) {
    ogForm.fill(formId, {
      name:        data.name        || '',
      description: data.description || '',
      parent_id:   data.parent_id   ? String(data.parent_id) : '',
      status:      data.status == 1
      // Para campos anidados en config: 'config.campo': data.config?.campo
    });
  }

  // Guardar — create o update según currentId
  static async save(formId) {
    const validation = ogForm.validate(formId);
    if (!validation.success) return ogToast.error(validation.message);

    const body   = this.buildBody(validation.data);
    const result = this.currentId
      ? await this.update(this.currentId, body)
      : await this.create(body);

    if (result) {
      ogToast.success(this.currentId
        ? __('categoria.success.updated')
        : __('categoria.success.created')
      );
      setTimeout(() => { ogModal.closeAll(); this.refresh(); }, 100);
    }
  }

  // Transformar datos del form al formato que espera la API
  static buildBody(formData) {
    return {
      name:        formData.name,
      description: formData.description || null,
      parent_id:   formData.parent_id ? parseInt(formData.parent_id) : null,
      status:      formData.status ? 1 : 0
      // Si hay campos anidados: config: { campo: formData.config?.campo }
    };
  }

  // ── CRUD API ─────────────────────────────────────────────────

  static async get(id) {
    try {
      const res = await ogApi.get(`${this.apis.single}/${id}`);
      return res.success === false ? null : (res.data || res);
    } catch (e) {
      ogToast.error(__('categoria.error.load_failed')); return null;
    }
  }

  static async create(data) {
    try {
      const res = await ogApi.post(this.apis.list, data);
      return res.success === false ? null : (res.data || res);
    } catch (e) {
      ogToast.error(__('categoria.error.create_failed')); return null;
    }
  }

  static async update(id, data) {
    try {
      const res = await ogApi.put(`${this.apis.single}/${id}`, { ...data, id });
      return res.success === false ? null : (res.data || res);
    } catch (e) {
      ogToast.error(__('categoria.error.update_failed')); return null;
    }
  }

  static async delete(id) {
    try {
      const res = await ogApi.delete(`${this.apis.single}/${id}`);
      if (res.success === false) { ogToast.error(__('categoria.error.delete_failed')); return null; }
      ogToast.success(__('categoria.success.deleted'));
      this.refresh();
      return res.data || res;
    } catch (e) {
      ogToast.error(__('categoria.error.delete_failed')); return null;
    }
  }

  // Refrescar datatable
  static refresh() {
    if (window.ogDatatable) ogDatatable.refreshFirst();
  }
}

// Exponer globalmente — necesario para los onclick del HTML de la vista
window.Categoria = Categoria;
```

**Reglas del JS:**
- Clase con métodos `static` — nunca se instancia
- Nombre del archivo = nombre de la clase = nombre en `window`
- `static init()` → se ejecuta automáticamente al cargar la vista
- `openNew(formId)` / `openEdit(formId, id)` → llamados desde `afterRender` del modal
- `fillForm` usa `ogForm.fill()` — los keys deben coincidir exactamente con los `name` del form JSON
- `buildBody` transforma y limpia los datos antes de enviarlos a la API
- `save()` decide create vs update según `this.currentId`
- Siempre `try/catch` en las llamadas a API
- Siempre `window.ClaseName = ClaseName` al final

---

## CSS DE EXTENSIÓN — assets/css/{crud}.css

Solo crear si la extensión necesita estilos que el framework no cubre.
Declararlo en la vista o en el `index.json` de la extensión:

```json
{ "styles": ["categoria/assets/css/categoria.css"] }
```

Usar alta especificidad para evitar conflictos con el CSS del framework:
```css
.categoria-card { display: flex !important; gap: 1rem !important; }
```

---

## IDIOMA — lang/es.json

```json
{
  "categoria": {
    "list": { "title": "Categorías", "header": "Lista de Categorías" },
    "modal": {
      "new":  { "title": "Nueva Categoría" },
      "edit": { "title": "Editar Categoría" }
    },
    "field": {
      "name":        { "label": "Nombre", "placeholder": "Ej: Marketing" },
      "description": { "label": "Descripción" },
      "parent":      { "label": "Categoría Padre" }
    },
    "col":     { "id": "ID", "name": "Nombre", "status": "Estado" },
    "confirm": { "delete": "¿Eliminar esta categoría?" },
    "success": { "created": "Categoría creada", "updated": "Categoría actualizada", "deleted": "Categoría eliminada" },
    "error":   { "load_failed": "Error al cargar", "create_failed": "Error al crear", "update_failed": "Error al actualizar", "delete_failed": "Error al eliminar" }
  }
}
```

Uso en JS: `__('categoria.success.created')` — acceso por punto.
Uso en JSON (campo label/placeholder/title): `"i18n:categoria.field.name.label"` — prefijo `i18n:`.
Uso en JSON (dentro de strings HTML): `{i18n:categoria.field.name.label}` — interpolado por `viewRender`.

La interpolación `{i18n:key}` funciona en cualquier string de `content` que el motor renderice:
```json
{ "type": "html", "content": "Este es un texto {i18n:categoria.list.header} traducido" }
```
También soporta parámetros: `{i18n:key|param1:valor1|param2:valor2}`.
Lo procesa `ogViewRender.processI18nInString()` antes de insertar el HTML en el DOM.

---

## CHECKLIST — CREAR UN CRUD FRONTEND

```
□ 1. ¿Nueva extensión o agregar a una existente?
       Nueva  → crear carpeta app/extensions/{nombre}/ + index.json completo
       Existe → agregar ítem en menu.items[] del index.json existente

□ 2. Crear views/sections/{crud}-list.json
       type: "content", scripts: ["{ext}/assets/js/{Crud}.js"]
       Botón nuevo con ogModal.open() + afterRender: {Crud}.openNew(formId)
       Componente datatable con source, columns, actions (edit + delete)

□ 3. Crear views/forms/{crud}-form.json
       id del form, fields[], group para columnas, botones cancel+submit
       submit.onclick: {Crud}.save('{form_id}')

□ 4. Crear assets/js/{Crud}.js
       static apis = { list: '/api/{recurso}' }
       static currentId = null
       init(), initFormatters(), openNew(), openEdit(), fillForm()
       save(), buildBody(), get(), create(), update(), delete(), refresh()
       window.{Crud} = {Crud}  ← al final siempre

□ 5. Crear lang/es.json
       Todos los keys referenciados con i18n: en las vistas y JS

□ 6. ¿Necesita CSS propio?
       SÍ → crear assets/css/{crud}.css + agregar "styles" en la vista
       NO → usar clases del framework (og-grid, btn, alert, og-flex, etc.)

□ 7. ¿El form o la vista es muy larga?
       SÍ → mover secciones a parts/{crud}/ y referenciar con json_part
```

---

## NOTACIONES DE RUTA — dónde va cada path

```
En onclick/scripts del JSON de vista:
  "categoria|forms/categoria-form"   → extensión|ruta (sin .json)
  "middle:dashboard/dashboard"        → middle:ruta
  "core:user/user-list"               → core:ruta del framework

En scripts[] de la vista:
  "categoria/assets/js/Categoria.js" → relativo a app/extensions/

En styles[] de la vista:
  "categoria/assets/css/categoria.css"

En source del datatable:
  "api/categoria"                     → sin / inicial, URL relativa

En source de select del form:
  "/api/categoria?status=1"           → con / inicial, URL absoluta
```

---

## ERRORES COMUNES

```
NO distinto nombre de clase y nombre de archivo  → el framework no la encuentra
NO olvidar window.Clase = Clase al final         → onclick del HTML no funciona
NO redeclarar formatters en cada llamada         → registrar solo en init()
NO currentId = id en openNew()                   → quedará en modo update
NO usar rutas absolutas en scripts[]             → relativas a app/extensions/
NO /api en source del datatable                  → usar "api/recurso" sin slash
NO mezclar keys de i18n: en JS y formato texto   → en JS usar __(), en JSON i18n:
NO llenar form con data.config como string       → parsear JSON.parse si es string
NO ignorar el data-real-id del formId            → el modal puede remapear el ID
```