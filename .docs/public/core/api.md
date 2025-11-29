# API Core

Clase para manejar todas las peticiones HTTP al backend con autenticación automática.

## Métodos Principales

### `api.get(endpoint)`
Realiza petición GET.

### `api.post(endpoint, data)`
Realiza petición POST con datos.

### `api.put(endpoint, data)`
Realiza petición PUT con datos.

### `api.delete(endpoint)`
Realiza petición DELETE.

## Características

### Headers Automáticos
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (si existe)

### Manejo de URLs
- Normaliza slashes duplicados
- Respeta protocolo HTTP/HTTPS
- Usa BASE_URL como base

### Manejo de Errores
- Detección automática de 401 (token expirado)
- Logging detallado de peticiones
- Throw de errores para manejo externo

### Integración con Auth
- Incluye token automáticamente si el usuario está autenticado
- Maneja sesión expirada redirigiendo al login