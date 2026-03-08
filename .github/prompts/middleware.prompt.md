# Middleware & Traits

> Middleware disponibles en rutas y traits de validación.
> Generado: 2026-03-07 19:35:47

---

### `framework/middleware/ogAuthMiddleware.php`

```
FILE: framework/middleware/ogAuthMiddleware.php
ROLE: Valida sesión activa via Bearer token en cada request protegida.

FLUJO:
  1. Extrae Bearer token del header Authorization
  2. Busca archivo de sesión en storage/sessions/ por los primeros 16 chars del token
  3. Verifica que no esté expirada
  4. Inyecta user_id y user en $GLOBALS y ogCache::memory
  5. Limpieza oportunista de sesiones expiradas (máx 10 archivos por request)

SESIONES:
  Formato de archivo: {expires}_{userId}_{token16}.json
  $GLOBALS['auth_user_id'] y $GLOBALS['auth_user'] quedan disponibles globalmente
  ogCache::memoryGet('auth_user_id') disponible en el resto del ciclo

ERRORES:
  401 → token ausente, inválido o expirado
  500 → versión de PHP insuficiente (solo OG_IS_DEV, verifica 1 vez por sesión)
```

### `framework/middleware/ogJsonMiddleware.php`

```
FILE: framework/middleware/ogJsonMiddleware.php
ROLE: Valida que el request tenga Content-Type: application/json y body JSON válido.
      Retorna 400 si el Content-Type es incorrecto o el JSON está malformado.
```

### `framework/middleware/ogThrottleMiddleware.php`

```
FILE: framework/middleware/ogThrottleMiddleware.php
ROLE: Rate limiting por IP y ruta. Limita el número de requests en una ventana
      de tiempo. Persiste contadores en storage/middleware/throttle_data.json.

USO EN RUTAS:
  ->middleware(['throttle:60,1'])   → max 60 requests por minuto
  ->middleware(['throttle:10,5'])   → max 10 requests cada 5 minutos

HEADERS DE RESPUESTA:
  X-RateLimit-Limit     → máximo permitido
  X-RateLimit-Remaining → requests restantes
  X-RateLimit-Reset     → timestamp de reset (si fue bloqueado)
  Retry-After           → segundos para reintentar (si fue bloqueado)

ERRORES:
  429 → límite excedido (loguea IP, path y contadores via ogLog::warning)

NOTAS:
  - Key única por MD5(ip + path)
  - Limpieza automática de entradas con más de 1 hora al guardar
```

### `framework/middleware/ogDevMiddleware.php`

```
FILE: framework/middleware/ogDevMiddleware.php
ROLE: Restringe el acceso a rutas solo para entorno local (localhost).
      Retorna 403 si la request no viene de localhost.
```

### `framework/traits/ogValidatesUnique.php`

```
FILE: framework/traits/ogValidatesUnique.php
ROLE: Trait de validación de unicidad en DB. Usado por ogController y
      controllers personalizados que extiendan validaciones de campos únicos.

MÉTODOS:
  validateUnique($table, $field, $value, $errorKey)
    → valida que $value no exista en $table.$field (para create)
    → ogResponse::error() HTTP 400 si ya existe

  validateUniqueExcept($table, $field, $value, $excludeId, $errorKey)
    → igual pero excluye el registro actual por id (para update)

  validateEmail($email, $table, $excludeId)
    → valida formato email via ogValidation
    → si se pasa $table también valida unicidad
    → si se pasa $excludeId usa validateUniqueExcept (para update)

USO EN CONTROLLER:
  class UserController extends ogController {
    function create() {
      $data = ogRequest::data();
      $this->validateEmail($data['email'], 'users');
      $this->validateUnique('users', 'phone', $data['phone']);
    }
    function update($id) {
      $data = ogRequest::data();
      $this->validateEmail($data['email'], 'users', $id);
    }
  }
```
