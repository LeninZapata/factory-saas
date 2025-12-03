# MiniFramework - Documentación (FRONTEND)

## 🚨 GUÍA RÁPIDA: Errores Comunes y Soluciones

Esta sección documenta los errores más comunes al trabajar con el framework y cómo evitarlos.

### 1. Vistas que no se muestran

**Síntoma:** El menú aparece pero al hacer clic no muestra contenido o la vista está en blanco.

**Causas comunes:**

- ❌ Usar `"component": "dataTable"` en lugar de `"component": "datatable"` (minúsculas)
- ❌ Falta la propiedad `pluginName` en la configuración del datatable
- ❌ Columnas configuradas como objetos en lugar de array de strings
- ❌ No envolver componentes dentro de la estructura `content`

**Solución:**
```json
{
  "id": "mi-vista",
  "title": "Mi Vista",
  "content": [
    {
      "type": "component",
      "component": "datatable",
      "order": 1,
      "config": {
        "pluginName": "miPlugin",
        "columns": ["id", "nombre", "email"],
        "dataSource": {
          "type": "auto",
          "api": {"endpoint": "/api/items"}
        }
      }
    }
  ]
}
```

### 2. Widgets que no aparecen en Dashboard

**Síntoma:** La vista dashboard se carga pero no muestra los widgets.

**Causa:** Los widgets están configurados fuera del array `content` o sin la estructura correcta.

**❌ INCORRECTO:**
```json
{
  "id": "dashboard",
  "widgets": [
    {"title": "Widget 1", "html": "<div>...</div>"}
  ]
}
```

**✅ CORRECTO:**
```json
{
  "id": "dashboard",
  "content": [
    {
      "type": "component",
      "component": "widget",
      "order": 1,
      "config": {
        "title": "Widget 1",
        "html": "<div>...</div>"
      }
    }
  ]
}
```

### 3. Acciones de DataTable que no funcionan

**Síntoma:** Los botones de acción aparecen pero no hacen nada al hacer clic.

**Causa:** Las acciones no están configuradas con `onclick` y código JavaScript ejecutable.

**❌ INCORRECTO:**
```json
"actions": {
  "edit": {
    "label": "Editar",
    "form": "forms/edit-form"
  }
}
```

**✅ CORRECTO:**
```json
"actions": {
  "edit": {
    "name": "✏️ Editar",
    "onclick": "modal.openWithData('plugin|forms/edit-form', {id: {id}, title: 'Editar'})",
    "dataLoader": {
      "type": "auto",
      "api": {"endpoint": "/api/items/{id}"}
    }
  },
  "delete": {
    "name": "🗑️ Eliminar",
    "onclick": "if(confirm('¿Eliminar?')) { api.delete('/api/items/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }); }"
  }
}
```

### 4. Plugin no aparece en el menú

**Síntoma:** El plugin está creado pero no aparece en el sidebar.

**Checklist de verificación:**

1. ✅ El plugin está registrado en `/public/plugins/index.json`
2. ✅ El archivo `/public/plugins/{plugin}/index.json` existe y tiene `"enabled": true`
3. ✅ La estructura del menú es correcta (usa `title` no `label`)
4. ✅ Las rutas de vistas son relativas (ej: `"sections/dashboard"` no `"plugin/sections/dashboard"`)

**Ejemplo correcto de index.json del plugin:**
```json
{
  "name": "miPlugin",
  "version": "1.0.0",
  "enabled": true,
  "hasMenu": true,
  "hasViews": true,
  "menu": {
    "title": "Mi Plugin",
    "icon": "🔌",
    "order": 10,
    "items": [
      {
        "id": "section1",
        "title": "Sección 1",
        "view": "sections/section1",
        "order": 1
      }
    ]
  }
}
```

### 5. Modal con formulario no carga datos

**Síntoma:** El modal se abre pero el formulario está vacío al editar.

**Causa:** No se está usando `modal.openWithData()` o falta la configuración `dataLoader`.

**✅ CORRECTO:**
```json
"actions": {
  "edit": {
    "name": "Editar",
    "onclick": "modal.openWithData('plugin|forms/edit', {id: {id}})",
    "dataLoader": {
      "type": "auto",
      "api": {
        "endpoint": "/api/items/{id}",
        "method": "GET"
      }
    }
  }
}
```

### 6. Controlador backend no se encuentra

**Síntoma:** Error 404 al hacer llamadas a la API del plugin.

**Checklist:**

1. ✅ El controlador existe en `/backend/resources/controllers/{nombre}Controller.php`
2. ✅ El resource schema existe en `/backend/resources/{nombre}.json`
3. ✅ El plugin backend está configurado en `/backend/plugins/{plugin}/plugin.json`
4. ✅ El controlador extiende correctamente la clase base y llama `parent::__construct('nombre')`

**Ejemplo correcto de controlador:**
```php
<?php
require_once __DIR__ . '/../core/controller.php';

class blogController extends controller {
    public function __construct() {
        parent::__construct('blog'); // Nombre del resource
    }
    
    // Métodos custom aquí
}
```

### 7. Formularios con campos repetibles no funcionan

**Síntoma:** Los campos repetibles no se agregan o eliminan correctamente.

**Causa:** Falta inicializar el sistema de repetibles o la estructura es incorrecta.

**✅ Estructura correcta:**
```json
{
  "name": "sources",
  "label": "Fuentes",
  "type": "repeatable",
  "addButtonPosition": "bottom",
  "addButtonText": "➕ Agregar Fuente",
  "fields": [
    {
      "name": "url",
      "label": "URL",
      "type": "text",
      "required": true
    }
  ]
}
```

---

## Estructura de Carpetas
```
public/
├── css/
│   ├── components/
│   │   ├── dataTable.css
│   │   ├── grouper.css
│   │   ├── langSelector.css
│   │   ├── modal.css
│   │   ├── tabs.css
│   │   ├── toast.css
│   │   └── widget.css
│   ├── core/
│   │   ├── auth.css
│   │   ├── button.css
│   │   ├── form.css
│   │   ├── layout.css
│   │   ├── reset.css
│   │   ├── sidebar.css
│   │   ├── table.css
│   │   ├── vars.css
│   │   └── view.css
│   └── main.css
├── js/
│   ├── components/
│   │   ├── dataTable.js
│   │   ├── grouper.js
│   │   ├── langSelector.js
│   │   ├── modal.js
│   │   ├── tabs.js
│   │   ├── toast.js
│   │   └── widget.js
│   ├── core/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── cache.js
│   │   ├── conditions.js
│   │   ├── dataLoader.js
│   │   ├── event.js
│   │   ├── form.js
│   │   ├── hook.js
│   │   ├── i18n.js
│   │   ├── layout.js
│   │   ├── loader.js
│   │   ├── logger.js
│   │   ├── sidebar.js
│   │   ├── validator.js
│   │   └── view.js
│   ├── lang/
│   │   ├── en.json
│   │   └── es.json
│   ├── views/
│   │   ├── auth/
│   │   │   ├── forms/
│   │   │   │   └── login-form.json
│   │   │   └── login.json
│   │   ├── dashboard/
│   │   │   └── dashboard.json
│   │   └── user/
│   │       ├── forms/
│   │       │   └── user-form.json
│   │       ├── mock/
│   │       │   └── mock-users.json
│   │       ├── sections/
│   │       │   └── user-list.json
│   │       └── mock-users.json
│   └── main.js
├── plugins/
│   ├── admin/
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   └── permissions.css
│   │   │   └── js/
│   │   │       ├── admin-permissions.js
│   │   │       ├── admin.js
│   │   │       └── permissions.js
│   │   ├── lang/
│   │   │   ├── en.json
│   │   │   └── es.json
│   │   ├── views/
│   │   │   └── sections/
│   │   │       └── admin-panel.json
│   │   └── index.json
│   ├── botmaster/
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   └── botmaster.css
│   │   │   └── js/
│   │   │       └── botmaster.js
│   │   ├── lang/
│   │   │   ├── en.json
│   │   │   └── es.json
│   │   ├── mock/
│   │   │   ├── bots.json
│   │   │   ├── families.json
│   │   │   └── tasks.json
│   │   ├── views/
│   │   │   ├── forms/
│   │   │   │   ├── bot-form.json
│   │   │   │   ├── family-form.json
│   │   │   │   └── task-builder.json
│   │   │   └── sections/
│   │   │       ├── bots.json
│   │   │       ├── dashboard.json
│   │   │       ├── families.json
│   │   │       ├── monitor.json
│   │   │       └── tasks.json
│   │   └── index.json
│   ├── ejemplos/
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   └── chart.css
│   │   │   └── js/
│   │   │       └── chart.js
│   │   ├── views/
│   │   │   ├── forms/
│   │   │   │   ├── conditions-advanced.json
│   │   │   │   ├── form-grouped-fields-test.json
│   │   │   │   ├── form-repeatable-grouped-opt1.json
│   │   │   │   └── repetibles-demo.json
│   │   │   └── sections/
│   │   │       ├── formularios.json
│   │   │       ├── graficos.json
│   │   │       └── widgets-demo.json
│   │   └── index.json
│   ├── inventario/
│   │   ├── dev/
│   │   │   └── db_inventario.json
│   │   ├── views/
│   │   │   ├── forms/
│   │   │   │   └── producto.json
│   │   │   └── sections/
│   │   │       ├── listado.json
│   │   │       └── stock.json
│   │   ├── hooks.js
│   │   └── index.json
│   └── index.json
└── index.html
```

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

---

## view.js

**Propósito:** Sistema de carga y renderizado de vistas desde core o plugins.

### ⚠️ ESTRUCTURA CORRECTA DE VISTAS JSON

Las vistas en este framework siguen una estructura específica. Es fundamental entender cómo configurarlas correctamente para evitar errores comunes.

#### Anatomía de una vista

```json
{
  "id": "unique-view-id",
  "title": "Título de la Vista",
  "subtitle": "Descripción opcional",
  "layout": "default",
  "scripts": ["assets/js/custom.js"],
  "styles": ["assets/css/custom.css"],
  "content": [
    {
      "type": "html|component|form",
      "order": 1,
      "content": "...",
      "component": "...",
      "config": {}
    }
  ],
  "tabs": [...],
  "statusbar": [...]
}
```

**Propiedades principales:**

- `id` (string, requerido) - Identificador único de la vista
- `title` (string, opcional) - Título mostrado en el header
- `subtitle` (string, opcional) - Subtítulo descriptivo
- `layout` (string, opcional) - Clase CSS aplicada al body
- `scripts` (array, opcional) - Scripts adicionales a cargar
- `styles` (array, opcional) - Estilos adicionales a cargar
- `content` (array, requerido) - Array de items de contenido
- `tabs` (array, opcional) - Sistema de pestañas
- `statusbar` (array, opcional) - Barra de estado inferior

#### Array `content` - Tipos de contenido

El array `content` puede contener diferentes tipos de elementos:

**1. HTML directo:**
```json
{
  "type": "html",
  "order": 1,
  "content": "<h3>Título</h3><p>Descripción</p>"
}
```

**2. Componente (widget, datatable, etc):**
```json
{
  "type": "component",
  "component": "datatable",
  "order": 2,
  "config": {
    "pluginName": "inventario",
    "dataSource": {...},
    "columns": [...],
    "actions": {...}
  }
}
```

**3. Formulario:**
```json
{
  "type": "form",
  "order": 3,
  "form_json": "forms/producto"
}
```

#### ❌ Errores comunes al crear vistas

**ERROR 1: Poner componentes directamente sin el wrapper correcto**
```json
// ❌ INCORRECTO
{
  "id": "dashboard",
  "widgets": [
    {
      "title": "Widget 1",
      "html": "<div>...</div>"
    }
  ]
}

// ✅ CORRECTO
{
  "id": "dashboard",
  "content": [
    {
      "type": "component",
      "component": "widget",
      "order": 1,
      "config": {
        "title": "Widget 1",
        "html": "<div>...</div>"
      }
    }
  ]
}
```

**ERROR 2: Usar "dataTable" en lugar de "datatable"**
```json
// ❌ INCORRECTO
{
  "type": "component",
  "component": "dataTable"
}

// ✅ CORRECTO
{
  "type": "component",
  "component": "datatable"
}
```

**ERROR 3: No incluir `pluginName` en datatable de plugins**
```json
// ❌ INCORRECTO
{
  "type": "component",
  "component": "datatable",
  "config": {
    "dataSource": {...}
  }
}

// ✅ CORRECTO
{
  "type": "component",
  "component": "datatable",
  "config": {
    "pluginName": "miPlugin",
    "dataSource": {...}
  }
}
```

**ERROR 4: Configurar columnas como objetos en lugar de strings simples**
```json
// ❌ INCORRECTO
"columns": [
  {"key": "id", "label": "ID"},
  {"key": "nombre", "label": "Nombre"}
]

// ✅ CORRECTO
"columns": ["id", "nombre", "categoria", "precio"]
```

**ERROR 5: No usar `onclick` en acciones de datatable**
```json
// ❌ INCORRECTO
"actions": {
  "edit": {
    "label": "Editar",
    "form": "forms/edit",
    "endpoint": "/api/item/{id}"
  }
}

// ✅ CORRECTO
"actions": {
  "edit": {
    "name": "Editar",
    "onclick": "modal.openWithData('plugin|forms/edit', {id: {id}})",
    "dataLoader": {
      "type": "auto",
      "api": {"endpoint": "/api/item/{id}"}
    }
  }
}
```

#### ✅ Ejemplos completos de vistas correctas

**Vista con widgets (Dashboard):**
```json
{
  "id": "dashboard",
  "title": "Panel de Control",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<h3>📊 Dashboard</h3>"
    },
    {
      "type": "component",
      "component": "widget",
      "order": 2,
      "config": {
        "title": "Total Usuarios",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/users/count",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>{{total}}</h2><p>Usuarios</p></div>"
      }
    },
    {
      "type": "component",
      "component": "widget",
      "order": 3,
      "config": {
        "title": "Ventas del Mes",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/sales/monthly",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>${{amount}}</h2><p>Ventas</p></div>"
      }
    }
  ]
}
```

**Vista con DataTable:**
```json
{
  "id": "productos-listado",
  "title": "Gestión de Productos",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<h3>📦 Productos</h3><p>Administra tu inventario</p>"
    },
    {
      "type": "html",
      "order": 2,
      "content": "<div class='view-toolbar'><button class='btn btn-primary' onclick=\"modal.open('inventario|forms/producto', {title: 'Nuevo Producto'})\">➕ Nuevo</button></div>"
    },
    {
      "type": "component",
      "component": "datatable",
      "order": 3,
      "config": {
        "pluginName": "inventario",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/productos",
            "method": "GET"
          }
        },
        "columns": ["id", "nombre", "categoria", "precio", "cantidad"],
        "actions": {
          "edit": {
            "name": "✏️ Editar",
            "dataLoader": {
              "type": "auto",
              "api": {
                "endpoint": "/api/productos/{id}",
                "method": "GET"
              }
            },
            "onclick": "modal.openWithData('inventario|forms/producto', {id: {id}, title: 'Editar Producto'})"
          },
          "delete": {
            "name": "🗑️ Eliminar",
            "onclick": "if(confirm('¿Eliminar {nombre}?')) { api.delete('/api/productos/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }); }"
          }
        }
      }
    }
  ]
}
```

**Vista con Tabs:**
```json
{
  "id": "configuracion",
  "title": "Configuración",
  "tabs": [
    {
      "id": "general",
      "title": "General",
      "content": [
        {
          "type": "form",
          "form_json": "forms/config-general"
        }
      ]
    },
    {
      "id": "avanzado",
      "title": "Avanzado",
      "content": [
        {
          "type": "html",
          "content": "<h4>Configuración Avanzada</h4>"
        },
        {
          "type": "component",
          "component": "datatable",
          "config": {
            "pluginName": "admin",
            "columns": ["key", "value"],
            "dataSource": {
              "type": "auto",
              "api": {"endpoint": "/api/settings"}
            }
          }
        }
      ]
    }
  ]
}
```

**Vista simple con HTML:**
```json
{
  "id": "graficos",
  "title": "Gráficos",
  "scripts": ["assets/js/chart.js"],
  "content": [
    {
      "type": "html",
      "content": "<div id='chart-container'><canvas id='myChart'></canvas></div>"
    }
  ]
}
```

### Propiedades estáticas

- `views` - Registro de vistas cargadas
- `loadedPlugins` - Plugins registrados
- `viewNavigationCache` - Cache de navegación de vistas (solo en dev)

### loadView(viewName, container, pluginContext, menuResources, afterRender, menuId)

**Lógica de resolución de rutas:**

1. **Si tiene `pluginContext`:**
   - Busca en `plugins/{pluginContext}/views/{viewName}.json`

2. **Si empieza con `core:`:**
   - Remueve el prefijo y busca en `js/views/{viewName}.json`

3. **Si contiene `/`:**
   - Extrae primera parte del path
   - Verifica si es plugin habilitado (`hook.isPluginEnabled()`)
   - **Si es plugin:** `plugins/{plugin}/views/{resto}.json`
   - **Si NO es plugin:** `js/views/{viewName}.json` (core)

4. **Default:**
   - Busca en `js/views/{viewName}.json` (core)

**Ejemplos:**
- `loadView('auth/login')` → `js/views/auth/login.json` (core)
- `loadView('botmaster/sections/dashboard')` → `plugins/botmaster/views/sections/dashboard.json` (plugin)
- `loadView('sections/bots', null, 'botmaster')` → `plugins/botmaster/views/sections/bots.json` (plugin context)
- `loadView('core:dashboard/dashboard')` → `js/views/dashboard/dashboard.json` (core forzado)

**Flujo:**
1. Verifica cache de navegación (solo en dev con `viewNavigation: true`)
2. Resuelve ruta según lógica anterior
3. Carga JSON de vista (con cache-busting si está deshabilitado el cache)
4. Filtra tabs según permisos del usuario
5. Combina recursos del menú con recursos de la vista
6. Renderiza vista en container o en `#content`
7. Carga recursos (scripts/styles)
8. Inicializa componentes dinámicos
9. Ejecuta callback `afterRender`
10. Guarda en cache de navegación si aplica

### filterTabsByPermissions(tabs, pluginName, menuId)

Filtra tabs según permisos del usuario:
- Admin: acceso total
- Sin permisos de plugin: retorna `[]`
- `menus === '*'`: acceso total
- `tabs === '*'`: todas las tabs
- `tabs` como objeto: filtra por `{tabId: true}`

### Renderizado

**renderView(viewData):**
- Renderiza en `#content`
- Aplica layout class al body
- Genera HTML de la vista

**renderViewInContainer(viewData, container):**
- Renderiza en container específico

**generateViewHTML(viewData):**
Genera estructura:
- `.view-header` - título/subtitle si existe
- `.view-tabs-container` - si tiene tabs
- `.view-content` - contenido principal
- `.view-statusbar` - barra de estado si existe

### renderContentItem(item)

Maneja tipos de contenido:
- `type: 'form'` → `<div class="dynamic-form" data-form-json="...">`
- `type: 'component'` → `<div class="dynamic-component" data-component="..." data-config="...">`
- `type: 'html'` → inserta `item.content` directamente

### loadDynamicComponents(container)

Inicializa componentes dinámicos:
- `.dynamic-form` → llama `form.load(formJson, el)`
- `.dynamic-component` → llama `window[componentName].render()` o `.init()`

### Integración con hooks

Ejecuta hooks de vista: `hook_${viewData.id}` para extender contenido.

**Cache:**
- Vistas: solo en producción
- Navegación (tabs): solo en desarrollo

---

## api.js

**Propósito:** Cliente HTTP para comunicación con backend.

### Propiedades

- `baseURL` - URL base (prioridad: `window.BASE_URL` > `appConfig.api.baseURL`)
- `headers` - Headers por defecto (`Content-Type: application/json`)

### request(endpoint, options)

**Características:**
- Normaliza URLs eliminando slashes duplicados (preserva protocolo)
- Auto-inyecta token JWT en header `Authorization: Bearer {token}`
- Maneja 401 automáticamente: cierra sesión si token expiró
- Lanza error si response no es ok

**Shortcuts:**
- `api.get(endpoint)` - GET request
- `api.post(endpoint, data)` - POST con JSON body
- `api.put(endpoint, data)` - PUT con JSON body
- `api.delete(endpoint)` - DELETE request

**Ejemplo:**
```javascript
const users = await api.get('/api/users');
await api.post('/api/user', { name: 'Juan' });
```

---

## cache.js

**Propósito:** Sistema de caché dual (memoria + localStorage) con TTL.

### Propiedades

- `memoryCache` - Map() para caché en memoria (rápido, volátil)
- `defaultTTL` - 1 hora (60 * 60 * 1000 ms)

### Métodos principales

**set(key, data, ttl):**
- Guarda en memoria Y localStorage
- TTL opcional (default: 1h)

**get(key):**
- Busca primero en memoria, luego en localStorage
- Retorna null si expiró o no existe
- Auto-promoción: si encuentra en localStorage, copia a memoria

**delete(key):**
- Elimina de ambos storages

**clear():**
- Limpia todo el caché (memoria + localStorage con prefijo `cache_`)

### Métodos adicionales

- `isExpired(key)` - Verifica si expiró sin eliminar
- `getTimeToExpire(key)` - Retorna milisegundos restantes
- `getStats()` - Info de keys en memoria y localStorage
- `cleanup()` - Elimina items expirados (se ejecuta cada 5 min)

### Debug (solo en dev)

Se activa automáticamente en desarrollo:
```javascript
debugCache.stats()
debugCache.list('memory')
debugCache.get('key')
```

---

## event.js

**Propósito:** Sistema de delegación de eventos global.

### on(selector, eventType, handler, context)

**Características:**
- Delegación de eventos (no requiere re-bind en contenido dinámico)
- Usa `matches()` y `closest()` para encontrar targets
- Captura en fase de captura (`useCapture: true`)
- Retorna ID del listener para poder removerlo

**Ejemplo:**
```javascript
const id = events.on('.btn-save', 'click', function(e) {
  console.log('Clicked:', this);
});

events.off(id); // Remover listener
```

### Métodos

- `on(selector, eventType, handler, context)` - Registra listener
- `off(id)` - Remueve listener por ID
- `clear()` - Limpia todos los listeners
- `debug()` - Log de listeners activos

**Nota:** `refresh()` existe por compatibilidad pero no hace nada (delegación no requiere refresh).

---

## i18n.js

**Propósito:** Sistema de internacionalización con soporte para core y plugins.

### Propiedades

- `currentLang` - Idioma actual
- `translations` - Map de traducciones core por idioma
- `pluginTranslations` - Map de traducciones de plugins
- `config.refreshOnChange` - Si true: recarga página al cambiar idioma

### init(config)

Inicializa i18n:
- Carga idioma desde: localStorage > config > default ('es')
- Carga archivo `js/lang/{lang}.json`

### t(key, params)

Traduce una key:
1. Busca en traducciones de plugin (si key empieza con nombre de plugin)
2. Busca en traducciones core
3. Fallback a idioma por defecto
4. Retorna key si no encuentra

**Reemplazo de parámetros:**
```javascript
i18n.t('welcome.message', { name: 'Juan' })
// "welcome.message": "Hola {name}" → "Hola Juan"
```

### setLang(lang)

Cambia idioma:
- Carga nuevas traducciones (core + plugins activos)
- Guarda en localStorage
- **Si `refreshOnChange: true`** → recarga página
- **Si `refreshOnChange: false`** → actualiza dinámicamente con `updateDynamicContent()`

### Actualización dinámica

Actualiza elementos con:
- `data-i18n` - textContent
- `data-i18n-placeholder` - placeholder
- `data-i18n-title` - title
- `data-i18n-params` - parámetros JSON

### loadPluginLang(pluginName, lang)

Carga traducciones de plugin desde `plugins/{pluginName}/lang/{lang}.json`

**Helper global:**
```javascript
__('key', params) // Alias de i18n.t()
```

---

## loader.js

**Propósito:** Cargador dinámico de scripts, styles y JSON.

### Propiedades

- `loaded` - Set de URLs ya cargadas (previene duplicados)

### loadScript(url, options)

Carga script JS dinámicamente:
- Retorna Promise
- Previene carga duplicada
- `options.optional` - No lanza error si falla

### loadStyle(url, options)

Carga stylesheet CSS dinámicamente:
- Retorna Promise
- Previene carga duplicada
- `options.optional` - No lanza error si falla

### loadResources(scripts, styles)

Carga múltiples recursos en paralelo:
```javascript
await loader.loadResources(
  ['js/plugin.js', 'js/helper.js'],
  ['css/plugin.css']
);
```

### loadJson(url, options)

Carga archivo JSON:
- `options.optional` - Retorna null si no existe (no lanza error)
- `options.silent` - No hace log si falla

**Ejemplo:**
```javascript
const config = await loader.loadJson('config.json', { 
  optional: true,
  silent: true 
});
```

---

## hook.js

**Propósito:** Sistema de plugins - carga, registro, menús y hooks extensibles.

### Propiedades

- `hooks` - Map de hooks registrados
- `loadedHooks` - Set de plugins con hooks cargados
- `pluginRegistry` - Map de plugins habilitados (filtrados por permisos)
- `pluginRegistryOriginal` - Map de TODOS los plugins (sin filtrar)
- `menuItems` - Array de items de menú generados

### loadPluginHooks()

**Flujo principal de carga:**
1. Lee `plugins/index.json` para obtener lista de plugins
2. Para cada plugin:
   - Carga `plugins/{plugin}/index.json` (config)
   - Si `enabled: true`:
     - Guarda en `pluginRegistry` y `pluginRegistryOriginal`
     - Carga autoload script si existe
     - Carga scripts/styles del plugin
     - Carga idiomas del plugin
     - Genera items de menú
     - Carga hooks si `hasHooks: true`
     - Precarga vistas si `preloadViews: true`
3. Ordena menuItems por `order`

### loadPluginConfig(pluginName)

Carga `plugins/{pluginName}/index.json`:
```json
{
  "name": "botmaster",
  "enabled": true,
  "hasMenu": true,
  "hasHooks": true,
  "autoload": "assets/js/botmaster.js",
  "scripts": ["assets/js/helper.js"], // a este nivel el script se cargaran a nivel de la carga de la pagina ya que es el index.json del plugins, para bajo demanda el script seria cargado dentro del {vista/section/form}.json del archivo para mejor performance.
  "styles": ["assets/css/botmaster.css"], //a este nivel el style se cargaran a nivel de la carga de la pagina
  "menu": {
    "title": "Botmaster",
    "icon": "🤖",
    "order": 10,
    "items": [...]
  }
}
```

### processMenuItems(items, parentPlugin, pluginScripts, pluginStyles)

Procesa items de menú:
- Combina scripts/styles del plugin con los del item
- Ordena por `order`
- Recursivo para subitems

### getMenuItems()

Retorna menús visibles:
- Solo plugins con `enabled: true`
- Ya filtrados por permisos de usuario
- Ordenados por `order`

### getAllPluginsForPermissions()

Retorna TODOS los plugins (sin filtrar):
- Usa `pluginRegistryOriginal`
- Para configuración de permisos

### Métodos de consulta

- `getPluginConfig(name)` - Config de un plugin
- `isPluginEnabled(name)` - Si está habilitado
- `getEnabledPlugins()` - Lista de habilitados
- `hasPluginLanguages(name)` - Si tiene idiomas cargados
- `getPluginLanguages(name)` - Idiomas cargados

### execute(hookName, defaultData)

Ejecuta hooks de plugins:
1. Itera plugins habilitados con hooks
2. Llama `window[{plugin}Hooks][hookName]()`
3. Combina resultados con defaultData
4. Ordena por `order`
5. Retorna array combinado

**Ejemplo:**
```javascript
// En plugin hooks.js
class botmasterHooks {
  static hook_dashboard() {
    return [{
      type: 'widget',
      order: 5,
      component: 'botStatus'
    }];
  }
}

// En view.js
const content = hook.execute('hook_dashboard', existingContent);
```

### Carga de idiomas

- `loadPluginLanguages(name)` - Carga idioma actual del plugin
- `tryLoadPluginLang(name, lang)` - Intenta cargar idioma específico
- Guarda en `i18n.pluginTranslations` y cache

### Precarga de vistas

Si `menu.preloadViews: true`, precarga vistas del menú en cache.

---

## layout.js

**Propósito:** Genera estructura HTML base de la aplicación.

### init(mode)

**Modos:**

**'auth':**
```html
<div class="layout">
  <main class="content" id="content"></main>
</div>
```

**'app' (default):**
```html
<div class="layout">
  <header class="header" id="header">Sistema</header>
  <aside class="sidebar" id="sidebar"></aside>
  <main class="content" id="content">
    <div class="view-container">
      <div class="welcome-message">
        <p>Cargando...</p>
      </div>
    </div>
    <footer class="footer">© 2024 - Sistema</footer>
  </main>
</div>
```

**Uso:**
- `layout.init('auth')` - Login/registro
- `layout.init('app')` - App principal

---

## logger.js

**Propósito:** Sistema de logging con prefijos por módulo y colores.

### Niveles

- `debug()` - Solo en desarrollo (requiere `isDevelopment: true`)
- `info()` - Información general
- `warn()` - Advertencias
- `success()` - Operaciones exitosas
- `error()` - Errores
- `log()` - Logs genéricos

### Formato

Todos los métodos reciben: `(module, ...args)`

**Convención de prefijos:**
- `cor:xxx` - Core (ej: `cor:auth`, `cor:view`, `cor:api`)
- `com:xxx` - Componentes (ej: `com:modal`, `com:datatable`)
- `p:xxx` - Plugins (ej: `p:permissions`, `p:botmaster`)
- `m:xxx` - main.js solamente

**Ejemplos:**
```javascript
logger.debug('cor:auth', 'Token válido');
logger.info('cor:view', 'Vista cargada:', viewName);
logger.warn('com:modal', 'Modal no encontrado');
logger.success('p:botmaster', 'Bots cargados');
logger.error('cor:api', 'Error en petición:', error);
```

### Estilos

Cada nivel tiene color diferente en consola:
- debug: gris (#646464)
- info: azul (#2c7ab8)
- warn: naranja (#a55617)
- success: verde (#1f8a4f)
- error: rojo (#c0392b)
- log: gris claro (#7a8a8f)

---

## auth.js

**Propósito:** Sistema completo de autenticación, sesión y permisos.

### Propiedades

- `config` - Configuración de auth
- `user` - Usuario autenticado
- `userPermissions` - Permisos del usuario
- `userPreferences` - Preferencias del usuario
- `sessionCheckInterval` - Intervalo de verificación de sesión

### init(config)

**Flujo de inicialización:**
1. Configura endpoints y opciones
2. Registra handler de formulario de login
3. Verifica sesión existente con `check()`
4. **Si autenticado:**
   - Carga usuario desde cache
   - Normaliza config (parsea JSON si es string)
   - Carga permisos del usuario
   - Inicia monitoreo de sesión
   - Muestra app
5. **Si NO autenticado:**
   - Muestra vista de login

### Autenticación

**check():**
- Verifica token en cache local
- Valida con endpoint `api.me`
- Retorna true/false
- Auto-limpia sesión si token expiró

**login(credentials):**
1. POST a `api.login` con credentials
2. Guarda token y user en cache con TTL
3. Carga permisos
4. Muestra app
5. Inicia monitoreo de sesión
6. Retorna `{ success, user, token, ttl_ms }`

**logout():**
1. Detiene monitoreo de sesión
2. POST a `api.logout`
3. Limpia caches de app
4. Limpia sesión
5. Recarga página

### Sesión

**Métodos:**
- `getToken()` - Retorna token del cache
- `getUser()` - Retorna usuario del cache
- `clearSession()` - Elimina token y usuario
- `isAuthenticated()` - true si hay user y token

### Monitoreo de sesión

**startSessionMonitoring():**
- Verifica sesión cada X minutos (config.sessionCheckInterval)
- Llama a `api.me` para validar token
- Si falla: llama `handleExpiredSession()`

**handleExpiredSession():**
1. Detiene monitoreo
2. Muestra toast de "Sesión expirada"
3. Espera 2 segundos
4. Limpia caches y sesión
5. Muestra login

### Sistema de permisos

**Estructura de permisos del usuario:**
```json
{
  "permissions": {
    "plugins": {
      "botmaster": {
        "enabled": true,
        "menus": {
          "bots": true,
          "tasks": {
            "enabled": true,
            "tabs": {
              "list": true,
              "create": false
            }
          }
        }
      }
    }
  },
  "preferences": {}
}
```

**loadUserPermissions():**
- Extrae `permissions` y `preferences` de `user.config`
- Guarda en `userPermissions` y `userPreferences`
- Llama `filterPluginsByPermissions()`

**filterPluginsByPermissions():**
1. **Si es admin:** No filtra nada (acceso total)
2. **Si NO es admin:**
   - Itera `hook.pluginRegistry`
   - **Por cada plugin:**
     - Si `permissions[plugin].enabled === false` → deshabilita plugin
     - Si tiene menú:
       - Si `menus === '*'` → acceso total a menús
       - Si no: filtra items de menú por IDs permitidos
   - Logs detallados del proceso de filtrado

**getTabPermissions(menuId):**
- Retorna permisos de tabs para un menú específico
- Retorna `'*'` si acceso total
- Retorna objeto `{ tabId: true }` si filtrado
- Retorna `null` si no hay permisos

### UI

**showLogin():**
- Inicializa layout en modo 'auth'
- Carga vista de login

**showApp():**
1. Inicializa layout en modo 'app'
2. Carga plugins con `hook.loadPluginHooks()`
3. Registra plugins en `view.loadedPlugins`
4. Filtra plugins por permisos
5. Inicializa sidebar con menús filtrados
6. Carga vista por defecto (redirectAfterLogin)

**clearAppCaches():**
Limpia todos los caches al hacer logout:
- `view.viewNavigationCache`
- `form.schemas`
- `hook.pluginRegistry`
- `sidebar.menuItems`

**reloadAppAfterPermissionChange():**
Recarga app cuando se actualizan permisos:
1. Recarga plugins
2. Filtra por nuevos permisos
3. Reinicializa sidebar

### Handler de formulario

**setupLoginHandler():**
- Registra evento en `form[data-form-id*="login-form"]`
- Valida campos requeridos
- Muestra estado de carga en botón
- Llama `login()` con credenciales
- Muestra errores con `showLoginError()`

**showLoginError(form, message):**
- Inserta div con mensaje de error
- Auto-elimina después de 5 segundos

### Configuración por defecto

```javascript
{
  enabled: true,
  loginView: 'auth/login',
  redirectAfterLogin: 'dashboard',
  storageKey: 'factory_auth',
  sessionCheckInterval: 5 * 60 * 1000, // 5 min
  tokenTTL: 24 * 60 * 60 * 1000, // 24h
  api: {
    login: '/api/user/login',
    logout: '/api/user/logout',
    me: '/api/user/profile'
  }
}
```

---

## sidebar.js

**Propósito:** Gestión del menú lateral de navegación.

### Propiedades

- `menuData.menu` - Array de items de menú

### init()

1. Carga menú con `loadMenu()`
2. Obtiene primera vista disponible con `getFirstView()`
3. Carga la primera vista

### loadMenu()

**Flujo:**
1. Obtiene menús de plugins con `hook.getMenuItems()`
2. Crea menú base con Dashboard
3. Combina base + plugins
4. Elimina duplicados con `removeDuplicateMenus()`
5. Renderiza con `renderMenu()`

**Estructura de menuData:**
```javascript
{
  menu: [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "📊",
      view: "dashboard/dashboard",
      order: 1
    },
    {
      id: "botmaster",
      title: "Botmaster",
      icon: "🤖",
      order: 10,
      items: [
        {
          id: "bots",
          title: "Bots",
          view: "sections/bots",
          scripts: ["assets/js/botmaster.js"],
          preloadViews: true
        }
      ]
    }
  ]
}
```

### renderMenu()

1. Genera HTML con `generateMenuHtml()`
2. Genera botón de logout con `generateLogoutButton()`
3. Inyecta en `#sidebar`
4. Bind eventos de click con `bindMenuEvents()`
5. Bind evento de logout

### generateMenuHtml(menuItems, level)

Genera HTML recursivo:
- Aplica clases según nivel y si tiene submenú
- Muestra icono solo en nivel 0
- Genera submenús recursivamente
- Añade `.menu-arrow` si tiene items

### bindMenuEvents()

Maneja clicks en items de menú:

**Si tiene subitems:**
- Llama `toggleSubmenu()` para expandir/contraer

**Si tiene view:**
1. Marca como activo con `setActiveMenu()`
2. Detecta plugin con `detectPluginFromMenuId()`
3. Extrae scripts/styles del menuData
4. Precarga vistas hermanas con `preloadSiblingViews()`
5. Carga vista con `view.loadView(view, null, pluginName, resources, null, menuId)`

### Precarga de vistas

**preloadSiblingViews(menuId, level, pluginName):**
- Encuentra menús hermanos (mismo nivel, mismo padre)
- Para cada hermano con `preloadViews: true`:
  - Precarga su vista en cache

**preloadView(viewPath, pluginName):**
- Verifica si ya está en cache
- Fetch de la vista JSON
- Guarda en cache si es exitoso
- No bloquea si falla (solo warning)

### Utilidades

**findMenuData(menuId, level):**
- Búsqueda recursiva de item por ID y nivel
- Retorna objeto del menú o `{}`

**findParentMenu(menuId, level):**
- Encuentra el menú padre de un item
- Retorna null si es nivel 0

**detectPluginFromMenuId(menuId):**
- Revisa `view.loadedPlugins`
- Si menuId empieza con `{plugin}-` → retorna plugin
- Sino → retorna null

**getFirstView():**
- Busca recursivamente la primera vista disponible
- Fallback: 'dashboard/dashboard'

**toggleSubmenu(element):**
- Toggle clase 'open' en el item
- Si está abriendo: cierra hermanos del mismo nivel

**removeDuplicateMenus(menuItems):**
- Usa Set para eliminar duplicados por ID
- Mantiene el primer item encontrado

### generateLogoutButton()

Genera footer del sidebar:
- Muestra nombre del usuario (`auth.user.user` o `auth.user.email`)
- Botón de logout con confirmación

### bindLogoutEvent()

- Muestra confirmación antes de logout
- Llama `auth.logout()` si confirma

---

## form.js

**Propósito:** Sistema completo de generación y manejo de formularios desde JSON.

### Propiedades

- `schemas` - Map de esquemas de formularios cargados
- `registeredEvents` - Set de eventos registrados

### load(formName, container, data, isCore, afterRender)

**Lógica de resolución de rutas (similar a view):**

1. **Si `isCore === true`:** → `js/views/{formName}.json`
2. **Si `isCore === false`:** → `plugins/{plugin}/views/forms/{resto}.json`
3. **Si empieza con `core:`:** → `js/views/{formName}.json`
4. **Si contiene `/` y es plugin:** → `plugins/{plugin}/views/forms/{resto}.json`
5. **Default:** → `js/views/{formName}.json`

**Flujo:**
1. Verifica cache
2. Fetch del JSON del formulario
3. Crea instancia única con ID timestamped
4. Ejecuta hooks `hook_form_{id}` para extender fields
5. Guarda schema en `schemas` Map
6. Renderiza con `render()`
7. Llena datos con `fill()` si se provee data
8. Bind eventos generales
9. Inicializa repetibles, transforms, conditions
10. Ejecuta callback `afterRender`
11. Retorna instanceId

### Estructura de schema

```json
{
  "id": "user-form",
  "title": "Formulario de Usuario",
  "description": "Crear/editar usuario",
  "toolbar": [...],
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true,
      "validation": "required|min:3",
      "role": "admin",
      "condition": [
        { "field": "activo", "operator": "==", "value": true }
      ],
      "conditionContext": "form",
      "conditionLogic": "AND"
    }
  ],
  "statusbar": [...]
}
```

### Tipos de fields

**Simple:**
- `text`, `email`, `number`, `password`, `textarea`, `select`, `checkbox`, `radio`, `date`, `time`, `datetime`, `file`, `hidden`

**Especiales:**
- `button` - Botón de acción
- `html` - HTML directo

**Contenedores:**
- `group` - Agrupa fields en columnas
- `grouper` - Tabs o acordeón
- `repeatable` - Items repetibles

### renderField(field, path)

Genera HTML según tipo de field:
- Aplica i18n con `t()` en labels/placeholders
- Valida acceso por rol con `hasRoleAccess()`
- Genera estructura `.form-group` o `.form-checkbox`
- Aplica transforms si existen
- Incluye validación inline si está configurada

### Repeatable fields

**renderRepeatable(field, path):**
- Genera contenedor `.repeatable-items`
- Botón "Agregar" (posición: top/middle/bottom)
- Items dinámicos con índice

**addRepeatableItem(path):**
- Clona schema de fields
- Genera item con índice `[n]`
- Botón "Eliminar" por item
- Re-inicializa transforms y conditions

**initRepeatables(formId):**
- Encuentra todos los repetibles
- Guarda schema de fields en data-attribute
- Inicializa contador

### Group y Grouper

**renderGroup(field, basePath):**
- Genera grid de columnas (1-4)
- `columns`: número de columnas
- `gap`: spacing (small/normal/large)

**renderGrouper(field, parentPath):**
- `mode: 'linear'` - Acordeón colapsable
- `mode: 'tabs'` - Tabs horizontales
- `collapsible: true/false` - Solo en linear
- `openFirst: true/false` - Primer grupo abierto

### getData(formId)

Extrae datos del formulario:
- Usa FormData nativo
- Convierte a objeto anidado con `setNestedValue()`
- Maneja repetibles: `field[0].name` → `{ field: [{ name: ... }] }`
- Retorna objeto JavaScript

### fill(formId, data)

Llena formulario con datos:
- Itera sobre data
- Encuentra inputs por name
- Maneja checkboxes y valores normales

### validate(formId)

Valida formulario según schema:
- Limpia errores previos
- Valida cada field según rules
- Reglas: `required`, `email`, `min`, `max`, `numeric`, `alpha`, `alphanumeric`
- Muestra errores inline
- Retorna `{ success, errors, message, data }`

### Transforms

**bindTransforms(formId):**
- `uppercase`, `lowercase`, `capitalize`, `numeric`, `alpha`, `alphanumeric`
- Aplica en tiempo real en evento `input`

### Permisos por rol

**hasRoleAccess(field):**
- Si field tiene `role: "admin"` → solo admin ve el field
- Compara con `auth.user.role`

### bindEventsOnce()

Registra eventos globales (una sola vez):
- Submit: llama `validate()` antes de enviar
- Repeatable add: llama `addRepeatableItem()`
- Repeatable remove: elimina item
- Grouper: toggle acordeón/tabs

### Integración con hooks

Ejecuta `hook_form_{formId}` para permitir que plugins agreguen fields dinámicamente.

---

## conditions.js

**Propósito:** Sistema de visibilidad condicional de fields en formularios.

### Propiedades

- `rules` - Map de reglas por formId
- `watchers` - Map de event listeners y observers

### init(formId)

1. Extrae condiciones del schema con `extractConditions()`
2. Configura watchers con `setupWatchers()`
3. Configura MutationObserver para repetibles con `setupRepeatableObserver()`
4. Evaluación inicial

### Estructura de condiciones

```json
{
  "name": "email_alternativo",
  "label": "Email Alternativo",
  "type": "email",
  "condition": [
    { "field": "tiene_email_alt", "operator": "==", "value": true },
    { "field": "tipo_usuario", "operator": "any", "value": "premium,enterprise" }
  ],
  "conditionContext": "form",
  "conditionLogic": "AND"
}
```

### Contextos

- `form` - Busca fields en todo el formulario
- `view` - Busca en todo el documento
- `repeatable` - Solo dentro del item del repeatable
- `group` - Dentro del grupo más cercano

### Operadores

- `==`, `!=` - Igualdad (normaliza booleanos)
- `>`, `<`, `>=`, `<=` - Comparación numérica
- `any` - Valor está en lista (ej: "val1,val2,val3")
- `not-any` - Valor NO está en lista
- `empty` - Campo vacío
- `not-empty` - Campo NO vacío
- `contains` - Texto contiene substring
- `not-contains` - Texto NO contiene substring

### Logic

- `AND` (default) - Todas las condiciones deben cumplirse
- `OR` - Al menos una condición debe cumplirse

### evaluate(formId)

Evalúa todas las reglas:
- Si `context: 'repeatable'` → `evaluateRepeatable()` (evalúa cada item)
- Sino → `checkConditions()` y `applyVisibilitySimple()`

### evaluateRepeatable(formEl, targetFieldPath, rule)

Para campos dentro de repetibles:
- Encuentra todos los `.repeatable-item`
- Evalúa condiciones por cada item individualmente
- Aplica visibilidad solo al field dentro de ese item

### setupWatchers(formId)

- Identifica qué fields afectan condiciones
- Registra eventos `change` e `input` delegados
- Evalúa al detectar cambios

### setupRepeatableObserver(formId)

- Usa MutationObserver para detectar nuevos items
- Re-evalúa condiciones cuando se agrega item
- Recursivo para repetibles anidados

### checkConditions(context, rule, targetFieldPath)

1. Obtiene contexto según `conditionContext`
2. Itera sobre condiciones
3. Aplica lógica AND/OR
4. Retorna true/false

### applyVisibilitySimple(formEl, fieldPath, shouldShow)

- Encuentra field element
- Si `shouldShow`: muestra, habilita, quita clase `wpfw-depend-on`
- Si NO: oculta, deshabilita, agrega clase

### destroy(formId)

- Desconecta MutationObservers
- Elimina event listeners
- Limpia reglas del Map

---

## dataLoader.js

**Propósito:** Cargador unificado de datos con soporte para API y Mock con fallback automático.

### load(config, pluginName)

Método principal que decide fuente de datos según `type`:
- `auto` (default) - Detecta automáticamente
- `api` - Fuerza uso de API
- `mock` - Fuerza uso de mock

### Configuración de dataSource

```json
{
  "type": "auto",
  "api": {
    "enabled": true,
    "endpoint": "/api/users",
    "method": "GET"
  },
  "mock": {
    "file": "mock/users.json"
  }
}
```

### loadAuto(config, pluginName)

**Lógica de decisión:**
1. Verifica si plugin tiene `backend.enabled: true` en su `index.json`
2. Verifica si config tiene `api.enabled !== false`
3. **Si ambos son true Y tiene endpoint:**
   - Intenta cargar desde API
   - Si falla: fallback automático a mock con warning
4. **Sino:**
   - Carga desde mock directamente

**Ejemplo de plugin con backend:**
```json
// plugins/botmaster/index.json
{
  "name": "botmaster",
  "enabled": true,
  "backend": {
    "enabled": true
  }
}
```

### loadFromApi(apiConfig)

Carga datos desde API:
- Usa `api.js` (auto-inyecta token)
- Soporta métodos: GET, POST, PUT, DELETE
- Maneja respuestas con estructura `{ success, data }`
- Maneja respuestas directas
- Lanza error si falla

**Configuración API:**
```json
{
  "endpoint": "/api/users",
  "method": "GET",
  "body": {}
}
```

### loadFromMock(mockConfig, pluginName)

Carga datos desde archivo JSON local:
- **Si pluginName:** `plugins/{plugin}/{mockConfig.file}`
- **Sino:** `{mockConfig.file}`
- No requiere autenticación (fetch directo)
- Cache-busting en desarrollo

**Filtrado opcional:**
```json
{
  "file": "mock/users.json",
  "filterBy": "id",
  "filterValue": 123
}
```
Retorna solo el item donde `item.id == 123`

### loadList(dataSourceConfig, pluginName)

Alias de `load()` para semántica de "cargar lista".

### loadDetail(dataLoaderConfig, id, pluginName)

Carga un registro específico:
1. **Para mock:**
   - Configura `filterBy` y `filterValue` automáticamente
   - Default `filterBy: 'id'`
2. **Para API:**
   - Reemplaza `{id}` en endpoint
   - Ej: `/api/users/{id}` → `/api/users/123`

**Uso:**
```javascript
const user = await dataLoader.loadDetail(config, 123, 'admin');
```

### Escenarios de uso

**Desarrollo (mock):**
```json
{
  "type": "auto",
  "mock": {
    "file": "mock/bots.json"
  }
}
```

**Producción (API):**
```json
{
  "type": "auto",
  "api": {
    "endpoint": "/api/bots"
  },
  "mock": {
    "file": "mock/bots.json"
  }
}
```
Si API falla, usa mock como fallback.

**Solo API (sin fallback):**
```json
{
  "type": "api",
  "api": {
    "endpoint": "/api/bots"
  }
}
```

**Solo Mock:**
```json
{
  "type": "mock",
  "mock": {
    "file": "mock/bots.json"
  }
}
```

---

## Componentes

### dataTable.js

**Propósito:** Componente de tabla de datos con carga automática desde API/Mock.

#### Propiedades

- `tables` - Map de tablas renderizadas
- `counter` - Contador para IDs únicos

#### render(config, container)

Renderiza tabla en contenedor:
1. Genera ID único
2. Detecta plugin con `detectPluginName()`
3. Carga datos con `loadData()`
4. Guarda referencia en Map
5. Genera HTML
6. Bind eventos

#### ⚠️ IMPORTANTE - Configuración correcta de DataTable

**Errores comunes al configurar DataTables:**

1. **Nombre del componente debe ser en minúsculas:**
   - ❌ `"component": "dataTable"` (INCORRECTO)
   - ✅ `"component": "datatable"` (CORRECTO)

2. **Se requiere la propiedad `pluginName`:**
   ```json
   {
     "pluginName": "blognetwork"
   }
   ```

3. **Las columnas deben ser un array de strings simple:**
   - ❌ INCORRECTO:
   ```json
   "columns": [
     {"key": "id", "label": "ID", "sortable": true},
     {"key": "name", "label": "Nombre"}
   ]
   ```
   - ✅ CORRECTO:
   ```json
   "columns": ["id", "name", "domain", "status", "created_at"]
   ```

4. **Las acciones usan `onclick` con código JavaScript:**
   - ❌ INCORRECTO (configuración como objetos con endpoint):
   ```json
   "actions": {
     "edit": {
       "label": "Editar",
       "form": "forms/blog-form",
       "endpoint": "/api/blog/{id}"
     }
   }
   ```
   - ✅ CORRECTO (onclick con código JavaScript):
   ```json
   "actions": {
     "edit": {
       "name": "✏️ Editar",
       "onclick": "modal.openWithData('blognetwork|forms/blog-form', {id: {id}, title: '✏️ Editar: {name}'})",
       "dataLoader": {
         "type": "auto",
         "api": {
           "endpoint": "/api/blog/{id}",
           "method": "GET"
         }
       }
     },
     "delete": {
       "name": "🗑️ Eliminar",
       "onclick": "if(confirm('¿Eliminar {name}?')) { api.delete('/api/blog/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }); }"
     }
   }
   ```

**Ejemplo completo CORRECTO de vista con DataTable:**

```json
{
  "id": "blognetwork-blogs",
  "title": "Gestión de Blogs",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<h3>📰 Gestión de Blogs</h3>"
    },
    {
      "type": "html",
      "order": 2,
      "content": "<div class='view-toolbar'><button class='btn btn-primary' onclick=\"modal.open('blognetwork|forms/blog-form', {title: '➕ Nuevo Blog'})\">➕ Nuevo Blog</button></div>"
    },
    {
      "type": "component",
      "component": "datatable",
      "order": 3,
      "config": {
        "pluginName": "blognetwork",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/blog",
            "method": "GET"
          }
        },
        "columns": ["id", "name", "domain", "status", "created_at"],
        "actions": {
          "edit": {
            "name": "✏️ Editar",
            "dataLoader": {
              "type": "auto",
              "api": {
                "endpoint": "/api/blog/{id}",
                "method": "GET"
              }
            },
            "onclick": "modal.openWithData('blognetwork|forms/blog-form', {id: {id}, title: '✏️ Editar: {name}'})"
          },
          "delete": {
            "name": "🗑️ Eliminar",
            "onclick": "if(confirm('¿Eliminar {name}?')) { api.delete('/api/blog/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }).catch(e => toast.error('Error')); }"
          }
        }
      }
    }
  ]
}
```

#### Configuración

```json
{
  "pluginName": "botmaster",
  "dataSource": {
    "type": "auto",
    "api": {
      "endpoint": "/api/bots"
    },
    "mock": {
      "file": "mock/bots.json"
    }
  },
  "columns": [
    "id",
    {
      "name": {
        "name": "i18n:botmaster:bot.name",
        "width": "200px",
        "align": "left",
        "format": "capitalize"
      }
    },
    {
      "status": {
        "name": "Estado",
        "format": "boolean"
      }
    },
    {
      "created_at": {
        "name": "Fecha",
        "format": "datetime"
      }
    }
  ],
  "actions": {
    "edit": {
      "name": "Editar",
      "onclick": "editBot('{id}')"
    },
    "delete": {
      "name": "Eliminar",
      "onclick": "deleteBot('{id}')",
      "dataLoader": {
        "type": "api",
        "api": {
          "endpoint": "/api/bots/{id}",
          "method": "DELETE"
        }
      }
    }
  }
}
```

#### detectPluginName(container)

Detecta plugin automáticamente:
1. Busca `[data-plugin]` en ancestros
2. Busca `.view-container[data-view]` y extrae plugin del path
3. Verifica `window.view.currentPlugin`
4. Busca clase `.plugin-{name}`
5. Retorna null si no encuentra

#### loadData(config, pluginName)

Carga datos según configuración:
- **Si tiene `dataSource`:** usa `dataLoader.loadList()`
- **Si tiene `source` y es API:** usa `api.get()`
- **Si tiene `source` y es JSON:** usa `fetch()`
- **Fallback:** array vacío

#### processColumns(columns)

Normaliza configuración de columnas:

**Formatos soportados:**
```javascript
// Array simple
["id", "name", "email"]

// Array con config
[
  "id",
  {
    "name": {
      "name": "Nombre",
      "width": "200px",
      "align": "left",
      "format": "capitalize"
    }
  }
]

// Objeto
{
  "id": "ID",
  "name": {
    "name": "Nombre",
    "width": "200px"
  }
}
```

#### Formatos de valores

- `date` - `toLocaleDateString()`
- `datetime` - `toLocaleString()`
- `money` - Formatea como USD con `Intl.NumberFormat`
- `boolean` - "Sí" / "No"
- `uppercase` - MAYÚSCULAS
- `lowercase` - minúsculas
- `capitalize` - Primera letra mayúscula
- `function` - Función personalizada `(value, row) => string`

#### translateLabel(label)

Sistema de traducciones:
- **Si empieza con `i18n:`:**
  - `i18n:user.name` → busca en core
  - `i18n:botmaster:bot.name` → busca en plugin
- **Sino:** retorna label directo
- **Fallback:** `formatHeader()` (capitaliza y reemplaza `_`)

#### renderActions(row, actions)

Genera botones de acción:
- Reemplaza variables `{field}` con valores del row
- Escapa valores para prevenir inyección
- Soporta `dataLoader` config para acciones async

**Ejemplo de acción:**
```json
{
  "edit": {
    "name": "Editar",
    "onclick": "editBot('{id}', '{name}')"
  }
}
```
Genera: `onclick="editBot('123', 'Bot Name')"`

#### replaceVars(str, row)

Reemplaza `{field}` con valores del row:
- Escapa caracteres especiales (`\`, `'`, `"`, `\n`, `\r`)
- Warning si field no existe

#### refresh(tableId)

Recarga tabla:
1. Obtiene config del Map
2. Recarga datos
3. Regenera HTML
4. Re-bind eventos

#### refreshFirst()

Recarga la primera tabla visible en la página.

**Uso:**
```javascript
// Renderizar tabla
await datatable.render(config, container);

// Refrescar después de operación
await datatable.refreshFirst();
```

### modal.js

**Propósito:** Sistema de modales para cargar formularios y vistas dinámicamente.

#### Propiedades

- `modals` - Map de modales abiertos
- `counter` - Contador para IDs únicos

#### open(resource, options)

Abre modal con contenido dinámico:

**Opciones:**
```javascript
{
  title: "Título del modal",
  width: "80%",
  maxWidth: "900px",
  footer: "<button>Custom</button>",
  showFooter: true,
  html: false,
  afterRender: (formId, container) => {}
}
```

**Retorna:** `{ modalId, loadPromise }`

#### Formatos de resource

**Formularios core:**
```javascript
modal.open("core:user/forms/user-form")
modal.open("auth/forms/login-form")  // legacy
```

**Formularios plugin:**
```javascript
modal.open("plugin:botmaster/forms/bot-form")
modal.open("botmaster|forms/bot-form")  // legacy
```

**Vistas core:**
```javascript
modal.open("core:sections/dashboard")
modal.open("dashboard")  // legacy
```

**Vistas plugin:**
```javascript
modal.open("botmaster|sections/bots")
```

**HTML directo:**
```javascript
modal.open("<h1>Hola</h1>", { html: true })
```

**Objeto config:**
```javascript
modal.open({ view: "dashboard" })
```

#### loadContent(modalId, resource, options)

Carga contenido según tipo de resource:
1. HTML directo si `options.html: true`
2. Formulario core si empieza con `core:`
3. Formulario plugin si empieza con `plugin:`
4. Formulario plugin legacy si contiene `|forms/`
5. Formulario core si contiene `/forms/`
6. Vista core si empieza con `core:sections/`
7. Vista plugin si contiene `|`
8. Vista simple para cualquier string
9. Vista desde objeto si tiene `view` property

**Callback afterRender:**
Se ejecuta después de cargar el contenido:
```javascript
modal.open("user/forms/user-form", {
  afterRender: (formId, container) => {
    console.log("Form loaded:", formId);
  }
})
```

#### openWithData(resource, options)

Abre modal y carga datos automáticamente:

**Opciones:**
```javascript
{
  id: 123,  // ID del registro
  title: "Editar Bot",
  dataLoader: {
    type: "auto",
    api: {
      endpoint: "/api/bots/{id}"
    },
    mock: {
      file: "mock/bots.json"
    }
  }
}
```

**Flujo:**
1. Abre modal con `open()`
2. Detecta pluginName del resource
3. Obtiene dataLoader de:
   - `options.dataLoader` (manual)
   - `data-loader-config` del botón que disparó el evento
   - Plugin config (`backend.endpoints.show`)
4. Carga datos con `dataLoader.loadDetail()`
5. Espera a que el formulario esté listo
6. Llena formulario con `form.fill()`

**Uso desde dataTable action:**
```json
{
  "edit": {
    "name": "Editar",
    "onclick": "modal.openWithData('botmaster|forms/bot-form', {id: '{id}', title: 'Editar Bot'})",
    "dataLoader": {
      "type": "auto",
      "api": {
        "endpoint": "/api/bots/{id}"
      },
      "mock": {
        "file": "mock/bots.json"
      }
    }
  }
}
```

#### waitForForm(formId, timeout)

Espera a que un formulario exista en el DOM:
- Usa `requestAnimationFrame` para polling eficiente
- Timeout default: 3000ms
- Retorna Promise que resuelve con el form element

#### close(modalId)

Cierra modal específico:
- Remueve overlay del DOM
- Elimina del Map
- Limpia cache de tabs

#### closeAll()

Cierra todos los modales abiertos.

#### Auto-cierre en overlay

Click en el fondo (overlay) cierra el modal automáticamente.

**Ejemplos de uso:**

```javascript
// Modal simple
modal.open("user/forms/user-form", {
  title: "Nuevo Usuario"
});

// Modal con datos
await modal.openWithData("botmaster|forms/bot-form", {
  id: 123,
  title: "Editar Bot"
});

// Modal con HTML custom
modal.open("<div>Contenido</div>", {
  html: true,
  title: "Info"
});

// Modal sin footer
modal.open("dashboard", {
  title: "Dashboard",
  showFooter: false
});

// Modal con callback
modal.open("user/forms/user-form", {
  afterRender: (formId, container) => {
    // Hacer algo después de cargar
    form.fill(formId, { name: "Juan" });
  }
});
```

### grouper.js

**Propósito:** Componente de agrupación visual con soporte para acordeón y tabs.

#### Propiedades

- `counter` - Contador para IDs únicos
- `instances` - Map de instancias renderizadas

#### render(config, container)

Renderiza grupos en el contenedor:

**Configuración:**
```javascript
{
  mode: 'linear' | 'tabs',
  collapsible: true,      // Solo linear
  openFirst: true,        // Solo linear
  activeIndex: 0,         // Solo tabs
  groups: [
    {
      title: 'Información Básica',
      content: '<div>...</div>'
    },
    {
      title: 'Detalles',
      content: '<div>...</div>'
    }
  ]
}
```

**Retorna:** `grouperId`

#### Modos

**Linear (acordeón):**
- Secciones colapsables verticalmente
- `collapsible: true` - Permite colapsar (default: true)
- `openFirst: true` - Abre primera sección (default: true)
- Click en header para expandir/contraer

**Tabs:**
- Pestañas horizontales
- `activeIndex: 0` - Tab activo inicial (default: 0)
- Click en tab para cambiar

#### renderLinear(grouperId, config)

Genera HTML para modo linear:
```html
<div class="grouper grouper-linear">
  <div class="grouper-section open">
    <div class="grouper-header collapsible">
      <h3 class="grouper-title">Título</h3>
      <span class="grouper-toggle">▼</span>
    </div>
    <div class="grouper-content">
      <!-- content -->
    </div>
  </div>
</div>
```

#### renderTabs(grouperId, config)

Genera HTML para modo tabs:
```html
<div class="grouper grouper-tabs">
  <div class="grouper-tabs-header">
    <button class="grouper-tab-btn active">Tab 1</button>
    <button class="grouper-tab-btn">Tab 2</button>
  </div>
  <div class="grouper-tabs-content">
    <div class="grouper-tab-panel active">...</div>
    <div class="grouper-tab-panel">...</div>
  </div>
</div>
```

#### Métodos de control

**switchTab(grouperId, tabIndex)** - Solo tabs
```javascript
grouper.switchTab('grouper-1', 2); // Cambia a tab 2
```

**toggleSection(grouperId, sectionIndex, forceOpen)** - Solo linear
```javascript
grouper.toggleSection('grouper-1', 0);        // Toggle
grouper.toggleSection('grouper-1', 0, true);  // Fuerza abrir
grouper.toggleSection('grouper-1', 0, false); // Fuerza cerrar
```

**openAll(grouperId)** - Solo linear
```javascript
grouper.openAll('grouper-1'); // Abre todas las secciones
```

**closeAll(grouperId)** - Solo linear
```javascript
grouper.closeAll('grouper-1'); // Cierra todas las secciones
```

#### bindEvents(grouperId)

Registra eventos según modo:
- **Linear:** Click en header para toggle
- **Tabs:** Click en botones para cambiar tab activo

#### Ejemplos de uso

**Acordeón básico:**
```javascript
const config = {
  mode: 'linear',
  collapsible: true,
  openFirst: true,
  groups: [
    {
      title: 'Sección 1',
      content: '<p>Contenido 1</p>'
    },
    {
      title: 'Sección 2',
      content: '<p>Contenido 2</p>'
    }
  ]
};

grouper.render(config, container);
```

**Tabs:**
```javascript
const config = {
  mode: 'tabs',
  activeIndex: 0,
  groups: [
    {
      title: 'General',
      content: '<p>Info general</p>'
    },
    {
      title: 'Avanzado',
      content: '<p>Config avanzada</p>'
    }
  ]
};

const id = grouper.render(config, container);
// Cambiar programáticamente
grouper.switchTab(id, 1);
```

**Acordeón no colapsable:**
```javascript
const config = {
  mode: 'linear',
  collapsible: false,  // Siempre visible
  groups: [...]
};
```

#### Integración con formularios

El grouper se usa dentro de form.js para organizar fields:
```json
{
  "type": "grouper",
  "mode": "tabs",
  "groups": [
    {
      "title": "Datos Personales",
      "fields": [...]
    },
    {
      "title": "Contacto",
      "fields": [...]
    }
  ]
}
```

### tabs.js

**Propósito:** Sistema de pestañas con cache y carga dinámica de contenido.

#### Propiedades

- `tabCache` - Map de contenido cacheado por tab

#### render(tabsData, container)

Renderiza sistema de tabs:

**Estructura de tabsData:**
```javascript
{
  id: "view-tabs",
  tabs: [
    {
      id: "tab1",
      title: "General",
      content: [
        {
          type: "form",
          form_json: "user/forms/user-form"
        }
      ]
    },
    {
      id: "tab2",
      title: "Detalles",
      content: [
        {
          type: "component",
          component: "datatable",
          config: { ... }
        }
      ]
    }
  ]
}
```

**Flujo:**
1. Limpia cache
2. Genera HTML de tabs (header + content)
3. Bind eventos de click
4. Carga primer tab automáticamente

#### loadTabContent(tabsData, tabId, container)

Carga contenido de un tab:
1. Busca tab por ID
2. Verifica cache (si existe, lo usa)
3. Renderiza contenido con `renderContent()`
4. Carga componentes dinámicos
5. Guarda en cache
6. Inyecta en DOM

#### Tipos de contenido soportados

**Formulario:**
```javascript
{
  type: "form",
  form_json: "user/forms/user-form"
}
```

**Componente:**
```javascript
{
  type: "component",
  component: "datatable",
  config: { ... }
}
```

**HTML:**
```javascript
{
  type: "html",
  content: "<div>Custom HTML</div>"
}
```

**String directo:**
```javascript
content: "<p>Texto simple</p>"
```

**Array:**
```javascript
content: [
  { type: "html", content: "<h2>Título</h2>" },
  { type: "form", form_json: "..." }
]
```

#### loadDynamicComponents(container)

Inicializa componentes dinámicos:
- `.dynamic-form` → llama `form.load()`
- `.dynamic-component` → llama componente específico
- Maneja datatable como caso especial

#### clearCache()

Limpia cache de tabs (útil al cerrar modales).

#### Sistema de cache

- Cache por `${viewId}-${tabId}`
- Guarda nodos DOM completos
- Solo cachea tabs visitados
- Mejora performance en navegación

---

### toast.js

**Propósito:** Notificaciones toast con cola y posicionamiento.

#### Propiedades

- `container` - Contenedor de toasts
- `queue` - Cola de mensajes pendientes
- `active` - Toasts actualmente visibles
- `maxVisible` - Máximo 5 toasts simultáneos

#### Métodos principales

**show(message, options):**
```javascript
toast.show('Mensaje', {
  type: 'info',           // info|success|error|warning
  duration: 3000,         // ms
  position: 'top-right'   // top-right|top-left|bottom-right|bottom-left
});
```

**Shortcuts:**
```javascript
toast.success('Guardado correctamente');
toast.error('Error al guardar');
toast.warning('Advertencia');
toast.info('Información');
```

#### Sistema de cola

- Si hay menos de 5 toasts: muestra inmediatamente
- Si hay 5 o más: agrega a cola
- Al cerrar un toast: muestra siguiente de la cola

#### display(message, config)

Renderiza toast:
1. Asegura contenedor con posición correcta
2. Crea elemento toast
3. Agrega a `active`
4. Anima entrada (clase `.toast-show`)
5. Auto-cierra después de `duration`

#### remove(toastEl)

Cierra toast:
1. Remueve clase `.toast-show` (animación salida)
2. Espera 300ms para animación
3. Elimina del DOM
4. Remueve de `active`
5. Procesa siguiente en cola

#### ensureContainer(position)

Gestiona contenedor:
- Si posición cambió: recrea contenedor
- Solo un contenedor activo a la vez
- Limpia `active` al cambiar posición

#### getIcon(type)

Retorna icono según tipo:
- success: ✓
- error: ✕
- warning: ⚠
- info: ℹ

**Uso común:**
```javascript
// Después de operación exitosa
const result = await api.post('/api/user', data);
toast.success('Usuario creado');

// Error
try {
  await api.delete('/api/user/123');
} catch (error) {
  toast.error('Error al eliminar');
}

// Con duración custom
toast.info('Procesando...', { duration: 5000 });
```

---

### widget.js

**Propósito:** Sistema de widgets drag-and-drop en grid.

#### Propiedades

- `grids` - Map de configuraciones de grids
- `draggedWidget` - Widget siendo arrastrado

#### render(container, config)

Renderiza grid de widgets:

**⚠️ IMPORTANTE - Configuración correcta de widgets en vistas:**

Los widgets deben configurarse dentro del array `content` de la vista, NO como objetos independientes. Cada widget es un item de contenido con `type: "component"` y `component: "widget"`.

**❌ INCORRECTO (No funciona):**
```json
{
  "id": "dashboard",
  "title": "Dashboard",
  "widgets": [
    {
      "title": "Total Blogs",
      "html": "<div data-source='/api/blog/count'>...</div>"
    }
  ]
}
```

**✅ CORRECTO (Así debe ser):**
```json
{
  "id": "dashboard",
  "title": "Dashboard",
  "content": [
    {
      "type": "component",
      "component": "widget",
      "order": 1,
      "config": {
        "title": "Total Blogs",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/blog/count",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>{{total}}</h2><p>Total de Blogs</p></div>"
      }
    },
    {
      "type": "component",
      "component": "widget",
      "order": 2,
      "config": {
        "title": "Contenido Scrapeado",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/blog_content/count",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>{{total}}</h2><p>Artículos</p></div>"
      }
    }
  ]
}
```

**Configuración de widget individual:**
```javascript
{
  columns: 2,  // Columnas del grid
  widgets: [
    {
      title: 'Estadísticas',
      order: 1,
      component: 'datatable',
      config: { ... }
    },
    {
      title: 'Gráfico',
      order: 2,
      view: 'dashboard/chart'
    },
    {
      title: 'Info',
      order: 3,
      html: '<div>HTML directo</div>'
    }
  ]
}
```

**Flujo:**
1. Crea grid con columnas especificadas
2. Agrega cada widget con `addWidget()`
3. Bind eventos de drag & drop

#### addWidget(grid, config)

Crea widget:
1. Genera ID único
2. Crea estructura HTML (header + body)
3. Marca como draggable
4. Asigna order
5. Carga contenido con `loadWidgetContent()`

#### loadWidgetContent(widgetId, config)

Carga contenido según tipo:

**Component:**
```javascript
{
  component: 'datatable',
  config: { ... }
}
```

**View:**
```javascript
{
  view: 'dashboard/chart'
}
```

**Form:**
```javascript
{
  form: 'user/forms/user-form'
}
```

**HTML:**
```javascript
{
  html: '<div>Custom</div>'
}
```

**Content:**
```javascript
{
  content: [
    { type: 'html', content: '<p>Texto</p>' }
  ]
}
```

#### Drag & Drop

**bindDragEvents(grid):**
- `dragstart` - Marca widget arrastrado, añade clase `.dragging`
- `dragend` - Limpia estado
- `dragover` - Calcula posición e inserta widget

**Lógica de posicionamiento:**
- Calcula punto medio del widget destino
- Si cursor arriba del medio: inserta antes
- Si cursor abajo del medio: inserta después

**Orden visual:**
El orden de los widgets en el DOM determina su posición visual (el `order` es solo inicial).

**Ejemplo completo:**
```javascript
const config = {
  columns: 3,
  widgets: [
    {
      title: 'Usuarios Activos',
      order: 1,
      component: 'datatable',
      config: {
        dataSource: {
          type: 'api',
          api: { endpoint: '/api/users/active' }
        },
        columns: ['id', 'name', 'email']
      }
    },
    {
      title: 'Estadísticas',
      order: 2,
      view: 'dashboard/stats'
    },
    {
      title: 'Información',
      order: 3,
      html: '<div class="info-box">Sistema v1.0</div>'
    }
  ]
};

await widget.render(container, config);
```

---

## 📋 TABLA DE REFERENCIA RÁPIDA

### Componentes y su sintaxis correcta

| Componente | Nombre correcto | Uso común | Propiedades requeridas |
|------------|----------------|-----------|----------------------|
| DataTable | `"datatable"` (minúsculas) | Tablas de datos | `pluginName`, `columns`, `dataSource` |
| Widget | `"widget"` | Dashboards | `title`, `html` o `component` |
| Grouper | `"grouper"` | Acordeones/Tabs | `mode`, `groups` |
| Tabs | Sistema de tabs | Vistas con pestañas | `tabs` array |
| Modal | `modal.open()` | Ventanas emergentes | `resource`, `options` |
| Toast | `toast.success()` | Notificaciones | `message`, `type` (opcional) |
| Form | `form.load()` | Formularios | `formName`, `container` |

### Estructura básica de archivos de plugin

```
public/plugins/miPlugin/
├── index.json              # Configuración principal
├── assets/
│   ├── css/
│   │   └── miPlugin.css
│   └── js/
│       └── miPlugin.js
├── lang/
│   ├── es.json
│   └── en.json
└── views/
    ├── sections/           # Vistas principales
    │   ├── dashboard.json
    │   └── listado.json
    └── forms/             # Formularios
        └── item-form.json

backend/plugins/miPlugin/
├── plugin.json            # Config backend
├── database/
│   └── schema.sql
├── controllers/
│   └── itemController.php
└── resources/
    └── item.json          # Schema del resource
```

### Rutas y convenciones

| Tipo | Formato correcto | Ejemplo |
|------|-----------------|---------|
| Vista core | `"core:ruta/vista"` | `"core:dashboard/dashboard"` |
| Vista plugin | `"plugin\|sections/vista"` | `"inventario\|sections/listado"` |
| Form core | `"ruta/forms/form"` | `"user/forms/user-form"` |
| Form plugin | `"plugin\|forms/form"` | `"botmaster\|forms/bot-form"` |
| API endpoint | `/api/resource` | `/api/blog`, `/api/user/login` |
| Mock data | `"mock/archivo.json"` | `"mock/bots.json"` |

### Configuración de dataSource

```json
{
  "type": "auto",
  "api": {
    "enabled": true,
    "endpoint": "/api/items",
    "method": "GET"
  },
  "mock": {
    "file": "mock/items.json"
  }
}
```

**Tipos soportados:**
- `auto` - Detecta automáticamente (API → Mock fallback)
- `api` - Solo API
- `mock` - Solo Mock

### Acciones comunes en DataTable

```json
"actions": {
  "view": {
    "name": "👁️ Ver",
    "onclick": "modal.open('plugin|sections/detalle', {id: {id}})"
  },
  "edit": {
    "name": "✏️ Editar",
    "onclick": "modal.openWithData('plugin|forms/edit', {id: {id}})",
    "dataLoader": {
      "type": "auto",
      "api": {"endpoint": "/api/items/{id}"}
    }
  },
  "delete": {
    "name": "🗑️ Eliminar",
    "onclick": "if(confirm('¿Eliminar?')) { api.delete('/api/items/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }); }"
  },
  "custom": {
    "name": "⚡ Acción",
    "onclick": "miAccion({id}, '{nombre}')"
  }
}
```

### Campos de formulario comunes

| Tipo | Uso | Propiedades importantes |
|------|-----|------------------------|
| `text` | Texto simple | `name`, `label`, `required` |
| `email` | Email | `name`, `label`, `validation: "email"` |
| `number` | Números | `name`, `label`, `min`, `max` |
| `select` | Selector | `name`, `label`, `options` o `dataSource` |
| `textarea` | Texto largo | `name`, `label`, `rows` |
| `checkbox` | Casilla | `name`, `label` |
| `radio` | Opciones | `name`, `label`, `options` |
| `date` | Fecha | `name`, `label` |
| `file` | Archivo | `name`, `label`, `accept` |
| `repeatable` | Lista dinámica | `name`, `fields`, `addButtonText` |
| `grouper` | Agrupación | `mode`, `groups` |
| `group` | Columnas | `columns`, `fields` |

### Validaciones disponibles

| Regla | Descripción | Ejemplo |
|-------|-------------|---------|
| `required` | Campo obligatorio | `"validation": "required"` |
| `email` | Email válido | `"validation": "email"` |
| `min:n` | Mínimo n caracteres | `"validation": "min:3"` |
| `max:n` | Máximo n caracteres | `"validation": "max:50"` |
| `numeric` | Solo números | `"validation": "numeric"` |
| `alpha` | Solo letras | `"validation": "alpha"` |
| `alphanumeric` | Letras y números | `"validation": "alphanumeric"` |
| Múltiples | Combinar con `\|` | `"validation": "required\|email\|min:5"` |

### Transforms disponibles

| Transform | Efecto | Uso |
|-----------|--------|-----|
| `uppercase` | MAYÚSCULAS | `"transform": "uppercase"` |
| `lowercase` | minúsculas | `"transform": "lowercase"` |
| `capitalize` | Primera Mayúscula | `"transform": "capitalize"` |
| `numeric` | Solo números | `"transform": "numeric"` |
| `alpha` | Solo letras | `"transform": "alpha"` |
| `alphanumeric` | Letras y números | `"transform": "alphanumeric"` |

### Operadores de condiciones

| Operador | Descripción | Ejemplo |
|----------|-------------|---------|
| `==` | Igual | `{"field": "activo", "operator": "==", "value": true}` |
| `!=` | Diferente | `{"field": "tipo", "operator": "!=", "value": "admin"}` |
| `>` | Mayor que | `{"field": "edad", "operator": ">", "value": 18}` |
| `<` | Menor que | `{"field": "stock", "operator": "<", "value": 10}` |
| `>=` | Mayor o igual | `{"field": "precio", "operator": ">=", "value": 100}` |
| `<=` | Menor o igual | `{"field": "descuento", "operator": "<=", "value": 50}` |
| `any` | En lista | `{"field": "tipo", "operator": "any", "value": "admin,manager"}` |
| `not-any` | No en lista | `{"field": "estado", "operator": "not-any", "value": "deleted,archived"}` |
| `empty` | Vacío | `{"field": "opcional", "operator": "empty"}` |
| `not-empty` | No vacío | `{"field": "requerido", "operator": "not-empty"}` |
| `contains` | Contiene | `{"field": "texto", "operator": "contains", "value": "palabra"}` |
| `not-contains` | No contiene | `{"field": "descripcion", "operator": "not-contains", "value": "prohibido"}` |

### API Methods

```javascript
// GET
const data = await api.get('/api/users');

// POST
const result = await api.post('/api/user', { name: 'Juan' });

// PUT
const updated = await api.put('/api/user/123', { name: 'Juan Updated' });

// DELETE
await api.delete('/api/user/123');
```

### Shortcuts útiles

```javascript
// Traducciones
__('key')
__('plugin:key')
__('key', { param: 'value' })

// Toasts
toast.success('Mensaje')
toast.error('Error')
toast.warning('Advertencia')
toast.info('Info')

// Modal
modal.open('plugin|forms/form')
modal.openWithData('plugin|forms/form', { id: 123 })
modal.close(modalId)

// DataTable
datatable.refresh(tableId)
datatable.refreshFirst()

// Form
form.load('plugin|forms/form', container)
form.getData(formId)
form.fill(formId, data)
form.validate(formId)

// Cache
cache.set('key', data, ttl)
cache.get('key')
cache.delete('key')
cache.clear()

// Events
events.on('.selector', 'click', handler)
events.off(eventId)
```

### Debugging

```javascript
// Cache stats
debugCache.stats()
debugCache.list('memory')
debugCache.get('key')

// Logger (solo en desarrollo)
logger.debug('módulo', 'mensaje')
logger.info('módulo', 'mensaje')
logger.warn('módulo', 'mensaje')
logger.error('módulo', 'mensaje')

// View debug
console.log(view.views)
console.log(view.loadedPlugins)

// Hook debug
hook.debug()
console.log(hook.pluginRegistry)

// Events debug
events.debug()
```

---

## 🔗 Enlaces y recursos

- **Repositorio:** [Factory SaaS Framework]
- **Documentación Backend:** `.docs/backend.md`
- **Ejemplos prácticos:** Plugin `ejemplos` en `/public/plugins/ejemplos`
- **Plugin de referencia completo:** Plugin `inventario` en `/public/plugins/inventario`

---

**Última actualización:** Noviembre 2025  
**Versión del framework:** 1.0  
**Autor:** Factory Team