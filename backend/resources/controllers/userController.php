<?php
// userController - Override del controller para user
class userController extends controller {

  function __construct() {
    parent::__construct('user');
  }

  // Override create para hashear contraseña
  function create() {
    $data = request::data();
    
    log::debug('UserController - create - Data recibida', $data);

    // Validar campos requeridos
    if (!isset($data['user']) || !isset($data['pass'])) {
      log::error('UserController - create - Campos faltantes', ['user' => isset($data['user']), 'pass' => isset($data['pass'])]);
      response::json(['success' => false, 'error' => 'Usuario y contraseña son requeridos'], 200);
    }

    // Hashear contraseña
    $data['pass'] = password_hash($data['pass'], PASSWORD_BCRYPT);

    // Convertir config a JSON si es array
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Timestamps
    $data['dc'] = date('Y-m-d H:i:s');
    $data['tc'] = time();

    log::debug('UserController - create - Data procesada', $data);

    // Validar user único
    if (db::table('user')->where('user', $data['user'])->exists()) {
      log::warning('UserController - create - Usuario ya existe', ['user' => $data['user']]);
      response::json(['success' => false, 'error' => 'El usuario ya existe'], 200);
    }

    // Validar email único si se proporciona
    if (isset($data['email']) && !empty($data['email'])) {
      if (db::table('user')->where('email', $data['email'])->exists()) {
        log::warning('UserController - create - Email ya existe', ['email' => $data['email']]);
        response::json(['success' => false, 'error' => 'El email ya existe'], 200);
      }
    }

    try {
      $id = db::table('user')->insert($data);
      log::info('UserController - create - Usuario creado', ['id' => $id]);
      response::success(['id' => $id], 'Usuario creado', 201);
    } catch (Exception $e) {
      log::error('UserController - create - Error SQL', [
        'message' => $e->getMessage(),
        'data' => $data
      ]);
      response::json(['success' => false, 'error' => 'Error al crear usuario: ' . $e->getMessage()], 200);
    }
  }

  // Override update para hashear contraseña si se proporciona
  function update($id) {
    $exists = db::table('user')->find($id);
    if (!$exists) response::notFound('Usuario no encontrado');

    $data = request::data();

    // Hashear contraseña si se proporciona
    if (isset($data['pass']) && !empty($data['pass'])) {
      $data['pass'] = password_hash($data['pass'], PASSWORD_BCRYPT);
    } else {
      unset($data['pass']); // No actualizar si está vacío
    }

    // Convertir config a JSON si es array
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Validar user único (excepto el actual)
    if (isset($data['user'])) {
      $query = db::table('user')->where('user', $data['user'])->where('id', '!=', $id);
      if ($query->exists()) {
        response::error('El usuario ya existe', 400);
      }
    }

    // Validar email único (excepto el actual)
    if (isset($data['email']) && !empty($data['email'])) {
      $query = db::table('user')->where('email', $data['email'])->where('id', '!=', $id);
      if ($query->exists()) {
        response::error('El email ya existe', 400);
      }
    }

    // Timestamps
    $data['du'] = date('Y-m-d H:i:s');
    $data['tu'] = time();

    $affected = db::table('user')->where('id', $id)->update($data);
    response::success(['affected' => $affected], 'Usuario actualizado');
  }

  // Override show para no devolver la contraseña
  function show($id) {
    $data = db::table('user')->find($id);
    if (!$data) response::notFound('Usuario no encontrado');
    
    unset($data['pass']);
    response::success($data);
  }

  // Override list para no devolver contraseñas
  function list() {
    $query = db::table('user');

    // Filtros dinámicos
    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      if ($key === 'pass') continue; // No permitir filtrar por contraseña
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

    // Remover contraseñas
    foreach ($data as &$user) {
      unset($user['pass']);
    }

    response::success($data);
  }
}