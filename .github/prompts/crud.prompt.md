# Backend — Playbook CRUD & Módulos

> Cómo crear un módulo CRUD. Cuándo crear cada archivo, dónde va, por qué.
> Generado: 2026-03-08 14:28:20

---

## CÓMO FUNCIONA EL MOTOR (ogApi)

Cada request `/api/{modulo}` dispara este flujo en `ogApi.php`:

```
PASO 1 — Auto-registra 5 rutas CRUD desde {modulo}.json (busca app → middle → framework)
         Intenta cargar {Modulo}Controller — si no existe usa ogController genérico
PASO 2 — Carga framework/routes/{modulo}.php si existe
PASO 3 — Carga middle/routes/{modulo}.php si existe
PASO 4 — Carga app/routes/{modulo}.php si existe   ← rutas custom
```

Las rutas custom (PASO 4) se suman a las 5 CRUD — no las reemplazan.
El archivo `routes/{modulo}.php` solo es necesario si hay endpoints fuera del CRUD estándar.

---

## ÁRBOL DE DECISIÓN — QUÉ ARCHIVOS CREAR

```
¿El CRUD estándar (list/show/create/update/delete) cubre todo sin cambios?
│
├── SÍ → Solo crear {modulo}.json — ogController lo cubre todo
│
└── NO → Crear {Modulo}Controller.php extends ogController
          Sobreescribir solo los métodos que necesitan cambio
          │
          ├── ¿La lógica extra vive solo dentro del Controller?
          │    └── No crear Handler
          │
          └── ¿Hay side-effects (archivos, APIs, emails) o la lógica
               se reutiliza desde otros módulos/rutas/bots/webhooks?
               └── Crear {Modulo}Handler.php — métodos static puros

¿Hay endpoints fuera de list/show/create/update/delete?
├── NO → No crear app/routes/{modulo}.php
└── SÍ → Crear app/routes/{modulo}.php
          Solo declarar los endpoints extra — las 5 CRUD no van aquí
```

---

## DÓNDE VAN LOS ARCHIVOS

```
backend/app/
├── resources/
│   ├── schemas/{modulo}.json           ← SIEMPRE — habilita las 5 rutas CRUD
│   ├── controllers/{Modulo}Controller.php  ← Si hay lógica custom en los métodos CRUD
│   └── handlers/{Modulo}Handler.php        ← Si hay side-effects o lógica reutilizable
└── routes/{modulo}.php                 ← Solo si hay endpoints no estándar
```

Búsqueda automática: `app/` → `middle/` → `framework/`. Siempre trabajar en `app/`.

---

## SCHEMA — {modulo}.json

```json
{
  "resource":   "sale",
  "table":      "sales",
  "timestamps": true,
  "middleware": ["throttle:100,1"],
  "routes": {
    "list":   { "method": "GET",    "path": "/api/sale",      "middleware": ["auth"] },
    "show":   { "method": "GET",    "path": "/api/sale/{id}", "middleware": ["auth"] },
    "create": { "method": "POST",   "path": "/api/sale",      "middleware": ["auth", "json"] },
    "update": { "method": "PUT",    "path": "/api/sale/{id}", "middleware": ["auth", "json"] },
    "delete": { "method": "DELETE", "path": "/api/sale/{id}", "middleware": ["auth"] }
  },
  "fields": [
    { "name": "user_id", "type": "int",      "required": true },
    { "name": "name",    "type": "string",   "required": true, "maxLength": 100 },
    { "name": "status",  "type": "tinyint",  "default": 1 },
    { "name": "dc",      "type": "datetime" },
    { "name": "du",      "type": "datetime" },
    { "name": "tc",      "type": "int" },
    { "name": "tu",      "type": "int" }
  ]
}
```

`timestamps: true` → ogController agrega `dc/tc` en create, `du/tu` en update automáticamente.
Los campos dc/du/tc/tu deben estar en `fields[]` aunque el framework los rellene.
Para deshabilitar una ruta: agregar `"enabled": false` en esa ruta del schema.

---

## QUÉ CUBRE ogController SOLO (sin Controller personalizado)

```
list()      → filtra por $_GET (excepto page/per_page/sort/order), pagina, ordena
show($id)   → find($id), 404 automático
create()    → valida required del schema, agrega timestamps, insert
update($id) → verifica existencia, agrega timestamps, update
delete($id) → verifica existencia, delete
```

Si esto es suficiente, no crear Controller. Aplica a catálogos, tablas de config, etc.

---

## CONTROLLER PERSONALIZADO

```php
<?php
class SaleController extends ogController {

  function __construct() {
    parent::__construct('sale'); // nombre del schema — obligatorio siempre
  }

  // Solo sobreescribir lo que necesita cambio — el resto hereda de ogController

  function create() {
    $data = ogRequest::data();

    // Validación custom + defaults
    if (empty($data['amount'])) {
      ogResponse::json(['success' => false, 'error' => __('sale.amount_required')], 200);
    }
    $data['sale_type']      = $data['sale_type']      ?? 'main';
    $data['process_status'] = $data['process_status'] ?? 'initiated';
    $data['dc'] = date('Y-m-d H:i:s');
    $data['tc'] = time();

    try {
      $id = ogDb::t('sales')->insert($data);
      ogResponse::success(['id' => $id], __('sale.create.success'), 201);
    } catch (Exception $e) {
      ogLog::error('SaleController::create', ['message' => $e->getMessage()], ['module' => 'sale']);
      ogResponse::serverError(__('sale.create.error'), OG_IS_DEV ? $e->getMessage() : null);
    }
  }

  function list() {
    $query = ogDb::t('sales');

    // Filtro por usuario autenticado (patrón común)
    if (isset($GLOBALS['auth_user_id'])) {
      $query = $query->where('user_id', $GLOBALS['auth_user_id']);
    }

    // Join si necesita datos de otra tabla
    // $query = $query->select(['sales.*', 'bots.name AS bot_name'])
    //   ->leftJoin('bots', 'sales.bot_id', '=', 'bots.id');

    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      $query = $query->where($key, $value);
    }

    $data = $query
      ->orderBy(ogRequest::query('sort', 'id'), ogRequest::query('order', 'DESC'))
      ->paginate(ogRequest::query('page', 1), ogRequest::query('per_page', 50))
      ->get();

    ogResponse::success($data ?? []);
  }

  // Método extra — se llama desde app/routes/sale.php
  function clone() {
    $data = ogRequest::data();
    // ...
    ogResponse::success(['id' => $newId], __('sale.clone.success'));
  }
}
```

**Reglas del Controller:**
- `extends ogController` + `parent::__construct('schema')` — obligatorio
- Sobreescribir solo los métodos que cambian
- Timestamps manuales: `dc/tc` en create, `du/tu` en update
- Siempre `try/catch` en operaciones DB
- Respuesta siempre via `ogResponse::*`
- Los métodos extra se llaman desde `routes/{modulo}.php`

---

## HANDLER

```php
<?php
class SaleHandler {

  private static $logMeta = ['module' => 'SaleHandler', 'layer' => 'app/resources'];

  // Sin extends — clase pura PHP
  // Todos los métodos static — nunca se instancia directamente
  // Retorna arrays con success/data/error — nunca llama ogResponse

  static function getByClient($params) {
    $sales = ogDb::t('sales')
      ->where('client_id', $params['client_id'])
      ->orderBy('dc', 'DESC')
      ->limit(ogRequest::query('limit', 50))
      ->get();
    return ['success' => true, 'data' => $sales ?? []];
  }

  static function updateStatus($saleId, $status) {
    $sale = ogDb::t('sales')->find($saleId);
    if (!$sale) return ['success' => false, 'error' => __('sale.not_found')];
    try {
      ogDb::t('sales')->where('id', $saleId)->update([
        'process_status' => $status,
        'du' => date('Y-m-d H:i:s'),
        'tu' => time()
      ]);
      return ['success' => true];
    } catch (Exception $e) {
      return ['success' => false, 'error' => $e->getMessage()];
    }
  }
}
```

**Cómo llamar al Handler:**

```php
// Desde rutas — handler() carga + retorna instancia, PHP permite instancia::static
ogResponse::json(ogApp()->handler('sale')::getByClient(['client_id' => $id]));

// Desde Controller — loadHandler() carga el archivo, luego llama static directamente
ogApp()->loadHandler('product');
ProductHandler::handleByContext($data, 'create');
```

---

## RUTAS CUSTOM — app/routes/{modulo}.php

```php
<?php
// app/routes/sale.php
// Las 5 rutas CRUD se auto-registran desde sale.json — NO redeclararlas aquí

$router->group('/api/sale', function($router) {

  // Delegar al Handler
  $router->get('/client/{client_id}', function($client_id) {
    ogResponse::json(ogApp()->handler('sale')::getByClient(['client_id' => $client_id]));
  })->middleware(['auth', 'throttle:100,1']);

  // Delegar a método extra del Controller
  $router->post('/clone', function() {
    ogApp()->controller('sale')->clone();
  })->middleware(['auth', 'json']);

  // Lógica inline si es puntual y no se reutiliza
  $router->put('/{id}/status', function($id) {
    $status = ogRequest::data()['status'] ?? null;
    if (!$status) ogResponse::json(['success' => false, 'error' => __('sale.status_required')], 400);
    ogResponse::json(ogApp()->handler('sale')::updateStatus($id, $status));
  })->middleware(['auth', 'json', 'throttle:100,1']);

});
```

---

## CHECKLIST

```
□ 1. app/resources/schemas/{modulo}.json
       resource, table, timestamps: true, middleware global,
       5 rutas CRUD con sus middleware, fields (timestamps al final)

□ 2. ¿ogController cubre todo?
       SÍ → fin, no crear más archivos
       NO → app/resources/controllers/{Modulo}Controller.php
            extends ogController + parent::__construct + solo métodos que cambian

□ 3. ¿Side-effects o lógica reutilizable?
       SÍ → app/resources/handlers/{Modulo}Handler.php
            sin extends, todos static, retorna arrays, nunca ogResponse
       NO → no crear Handler

□ 4. ¿Endpoints fuera del CRUD estándar?
       SÍ → app/routes/{modulo}.php — solo los extras
       NO → no crear routes/{modulo}.php
```

---

## ERRORES COMUNES

```
NO crear Controller sin que exista el schema      → fatal en parent::__construct
NO redeclarar las 5 rutas CRUD en routes/         → ya son automáticas del schema
NO olvidar parent::__construct('modulo')          → el Controller falla sin esto
NO usar métodos de instancia en Handler           → deben ser static
NO llamar ogResponse dentro del Handler           → solo en Controller y rutas
NO hardcodear paths absolutos                     → ogApp()->getPath('storage/...')
NO instanciar helpers directamente                → ogApp()->helper('nombre')
```