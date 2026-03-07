<?php
trait ogValidatesUnique {

  // Validar campo único (para create)
  public function validateUnique($table, $field, $value, $errorKey = null) {
    if (ogDb::table($table)->where($field, $value)->exists()) {
      $error = $errorKey ?? "validation.field_exists";
      ogResponse::error(__($error, ['field' => $field]), 400);
    }
  }

  // Validar campo único excepto ID actual (para update)
  public function validateUniqueExcept($table, $field, $value, $excludeId, $errorKey = null) {
    $exists = ogDb::table($table)
      ->where($field, $value)
      ->where('id', '!=', $excludeId)
      ->exists();

    if ($exists) {
      $error = $errorKey ?? "validation.field_exists";
      ogResponse::error(__($error, ['field' => $field]), 400);
    }
  }

  // Validar email (formato + unicidad)
  public function validateEmail($email, $table = null, $excludeId = null) {
    if (empty($email)) return;

    // Cargar ogValidation bajo demanda
    $validation = ogApp()->helper('validation');
    // Validar formato
    if (!$validation->email($email)) {
      ogResponse::error(__('validation.invalid_email'), 400);
    }

    // Validar unicidad si se especifica tabla
    if ($table) {
      if ($excludeId) {
        $this->validateUniqueExcept($table, 'email', $email, $excludeId, 'user.email_exists');
      } else {
        $this->validateUnique($table, 'email', $email, 'user.email_exists');
      }
    }
  }
}

/**
 * @doc-start
 * FILE: framework/traits/ogValidatesUnique.php
 * ROLE: Trait de validación de unicidad en DB. Usado por ogController y
 *       controllers personalizados que extiendan validaciones de campos únicos.
 *
 * MÉTODOS:
 *   validateUnique($table, $field, $value, $errorKey)
 *     → valida que $value no exista en $table.$field (para create)
 *     → ogResponse::error() HTTP 400 si ya existe
 *
 *   validateUniqueExcept($table, $field, $value, $excludeId, $errorKey)
 *     → igual pero excluye el registro actual por id (para update)
 *
 *   validateEmail($email, $table, $excludeId)
 *     → valida formato email via ogValidation
 *     → si se pasa $table también valida unicidad
 *     → si se pasa $excludeId usa validateUniqueExcept (para update)
 *
 * USO EN CONTROLLER:
 *   class UserController extends ogController {
 *     function create() {
 *       $data = ogRequest::data();
 *       $this->validateEmail($data['email'], 'users');
 *       $this->validateUnique('users', 'phone', $data['phone']);
 *     }
 *     function update($id) {
 *       $data = ogRequest::data();
 *       $this->validateEmail($data['email'], 'users', $id);
 *     }
 *   }
 * @doc-end
 */