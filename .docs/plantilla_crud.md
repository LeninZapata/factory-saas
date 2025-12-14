# Plantilla CRUD Rápido - Sistema Híbrido Backend + Frontend

## Instrucciones para la AI

Esta plantilla permite crear un CRUD completo (backend PHP + frontend JS) de forma rápida siguiendo las convenciones del sistema.

### Convenciones Generales
- **Tabulación**: 2 espacios
- **Nombres compuestos**: Primera palabra minúscula → `holaService`
- **Archivos JSON**: `hola-service.json`
- **Archivos código**: `holaService.php`, `holaService.js`
- **Comentarios**: Máximo 1 línea, solo si es importante
- **Logs**: Solo en errores, formato `'ext:xxx'`, `'core:xxx'`, `'com:xxx'`
- **CSS**: Código anidado para reducir tokens

---

## BACKEND

### 1. Tabla SQL
```sql
CREATE TABLE IF NOT EXISTS `{miExtension}s` (
  `id` int NOT NULL AUTO_INCREMENT,
  {campos_personalizados}
  `dc` datetime NOT NULL COMMENT 'Fecha de creación',
  `da` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  `ta` int NOT NULL COMMENT 'Timestamp de creación',
  `tu` int DEFAULT NULL COMMENT 'Timestamp de actualización',
  PRIMARY KEY (`id`),
  KEY `idx_dc` (`dc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{Descripción}';
```

### 2. Resource JSON: `/app/resources/{miExtension}.json`
```json
{
  "resource": "{miExtension}",
  "table": "{miExtension}s",
  "timestamps": true,
  "middleware": ["throttle:100,1"],
  "routes": {
    "list": {"method": "GET", "path": "/api/{miExtension}", "middleware": ["auth"]},
    "show": {"method": "GET", "path": "/api/{miExtension}/{id}", "middleware": ["auth"]},
    "create": {"method": "POST", "path": "/api/{miExtension}", "middleware": ["auth", "json"]},
    "update": {"method": "PUT", "path": "/api/{miExtension}/{id}", "middleware": ["auth", "json"]},
    "delete": {"method": "DELETE", "path": "/api/{miExtension}/{id}", "middleware": ["auth"]}
  },
  "fields": [
    {campos_definicion}
  ]
}
```

### 3. Controller: `/app/resources/controllers/{miExtension}Controller.php`
```php
<?php
class {miExtension}Controller extends controller {

  function __construct() {
    parent::__construct('{miExtension}');
  }

  function create() {
    $data = request::data();
    
    if (!isset($data['{campo_requerido}']) || empty($data['{campo_requerido}'])) {
      response::json(['success' => false, 'error' => __('{miExtension}.{campo_requerido}_required')], 200);
    }

    // Convertir JSON si aplica
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    $data['dc'] = date('Y-m-d H:i:s');
    $data['ta'] = time();

    try {
      $id = db::table('{miExtension}s')->insert($data);
      response::success(['id' => $id], __('{miExtension}.create.success'), 201);
    } catch (Exception $e) {
      response::serverError(__('{miExtension}.create.error'), IS_DEV ? $e->getMessage() : null);
    }
  }

  function update($id) {
    $exists = db::table('{miExtension}s')->find($id);
    if (!$exists) response::notFound(__('{miExtension}.not_found'));

    $data = request::data();
    
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    $data['da'] = date('Y-m-d H:i:s');
    $data['tu'] = time();

    try {
      $affected = db::table('{miExtension}s')->where('id', $id)->update($data);
      response::success(['affected' => $affected], __('{miExtension}.update.success'));
    } catch (Exception $e) {
      response::serverError(__('{miExtension}.update.error'), IS_DEV ? $e->getMessage() : null);
    }
  }

  function show($id) {
    $data = db::table('{miExtension}s')->find($id);
    if (!$data) response::notFound(__('{miExtension}.not_found'));
    
    if (isset($data['config']) && is_string($data['config'])) {
      $data['config'] = json_decode($data['config'], true);
    }

    response::success($data);
  }

  function list() {
    $query = db::table('{miExtension}s');
    
    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      $query = $query->where($key, $value);
    }

    $sort = request::query('sort', 'id');
    $order = request::query('order', 'DESC');
    $query = $query->orderBy($sort, $order);

    $page = request::query('page', 1);
    $perPage = request::query('per_page', 50);
    $data = $query->paginate($page, $perPage)->get();

    if (!is_array($data)) $data = [];
    
    foreach ($data as &$item) {
      if (isset($item['config']) && is_string($item['config'])) {
        $item['config'] = json_decode($item['config'], true);
      }
    }

    response::success($data);
  }

  function delete($id) {
    $item = db::table('{miExtension}s')->find($id);
    if (!$item) response::notFound(__('{miExtension}.not_found'));

    try {
      $affected = db::table('{miExtension}s')->where('id', $id)->delete();
      response::success(['affected' => $affected], __('{miExtension}.delete.success'));
    } catch (Exception $e) {
      response::serverError(__('{miExtension}.delete.error'), IS_DEV ? $e->getMessage() : null);
    }
  }
}
```

### 4. Routes: `/app/routes/apis/{miExtension}.php`
```php
<?php
// Las rutas CRUD se auto-registran desde {miExtension}.json

$router->group('/api/{miExtension}', function($router) {
  // Rutas personalizadas adicionales aquí
});
```

### 5. Traducciones: `/app/lang/es/{miExtension}.php`
```php
<?php
return [
  '{campo_requerido}_required' => 'El campo {campo_requerido} es requerido',
  'not_found' => '{MiExtension} no encontrado',
  'create.success' => '{MiExtension} creado correctamente',
  'create.error' => 'Error al crear {miExtension}',
  'update.success' => '{MiExtension} actualizado correctamente',
  'update.error' => 'Error al actualizar {miExtension}',
  'delete.success' => '{MiExtension} eliminado correctamente',
  'delete.error' => 'Error al eliminar {miExtension}'
];
```

---

## FRONTEND

### 1. Index extensión: `/public/extensions/{miExtension}/index.json`
```json
{
  "name": "{miExtension}",
  "version": "1.0.0",
  "enabled": true,
  "hasViews": true,
  "hasMenu": true,
  "hasHooks": false,
  "description": "{Descripción de la extensión}",
  "menu": {
    "title": "{Título Menú}",
    "icon": "{emoji}",
    "order": 10,
    "items": [
      {
        "id": "{miExtension}-listado",
        "title": "Listado",
        "view": "sections/{miExtension}-listado",
        "order": 1
      }
    ]
  }
}
```

### 2. Listado: `/public/extensions/{miExtension}/views/sections/{miExtension}-listado.json`
```json
{
  "id": "{miExtension}Listado",
  "title": "{i18n:{miExtension}.listado.title}",
  "type": "content",
  "scripts": ["{miExtension}/assets/js/{miExtension}.js"],
  "content": [
    {
      "type": "html",
      "content": "<div class='view-header'><h2>{i18n:{miExtension}.listado.header.title}</h2><p>{i18n:{miExtension}.listado.header.description}</p></div>",
      "order": 0
    },
    {
      "type": "html",
      "content": "<div class='view-toolbar'><button class='btn btn-primary' onclick=\"modal.open('{miExtension}|forms/{miExtension}-form', {title: '{i18n:{miExtension}.modal.new.title}', width: '90%', maxWidth: '700px', showFooter: false, afterRender: function(formId){{miExtension}.openNew(formId);}})\">➕ {i18n:core.add}</button><button class='btn btn-secondary' onclick='{miExtension}.refresh();toast.info(\"{i18n:{miExtension}.refresh.success}\")'>🔄 {i18n:core.refresh}</button></div>",
      "order": 1
    },
    {
      "type": "component",
      "component": "datatable",
      "order": 2,
      "config": {
        "source": "api/{miExtension}",
        "columns": [
          {"id": {"name": "i18n:{miExtension}.column.id", "width": "80px", "align": "center", "sortable": true}},
          {columnas_personalizadas}
          {"dc": {"name": "i18n:{miExtension}.column.created", "format": "datetime", "width": "180px", "align": "center"}}
        ],
        "actions": {
          "edit": {
            "name": "i18n:core.edit",
            "onclick": "modal.open('{miExtension}|forms/{miExtension}-form', {title: '{i18n:{miExtension}.modal.edit.title}', width: '90%', maxWidth: '700px', showFooter: false, afterRender: function(formId){{miExtension}.openEdit(formId, {id});}})"
          },
          "delete": {
            "name": "i18n:core.delete",
            "onclick": "if(confirm('{i18n:{miExtension}.confirm.delete}')) {miExtension}.delete({id}).then(r => r && {miExtension}.refresh())"
          }
        }
      }
    }
  ]
}
```

### 3. Formulario: `/public/extensions/{miExtension}/views/forms/{miExtension}-form.json`
```json
{
  "id": "{miExtension}-form",
  "title": "i18n:{miExtension}.form.title",
  "description": "i18n:{miExtension}.form.description",
  "fields": [
    {campos_formulario}
  ],
  "statusbar": [
    {"name": "cancel", "type": "button", "label": "i18n:core.cancel", "action": "call:modal.closeAll", "style": "secondary"},
    {"name": "submit", "type": "button", "label": "i18n:core.save", "action": "submit:{miExtension}.save"}
  ]
}
```

### 4. JavaScript: `/public/extensions/{miExtension}/assets/js/{miExtension}.js`
```javascript
class {miExtension} {
  static apis = {
    {miExtension}: '/api/{miExtension}'
  };

  static currentId = null;

  static openNew(formId) {
    this.currentId = null;
    const formEl = document.getElementById(formId);
    const realId = formEl?.getAttribute('data-real-id') || formId;
    form.clearAllErrors(realId);
  }

  static async openEdit(formId, id) {
    this.currentId = id;
    const formEl = document.getElementById(formId);
    const realId = formEl?.getAttribute('data-real-id') || formId;
    
    form.clearAllErrors(realId);
    const data = await this.get(id);
    if (!data) return;
    
    this.fillForm(formId, data);
  }

  static fillForm(formId, data) {
    form.fill(formId, {
      {mapeo_campos_formulario}
    });
  }

  static async save(formId) {
    const validation = form.validate(formId);
    if (!validation.success) return toast.error(validation.message);

    const body = this.buildBody(validation.data);
    const result = this.currentId 
      ? await this.update(this.currentId, body) 
      : await this.create(body);

    if (result) {
      toast.success(this.currentId 
        ? __('{miExtension}.success.updated') 
        : __('{miExtension}.success.created')
      );
      setTimeout(() => {
        modal.closeAll();
        this.refresh();
      }, 100);
    }
  }

  static buildBody(formData) {
    return {
      {mapeo_body_api}
    };
  }

  static async create(data) {
    try {
      const res = await api.post(this.apis.{miExtension}, data);
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.create_failed'));
      return null;
    }
  }

  static async get(id) {
    try {
      const res = await api.get(`${this.apis.{miExtension}}/${id}`);
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.load_failed'));
      return null;
    }
  }

  static async update(id, data) {
    try {
      const res = await api.put(`${this.apis.{miExtension}}/${id}`, {...data, id});
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.update_failed'));
      return null;
    }
  }

  static async delete(id) {
    try {
      const res = await api.delete(`${this.apis.{miExtension}}/${id}`);
      if (res.success === false) {
        toast.error(__('{miExtension}.error.delete_failed'));
        return null;
      }
      toast.success(__('{miExtension}.success.deleted'));
      this.refresh();
      return res.data || res;
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.delete_failed'));
      return null;
    }
  }

  static async list() {
    try {
      const res = await api.get(this.apis.{miExtension});
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      return [];
    }
  }

  static refresh() {
    if (window.datatable) datatable.refreshFirst();
  }
}

window.{miExtension} = {miExtension};
```

### 5. Traducciones: `/public/extensions/{miExtension}/lang/es.json`
```json
{
  "{miExtension}.listado.title": "{Emoji} Listado de {Título}",
  "{miExtension}.listado.header.title": "{Emoji} {Título Completo}",
  "{miExtension}.listado.header.description": "{Descripción breve}",
  "{miExtension}.column.id": "ID",
  {traducciones_columnas}
  "{miExtension}.column.created": "Fecha de Creación",
  "{miExtension}.form.title": "Formulario de {Título}",
  "{miExtension}.form.description": "{Descripción formulario}",
  {traducciones_campos}
  "{miExtension}.modal.new.title": "{Emoji} Nuevo {Título}",
  "{miExtension}.modal.edit.title": "✏️ Editar {Título}",
  "{miExtension}.confirm.delete": "¿Eliminar {título}?",
  "{miExtension}.success.created": "{Título} creado correctamente",
  "{miExtension}.success.updated": "{Título} actualizado correctamente",
  "{miExtension}.success.deleted": "{Título} eliminado correctamente",
  "{miExtension}.error.create_failed": "Error al crear {título}",
  "{miExtension}.error.update_failed": "Error al actualizar {título}",
  "{miExtension}.error.delete_failed": "Error al eliminar {título}",
  "{miExtension}.error.load_failed": "Error al cargar {título}",
  "{miExtension}.refresh.success": "Lista actualizada"
}
```

### 6. Registrar extensión: `/public/extensions/index.json`
```json
{
  "extensions": [
    {"name": "admin", "description": "Administración del sistema"},
    {"name": "{miExtension}", "description": "{Descripción}"}
  ]
}
```

---

## TIPOS DE CAMPOS SOPORTADOS

### Backend (Resource JSON)
- `string` - Texto (con maxLength)
- `text` - Texto largo
- `int` - Entero
- `float` - Decimal
- `boolean` - Booleano
- `json` - Objeto JSON
- `datetime` - Fecha/hora
- `date` - Solo fecha

### Frontend (Formulario)
- `text` - Input texto
- `textarea` - Área texto
- `number` - Input numérico
- `email` - Input email
- `password` - Input contraseña
- `select` - Dropdown
- `checkbox` - Casilla verificación
- `radio` - Botones radio
- `date` - Selector fecha
- `datetime` - Selector fecha/hora

### Validaciones
- `required` - Campo obligatorio
- `min:N` - Mínimo N caracteres
- `max:N` - Máximo N caracteres
- `email` - Email válido
- `numeric` - Solo números
- `alpha` - Solo letras
- `alphanumeric` - Letras y números