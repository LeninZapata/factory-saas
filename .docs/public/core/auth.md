# MiniFramework - Documentación

## index.html

**Propósito:** Punto de entrada que configura variables globales y carga el sistema.

**Variables globales:**
- `VERSION` - Versión de la app
- `BASE_URL` - Ruta base calculada automáticamente desde la URL actual
- `IS_DEV` - Detecta entorno (localhost, IPs locales, puertos dev: 3000, 5173, 8080)

**Flujo:**
1. Detecta entorno automáticamente
2. Calcula `appVersion` usando sessionStorage (cache-busting)
3. Inyecta `main.js` como módulo ES6 con versión en query string

**Nota:** En desarrollo usa timestamp, en producción usa VERSION.

---

## main.js

**Propósito:** Configuración global y bootstrap del sistema.

### window.appConfig

Objeto de configuración principal con:

**i18n:**
- `enabled`, `defaultLang`, `availableLangs`

**auth:**
- `loginView`, `redirectAfterLogin`, `storageKey`
- `tokenTTL` - 24h
- `sessionCheckInterval` - 2 min
- `api` - endpoints de login/logout/profile

**routes:**
- Mapeo de rutas para vistas, modelos, componentes
- Usa `{pluginName}` como placeholder para plugins

**cache:**
- Habilitado solo en producción (!IS_DEV)
- `viewNavigation` habilitado solo en desarrollo
- `ttl` - 1 hora

### SCRIPTS_TO_LOAD

Array con orden de carga de módulos:
1. Core (logger, api, cache, event, i18n, loader, validator, conditions, dataLoader, hook, form, auth, view, sidebar, layout)
2. Components (langSelector, toast, grouper, modal, tabs, widget, dataTable)

### initializeApp()

**Flujo de inicialización:**
1. Carga todos los scripts con cache-busting
2. Ejecuta cada script con `new Function()`
3. Inicializa i18n si está habilitado
4. Inicializa auth:
   - Verifica autenticación
   - Redirige a login si no autenticado
   - Muestra app si autenticado
5. Ejecuta cleanup del cache
6. Manejo de errores con UI de fallback

**Importante:** Se ejecuta en DOMContentLoaded o inmediatamente si el DOM ya está listo.