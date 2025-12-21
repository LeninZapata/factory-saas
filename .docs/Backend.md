# Backend PHP - Documentación Completa

Documentación del framework PHP minimalista orientado a alto rendimiento y desarrollo rápido de SaaS.

---

## 📁 Estructura del Backend

```
backend/
├── api.php                 # Entry point del API REST
├── .htaccess              # Rewrite rules
├── framework/             # Núcleo portable (NO modificar)
│   ├── config/
│   │   └── init.php       # Inicialización del framework
│   ├── core/
│   │   ├── Application.php    # Ciclo de vida del request
│   │   ├── autoload.php       # Autoloader inteligente
│   │   ├── controller.php     # Controlador base CRUD
│   │   ├── router.php         # Sistema de rutas
│   │   ├── service.php        # Orquestador de servicios
│   │   └── resource.php       # Helper fluido (alternativa)
│   ├── helpers/
│   │   ├── db.php            # Query builder
│   │   ├── request.php       # Manejo de peticiones
│   │   ├── response.php      # Respuestas JSON
│   │   ├── log.php           # Sistema de logging
│   │   ├── logReader.php     # Lectura de logs
│   │   ├── lang.php          # Internacionalización (lazy)
│   │   ├── validation.php    # Validación de datos
│   │   ├── http.php          # Cliente HTTP
│   │   ├── file.php          # Manejo de archivos
│   │   ├── utils.php         # Utilidades generales
│   │   ├── str.php           # Manipulación strings
│   │   ├── url.php           # Manejo URLs
│   │   ├── country.php       # Info de países
│   │   ├── sessionCleanup.php # Limpieza sesiones
│   │   └── routeDiscovery.php # Descubrimiento rutas
│   ├── middleware/
│   │   ├── authMiddleware.php    # Autenticación
│   │   ├── jsonMiddleware.php    # Validación JSON
│   │   └── throttleMiddleware.php # Rate limiting
│   ├── traits/
│   │   └── ValidatesUnique.php   # Validaciones reutilizables
│   ├── services/              # Servicios de integración
│   │   ├── ai.php            # AI (DeepSeek, OpenAI)
│   │   ├── chatapi.php       # WhatsApp (Evolution)
│   │   ├── email.php         # Email
│   │   └── storage.php       # Storage
│   ├── lang/                  # Traducciones framework
│   │   └── es/
│   │       ├── api.php
│   │       ├── auth.php
│   │       ├── core.php
│   │       ├── validation.php
│   │       └── services/
│   └── docs/                  # Mini-documentación
│       ├── db.md
│       ├── router.md
│       ├── controller.md
│       └── ...
└── app/                       # Lógica específica del proyecto
    ├── config/
    │   ├── init.php          # Inicialización del app
    │   ├── consts.php        # Constantes del app
    │   └── database.php      # Configuración BD
    ├── routes/
    │   ├── api.php           # Router principal
    │   └── apis/             # Rutas manuales por módulo
    │       ├── auth.php
    │       ├── user.php
    │       └── client.php
    ├── resources/
    │   ├── schemas/          # Schemas JSON (auto-CRUD)
    │   │   ├── user.json
    │   │   └── client.json
    │   ├── controllers/      # Controllers personalizados
    │   │   └── UserController.php
    │   └── handlers/         # Handlers custom
    │       ├── AuthHandler.php
    │       └── ClientHandler.php
    ├── storage/
    │   ├── logs/             # Logs del sistema
    │   └── sessions/         # Sesiones (archivos)
    └── lang/                 # Traducciones del app
        └── es/
            ├── user.php
            └── client.php
```

---

## 🚀 api.php - Entry Point

**Propósito:** Entry point del API REST con manejo de CORS, errores y validación de respuestas.

### Configuración Inicial

**CORS Headers:**
```php
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Manejo de Preflight:**
- OPTIONS request → 200 y exit

### Flujo de Ejecución

```
1. Output buffering (ob_start)
   └─ Captura warnings/notices no deseados

2. Carga configuración
   └─ app/config/init.php
      └─ Define constantes (BASE_PATH, IS_DEV, DB_*, etc.)

3. Error handling
   ├─ IS_DEV: muestra todos los errores
   └─ Producción: oculta errores

4. Carga Application
   └─ new Application()
      ├─ Carga autoload
      ├─ Carga router
      └─ Carga rutas (app/routes/api.php)

5. Ejecuta request
   └─ $app->run()
      ├─ Captura segundo buffer
      ├─ $router->dispatch()
      ├─ Ejecuta middlewares
      ├─ Ejecuta controller/handler
      └─ Maneja excepciones

6. Validación de respuesta
   ├─ Valida JSON
   ├─ Si inválido → Error con debug
   └─ Envía respuesta
```

### Características Clave

✅ **Zero output antes de JSON** - Previene headers corrupted  
✅ **Validación de JSON** - No envía respuestas malformadas  
✅ **Debug condicional** - Info detallada solo en desarrollo  
✅ **CORS automático** - Sin configuración adicional  

---

## ⚙️ config/ - Configuración

### app/config/init.php

**Propósito:** Punto de entrada de configuración del app.

```php
<?php
// Rutas base
define('BASE_PATH', dirname(dirname(__DIR__)));
define('BACKEND_PATH', BASE_PATH . '/backend');
define('FRAMEWORK_PATH', BACKEND_PATH . '/framework');
define('APP_PATH', BACKEND_PATH . '/app');

// Cargar framework
require_once FRAMEWORK_PATH . '/config/init.php';

// Cargar constantes del app
require_once __DIR__ . '/consts.php';
```

### app/config/database.php

**Propósito:** Configuración de base de datos con auto-detección.

```php
<?php
return [
  'host' => isLocalhost() ? 'localhost' : 'produccion.com',
  'name' => isLocalhost() ? 'mi_proyecto' : 'db_prod',
  'user' => isLocalhost() ? 'root' : 'user_prod',
  'pass' => isLocalhost() ? '' : 'pass_prod',
  'charset' => 'utf8mb4'
];
```

### app/config/consts.php

**Propósito:** Constantes específicas del proyecto.

```php
<?php
$dbConfig = require __DIR__ . '/database.php';

define('DB_HOST', $dbConfig['host']);
define('DB_NAME', $dbConfig['name']);
define('DB_USER', $dbConfig['user']);
define('DB_PASS', $dbConfig['pass']);
define('DB_CHARSET', $dbConfig['charset']);

define('SESSION_TTL', TIME_MONTH);
define('SESSION_TTL_MS', TIME_MONTH * 1000);
```

### framework/config/init.php

**Propósito:** Inicialización del framework (NO modificar).

**Define:**
- Constantes de tiempo (TIME_SECOND, TIME_MINUTE, etc.)
- Rutas del framework (SERVICES_PATH, etc.)
- Carga helpers críticos (system, lang, log)
- Configura timezone, error_reporting
- lang::load('es') - Solo guarda locale

---

## 🎯 core/ - Clases Principales

### Application.php

**Propósito:** Maneja el ciclo de vida completo de cada request.

**Responsabilidades:**
1. Cargar autoloader
2. Inicializar router
3. Cargar rutas del app
4. Ejecutar dispatch
5. Capturar excepciones
6. Validar JSON de salida
7. Manejar errores (detallado en dev, genérico en prod)

**Uso:**
```php
$app = new Application();
$app->run();
```

### autoload.php

**Propósito:** SPL autoloader inteligente con mapa estático + lazy loading.

**Orden de Búsqueda (lazy loading):**
```
1. Helpers      → /framework/helpers/{class}.php
2. Core         → /framework/core/{class}.php
3. Middleware   → /framework/middleware/{class}.php
4. Controllers  → /app/resources/controllers/{class}.php
5. Handlers     → /app/resources/handlers/{class}.php
6. Traits       → /framework/traits/{class}.php
7. Services     → Auto-discovery por categoría
```

**Mapa Estático (pre-cargados):**
- controller, router, resource, service
- request, response, db

**Auto-discovery de Services:**
Busca por categorías: `ai/deepseek`, `email/plusemail`, etc.

### controller.php

**Propósito:** Controller base con CRUD automático desde schemas JSON.

**Constructor:**
```php
function __construct($resourceName) {
  // Carga resources/{resourceName}.json
}
```

**Métodos CRUD Automáticos:**

1. **list()** - GET all
   - Filtros dinámicos desde query params
   - Paginación: `?page=1&per_page=50`
   - Ordenamiento: `?sort=name&order=ASC`

2. **show($id)** - GET one
   - Busca por ID
   - 404 si no existe

3. **create()** - POST
   - Validación de campos `required` desde schema
   - Validación de campos `unique` desde schema
   - Timestamps automáticos si `timestamps: true`

4. **update($id)** - PUT
   - Validación de existencia
   - Timestamps de actualización
   - Validación de unique (excluyendo ID actual)

5. **delete($id)** - DELETE
   - Validación de existencia
   - Eliminación física

**Características:**
✅ Validación automática desde schema  
✅ Timestamps automáticos (dc, du, tc, tu)  
✅ Filtros dinámicos desde URL  
✅ Override de métodos para lógica custom  

**Ejemplo de Override:**
```php
class UserController extends controller {
  use ValidatesUnique;

  function __construct() {
    parent::__construct('user');
  }

  function create() {
    $data = request::data();
    
    // Validaciones custom
    $this->validateUnique('user', 'user', $data['user'], 'user.already_exists');
    
    // Hash de password
    $data['pass'] = password_hash($data['pass'], PASSWORD_BCRYPT);
    
    // Llamar al padre para insertar
    parent::create();
  }
}
```

### router.php

**Propósito:** Router minimalista con middleware, grupos y rutas dinámicas.

**Métodos de Registro:**
```php
$router->get($path, $handler);
$router->post($path, $handler);
$router->put($path, $handler);
$router->delete($path, $handler);
```

**Formatos de Handler:**
```php
// Closure
$router->get('/hello', function() {
  response::json(['message' => 'Hello']);
});

// Array [Class, method]
$router->get('/user', [UserController::class, 'list']);

// String "Class@method"
$router->get('/user', 'UserController@list');
```

**Rutas Dinámicas:**
```php
$router->get('/user/{id}', function($id) {
  $user = db::table('user')->find($id);
  response::success($user);
});
```

**Middleware:**
```php
// Individual
$router->post('/user', [UserController::class, 'create'])
  ->middleware(['auth', 'json']);

// Grupo
$router->group('/api/admin', function($r) {
  $r->get('/stats', 'AdminController@stats');
})->middleware('auth');
```

**dispatch():**
- Normaliza URL (sin trailing slash, sin slashes duplicados)
- Ejecuta middlewares en orden
- Ejecuta handler
- Maneja errores

### service.php

**Propósito:** Orquestador de servicios de integración.

**Uso:**
```php
// Acceder a servicio
$ai = service::integration('ai');
$response = $ai->getChatCompletion($prompt, $bot);

// Detectar provider automáticamente
$provider = service::detect('chatapi', $webhookData);
```

**Servicios Disponibles:**
- `ai` - DeepSeek, OpenAI
- `chatapi` - Evolution API
- `email` - PlusEmail
- `storage` - Local storage

---

## 🛠️ helpers/ - Utilidades

### db.php - Query Builder

**Propósito:** Query builder fluido estilo Laravel con soporte completo.

**Uso Básico:**
```php
// Select
$users = db::table('user')->where('role', 'admin')->get();
$user = db::table('user')->find(1);

// Insert
$id = db::table('user')->insert(['user' => 'john', 'pass' => '...']);

// Update
db::table('user')->where('id', 1)->update(['email' => 'new@mail.com']);

// Delete
db::table('user')->where('id', 1)->delete();
```

**Métodos Avanzados:**
```php
// WhereIn
$users = db::table('user')->whereIn('id', [1, 5, 10])->get();

// WhereFilters (★ MUY ÚTIL)
$filters = [
  ['status', '=', 'active'],
  ['age', '>=', 18],
  ['name', 'LIKE', '%john%'],
  ['role', 'IN', ['admin', 'editor']],
  ['deleted_at', 'NULL'],
  ['price', 'BETWEEN', [100, 500]]
];
$users = db::table('user')->whereFilters($filters)->get();

// Joins
db::table('user')
  ->join('client', 'user.id', '=', 'client.user_id')
  ->where('user.status', 'active')
  ->get();

// Paginación
$users = db::table('user')->paginate(1, 20)->get();
```

**Métodos Útiles (Shortcuts):**
```php
$user = db::table('user')->first();              // Primer resultado
$count = db::table('user')->count();             // Contar registros
$exists = db::table('user')->exists();           // true/false
$emails = db::table('user')->pluck('email');     // Array de columna
$name = db::table('user')->value('name');        // Un solo valor
$users = db::table('user')->skip(10)->take(5);  // Offset/Limit
```

**Debug:**
```php
$sql = db::table('user')->where('id', 1)->getSql();  // SQL con valores
$sql = db::table('user')->where('id', 1)->toSql();   // SQL con placeholders
```

### request.php - Peticiones HTTP

**Propósito:** Helpers para acceder a datos del request.

```php
$data = request::data();              // Body JSON o form
$page = request::query('page', 1);    // Query params con default
$token = request::bearerToken();      // Bearer token
$method = request::method();          // GET, POST, etc.
$ip = request::ip();                  // IP del cliente
$path = request::path();              // /api/user
$isAjax = request::isAjax();          // true/false
```

### response.php - Respuestas JSON

**Propósito:** Helpers para enviar respuestas HTTP/JSON estandarizadas.

```php
// Éxito
response::success(['user' => $user], 'Usuario creado', 201);
// Output: {"success":true, "message":"Usuario creado", "data":{...}}

// Error
response::error('Usuario no encontrado', 404);
// Output: {"success":false, "error":"Usuario no encontrado"}

// Validación
response::validation(['email' => 'Email inválido']);

// Shortcuts
response::notFound();
response::unauthorized();
response::forbidden();
response::serverError('Error interno', $debug);
```

**Fix implementado:**
```php
// ✅ Ahora permite arrays vacíos
response::success([]);  // {"success":true, "data":[]}
response::success(0);   // {"success":true, "data":0}
```

### log.php - Sistema de Logging

**Propósito:** Logging estructurado con niveles, módulos, tags y rotación.

```php
log::debug('Debug info', $ctx, ['module' => 'auth']);
log::info('Usuario logueado', ['user_id' => 1], ['module' => 'auth']);
log::warning('Sesión expirada', [], ['module' => 'session']);
log::error('Error en DB', ['error' => $e], ['module' => 'database']);

// Con tags
log::info('Mensaje enviado', $data, [
  'module' => 'whatsapp',
  'tags' => ['message', 'sent']
]);

// Con custom vars
log::info('Pago procesado', [], [
  'module' => 'payment',
  'custom' => ['user_id' => 5, 'amount' => 100]
]);
```

**Formato:**
```
[timestamp] [level] [module] [message] [context_json] [file:line] [user_id] [tags]
```

**Archivo:** `storage/logs/api_{fecha}.log`

### lang.php - Internacionalización (Lazy Loading)

**Propósito:** Traducciones multi-idioma con carga bajo demanda y cache.

**Características:**
✅ **Lazy loading** - Solo carga módulos que usas  
✅ **Cache en memoria** - No requiere dos veces  
✅ **Merge automático** - Framework + App  

```php
// Cargar idioma (solo guarda locale, NO carga archivos)
lang::load('es');

// Obtener traducción (carga módulo bajo demanda)
__('auth.login.success');          // Carga SOLO auth.php
__('core.error');                  // Carga SOLO core.php
__('services.ai.no_services');     // Carga SOLO services/

// Con variables
__('user.created', ['name' => 'Juan']);
// Output: "Usuario Juan creado exitosamente"
```

**Flujo interno:**
```
1. __('core.autoload.class_not_found')
   └─ Extrae módulo: 'core'
   └─ ¿En cache? NO
   └─ loadModule('core')
      ├─ require /framework/lang/es/core.php
      ├─ require /app/lang/es/core.php (si existe)
      └─ array_merge() y guardar en cache
   └─ Retorna traducción

2. __('core.router.not_found')
   └─ Extrae módulo: 'core'
   └─ ¿En cache? SÍ ✅
   └─ Retorna traducción (sin require)
```

**Debug:**
```php
lang::getLoadedModules();  // ['core', 'auth', 'middleware']
lang::getCacheStats();     // Estadísticas completas
```

### validation.php - Validación de Datos

```php
validation::email('user@example.com');  // true/false
validation::phone('+593987654321');
validation::url('https://example.com');
validation::numeric('123');
validation::range(50, 1, 100);

$result = validation::required($data, ['user', 'pass', 'email']);
// Returns: ['valid' => bool, 'errors' => [...]]
```

### Otros Helpers Útiles

**logReader.php** - Leer y filtrar logs
```php
$logs = logReader::today(100);
$logs = logReader::filter($logs, ['level' => 'ERROR', 'module' => 'auth']);
```

**sessionCleanup.php** - Limpieza optimizada de sesiones
```php
sessionCleanup::clean();
sessionCleanup::cleanByUserId($userId);
$stats = sessionCleanup::stats();
```

**routeDiscovery.php** - Descubrir endpoints
```php
$routes = routeDiscovery::getAllRoutes();
$stats = routeDiscovery::getStats($routes);
```

**utils.php** - Utilidades generales
```php
utils::uuid();
utils::token(64);
utils::slug('Hello World');
utils::timeAgo($datetime);
```

**str.php** - Manipulación de strings
```php
str::normalize('Café');  // 'cafe'
str::containsAllWords('hola mundo', 'este es un hola mundo');
str::isJson($string);
```

**file.php** - Manejo de archivos
```php
file::saveJson($path, $data, 'module');
file::getJson($path);
file::delete($path);
```

**country.php** - Información de países
```php
country::get('EC');  // ['name' => 'Ecuador', 'timezone' => 'America/Guayaquil']
country::now('EC');  // Hora actual en Ecuador
country::convert($datetime, 'EC', 'ES');
```

---

## 🎭 traits/ - Código Reutilizable

### ValidatesUnique.php

**Propósito:** Validaciones de unicidad para controllers.

**Uso:**
```php
class UserController extends controller {
  use ValidatesUnique;
  
  function create() {
    $data = request::data();
    
    // Validar email (formato + unicidad)
    $this->validateEmail($data['email'], 'user');
    
    // Validar campo único
    $this->validateUnique('user', 'user', $data['user'], 'user.already_exists');
    
    // ...
  }
  
  function update($id) {
    $data = request::data();
    
    // Validar único excepto ID actual
    $this->validateUniqueExcept('user', 'email', $data['email'], $id);
    
    // ...
  }
}
```

**Métodos:**
- `validateUnique($table, $field, $value, $errorKey)`
- `validateUniqueExcept($table, $field, $value, $excludeId, $errorKey)`
- `validateEmail($email, $table, $excludeId)`

---

## 🔐 middleware/ - Interceptores

### authMiddleware.php

**Propósito:** Validar token de autenticación usando sesiones en archivos.

**Flujo:**
```
1. Extrae token: Authorization: Bearer {token}
2. Busca archivo optimizado: {timestamp}_{user_id}_{token_short}.json
3. Verifica expiración
4. Carga user en $GLOBALS['auth_user']
5. Guarda user_id en $GLOBALS['auth_user_id']
```

**Respuestas:**
- Sin token → 401 "Token no proporcionado"
- Token inválido → 401 "Token inválido"
- Token expirado → 401 "Token expirado" (elimina archivo)

**Uso:**
```php
$router->get('/api/user/profile', 'UserHandler@profile')
  ->middleware('auth');
```

### jsonMiddleware.php

**Propósito:** Validar que Content-Type sea JSON y body sea válido.

**Validaciones:**
- Content-Type debe incluir `application/json`
- Body debe ser JSON válido

**Uso:**
```php
$router->post('/api/user', [UserController::class, 'create'])
  ->middleware(['json', 'auth']);
```

### throttleMiddleware.php

**Propósito:** Rate limiting por IP.

**Parámetros:** `throttle:maxRequests,minutes`

```php
->middleware('throttle:60,1')   // 60 requests por minuto
->middleware('throttle:10,1')   // 10 requests por minuto
```

**Headers de Respuesta:**
- `X-RateLimit-Limit` - Límite total
- `X-RateLimit-Remaining` - Requests restantes
- `X-RateLimit-Reset` - Timestamp de reset
- `Retry-After` - Segundos para retry (si bloqueado)

**Respuesta:** 429 "Demasiadas peticiones"

---

## 🌐 services/ - Servicios de Integración

### ai.php - Servicio de IA

**Providers:** DeepSeek, OpenAI

**Funciones:**
```php
$ai = new ai();

// Chat completion con fallback
$response = $ai->getChatCompletion($prompt, $bot, [
  'model' => 'deepseek-chat'
]);

// Transcripción de audio
$text = $ai->transcribeAudio($audioUrl, $bot);

// Análisis de imágenes
$result = $ai->analyzeImage($imageDataUri, $instruction, $bot);
```

### chatapi.php - WhatsApp

**Providers:** Evolution API

**Funciones:**
```php
chatapi::setConfig($botData, $provider);

// Enviar mensaje con fallback
chatapi::send($number, 'Hola mundo', $mediaUrl);

// Enviar "escribiendo..."
chatapi::sendPresence($number, 'composing', 5000);

// Archivar chat
chatapi::sendArchive($chatNumber, $lastMessageId, true);

// Detectar provider y normalizar
$normalized = chatapi::detectAndNormalize($rawWebhookData);
```

### email.php - Email

**Providers:** PlusEmail (extensible)

```php
email::provider('plusemail')->send($to, $subject, $body);
```

---

## 📝 resources/ - Schemas y Controllers

### Estructura de Schema JSON

**Ubicación:** `/app/resources/schemas/{resource}.json`

```json
{
  "resource": "user",
  "table": "user",
  "timestamps": true,
  "middleware": ["throttle:100,1"],
  
  "routes": {
    "list": {
      "method": "GET",
      "path": "/api/user",
      "middleware": ["auth"]
    },
    "show": {
      "method": "GET",
      "path": "/api/user/{id}",
      "middleware": ["auth"]
    },
    "create": {
      "method": "POST",
      "path": "/api/user",
      "middleware": ["auth", "json"]
    },
    "update": {
      "method": "PUT",
      "path": "/api/user/{id}",
      "middleware": ["auth", "json"]
    },
    "delete": {
      "method": "DELETE",
      "path": "/api/user/{id}",
      "middleware": ["auth"]
    }
  },
  
  "fields": [
    {
      "name": "user",
      "type": "string",
      "required": true,
      "unique": true,
      "maxLength": 50
    },
    {
      "name": "pass",
      "type": "string",
      "required": true,
      "maxLength": 255
    },
    {
      "name": "email",
      "type": "string",
      "unique": true,
      "maxLength": 150
    },
    {
      "name": "config",
      "type": "json"
    },
    {
      "name": "role",
      "type": "string",
      "maxLength": 50
    }
  ]
}
```

**Campos del Schema:**
- `resource` - Nombre del recurso
- `table` - Nombre de la tabla en BD
- `timestamps` - Auto-manejo de dc, du, tc, tu
- `middleware` - Middleware global del recurso
- `routes` - Configuración de rutas CRUD
- `fields` - Definición y validación de campos

**Tipos de Campos:**
- `string` - VARCHAR con maxLength
- `text` - TEXT
- `int` - INT
- `float` - DECIMAL
- `boolean` - TINYINT(1)
- `json` - JSON
- `datetime` - DATETIME
- `date` - DATE

### Controllers Personalizados

**Ubicación:** `/app/resources/controllers/{Resource}Controller.php`

**Convención:** PascalCase (UserController, ClientController)

```php
<?php
class UserController extends controller {
  use ValidatesUnique;

  function __construct() {
    parent::__construct('user');
  }

  // Override create para hashear password
  function create() {
    $data = request::data();

    if (!isset($data['user']) || !isset($data['pass'])) {
      response::error(__('user.fields_required'), 400);
    }

    // Validaciones
    $this->validateUnique('user', 'user', $data['user'], 'user.already_exists');
    
    if (isset($data['email']) && !empty($data['email'])) {
      $this->validateEmail($data['email'], 'user');
    }

    // Hash password
    $data['pass'] = password_hash($data['pass'], PASSWORD_BCRYPT);

    // Convertir config a JSON
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Timestamps
    $data['dc'] = date('Y-m-d H:i:s');
    $data['tc'] = time();

    try {
      $id = db::table('user')->insert($data);
      log::info('Usuario creado', ['id' => $id], ['module' => 'user']);
      response::success(['id' => $id], __('user.create.success'), 201);
    } catch (Exception $e) {
      log::error('Error al crear usuario', ['error' => $e->getMessage()], ['module' => 'user']);
      response::serverError(__('user.create.error'), IS_DEV ? $e->getMessage() : null);
    }
  }

  // Override update
  function update($id) {
    $exists = db::table('user')->find($id);
    if (!$exists) response::notFound(__('user.not_found'));

    $data = request::data();

    // Hash password solo si se proporciona
    if (isset($data['pass']) && !empty($data['pass'])) {
      $data['pass'] = password_hash($data['pass'], PASSWORD_BCRYPT);
    } else {
      unset($data['pass']);
    }

    // Validaciones
    if (isset($data['email']) && !empty($data['email'])) {
      $this->validateEmail($data['email'], 'user', $id);
    }

    if (isset($data['user'])) {
      $this->validateUniqueExcept('user', 'user', $data['user'], $id, 'user.already_exists');
    }

    // Convertir config
    if (isset($data['config']) && is_array($data['config'])) {
      $data['config'] = json_encode($data['config'], JSON_UNESCAPED_UNICODE);
    }

    // Timestamps
    $data['du'] = date('Y-m-d H:i:s');
    $data['tu'] = time();

    $affected = db::table('user')->where('id', $id)->update($data);

    // Invalidar sesiones si se modificó config
    $cleaned = 0;
    if (isset($data['config'])) {
      $currentUserId = $GLOBALS['auth_user_id'] ?? null;

      if ($currentUserId && $currentUserId == $id) {
        log::info("Usuario {$id} se editó a sí mismo, no se invalida su sesión", null, ['module' => 'user']);
      } else {
        $cleaned = sessionCleanup::cleanByUserId($id);
        log::info("Sesiones invalidadas para user_id={$id}: {$cleaned}", null, ['module' => 'user']);
      }
    }

    response::success([
      'affected' => $affected,
      'sessions_invalidated' => $cleaned
    ], __('user.update.success'));
  }

  // Override show para ocultar password
  function show($id) {
    $data = db::table('user')->find($id);
    if (!$data) response::notFound(__('user.not_found'));

    if (isset($data['config']) && is_string($data['config'])) {
      $data['config'] = json_decode($data['config'], true);
    }

    unset($data['pass']);
    response::success($data);
  }

  // Override list para ocultar passwords
  function list() {
    $query = db::table('user');

    foreach ($_GET as $key => $value) {
      if (in_array($key, ['page', 'per_page', 'sort', 'order'])) continue;
      if ($key === 'pass') continue;
      $query = $query->where($key, $value);
    }

    $sort = request::query('sort', 'id');
    $order = request::query('order', 'ASC');
    $query = $query->orderBy($sort, $order);

    $page = request::query('page', 1);
    $perPage = request::query('per_page', 50);
    $data = $query->paginate($page, $perPage)->get();

    foreach ($data as &$user) {
      unset($user['pass']);
      if (isset($user['config']) && is_string($user['config'])) {
        $user['config'] = json_decode($user['config'], true);
      }
    }

    response::success($data);
  }
}
```

### Handlers Personalizados

**Ubicación:** `/app/resources/handlers/{Resource}Handler.php`

**Convención:** PascalCase (AuthHandler, ClientHandler)

**Ejemplo: AuthHandler.php**

```php
<?php
class AuthHandler {

  static function login($params) {
    $data = request::data();

    if (!isset($data['user']) || !isset($data['pass'])) {
      return ['success' => false, 'error' => __('auth.credentials.required')];
    }

    // Buscar usuario
    $user = db::table('user')
      ->where('user', $data['user'])
      ->orWhere('email', $data['user'])
      ->first();

    if (!$user || !password_verify($data['pass'], $user['pass'])) {
      log::warning('Login fallido', ['user' => $data['user']], ['module' => 'auth']);
      return ['success' => false, 'error' => __('auth.credentials.invalid')];
    }

    // Generar token
    $token = utils::token(64);
    $expiresAt = time() + SESSION_TTL;

    // Parsear config
    if (isset($user['config']) && is_string($user['config'])) {
      $user['config'] = json_decode($user['config'], true);
    }

    unset($user['pass']);

    // Guardar sesión con nombre optimizado
    self::saveSession($user, $token, $expiresAt);

    log::info('Login exitoso', ['user_id' => $user['id']], ['module' => 'auth']);

    return [
      'success' => true,
      'message' => __('auth.login.success'),
      'data' => [
        'user' => $user,
        'token' => $token,
        'expires_at' => date('Y-m-d H:i:s', $expiresAt)
      ]
    ];
  }

  static function logout($params) {
    $token = request::bearerToken();
    if (!$token) {
      return ['success' => false, 'error' => __('auth.token.missing')];
    }

    self::deleteSessionByToken($token);
    return ['success' => true, 'message' => __('auth.logout.success')];
  }

  // Guardar sesión con nombre optimizado: {timestamp}_{user_id}_{token_short}.json
  private static function saveSession($user, $token, $expiresAt) {
    $sessionsDir = STORAGE_PATH . '/sessions/';
    if (!is_dir($sessionsDir)) mkdir($sessionsDir, 0755, true);

    $tokenShort = substr($token, 0, 16);
    $filename = "{$expiresAt}_{$user['id']}_{$tokenShort}.json";

    file_put_contents($sessionsDir . $filename, json_encode([
      'user_id' => $user['id'],
      'user' => $user,
      'token' => $token,
      'expires_at' => date('Y-m-d H:i:s', $expiresAt),
      'expires_timestamp' => $expiresAt,
      'created_at' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE));
  }

  private static function deleteSessionByToken($token) {
    $sessionsDir = STORAGE_PATH . '/sessions/';
    $tokenShort = substr($token, 0, 16);
    $files = glob($sessionsDir . "*_*_{$tokenShort}.json");

    foreach ($files as $file) {
      $session = json_decode(file_get_contents($file), true);
      if ($session && $session['token'] === $token) {
        unlink($file);
        return true;
      }
    }
    return false;
  }
}
```

---

## 🛣️ routes/ - Sistema de Rutas

### app/routes/api.php - Router Principal

**Propósito:** Router híbrido con auto-registro CRUD + rutas manuales.

**Flujo:**
```
1. Extrae módulo del path (/api/user → user)

2. Auto-registra CRUD desde /app/resources/schemas/{module}.json
   ├─ GET /api/{module}      → list()
   ├─ GET /api/{module}/{id} → show()
   ├─ POST /api/{module}     → create()
   ├─ PUT /api/{module}/{id} → update()
   └─ DELETE /api/{module}/{id} → delete()

3. Carga rutas manuales de /app/routes/apis/{module}.php
```

**Ejemplo:**
```php
<?php
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Normalizar path
$path = preg_replace('#/+#', '/', $path);
if (preg_match('#(/api/.*)$#', $path, $matches)) {
  $path = $matches[1];
}
$path = rtrim($path, '/');

// Extraer módulo
$module = null;
if (preg_match('#^/api/([^/]+)#', $path, $matches)) {
  $module = $matches[1];
}

// Auto-registrar CRUD desde JSON
if ($module) {
  $resourceFile = APP_PATH . "/resources/schemas/{$module}.json";

  if (file_exists($resourceFile)) {
    $config = json_decode(file_get_contents($resourceFile), true);

    // Verificar controller personalizado
    $controllerClass = ucfirst($module) . 'Controller';
    $ctrl = class_exists($controllerClass)
      ? new $controllerClass()
      : new controller($module);

    $globalMw = $config['middleware'] ?? [];

    // Rutas CRUD
    $crudRoutes = [
      'list'   => ['get',    "/api/{$module}",      'list'],
      'show'   => ['get',    "/api/{$module}/{id}", 'show'],
      'create' => ['post',   "/api/{$module}",      'create'],
      'update' => ['put',    "/api/{$module}/{id}", 'update'],
      'delete' => ['delete', "/api/{$module}/{id}", 'delete']
    ];

    foreach ($crudRoutes as $key => $routeData) {
      list($method, $routePath, $action) = $routeData;

      $routeConfig = $config['routes'][$key] ?? [];

      if (isset($routeConfig['enabled']) && $routeConfig['enabled'] === false) {
        continue;
      }

      $routeMw = array_merge($globalMw, $routeConfig['middleware'] ?? []);

      $route = $router->$method($routePath, [$ctrl, $action]);

      if (!empty($routeMw)) {
        $route->middleware($routeMw);
      }
    }
  }
}

// Cargar rutas manuales
$manualRoutes = ROUTES_PATH . '/apis/' . $module . '.php';
if ($module && file_exists($manualRoutes)) {
  require_once $manualRoutes;
}
```

### app/routes/apis/auth.php - Rutas de Autenticación

```php
<?php
$router->group('/api/auth', function($router) {

  // Login
  $router->post('/login', function() {
    $result = AuthHandler::login([]);
    response::json($result);
  })->middleware(['json', 'throttle:10,1']);

  // Logout
  $router->post('/logout', function() {
    $result = AuthHandler::logout([]);
    response::json($result);
  })->middleware('auth');

});
```

### app/routes/apis/user.php - Rutas Custom de User

```php
<?php
// Las rutas CRUD se auto-registran desde user.json

$router->group('/api/user', function($router) {

  // Profile
  $router->get('/profile', function() {
    UserHandler::profile([]);
  })->middleware('auth');

  // Update config
  $router->put('/{id}/config', function($id) {
    UserHandler::updateConfig(['id' => $id]);
  })->middleware(['auth', 'json']);

});
```

---

## 🌍 lang/ - Sistema de Traducciones

### Estructura

```
framework/lang/
└── es/
    ├── api.php
    ├── auth.php
    ├── core.php
    ├── middleware.php
    ├── validation.php
    └── services/
        ├── ai.php
        ├── chatapi.php
        └── email.php

app/lang/
└── es/
    ├── user.php
    ├── client.php
    └── product.php
```

### Convenciones de Campos de BD

**dc** = Date Created (Y-m-d H:i:s)  
**du** = Date Updated (Y-m-d H:i:s)  
**tc** = Timestamp Created (unix)  
**tu** = Timestamp Updated (unix)  

Ver: `/framework/docs/schema-conventions.md`

### Convenciones de Nombres

**Clases Framework:**
- lowercase → Helpers: `db`, `log`, `request`, `response`
- camelCase → Compound: `logReader`, `sessionCleanup`

**Clases App:**
- PascalCase → Controllers/Handlers: `UserController`, `AuthHandler`

Ver: `/framework/docs/naming-conventions.md`

---

## 🔄 Flujo Completo de un Request

### Ejemplo: POST /api/auth/login

```
1. api.php
   └─ Entry point, inicia output buffering

2. app/config/init.php
   └─ Define constantes (IS_DEV, DB_*, paths)

3. new Application()
   ├─ Carga autoload.php
   ├─ Carga router.php
   └─ Carga app/routes/api.php

4. $app->run()
   └─ $router->dispatch()
      ├─ Match ruta: POST /api/auth/login
      ├─ Ejecuta middleware: throttle:10,1
      ├─ Ejecuta middleware: json
      └─ Ejecuta handler: AuthHandler::login()

5. AuthHandler::login()
   ├─ request::data() → Body JSON
   ├─ db::table('user')->where() → Busca usuario
   ├─ password_verify() → Valida password
   ├─ utils::token(64) → Genera token
   ├─ Guarda sesión en archivo
   └─ return respuesta

6. response::json()
   └─ Envía JSON al cliente

7. api.php
   └─ Valida JSON output y finaliza
```

### Ejemplo: GET /api/user (CRUD auto)

```
1. api.php

2. app/routes/api.php
   └─ Auto-registra desde user.json
      ├─ Carga UserController (si existe)
      ├─ Registra rutas CRUD
      └─ Aplica middleware: ['auth']

3. authMiddleware
   ├─ Extrae Bearer token
   ├─ Busca sesión en archivo
   ├─ Valida expiración
   └─ Carga user en $GLOBALS

4. UserController::list()
   ├─ db::table('user')->get()
   ├─ Oculta passwords
   ├─ Parsea config JSON
   └─ response::success($data)

5. Respuesta JSON al cliente
```

---

## ✅ Características Clave del Backend

1. **CRUD automático desde JSON**
   - Define schema una vez
   - Obtén API REST completa con validación

2. **Controllers personalizados**
   - Override métodos CRUD para lógica específica
   - Usa traits para código reutilizable

3. **Handlers para custom actions**
   - Rutas personalizadas sin modificar controller base

4. **Sesiones basadas en archivos**
   - Sin consultas a BD en cada request
   - Token como parte del nombre de archivo
   - TTL automático con limpieza programada
   - Nombres optimizados: `{timestamp}_{user_id}_{token_short}.json`

5. **Middleware composable**
   - Global (resource-level)
   - Por ruta (route-level)
   - Con parámetros: `throttle:60,1`

6. **Query builder fluido**
   - Chainable methods
   - Prepared statements automáticos
   - whereFilters dinámico
   - Soporte completo de JOIN/ORDER/GROUP

7. **Auto-carga inteligente**
   - Mapa estático para críticos
   - Lazy loading para el resto
   - Auto-discovery de services

8. **Validación automática**
   - Required, unique desde schema
   - Timestamps automáticos
   - Traits reutilizables

9. **Lazy loading de traducciones**
   - Solo carga módulos usados
   - Cache en memoria
   - Merge framework + app

10. **Sistema de logging estructurado**
    - Niveles (debug, info, warning, error)
    - Módulos y tags
    - Rotación automática

---

## 📚 Documentación Adicional

- **FRAMEWORK.md** - Documentación completa del núcleo
- **BLUEPRINT.md** - Guía para crear proyectos nuevos
- **BUSINESS-LOGIC-MAP.md** - Template para mapear lógica
- `/framework/docs/` - Mini-docs de cada componente

---

## 🎯 Mejoras Implementadas (2025)

✅ Estandarización PascalCase para handlers/controllers  
✅ Trait ValidatesUnique para validaciones reutilizables  
✅ response.php corregido (if $data !== null)  
✅ lang.php con lazy loading + cache en memoria  
✅ Mini-documentación de 12 componentes  
✅ Convenciones documentadas (nombres, schemas BD)  
✅ autoload.php con soporte de traits  

---

**Versión:** 1.3  
**Última actualización:** Diciembre 2025
