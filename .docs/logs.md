# 📋 Sistema de Logs - Documentación

## 🎯 Características

✅ **Formato TAB-separated** - Fácil de parsear
✅ **Auto-detección** de archivo y línea
✅ **Tags personalizados** - Agrupar logs por categorías
✅ **Filtros avanzados** - Por módulo, tags, custom vars
✅ **Configuración flexible** - Presets + templates
✅ **Rotación por tamaño** - Archivos de máximo 1MB
✅ **API REST** - Endpoints para consultar logs

---

## 📋 Formato de Log

### Estructura (TAB-separated)
```
[timestamp]	LEVEL	module	file:line	message	tags	context_json
```

**Nota:** Campos vacíos usan `-` para mantener formato consistente

### Ejemplo Real
```
[2025-12-08 23:38:54]	INFO	auth	userHandlers.php:142	Login exitoso	auth,login	{"user":"admin44","id":3}
[2025-12-08 23:40:12]	ERROR	integrations/whatsapp	whatsapp.php:87	Error al enviar	whatsapp,error	{"number":"593987654321","bot_id":10}
[2025-12-08 23:41:00]	INFO	user	userController.php:160	Usuario actualizado	-	{"user_id":5}
[2025-12-08 23:42:15]	INFO	worker	worker.php:50	Proceso completado	-	-
```

---

## 🔧 Uso Básico

### 1. Log Simple
```php
log::info('Usuario creado exitosamente');
```

### 2. Log con Contexto
```php
log::info('Login exitoso', [
  'user' => 'admin44',
  'id' => 3
]);
```

### 3. Log con Módulo y Tags
```php
log::info('Mensaje enviado', 
  ['text' => 'Hola'],
  [
    'module' => 'integrations/whatsapp',
    'tags' => ['whatsapp', 'message', 'outbound']
  ]
);
```

### 4. Log con Custom Vars (para filtrar después)
```php
log::info('Mensaje recibido', 
  ['text' => 'Ayuda'],
  [
    'module' => 'integrations/whatsapp',
    'number' => '593987654321',
    'bot_id' => 10,
    'tags' => ['whatsapp', 'inbound']
  ]
);
```

### 5. Log sin Contexto (usa null o [])
```php
// Ambos son válidos
log::info('Sesiones invalidadas', null, ['module' => 'user', 'bot_id' => 10]);
log::info('Proceso completado', [], ['module' => 'worker']);
// En el log aparece: ... - {"bot_id":10}
// En el log aparece: ... - -
```

### 6. Contexto Flexible (acepta string, número, boolean)
```php
log::info('Items procesados', 150, ['module' => 'worker']);
// En el log: ... - {"value":150}

log::info('Estado', true, ['module' => 'system']);
// En el log: ... - {"value":true}
```

### 7. Diferentes Niveles
```php
log::debug('Debugging info');     // Solo en IS_DEV = true
log::info('General info');
log::warning('Warning message');
log::error('Error occurred');
```

---

## ⚙️ Configuración

```php
log::setConfig([
  'format' => 'daily',        // single, monthly, daily, custom
  'level' => 'info',          // debug, info, warning, error
  'max_size' => 1048576,      // 1MB
  'enabled' => true
]);
```

### Presets

**Single** - Todo en un archivo
```php
log::setConfig(['format' => 'single']);
// logs/app.log
```

**Monthly** - Por mes
```php
log::setConfig(['format' => 'monthly']);
// logs/2025/12/app.log
```

**Daily** - Por día (default)
```php
log::setConfig(['format' => 'daily']);
// logs/2025/12/08/app.log
```

**Custom** - Template personalizado
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/{module}.log'
]);
// logs/2025/12/08/auth.log
// logs/2025/12/08/whatsapp.log
```

### Variables de Template

| Variable | Ejemplo |
|----------|---------|
| `{year}` | `2025` |
| `{month}` | `12` |
| `{day}` | `08` |
| `{hour}` | `23` |
| `{module}` | `auth` |
| `{custom_var}` | `{bot_id}` → `10` |

### Template por Bot
```php
log::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/bot/{bot_id}.log'
]);

log::info('Mensaje', [], [
  'module' => 'bot',
  'custom' => ['bot_id' => 5]
]);
// logs/2025/12/08/bot/5.log
```

---

## 🔍 Consultar Logs (API)

**Autenticación:** `Authorization: Bearer {token}`

### Endpoints Disponibles

```bash
# Logs de hoy
GET /api/logs/today?limit=100

# Últimos logs
GET /api/logs/latest?limit=50

# Logs de fecha específica
GET /api/logs/2025/12/08

# Logs de un mes
GET /api/logs/2025/12

# Búsqueda con rango
GET /api/logs/search?from=2025-12-01&to=2025-12-08

# Estadísticas
GET /api/logs/stats
```

### Filtros Disponibles

| Filtro | Descripción | Ejemplo |
|--------|-------------|---------|
| `limit` | Máximo de logs | `?limit=50` |
| `level` | Por nivel | `?level=ERROR` |
| `module` | Por módulo | `?module=integrations/whatsapp` |
| `tags` | Por tags | `?tags=whatsapp,error` |
| `search` | Buscar texto | `?search=login` |
| `number` | Custom var | `?number=593987654321` |
| `bot_id` | Custom var | `?bot_id=10` |
| **[cualquier custom var]** | | `?client_id=5` |

### Ejemplos de Consultas

```bash
# Todos los logs de WhatsApp de hoy
GET /api/logs/today?module=integrations/whatsapp

# Errores de un bot específico
GET /api/logs/today?bot_id=10&level=ERROR

# Logs de un número de teléfono
GET /api/logs/search?number=593987654321&from=2025-12-01

# Logs con tags específicos
GET /api/logs/today?tags=whatsapp,error

# Combinar múltiples filtros
GET /api/logs/search?module=integrations/whatsapp&bot_id=10&tags=error&from=2025-12-01
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2025-12-08 23:38:54",
        "level": "INFO",
        "module": "integrations/whatsapp",
        "location": "whatsapp.php:142",
        "message": "Mensaje enviado",
        "tags": ["whatsapp", "message", "outbound"],
        "context": {
          "number": "593987654321",
          "bot_id": 10,
          "text": "Hola"
        }
      }
    ],
    "count": 1,
    "date": "2025-12-08"
  }
}
```

---

## 💡 Casos de Uso

### WhatsApp Bot con Filtros
```php
// Escribir log
log::info('Mensaje enviado', 
  ['text' => 'Hola'], 
  [
    'module' => 'integrations/whatsapp',
    'number' => '593987654321',
    'bot_id' => 10,
    'tags' => ['whatsapp', 'outbound']
  ]
);

// Consultar logs de ese número
GET /api/logs/today?number=593987654321

// Errores de ese bot
GET /api/logs/today?bot_id=10&level=ERROR&tags=error
```

### Sistema Multi-Tenant
```php
log::setConfig([
  'format' => 'custom',
  'template' => 'tenants/{tenant_id}/{year}/{month}/{day}.log'
]);

log::info('Action', [], [
  'module' => 'tenant',
  'custom' => ['tenant_id' => 123]
]);
// logs/tenants/123/2025/12/08.log
```

---

## 🏗️ Arquitectura

```
ESCRIBIR → log.php (minimalista)
    ↓
ARCHIVOS .log
    ↓  
LEER → logReader.php (filtros)
    ↓
ENDPOINTS → logs.php (API)
```

### Archivos

- `framework/helpers/log.php` - Escribir logs
- `framework/helpers/logReader.php` - Leer/filtrar logs
- `app/routes/apis/logs.php` - Endpoints API

---

## 🎓 Mejores Prácticas

✅ Usar módulos jerárquicos: `integrations/whatsapp`, `ecommerce/orders`
✅ Tags consistentes: `['whatsapp', 'telegram']`, `['inbound', 'outbound']`, `['error', 'success']`
✅ Custom vars útiles: `number`, `bot_id`, `user_id`, `client_id`
✅ Niveles apropiados: DEBUG para desarrollo, ERROR para problemas
✅ Sin contexto: Usa `null` o `[]` (aparece como `-` en logs)
✅ Contexto flexible: Acepta arrays, strings, números, booleans
❌ No loguear passwords ni datos sensibles

**Formato de campos vacíos:**
- Tags vacíos → `-`
- Context vacío → `-`
- Mantiene formato consistente (7 columnas) para parsers TSV