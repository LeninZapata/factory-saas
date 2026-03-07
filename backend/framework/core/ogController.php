<?php

// Cargar trait antes de declarar la clase
if (!trait_exists('ogValidatesUnique')) {
  require_once OG_FRAMEWORK_PATH . '/traits/ogValidatesUnique.php';
}

class ogController {
  use ogValidatesUnique;

  private $config, $table, $resource;

  function __construct($resourceName) {
    // Buscar schema: app → middle → framework
    $configFile = ogApp()->getPath() . "/resources/schemas/{$resourceName}.json";
    if (!file_exists($configFile)) {
      $configFile = OG_FRAMEWORK_PATH . "/../middle/resources/schemas/{$resourceName}.json";
    }
    if (!file_exists($configFile)) {
      $configFile = OG_FRAMEWORK_PATH . "/resources/schemas/{$resourceName}.json";
    }

    if (!file_exists($configFile)) {
      ogResponse::error(__('core.controller.resource_not_found', ['resource' => $resourceName]), 404);
    }

    $this->config = json_decode(file_get_contents($configFile), true);
    $this->table = $this->config['table'];
    $this->resource = $resourceName;

    // Cargar handlers personalizados si existen: app → middle → framework
    $handlerFile = ogApp()->getPath() . "/resources/handlers/" . ucfirst($resourceName) . "Handler.php";
    if (file_exists($handlerFile)) {
      require_once $handlerFile;
    } else {
      $handlerFile = OG_FRAMEWORK_PATH . "/../middle/resources/handlers/" . ucfirst($resourceName) . "Handler.php";
      if (file_exists($handlerFile)) {
        require_once $handlerFile;
      } else {
        $handlerFile = OG_FRAMEWORK_PATH . "/resources/handlers/og" . ucfirst($resourceName) . "Handler.php";
        if (file_exists($handlerFile)) require_once $handlerFile;
      }
    }
  }

  // LIST - Obtener todos
  function list() {
    $query = ogDb::table($this->table);

    // Filtros dinámicos desde query params
    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      $query = $query->where($key, $value);
    }

    // Ordenamiento
    $sort = ogRequest::query('sort', 'id');
    $order = ogRequest::query('order', 'ASC');
    $query = $query->orderBy($sort, $order);

    // Paginación
    $page = ogRequest::query('page', 1);
    $perPage = ogRequest::query('per_page', 50);
    $data = $query->paginate($page, $perPage)->get();

    ogResponse::success($data);
  }

  // SHOW - Obtener uno
  function show($id) {
    $data = ogDb::table($this->table)->find($id);
    if (!$data) ogResponse::notFound(__('core.controller.not_found', ['resource' => $this->resource]));
    ogResponse::success($data);
  }

  // CREATE - Crear
  function create() {
    $data = ogRequest::data();

    // Validar campos requeridos
    $required = $this->getRequiredFields();
    $validation = ogApp()->helper('validation')->required($data, $required);
    if (!$validation['valid']) ogResponse::validation($validation['errors']);

    // Timestamps
    if ($this->config['timestamps'] ?? false) {
      $data['created_at'] = date('Y-m-d H:i:s');
    } else {
      $data['dc'] = date('Y-m-d H:i:s');
      $data['tc'] = time();
    }

    $id = ogDb::table($this->table)->insert($data);
    ogResponse::success(['id' => $id], __('core.controller.created', ['resource' => $this->resource]), 201);
  }

  // UPDATE - Actualizar
  function update($id) {
    $exists = ogDb::table($this->table)->find($id);
    if (!$exists) ogResponse::notFound(__('core.controller.not_found', ['resource' => $this->resource]));

    $data = ogRequest::data();

    // Timestamps
    if ($this->config['timestamps'] ?? false) {
      $data['updated_at'] = date('Y-m-d H:i:s');
    } else {
      $data['du'] = date('Y-m-d H:i:s');
      $data['tu'] = time();
    }

    $affected = ogDb::table($this->table)->where('id', $id)->update($data);
    ogResponse::success(['affected' => $affected], __('core.controller.updated', ['resource' => $this->resource]));
  }

  // DELETE - Eliminar
  function delete($id) {
    $exists = ogDb::table($this->table)->find($id);
    if (!$exists) ogResponse::notFound(__('core.controller.not_found', ['resource' => $this->resource]));

    $affected = ogDb::table($this->table)->where('id', $id)->delete();
    ogResponse::success(['affected' => $affected], __('core.controller.deleted', ['resource' => $this->resource]));
  }

  // Obtener campos requeridos del schema
  private function getRequiredFields() {
    $required = [];
    foreach ($this->config['fields'] ?? [] as $field) {
      if ($field['required'] ?? false) {
        $required[] = $field['name'];
      }
    }
    return $required;
  }
}

/**
 * @doc-start
 * FILE: framework/core/ogController.php
 * ROLE: Controller CRUD genérico basado en schema JSON. Se instancia
 *       automáticamente desde ogApi.php cuando no existe controller personalizado.
 *
 * USO DIRECTO (en rutas manuales):
 *   $ctrl = new ogController('user');
 *   $router->get('/api/user', [$ctrl, 'list']);
 *
 * ACCIONES DISPONIBLES:
 *   list($id)    → GET    /api/{module}       filtros dinámicos desde ?campo=valor
 *   show($id)    → GET    /api/{module}/{id}
 *   create()     → POST   /api/{module}       valida campos required del schema
 *   update($id)  → PUT    /api/{module}/{id}
 *   delete($id)  → DELETE /api/{module}/{id}
 *
 * TIMESTAMPS AUTOMÁTICOS:
 *   timestamps: true  → created_at / updated_at
 *   timestamps: false → dc / tc (create) y du / tu (update)
 *
 * BÚSQUEDA DE SCHEMA (orden):
 *   app/resources/schemas/{module}.json
 *   middle/resources/schemas/{module}.json
 *   framework/resources/schemas/{module}.json
 *
 * BÚSQUEDA DE HANDLER PERSONALIZADO (orden):
 *   app/resources/handlers/{Module}Handler.php
 *   middle/resources/handlers/{Module}Handler.php
 *   framework/resources/handlers/og{Module}Handler.php
 *
 * PAGINACIÓN (list):
 *   ?page=1&per_page=50&sort=id&order=ASC
 *
 * TRAITS:
 *   ogValidatesUnique → validación de campos únicos en DB
 * @doc-end
 */