# Rutas del Framework

> Endpoints del sistema: system, logs, sessions, country.
> Generado: 2026-03-07 19:35:47

---

### `framework/routes/system.php`

```
FILE: framework/routes/system.php
ROLE: Rutas internas de administración y diagnóstico del sistema.

ENDPOINTS:
  GET  /api/system/health          → estado del sistema (status + timestamp)
  GET  /api/system/info            → PHP version, entorno, storage, sesiones activas [auth]
  GET  /api/system/routes          → lista todos los endpoints registrados
    ?method=GET                    → filtrar por método HTTP
    ?source=middle                 → filtrar por origen
    ?grouped=true                  → agrupar por recurso
  GET  /api/system/tables          → estructura de tablas de la DB
    ?names=users,products          → filtrar tablas específicas
    ?format=mini|json|html         → formato de respuesta (default: mini/text)
  GET  /api/system/cache/stats     → estadísticas de archivos en storage/cache
  GET  /api/system/logs-test       → genera un log de prueba (debug)
  DELETE /api/system/cache/cleanup → elimina cache y sesiones expiradas
```

### `framework/routes/logs.php`

```
FILE: framework/routes/logs.php
ROLE: Endpoints de consulta y filtrado de logs del sistema.
      Lógica de lectura delegada a helper logReader.
      En producción todos los endpoints requieren middleware 'auth'.

ENDPOINTS:
  GET /api/logs/today              → logs de hoy (default: 100)
  GET /api/logs/latest             → últimos N logs (default: 50)
  GET /api/logs/{year}/{month}     → logs de un mes completo
  GET /api/logs/{year}/{month}/{day} → logs de una fecha específica
  GET /api/logs/search             → búsqueda con rango de fechas
    ?from=2025-12-01&to=2025-12-10 → rango (default: últimos 7 días)
  GET /api/logs/stats              → estadísticas de logs de hoy

FILTROS DISPONIBLES (todos los endpoints):
  ?level=ERROR                     → DEBUG, INFO, WARNING, ERROR
  ?module=integrations/whatsapp    → módulo específico
  ?tags=whatsapp,error             → tags separados por coma
  ?search=login                    → busca en mensaje y contexto
  ?user_id=5                       → filtrar por usuario
  ?limit=100                       → límite de resultados
  ?number=593987654321             → custom var: número de teléfono
  ?bot_id=10                       → custom var: ID de bot
  ?client_id=3                     → custom var: ID de cliente
  ?[custom_var]=valor              → cualquier custom var registrada en el log

EJEMPLOS COMBINADOS:
  GET /api/logs/today?module=integrations/whatsapp&number=593987654321&tags=error
  GET /api/logs/search?bot_id=10&level=ERROR&from=2025-12-01&to=2025-12-08
  GET /api/logs/2025/12/08?tags=whatsapp,telegram&level=WARNING
  GET /api/logs/today?user_id=5&level=INFO
```

### `framework/routes/sessions.php`

```
FILE: framework/routes/sessions.php
ROLE: Endpoints de gestión de sesiones.

ENDPOINTS:
  DELETE /api/sessions/user/{user_id} → invalida todas las sesiones de un usuario

NOTAS:
  - Puede ejecutarse desde CRON para limpieza programada
  - Delega la lógica a UserController::invalidateSessions()
```

### `framework/routes/country.php`

```
FILE: framework/routes/country.php
ROLE: Endpoints de consulta de países usando ogCountry.

ENDPOINTS:
  GET  /api/country/all            → todos los países
    ?region=america|europa         → filtrar por región
    ?codes=EC,CO,PE                → filtrar por códigos ISO
    ?sort=name|currency            → ordenar por campo (default: name)
    ?order=asc|desc                → dirección (default: asc)
  GET  /api/country/{code}         → datos de un país por código ISO
    ?time=1                        → incluir hora actual del país
  POST /api/country/convert        → convertir fecha entre timezones de dos países
    { "datetime": "2025-01-12 10:00:00", "from": "EC", "to": "ES" }
    → requiere middleware 'json'
```
