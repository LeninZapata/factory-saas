# Plantilla CRUD Rápido - Sistema Híbrido Backend + Frontend

## Instrucciones para la AI

Esta plantilla permite crear un CRUD completo (backend PHP + frontend JS) de forma rápida siguiendo las convenciones del sistema.

### Convenciones Generales
- **Tabulación**: 2 espacios
- **Nombres compuestos**: camelCase → `holaService`
- **Archivos JSON**: `hola-service.json`
- **Archivos PHP**: PascalCase para Controllers/Handlers → `HolaController.php`, `HolaHandler.php`
- **Archivos JS**: camelCase → `holaService.js`
- **Comentarios**: Máximo 1 línea, solo si es importante (2-3 si es complejo)
- **Logs**: Solo en errores, formato `'ext:xxx'` (extensión), `'core:xxx'` (core), `'com:xxx'` (componente)
- **CSS**: Código anidado para reducir tokens

---

## BACKEND

### 1. Tabla SQL

```sql
CREATE TABLE IF NOT EXISTS `{miRecurso}` (
  `id` int NOT NULL AUTO_INCREMENT,
  {campos_personalizados}
  `dc` datetime NOT NULL COMMENT 'Date Created - Fecha de creación',
  `du` datetime DEFAULT NULL COMMENT 'Date Updated - Fecha de actualización',
  `tc` int NOT NULL COMMENT 'Timestamp Created - Unix timestamp creación',
  `tu` int DEFAULT NULL COMMENT 'Timestamp Updated - Unix timestamp actualización',
  PRIMARY KEY (`id`),
  KEY `idx_dc` (`dc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{Descripción}';
```

**Convenciones de Timestamps:**
- `dc` = Date Created (Y-m-d H:i:s)
- `du` = Date Updated (Y-m-d H:i:s)
- `tc` = Timestamp Created (unix timestamp)
- `tu` = Timestamp Updated (unix timestamp)

---

### 2. Schema JSON: `/app/resources/schemas/{miRecurso}.json`

```json
{
  "resource": "{miRecurso}",
  "table": "{miRecurso}",
  "timestamps": true,
  "middleware": ["throttle:100,1"],

  "routes": {
    "list": {
      "method": "GET",
      "path": "/api/{miRecurso}",
      "middleware": ["auth"]
    },
    "show": {
      "method": "GET",
      "path": "/api/{miRecurso}/{id}",
      "middleware": ["auth"]
    },
    "create": {
      "method": "POST",
      "path": "/api/{miRecurso}",
      "middleware": ["auth", "json"]
    },
    "update": {
      "method": "PUT",
      "path": "/api/{miRecurso}/{id}",
      "middleware": ["auth", "json"]
    },
    "delete": {
      "method": "DELETE",
      "path": "/api/{miRecurso}/{id}",
      "middleware": ["auth"]
    }
  },

  "fields": [
    {
      "name": "{campo1}",
      "type": "string",
      "required": true,
      "unique": false,
      "maxLength": 100
    },
    {
      "name": "{campo2}",
      "type": "text"
    },
    {
      "name": "config",
      "type": "json"
    }
  ]
}
```

**Tipos de campos soportados:**
- `string` - VARCHAR (con maxLength)
- `text` - TEXT largo
- `int` - Entero
- `float` - Decimal
- `boolean` - Booleano
- `json` - Objeto JSON
- `datetime` - Fecha y hora
- `date` - Solo fecha

---

### 3. Controller (Opcional): `/app/resources/controllers/{MiRecurso}Controller.php`

**Nota:** Solo crear si necesitas lógica personalizada. Si no, el controller base maneja todo automáticamente.

**Convención de nombres:** PascalCase (primera letra mayúscula)

```php
<?php
class {MiRecurso}Controller extends controller {
  use ValidatesUnique;  // Trait para validaciones de unicidad

  function __construct() {
    parent::__construct('{miRecurso}');
  }

  // Override create solo si necesitas lógica custom
  function create() {
    $data = request::data();
    
    // Validar campos requeridos
    if (!isset($data['{campo_requerido}']) || empty($data['{campo_requerido}'])) {
      response::error(__('{miRecurso}.{campo_requerido}_required'), 400);
    }

    // Validar unicidad (si aplica)
    if (isset($data['{campo_unico}'])) {
      $this->validateUnique('{miRecurso}', '{campo_unico}', $data['{campo_unico}'], '{miRecurso}.{campo_unico}_exists');
    }

    // Convertir JSON si aplica
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Timestamps automáticos
    $data['dc'] = date('Y-m-d H:i:s');
    $data['tc'] = time();

    try {
      $id = db::table('{miRecurso}')->insert($data);
      log::info('{MiRecurso} creado', ['id' => $id], ['module' => '{miRecurso}']);
      response::success(['id' => $id], __('{miRecurso}.create.success'), 201);
    } catch (Exception $e) {
      log::error('Error al crear {miRecurso}', ['error' => $e->getMessage()], ['module' => '{miRecurso}']);
      response::serverError(__('{miRecurso}.create.error'), IS_DEV ? $e->getMessage() : null);
    }
  }

  // Override update solo si necesitas lógica custom
  function update($id) {
    $exists = db::table('{miRecurso}')->find($id);
    if (!$exists) response::notFound(__('{miRecurso}.not_found'));

    $data = request::data();
    
    // Validar unicidad excluyendo el registro actual
    if (isset($data['{campo_unico}'])) {
      $this->validateUniqueExcept('{miRecurso}', '{campo_unico}', $data['{campo_unico}'], $id, '{miRecurso}.{campo_unico}_exists');
    }

    // Convertir JSON si aplica
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Timestamps de actualización
    $data['du'] = date('Y-m-d H:i:s');
    $data['tu'] = time();

    try {
      $affected = db::table('{miRecurso}')->where('id', $id)->update($data);
      log::info('{MiRecurso} actualizado', ['id' => $id], ['module' => '{miRecurso}']);
      response::success(['affected' => $affected], __('{miRecurso}.update.success'));
    } catch (Exception $e) {
      log::error('Error al actualizar {miRecurso}', ['error' => $e->getMessage()], ['module' => '{miRecurso}']);
      response::serverError(__('{miRecurso}.update.error'), IS_DEV ? $e->getMessage() : null);
    }
  }

  // Override show para parsear JSON
  function show($id) {
    $data = db::table('{miRecurso}')->find($id);
    if (!$data) response::notFound(__('{miRecurso}.not_found'));
    
    // Parsear config si es JSON string
    if (isset($data['config']) && is_string($data['config'])) {
      $data['config'] = json_decode($data['config'], true);
    }

    response::success($data);
  }

  // Override list para parsear JSON
  function list() {
    $query = db::table('{miRecurso}');
    
    // Filtros dinámicos desde query params
    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      $query = $query->where($key, $value);
    }

    // Ordenamiento
    $sort = request::query('sort', 'id');
    $order = request::query('order', 'DESC');
    $query = $query->orderBy($sort, $order);

    // Paginación
    $page = request::query('page', 1);
    $perPage = request::query('per_page', 50);
    $data = $query->paginate($page, $perPage)->get();

    // Parsear config JSON
    foreach ($data as &$item) {
      if (isset($item['config']) && is_string($item['config'])) {
        $item['config'] = json_decode($item['config'], true);
      }
    }

    response::success($data);
  }

  // Override delete si necesitas lógica custom
  function delete($id) {
    $item = db::table('{miRecurso}')->find($id);
    if (!$item) response::notFound(__('{miRecurso}.not_found'));

    try {
      $affected = db::table('{miRecurso}')->where('id', $id)->delete();
      log::info('{MiRecurso} eliminado', ['id' => $id], ['module' => '{miRecurso}']);
      response::success(['affected' => $affected], __('{miRecurso}.delete.success'));
    } catch (Exception $e) {
      log::error('Error al eliminar {miRecurso}', ['error' => $e->getMessage()], ['module' => '{miRecurso}']);
      response::serverError(__('{miRecurso}.delete.error'), IS_DEV ? $e->getMessage() : null);
    }
  }
}
```

**Trait ValidatesUnique** (ya disponible en `/framework/traits/ValidatesUnique.php`):
- `validateUnique($table, $field, $value, $errorKey)` - Validar campo único
- `validateUniqueExcept($table, $field, $value, $excludeId, $errorKey)` - Validar único excepto ID
- `validateEmail($email, $table, $excludeId)` - Validar email (formato + unicidad)

---

### 4. Routes (Opcional): `/app/routes/apis/{miRecurso}.php`

**Nota:** Las rutas CRUD se auto-registran desde el JSON. Solo crear este archivo si necesitas rutas adicionales.

```php
<?php
// Las rutas CRUD se auto-registran desde {miRecurso}.json
// Este archivo es para rutas custom adicionales

$router->group('/api/{miRecurso}', function($router) {
  
  // Ejemplo: Ruta custom adicional
  $router->get('/stats', function() {
    // Lógica custom
    $stats = db::table('{miRecurso}')->count();
    response::success(['total' => $stats]);
  })->middleware('auth');

});
```

---

### 5. Traducciones: `/app/lang/es/{miRecurso}.php`

```php
<?php
return [
  '{campo_requerido}_required' => 'El campo {campo_requerido} es requerido',
  '{campo_unico}_exists' => 'El {campo_unico} ya existe',
  'not_found' => '{MiRecurso} no encontrado',
  
  'create.success' => '{MiRecurso} creado correctamente',
  'create.error' => 'Error al crear {miRecurso}',
  
  'update.success' => '{MiRecurso} actualizado correctamente',
  'update.error' => 'Error al actualizar {miRecurso}',
  
  'delete.success' => '{MiRecurso} eliminado correctamente',
  'delete.error' => 'Error al eliminar {miRecurso}'
];
```

---

## FRONTEND (Extensiones)

### 1. Index de extensión: `/public/extensions/{miExtension}/index.json`

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

---

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
        "source": "api/{miRecurso}",
        "columns": [
          {"id": {"name": "i18n:{miExtension}.column.id", "width": "80px", "align": "center", "sortable": true}},
          {"{campo1}": {"name": "i18n:{miExtension}.column.{campo1}", "width": "auto", "sortable": true}},
          {"{campo2}": {"name": "i18n:{miExtension}.column.{campo2}", "width": "auto"}},
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

---

### 3. Formulario: `/public/extensions/{miExtension}/views/forms/{miExtension}-form.json`

```json
{
  "id": "{miExtension}-form",
  "title": "i18n:{miExtension}.form.title",
  "description": "i18n:{miExtension}.form.description",
  "fields": [
    {
      "name": "{campo1}",
      "type": "text",
      "label": "i18n:{miExtension}.field.{campo1}",
      "placeholder": "i18n:{miExtension}.placeholder.{campo1}",
      "required": true,
      "validation": "required|min:3|max:100"
    },
    {
      "name": "{campo2}",
      "type": "textarea",
      "label": "i18n:{miExtension}.field.{campo2}",
      "placeholder": "i18n:{miExtension}.placeholder.{campo2}",
      "rows": 4
    }
  ],
  "statusbar": [
    {"name": "cancel", "type": "button", "label": "i18n:core.cancel", "action": "call:modal.closeAll", "style": "secondary"},
    {"name": "submit", "type": "button", "label": "i18n:core.save", "action": "submit:{miExtension}.save"}
  ]
}
```

**Tipos de campos frontend:**
- `text` - Input texto
- `textarea` - Área de texto
- `number` - Input numérico
- `email` - Input email
- `password` - Input contraseña
- `select` - Dropdown
- `checkbox` - Casilla de verificación
- `radio` - Botones radio
- `date` - Selector de fecha
- `datetime` - Selector de fecha/hora

**Validaciones:**
- `required` - Campo obligatorio
- `min:N` - Mínimo N caracteres
- `max:N` - Máximo N caracteres
- `email` - Email válido
- `numeric` - Solo números
- `alpha` - Solo letras
- `alphanumeric` - Letras y números

---

### 4. JavaScript: `/public/extensions/{miExtension}/assets/js/{miExtension}.js`

```javascript
class {miExtension} {
  static apis = {
    {miRecurso}: '/api/{miRecurso}'
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
      '{campo1}': data.{campo1} || '',
      '{campo2}': data.{campo2} || ''
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
      '{campo1}': formData.{campo1},
      '{campo2}': formData.{campo2}
    };
  }

  static async create(data) {
    try {
      const res = await api.post(this.apis.{miRecurso}, data);
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.create_failed'));
      return null;
    }
  }

  static async get(id) {
    try {
      const res = await api.get(`${this.apis.{miRecurso}}/${id}`);
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.load_failed'));
      return null;
    }
  }

  static async update(id, data) {
    try {
      const res = await api.put(`${this.apis.{miRecurso}}/${id}`, {...data, id});
      return res.success === false ? null : (res.data || res);
    } catch (error) {
      logger.error('ext:{miExtension}', error);
      toast.error(__('{miExtension}.error.update_failed'));
      return null;
    }
  }

  static async delete(id) {
    try {
      const res = await api.delete(`${this.apis.{miRecurso}}/${id}`);
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
      const res = await api.get(this.apis.{miRecurso});
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

---

### 5. Traducciones Frontend: `/public/extensions/{miExtension}/lang/es.json`

```json
{
  "{miExtension}.listado.title": "{Emoji} Listado de {Título}",
  "{miExtension}.listado.header.title": "{Emoji} {Título Completo}",
  "{miExtension}.listado.header.description": "{Descripción breve del módulo}",
  
  "{miExtension}.column.id": "ID",
  "{miExtension}.column.{campo1}": "{Título Campo 1}",
  "{miExtension}.column.{campo2}": "{Título Campo 2}",
  "{miExtension}.column.created": "Fecha de Creación",
  
  "{miExtension}.form.title": "Formulario de {Título}",
  "{miExtension}.form.description": "{Descripción del formulario}",
  
  "{miExtension}.field.{campo1}": "{Título Campo 1}",
  "{miExtension}.field.{campo2}": "{Título Campo 2}",
  "{miExtension}.placeholder.{campo1}": "Ingrese {campo1}...",
  "{miExtension}.placeholder.{campo2}": "Ingrese {campo2}...",
  
  "{miExtension}.modal.new.title": "{Emoji} Nuevo {Título}",
  "{miExtension}.modal.edit.title": "✏️ Editar {Título}",
  
  "{miExtension}.confirm.delete": "¿Está seguro de eliminar este {título}?",
  
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

---

### 6. Registrar extensión: `/public/extensions/index.json`

```json
{
  "extensions": [
    {"name": "admin", "description": "Administración del sistema"},
    {"name": "{miExtension}", "description": "{Descripción de la extensión}"}
  ]
}
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Crear tabla SQL con timestamps (dc, du, tc, tu)
- [ ] Crear schema JSON en `/app/resources/schemas/{miRecurso}.json`
- [ ] (Opcional) Crear controller personalizado si necesitas lógica custom
- [ ] (Opcional) Crear archivo de rutas custom en `/app/routes/apis/{miRecurso}.php`
- [ ] Crear archivo de traducciones en `/app/lang/es/{miRecurso}.php`
- [ ] Probar endpoints CRUD con Postman/curl

### Frontend
- [ ] Crear index.json de la extensión
- [ ] Crear vista de listado (datatable)
- [ ] Crear formulario JSON
- [ ] Crear clase JavaScript
- [ ] Crear traducciones frontend
- [ ] Registrar extensión en `/public/extensions/index.json`
- [ ] Probar en navegador

---

## MEJORAS RECIENTES (2025)

✅ **Convenciones actualizadas:**
- PascalCase para Controllers/Handlers (UserController, AuthHandler)
- camelCase para helpers y compound classes (logReader, sessionCleanup)

✅ **Trait ValidatesUnique:**
- Validaciones reutilizables de unicidad
- Métodos: validateUnique(), validateUniqueExcept(), validateEmail()

✅ **Lang.php con lazy loading:**
- Solo carga módulos que se usan
- Cache en memoria
- Mejor rendimiento

✅ **Response.php corregido:**
- Ahora permite arrays vacíos correctamente
- Fix: `if ($data !== null)` en lugar de `if ($data)`

✅ **Timestamps estandarizados:**
- dc/du = Date Created/Updated (datetime)
- tc/tu = Timestamp Created/Updated (unix)

---

## RECURSOS ADICIONALES

- **FRAMEWORK.md** - Documentación completa del núcleo
- **BLUEPRINT.md** - Guía para crear proyectos nuevos
- **backend.md** - Documentación detallada del backend
- `/framework/docs/` - Mini-documentación de componentes

---

**Versión:** 1.3  
**Última actualización:** Diciembre 2025
