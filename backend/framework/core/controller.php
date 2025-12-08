<?php
// Controller - Controlador basado en schemas JSON
class controller {
  private $config, $table, $resource;

  function __construct($resourceName) {
    $configFile = BACKEND_PATH . "/resources/{$resourceName}.json";

    if (!file_exists($configFile)) {
      response::error("Resource '$resourceName' not found", 404);
    }

    $this->config = json_decode(file_get_contents($configFile), true);
    $this->table = $this->config['table'];
    $this->resource = $resourceName;

    // Cargar handlers personalizados si existen
    $handlerFile = BACKEND_PATH . "/resources/handlers/{$resourceName}Handlers.php";
    if (file_exists($handlerFile)) require_once $handlerFile;
  }

  // LIST - Obtener todos
  function list() {
    $query = db::table($this->table);

    // Filtros dinámicos desde query params
    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      $query = $query->where($key, $value);
    }

    // Ordenamiento
    $sort = request::query('sort', 'id');
    $order = request::query('order', 'ASC');
    $query = $query->orderBy($sort, $order);

    // Paginación
    $page = request::query('page', 1);
    $perPage = request::query('per_page', 50);
    $data = $query->paginate($page, $perPage)->get();

    response::success($data);
  }

  // SHOW - Obtener uno
  function show($id) {
    $data = db::table($this->table)->find($id);
    if (!$data) response::notFound("{$this->resource} not found");
    response::success($data);
  }

  // CREATE - Crear
  function create() {
    $data = request::data();

    // Validar campos requeridos
    $required = $this->getRequiredFields();
    $validation = validation::required($data, $required);
    if (!$validation['valid']) response::validation($validation['errors']);

    // Validar campos únicos
    $this->validateUnique($data);

    // Timestamps
    if ($this->config['timestamps'] ?? false) {
      $data['created_at'] = date('Y-m-d H:i:s');
    }

    $id = db::table($this->table)->insert($data);
    response::success(['id' => $id], "{$this->resource} created", 201);
  }

  // UPDATE - Actualizar
  function update($id) {
    $exists = db::table($this->table)->find($id);
    if (!$exists) response::notFound("{$this->resource} not found");

    $data = request::data();

    // Validar campos únicos (excepto el registro actual)
    $this->validateUnique($data, $id);

    // Timestamps
    if ($this->config['timestamps'] ?? false) {
      $data['updated_at'] = date('Y-m-d H:i:s');
    }

    $affected = db::table($this->table)->where('id', $id)->update($data);
    response::success(['affected' => $affected], "{$this->resource} updated");
  }

  // DELETE - Eliminar
  function delete($id) {
    $exists = db::table($this->table)->find($id);
    if (!$exists) response::notFound("{$this->resource} not found");

    $affected = db::table($this->table)->where('id', $id)->delete();
    response::success(['affected' => $affected], "{$this->resource} deleted");
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

  // Validar campos únicos
  private function validateUnique($data, $excludeId = null) {
    foreach ($this->config['fields'] ?? [] as $field) {
      if (($field['unique'] ?? false) && isset($data[$field['name']])) {
        $query = db::table($this->table)->where($field['name'], $data[$field['name']]);

        // Excluir el registro actual en updates
        if ($excludeId) $query = $query->where('id', '!=', $excludeId);

        if ($query->exists()) {
          response::error("{$field['name']} already exists", 400);
        }
      }
    }
  }
}