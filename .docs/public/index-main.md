# Frontend MiniFramework - Documentación

## Estructura Base

### index.html
Archivo principal de entrada que configura y carga la aplicación.

**Propósito:**
- Define la estructura HTML base
- Configura variables globales del sistema
- Detecta automáticamente el entorno (desarrollo/producción)
- Gestiona versionado y cache
- Carga dinámicamente el script principal

**Características clave:**
- **Detección automática de entorno**: Identifica si está en localhost, IP local o puertos de desarrollo
- **Gestión de versiones**: Usa sessionStorage para control de cache
- **Ruta base dinámica**: Calcula BASE_URL automáticamente
- **Carga modular**: Inyecta main.js como módulo ES6

### main.js
Núcleo del framework que inicializa todos los componentes.

**Propósito:**
- Define la configuración global de la aplicación
- Carga y ejecuta todos los módulos del sistema
- Maneja la inicialización secuencial
- Proporciona manejo de errores global

**Módulos principales cargados:**

#### Core System
- `logger.js` - Sistema de logging
- `api.js` - Comunicación con backend
- `cache.js` - Gestión de cache
- `event.js` - Sistema de eventos
- `i18n.js` - Internacionalización
- `auth.js` - Autenticación y sesiones

#### UI Components
- `modal.js` - Sistema de modales
- `dataTable.js` - Tablas de datos
- `form.js` - Manejo de formularios
- `view.js` - Sistema de vistas
- `sidebar.js` - Navegación lateral

#### Configuración destacada:
```javascript
auth: {
  enabled: true,
  sessionCheckInterval: 2*60*1000, // Verificación cada 2 min
  tokenTTL: 24 horas
},

cache: {
  modals: !IS_DEV,        // Cache en producción
  views: !IS_DEV,
  viewNavigation: !!IS_DEV // Tabs solo en desarrollo
}s