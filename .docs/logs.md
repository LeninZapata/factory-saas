# 📝 Sistema de Logs Mejorado - Documentación

## 🎯 Características

✅ **Formato TAB-separated** - Fácil de parsear
✅ **Auto-detección** de archivo y línea
✅ **Configuración flexible** - Presets + templates personalizados
✅ **Rotación por tamaño** - Archivos de máximo 1MB
✅ **Organización por carpetas** - Customizable con variables
✅ **Endpoint de consulta** - API REST para leer logs
✅ **Búsqueda avanzada** - Por fecha, módulo, nivel, texto

---

## 📋 Formato de Log

### Estructura (TAB-separated)
```
[timestamp]	LEVEL	module	file:line	message	context_json
```

### Ejemplo Real
```
[2025-12-08 23:38:54]	INFO	auth	userHandlers.php:142	Login exitoso	{"user":"admin44","id":3}
[2025-12-08 23:40:12]	ERROR	payment	stripeService.php:87	Payment failed	{"amount":100,"error":"Insufficient funds"}
[2025-12-08 23:41:05]	DEBUG	bot	botHandler.php:23	Message received	{"bot_id":5,"msg":"Hello"}
```

### Campos

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **timestamp** | Fecha y hora | `[2025-12-08 23:38:54]` |
| **level** | Nivel del log | `INFO`, `DEBUG`, `WARNING`, `ERROR` |
| **module** | Módulo/componente | `auth`, `payment`, `bot` |
| **location** | Archivo:línea | `userHandlers.php:142` |
| **message** | Descripción | `Login exitoso` |
| **context** | Datos en JSON | `{"user":"admin44","id":3}` |

---

## 🔧 Uso Básico

### 1. Log Simple (auto-detecta file/line)

```php
log::info('Usuario creado exitosamente');
// [2025-12-08 23:38:54]	INFO	app	userController.php:45	Usuario creado exitosamente	
```

### 2. Log con Contexto

```php
log::info('Login exitoso', [
  'user' => 'admin44',
  'id' => 3,
  'ip' => '192.168.1.100'
]);
// [2025-12-08 23:38:54]	INFO	app	userHandlers.php:142	Login exitoso	{"user":"admin44","id":3,"ip":"192.168.1.100"}
```

### 3. Log con Módulo

```php
log::info('Payment processed', 
  ['amount' => 100, 'currency' => 'USD'],
  ['module' => 'payment']
);
// [2025-12-08 23:38:54]	INFO	payment	stripeService.php:87	Payment processed	{"amount":100,"currency":"USD"}
```

### 4. Diferentes Niveles

```php
log::debug('Debugging info');     // Solo en IS_DEV = true
log::info('General info');
log::warning('Warning message');
log::error('Error occurred');
log::sql('SELECT * FROM users');  // Solo en IS_DEV = true
```

---

## ⚙️ Configuración

### Configurar en `app/config/consts.php` o donde prefieras:

```php
// Al inicio de tu app
log::setConfig([
  'format' => 'daily',        // Preset: single, monthly, daily, custom
  'level' => 'info',          // Nivel mínimo: debug, info, warning, error
  'max_size' => 1048576,      // 1MB por archivo (rotación automática)
  'enabled' => true           // Habilitar/deshabilitar logs
]);
```

---

## 📁 Presets de Organización

### 1. **Single** - Todo en un archivo
```php
log::setConfig(['format' => 'single']);
```

**Estructura:**
```
storage/logs/
└── app.log
```

---

### 2. **Monthly** - Por mes
```php
log::setConfig(['format' => 'monthly']);
```

**Estructura:**
```
storage/logs/
├── 2025/
│   ├── 11/
│   │   └── app.log
│   └── 12/
│       └── app.log
```

---

### 3. **Daily** - Por día (default)
```php
log::setConfig(['format' => 'daily']);
```

**Estructura:**
```
storage/logs/
├── 2025/
│   └── 12/
│       ├── 01/
│       │   └── app.log
│       ├── 02/
│       │   └── app.log
│       └── 08/
│           ├── app.log
│           └── app_1.log  ← Rotado por tamaño
```

---

### 4. **Custom** - Template personalizado
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/{module}.log'
]);
```

**Estructura:**
```
storage/logs/
└── 2025/
    └── 12/
        └── 08/
            ├── auth.log
            ├── payment.log
            └── bot.log
```

---

## 🎨 Templates Personalizados

### Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{year}` | Año | `2025` |
| `{month}` | Mes (2 dígitos) | `12` |
| `{day}` | Día (2 dígitos) | `08` |
| `{hour}` | Hora (2 dígitos) | `23` |
| `{module}` | Módulo del log | `auth`, `payment` |
| `{custom_var}` | Variable custom | Cualquier valor |

### Ejemplos de Templates

#### Template 1: Por módulo y fecha
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{module}/{year}/{month}/{day}.log'
]);
```

**Resultado:**
```
logs/
├── auth/
│   └── 2025/12/08.log
├── payment/
│   └── 2025/12/08.log
└── bot/
    └── 2025/12/08.log
```

#### Template 2: Con variable custom (bot_id)
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/bot/{bot_id}.log'
]);

// En tu código
log::info('Bot procesó mensaje', 
  ['message' => 'Hello'],
  ['module' => 'bot', 'custom' => ['bot_id' => 5]]
);
```

**Resultado:**
```
logs/
└── 2025/12/08/
    └── bot/
        ├── 5.log
        ├── 7.log
        └── 12.log
```

#### Template 3: Por hora
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/{hour}h.log'
]);
```

**Resultado:**
```
logs/
└── 2025/12/08/
    ├── 00h.log
    ├── 01h.log
    ├── 23h.log
    └── ...
```

---

## 🔄 Rotación Automática por Tamaño

Cuando un archivo alcanza 1MB (configurable), se crea uno nuevo automáticamente:

```
logs/2025/12/08/
├── app.log          ← 1MB (lleno)
├── app_1.log        ← 1MB (lleno)
├── app_2.log        ← 500KB (escribiendo aquí)
```

**Cambiar límite:**
```php
log::setConfig([
  'max_size' => 2097152  // 2MB
]);
```

---

## 🔍 Consultar Logs (Endpoints)

### Ubicación del Archivo
El endpoint está en: `backend/app/routes/apis/log.php`

### Autenticación
Todos los endpoints requieren token de autenticación:
```
Authorization: Bearer {tu_token}
```

---

### 1️⃣ **Logs de Hoy**

```
GET /api/logs/today
GET /api/logs/today?limit=50
GET /api/logs/today?level=ERROR
GET /api/logs/today?module=auth
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-12-08 23:38:54",
        "level": "INFO",
        "module": "auth",
        "location": "userHandlers.php:142",
        "message": "Login exitoso",
        "context": {"user": "admin44", "id": 3}
      }
    ],
    "count": 1,
    "date": "2025-12-08"
  }
}
```

---

### 2️⃣ **Últimos Logs (sin importar fecha)**

```
GET /api/logs/latest
GET /api/logs/latest?limit=20
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "count": 20
  }
}
```

---

### 3️⃣ **Logs de Fecha Específica**

```
GET /api/logs/2025/12/08
GET /api/logs/2025/12/08?module=payment
GET /api/logs/2025/12/08?level=ERROR&limit=100
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "count": 45,
    "date": "2025-12-08",
    "files": ["app.log", "app_1.log"]
  }
}
```

---

### 4️⃣ **Logs de un Mes**

```
GET /api/logs/2025/12
GET /api/logs/2025/12?module=bot
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "count": 523,
    "month": "2025-12",
    "files": 8
  }
}
```

---

### 5️⃣ **Búsqueda Avanzada**

```
GET /api/logs/search?from=2025-12-01&to=2025-12-08
GET /api/logs/search?from=2025-12-01&to=2025-12-08&module=payment
GET /api/logs/search?search=login&limit=50
GET /api/logs/search?level=ERROR&from=2025-12-01
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "count": 89,
    "range": {
      "from": "2025-12-01",
      "to": "2025-12-08"
    }
  }
}
```

---

### 6️⃣ **Estadísticas**

```
GET /api/logs/stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 234,
    "by_level": {
      "INFO": 180,
      "ERROR": 12,
      "WARNING": 30,
      "DEBUG": 12
    },
    "by_module": {
      "auth": 50,
      "payment": 30,
      "bot": 100,
      "app": 54
    },
    "date": "2025-12-08"
  }
}
```

---

## 🎯 Query Params Disponibles

| Param | Descripción | Ejemplo |
|-------|-------------|---------|
| `limit` | Máximo de logs | `?limit=50` |
| `level` | Filtrar por nivel | `?level=ERROR` |
| `module` | Filtrar por módulo | `?module=auth` |
| `search` | Buscar en mensaje/contexto | `?search=login` |
| `from` | Fecha inicio (YYYY-MM-DD) | `?from=2025-12-01` |
| `to` | Fecha fin (YYYY-MM-DD) | `?to=2025-12-08` |

**Combinar múltiples:**
```
GET /api/logs/2025/12/08?level=ERROR&module=payment&limit=20
```

---

## 💡 Ejemplos de Uso Completos

### Ejemplo 1: Sistema de Bots con Custom Folders

```php
// Configuración
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/bot/{bot_id}.log'
]);

// En tu código de bot
class BotHandler {
  private $botId = 5;

  function processMessage($msg) {
    log::info('Message received', 
      ['message' => $msg, 'timestamp' => time()],
      ['module' => 'bot', 'custom' => ['bot_id' => $this->botId]]
    );
    
    // Logs se guardan en: logs/2025/12/08/bot/5.log
  }
}

// Consultar logs de ese bot
GET /api/logs/2025/12/08?search=bot&module=bot
```

---

### Ejemplo 2: Sistema Multi-Tenant

```php
// Configuración
log::setConfig([
  'format' => 'custom',
  'template' => 'tenants/{tenant_id}/{year}/{month}/{day}.log'
]);

// En tu código
class TenantService {
  private $tenantId;

  function __construct($tenantId) {
    $this->tenantId = $tenantId;
  }

  function doSomething() {
    log::info('Action performed',
      ['action' => 'create_user'],
      ['module' => 'tenant', 'custom' => ['tenant_id' => $this->tenantId]]
    );
    
    // Logs en: logs/tenants/123/2025/12/08.log
  }
}
```

---

### Ejemplo 3: Logs por Nivel de Error

```php
// Configuración
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/errors.log',
  'level' => 'error'  // Solo ERROR y superior
]);

// Solo se guardan errores
log::info('This wont be logged');
log::error('This WILL be logged');
```

---

## 🔧 Funciones Auxiliares

### Parsear archivo de log
```php
$logs = log::parse('/path/to/file.log', 100); // Últimas 100 líneas
```

### Buscar archivos de log
```php
$files = log::find([
  'year' => '2025',
  'month' => '12',
  'day' => '08'
]);
```

### Logs de hoy (programático)
```php
$logs = log::today(50); // Últimos 50 de hoy
```

### Últimos logs
```php
$logs = log::latest(20); // Últimos 20 en general
```

---

## ⚡ Performance

- ✅ **Escritura rápida** - Solo append a archivo
- ✅ **Rotación eficiente** - Verificación rápida de tamaño
- ✅ **Parseo ligero** - TAB-separated es muy eficiente
- ✅ **Búsqueda optimizada** - Índice por carpetas de fecha

---

## 🎓 Mejores Prácticas

1. ✅ **Usar módulos descriptivos** - `auth`, `payment`, `bot`
2. ✅ **Contexto con info útil** - IDs, valores importantes
3. ✅ **Niveles apropiados** - DEBUG para desarrollo, ERROR para problemas
4. ✅ **Templates organizados** - Por módulo o por fecha según necesidad
5. ✅ **Limitar búsquedas** - Usar `limit` para evitar sobrecargas
6. ❌ **No loguear passwords** - Nunca incluir datos sensibles

---

## 📦 Archivos

- **log.php** - Helper actualizado → Copiar a `backend/framework/helpers/`
- **log.php (routes)** - Endpoint de consulta → Copiar a `backend/app/routes/apis/log.php`

---

**¡Sistema de logs mejorado listo! 🎉**