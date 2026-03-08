# Helpers — Parte 3: Utils, File, Http, Str, Url, Date, Country, Logic, Validation

> Helpers bajo demanda via ogApp()->helper(). Ver también: helpers.prompt.md (ogDb) y helpers-cache-log.prompt.md.
> Generado: 2026-03-07 19:35:47

---

### `framework/helpers/ogStr.php`

```
FILE: framework/helpers/ogStr.php
ROLE: Helper de manipulación de strings. Normalización, conversión de casos
      y utilidades de comparación.

MÉTODOS:
  ogStr::normalize($text)
    → minúsculas + remueve tildes (á→a, é→e, ñ→n, ç→c, etc.)
    → útil para comparaciones case-insensitive sin tildes
    → ogStr::normalize('Ñoño') → 'nono'

  ogStr::containsAllWords($needle, $haystack)
    → true si TODAS las palabras de $needle están en $haystack
    → normaliza ambos strings antes de comparar
    → ogStr::containsAllWords('juan perez', 'Juan Pérez García') → true

  ogStr::isJson($string)
    → true si el string es JSON válido
    → retorna false si está vacío o no es string

  ogStr::toCamelCase($string)
    → convierte kebab-case o snake_case a camelCase
    → ogStr::toCamelCase('my-module')  → 'myModule'
    → ogStr::toCamelCase('my_module')  → 'myModule'
    → usado en ogApi.php para normalizar módulos de URL
```

### `framework/helpers/ogUtils.php`

```
FILE: framework/helpers/ogUtils.php
ROLE: Utilidades generales de uso frecuente. Generación de tokens, formato
      de datos y helpers de texto.

MÉTODOS:
  ogUtils::get($arr, $key, $default)
    → acceso seguro a array con valor default
    → ogUtils::get($data, 'name', 'sin nombre')

  ogUtils::uuid()
    → genera UUID v4 aleatorio
    → 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  ogUtils::token($length)
    → token hexadecimal criptográficamente seguro (default: 32 chars)
    → usa random_bytes() internamente

  ogUtils::money($amount, $currency)
    → formatea número como moneda con 2 decimales
    → ogUtils::money(1234.5) → '$1,234.50'

  ogUtils::timeAgo($datetime)
    → tiempo transcurrido en español
    → acepta timestamp unix o string de fecha
    → retorna: 'hace X segundos/minutos/horas/días' o 'dd/mm/yyyy'

  ogUtils::slug($text)
    → convierte texto a slug URL-friendly
    → ogUtils::slug('Héroe del año') → 'heroe-del-ano'
    → retorna 'n-a' si el resultado está vacío

  ogUtils::truncate($text, $len, $suffix)
    → trunca texto a $len caracteres añadiendo $suffix (default: '...')
    → no trunca si el texto es menor o igual a $len

  ogUtils::bytes($bytes)
    → formatea bytes a unidad legible
    → ogUtils::bytes(1536) → '1.5 KB'
```

### `framework/helpers/ogFile.php`

```
FILE: framework/helpers/ogFile.php
ROLE: Helper de archivos. Lectura y escritura de JSON, gestión de directorios
      y eliminación de archivos con logging de errores.

MÉTODOS:
  ogFile::saveJson($path, $data, $module, $action)
    → guarda $data bajo clave 'data' en JSON con metadata (created, module, action)

  ogFile::saveJsonItems($path, $items, $module, $action)
    → igual que saveJson pero guarda bajo clave 'items' (para arrays/colecciones)

  ogFile::getJson($path, $reconstructCallback)
    → lee y retorna 'data' o 'items' del JSON
    → si el archivo no existe ejecuta $reconstructCallback (opcional)

  ogFile::ensureDir($path)
    → crea el directorio si no existe (mkdir recursivo 0755)

  ogFile::delete($path)
    → elimina un archivo, retorna true si no existe o si se eliminó correctamente

  ogFile::deletePattern($pattern)
    → elimina archivos por patrón glob → retorna cantidad eliminada
    → ogFile::deletePattern($dir . '/*.cache')

NOTAS:
  - Crea directorios automáticamente si no existen (saveJson, saveJsonItems)
  - Todos los errores se loguean via ogLog con module 'file'
```

### `framework/helpers/ogHttp.php`

```
FILE: framework/helpers/ogHttp.php
ROLE: Helper de peticiones HTTP salientes via cURL. Wrapper simple para
      consumir APIs externas con decodificación JSON automática.

MÉTODOS:
  ogHttp::get($url, $options)
  ogHttp::post($url, $data, $options)
  ogHttp::put($url, $data, $options)
  ogHttp::delete($url, $options)

RESPUESTA (siempre retorna array, nunca lanza excepción):
  [
    'success'  => bool,        // true si httpCode 200-299
    'data'     => mixed,       // JSON decodificado o string raw
    'raw'      => string,      // respuesta sin decodificar
    'httpCode' => int,         // código HTTP
    'error'    => string|null  // mensaje de error si falló
  ]

OPCIONES DISPONIBLES:
  'timeout'    => 30       // segundos (default: 30)
  'headers'    => []       // array de headers: ['Authorization: Bearer token']
  'ssl_verify' => false    // verificar SSL (default: false)
  'auto_json'  => true     // decodificar respuesta JSON automáticamente

EJEMPLOS:
  $res = ogHttp::get('https://api.example.com/users');
  $res = ogHttp::post('https://api.example.com/users', ['name' => 'Juan'], [
    'headers' => ['Content-Type: application/json', 'Authorization: Bearer token']
  ]);
  if ($res['success']) { $data = $res['data']; }

NOTAS:
  - URLs normalizadas automáticamente via ogUrl::normalizeUrl()
  - Si Content-Type es application/json y $data es array → json_encode automático
  - Errores cURL se loguean via ogLog con module 'http'
```

### `framework/helpers/ogUrl.php`

```
FILE: framework/helpers/ogUrl.php
ROLE: Helper de manipulación de URLs. Normalización, construcción y validación.

MÉTODOS:
  ogUrl::normalizeUrl($url)
    → elimina slashes duplicados y trailing slash
    → preserva el protocolo (https://, http://)
    → usado internamente por ogHttp antes de cada request
    → ogUrl::normalizeUrl('https://api.com//users/') → 'https://api.com/users'

  ogUrl::addQueryParams($url, $params)
    → agrega array de parámetros como query string
    → detecta si ya hay '?' para usar '&'
    → ogUrl::addQueryParams('https://api.com/users', ['page' => 1]) → 'https://api.com/users?page=1'

  ogUrl::isValid($url)
    → valida URL via FILTER_VALIDATE_URL
    → retorna bool

  ogUrl::getDomain($url)
    → extrae el dominio de una URL
    → ogUrl::getDomain('https://api.example.com/users') → 'api.example.com'

  ogUrl::join(...$segments)
    → une segmentos de URL eliminando slashes duplicados
    → ogUrl::join('https://api.com', 'users', '42') → 'https://api.com/users/42'
```

### `framework/helpers/ogDate.php`

```
FILE: framework/helpers/ogDate.php
ROLE: Helper de fechas. Rangos predefinidos, formateo, diferencias y utilidades
      para MySQL.

RANGOS PREDEFINIDOS (getDateRange):
  'today'          → hoy 00:00:00 - 23:59:59
  'yesterday'      → ayer 00:00:00 - 23:59:59
  'yesterday_today'→ ayer - hoy
  'last_3_days'    → 3 días atrás SIN incluir hoy
  'last_7_days'    → 7 días atrás SIN incluir hoy
  'last_15_days'   → 15 días atrás SIN incluir hoy
  'last_30_days'   → 30 días atrás SIN incluir hoy
  'this_week'      → lunes de esta semana - hoy
  'this_month'     → primer día - último día del mes actual
  'last_month'     → primer día - último día del mes anterior

MÉTODOS:
  ogDate::getDateRange('last_7_days')        → ['start' => '...', 'end' => '...']
  ogDate::diffDays('2025-01-01')             → días desde esa fecha hasta hoy
  ogDate::addDays('2025-01-01', 7)           → '2025-01-08'
  ogDate::subDays('2025-01-01', 7)           → '2024-12-25'
  ogDate::isToday('2025-01-01')              → bool
  ogDate::isYesterday('2025-01-01')          → bool
  ogDate::toMysql()                          → '2025-01-01 15:30:00'
  ogDate::toMysqlDate()                      → '2025-01-01'
  ogDate::timestamp('2025-01-01')            → unix timestamp
  ogDate::formatEs('2025-01-01')             → '01/01/2025'
```

### `framework/helpers/ogCountry.php`

```
FILE: framework/helpers/ogCountry.php
ROLE: Helper de países. Datos estáticos de países (nombre, región, moneda,
      timezone, offset) con utilidades de conversión horaria.

COBERTURA:
  América del Sur, América Central y Caribe, América del Norte,
  Europa Occidental y del Este. Indexado por código ISO 3166-1 alpha-2.

MÉTODOS:
  ogCountry::get('EC')
    → ['name'=>'Ecuador', 'region'=>'america', 'currency'=>'USD',
       'timezone'=>'America/Guayaquil', 'offset'=>'UTC-5']

  ogCountry::all()
    → array completo de países

  ogCountry::exists('EC')
    → bool

  ogCountry::now('EC')
    → '2025-01-01 15:30:45'  (hora actual en timezone del país)

  ogCountry::now('EC', 'H:i')
    → '15:30'

  ogCountry::convert('2025-01-01 10:00:00', 'EC', 'ES')
    → '2025-01-01 16:00:00'  (convierte entre timezones de dos países)

NOTAS:
  - Códigos en mayúsculas (get/exists normalizan automáticamente)
  - Retorna null si el código no existe o hay error de timezone
```

### `framework/helpers/ogLogic.php`

```
FILE: framework/helpers/ogLogic.php
ROLE: Motor de lógica basado en JSON (JsonLogic). Evalúa reglas de negocio
      definidas como estructuras JSON contra datos en runtime.
      Útil para reglas dinámicas en ads, scoring, validaciones condicionales.

MÉTODOS PRINCIPALES:
  OgLogic::apply($logic, $data)
    → evalúa lógica y retorna el resultado directo

  OgLogic::evaluate($logic, $data)
    → igual que apply pero retorna detalles de evaluación
    → ['result' => bool, 'details' => [...], 'matched_rules' => [...]]
    → útil para saber QUÉ condiciones se cumplieron

  OgLogic::addOp($name, $callable)
    → registra operador personalizado
    → OgLogic::addOp('between', fn($a,$min,$max) => $a >= $min && $a <= $max)

  OgLogic::usesData($logic)
    → retorna array de variables que usa la lógica

OPERADORES DISPONIBLES:
  Comparación:  ==, ===, !=, !==, >, >=, <, <=
  Lógicos:      and, or, if, ?:, !, !!
  Arrays:       in, merge, filter, map, reduce, all, some, none
  Variables:    var, missing, missing_some
  Matemáticos:  +, -, *, /, %, max, min
  String:       cat, substr

EJEMPLO:
  $logic = ['or' => [
    ['and' => [
      ['<=', [['var' => 'cost_per_result'], 18]],
      ['>=', [['var' => 'results'], 1]]
    ]],
    ['>=', [['var' => 'roas'], 2.5]]
  ]];
  $data = ['cost_per_result' => 0.31, 'results' => 4, 'roas' => 4.88];

  OgLogic::apply($logic, $data);     → true
  OgLogic::evaluate($logic, $data);  → ['result'=>true, 'matched_rules'=>[...]]

NOTAS:
  - var con dot notation: ['var' => 'user.role'] accede a $data['user']['role']
  - Operadores if/and/or usan evaluación lazy (no evalúan lo innecesario)
  - evaluate() detalla qué rama del OR/AND cumplió (útil para auditoría de ads)
```

### `framework/helpers/ogValidation.php`

```
FILE: framework/helpers/ogValidation.php
ROLE: Helper de validación y sanitización de datos de entrada.

VALIDACIÓN:
  ogValidation::email($email)           → bool, valida formato email
  ogValidation::phone($phone)           → bool, acepta +, -, espacios, ()
  ogValidation::url($url)               → bool, valida formato URL
  ogValidation::numeric($val)           → bool, equivale a is_numeric()
  ogValidation::range($val, $min, $max) → bool, verifica rango numérico

CAMPOS REQUERIDOS:
  ogValidation::required($data, ['name', 'email'])
    → ['valid' => bool, 'errors' => [...]]
    → valida que los campos existan y no estén vacíos
    → usado internamente por ogController en create()

SANITIZACIÓN:
  ogValidation::sanitizeText($text)
    → strip_tags + htmlspecialchars + trim (UTF-8)
    → usar antes de guardar texto libre en DB

  ogValidation::sanitizeEmail($email)
    → FILTER_SANITIZE_EMAIL + trim
    → elimina caracteres no válidos en emails

NOTAS:
  - required() es el método más usado, llamado desde ogController::create()
  - Para validaciones únicas en DB ver trait ogValidatesUnique
```
