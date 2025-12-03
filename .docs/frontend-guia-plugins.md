# Guía Práctica: Creación de Plugins Frontend

Esta guía te enseña a crear plugins frontend con ejemplos prácticos. Todo está basado en ejemplos reales del sistema.

---

## Estructura del nucleo del frontend
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
└── index.html
```
---

## 📁 Estructura de un Plugin

```
public/plugins/miPlugin/
├── index.json              # ⚠️ ARCHIVO PRINCIPAL - Configuración del plugin
├── assets/
│   ├── css/
│   │   └── miPlugin.css   # Estilos del plugin
│   └── js/
│       └── miPlugin.js    # JavaScript del plugin
├── lang/
│   ├── es.json            # Traducciones español
│   └── en.json            # Traducciones inglés
└── views/
    ├── sections/          # Vistas principales (dashboard, listados, etc)
    │   ├── dashboard.json
    │   └── listado.json
    └── forms/             # Formularios (crear/editar)
        └── item-form.json
```

---

## 1️⃣ index.json - Configuración Principal

Este es el archivo más importante. Define el menú, scripts y configuración del plugin.

### Ejemplo básico (sin submenús):

```json
{
  "name": "miPlugin",
  "version": "1.0.0",

  "hasMenu": true,
  "hasViews": true,
  "menu": {
    "title": "Mi Plugin",
    "icon": "🔌",
    "order": 10,
    "view": "dashboard"
  }
}
```

**⚠️ Reglas Críticas:**
1. NO existe `enabled` en index.json del plugin (se habilita en `plugins/index.json`)
2. IDs de menú DEBEN empezar con: `"{nombre-plugin}-{id}"` (ej: `"clientes-dashboard"`)
3. Keys de traducción en inglés: `field.name` no `field.nombre`
4. En grouper usar `"fields":[]` NO `"content":[]`


### Ejemplo con submenús:

```json
{
  "name": "inventario",
  "version": "1.0.0",

  "hasMenu": true,
  "hasViews": true,
  "menu": {
    "title": "Inventario",
    "icon": "📦",
    "order": 10,
    "items": [
      {
        "id": "inventario-listado",
        "title": "Productos",
        "view": "listado",
        "order": 1
      },
      {
        "id": "inventario-stock",
        "title": "Stock",
        "view": "stock",
        "order": 2
      }
    ]
  }
}
```

### Ejemplo con scripts y estilos cargados al abrir el plugin:

```json
{
  "name": "botmaster",
  "version": "1.0.0",

  "hasMenu": true,
  "hasViews": true,
  "autoload": "assets/js/botmaster.js",
  "scripts": ["assets/js/helper.js"],
  "styles": ["assets/css/botmaster.css"],
  "menu": {
    "title": "Botmaster",
    "icon": "🤖",
    "order": 10,
    "items": [
      {
        "id": "botmaster-dashboard",
        "title": "Dashboard",
        "view": "dashboard",
        "order": 1
      },
      {
        "id": "botmaster-bots",
        "title": "Bots",
        "view": "bots",
        "order": 2
      }
    ]
  }
}
```

### ⚠️ Importante: Scripts y estilos a nivel de vista

Si quieres cargar scripts/estilos solo cuando se abre una vista específica (mejor performance), ponlos en el JSON de la vista, NO en index.json:

```json
{
  "id": "graficos",
  "title": "Gráficos",
  "scripts": ["assets/js/chart.js"],
  "styles": ["assets/css/chart.css"],
  "content": [...]
}
```

---

## 2️⃣ Vistas - Estructura y Tipos

### Vista básica con HTML:

```json
{
  "id": "mi-vista",
  "title": "Mi Vista Simple",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<h3>Título</h3><p>Descripción</p>"
    }
  ]
}
```

### Vista con Formulario Dinámico (carga automática):

Puedes cargar formularios directamente dentro de un `type: "html"` usando la clase `dynamic-form`. El sistema lo detecta y lo carga automáticamente.

```json
{
  "id": "login-view",
  "title": "Iniciar Sesión",
  "content": [
    {
      "type": "html",
      "content": "<div class='auth-container'><div class='auth-card'><div class='auth-header'><h1>🔐 Iniciar Sesión</h1><p>Ingresa tus credenciales</p></div><div class='form-container'><div class='dynamic-form' data-form-json='core:auth/forms/login-form'></div></div></div></div>"
    }
  ]
}
```

**Cómo funciona:**
1. El HTML contiene un `<div class='dynamic-form' data-form-json='...'></div>`
2. El atributo `data-form-json` especifica qué formulario cargar
3. El sistema detecta automáticamente estos elementos y carga el formulario en su lugar

**Formatos soportados para `data-form-json`:**
- `'core:auth/forms/login-form'` - Formulario del core
- `'miPlugin|forms/item-form'` - Formulario de plugin
- `'forms/config'` - Formulario relativo (busca en core o plugin según contexto)

**Versión más legible del HTML:**
```html
<div class='auth-container'>
  <div class='auth-card'>
    <div class='auth-header'>
      <h1>🔐 Iniciar Sesión</h1>
      <p>Ingresa tus credenciales</p>
    </div>
    <div class='form-container'>
      <!-- Este div será reemplazado automáticamente con el formulario -->
      <div class='dynamic-form' data-form-json='core:auth/forms/login-form'></div>
    </div>
  </div>
</div>
```

**💡 Ventajas de formularios dinámicos:**
- Permite diseñar layouts personalizados alrededor del formulario
- Combina HTML estático con formularios funcionales
- Útil para páginas de login, registro, o formularios con diseños especiales
- Se integra perfectamente con el sistema de validación

### Vista con Componente Dinámico:

Similar a los formularios, puedes cargar componentes dinámicamente:

```json
{
  "id": "dashboard-custom",
  "title": "Dashboard Personalizado",
  "content": [
    {
      "type": "html",
      "content": "<div class='custom-layout'><h2>Mis Estadísticas</h2><div class='dynamic-component' data-component='widget' data-config='{\"title\":\"Widget\",\"html\":\"<p>Contenido</p>\"}'></div></div>"
    }
  ]
}
```

**Atributos:**
- `class='dynamic-component'` - Marca el elemento como componente dinámico
- `data-component='nombre'` - Nombre del componente a cargar (widget, datatable, etc)
- `data-config='{...}'` - Configuración JSON del componente

### Vista con Widgets (Dashboard):

```json
{
  "id": "botmaster-dashboard",
  "title": "Dashboard",
  "content": [
    {
      "type": "component",
      "component": "widget",
      "order": 1,
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
      "order": 2,
      "config": {
        "title": "Widget con HTML estático",
        "html": "<div class='widget-info'><h3>🎯 Bienvenido</h3><p>Este widget no necesita cargar datos de un endpoint.</p><p>Es solo contenido HTML estático.</p></div>"
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
        "html": "<div class='widget-stat'><h2>${{amount}}</h2><p>Total</p></div>"
      }
    }
  ]
}
```

### Vista con DataTable (Listado):

```json
{
  "id": "productos-listado",
  "title": "Productos",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<div class='view-toolbar'><button class='btn btn-primary' onclick=\"modal.open('inventario|forms/producto', {title: 'Nuevo Producto'})\">➕ Nuevo</button></div>"
    },
    {
      "type": "component",
      "component": "datatable",
      "order": 2,
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

### Vista con Tabs:

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

---

## 3️⃣ Formularios

### Formulario básico:

```json
{
  "id": "producto-form",
  "title": "Formulario de Producto",
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true,
      "validation": "required|min:3"
    },
    {
      "name": "precio",
      "label": "Precio",
      "type": "number",
      "required": true,
      "validation": "required|numeric"
    },
    {
      "name": "categoria",
      "label": "Categoría",
      "type": "select",
      "required": true,
      "options": [
        {"value": "electronica", "label": "Electrónica"},
        {"value": "ropa", "label": "Ropa"},
        {"value": "alimentos", "label": "Alimentos"}
      ]
    },
    {
      "name": "descripcion",
      "label": "Descripción",
      "type": "textarea",
      "rows": 4
    },
    {
      "name": "activo",
      "label": "Activo",
      "type": "checkbox"
    }
  ]
}
```

### Formulario con campos repetibles (Repeatable):

```json
{
  "id": "blog-form",
  "title": "Formulario de Blog",
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre del Blog",
      "type": "text",
      "required": true
    },
    {
      "name": "sources",
      "label": "Fuentes de Scraping",
      "type": "repeatable",
      "addButtonPosition": "bottom",
      "addButtonText": "➕ Agregar Fuente",
      "fields": [
        {
          "name": "nombre",
          "label": "Nombre de la Fuente",
          "type": "text",
          "required": true
        },
        {
          "name": "url_principal",
          "label": "URL Principal",
          "type": "text",
          "required": true
        },
        {
          "name": "url_listado",
          "label": "URL del Listado",
          "type": "text",
          "required": true
        },
        {
          "name": "selector_titulo",
          "label": "Selector del Título (XPath)",
          "type": "text",
          "placeholder": "//h1"
        }
      ]
    }
  ]
}
```

### Formulario con agrupación (Grouper - Acordeón):

```json
{
  "id": "config-form",
  "title": "Configuración",
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text"
    },
    {
      "type": "grouper",
      "mode": "linear",
      "collapsible": true,
      "openFirst": true,
      "groups": [
        {
          "title": "📧 Configuración de Email",
          "fields": [
            {
              "name": "email_host",
              "label": "Host SMTP",
              "type": "text"
            },
            {
              "name": "email_port",
              "label": "Puerto",
              "type": "number"
            }
          ]
        },
        {
          "title": "🔐 Seguridad",
          "fields": [
            {
              "name": "ssl_enabled",
              "label": "Habilitar SSL",
              "type": "checkbox"
            }
          ]
        }
      ]
    }
  ]
}
```

### Formulario con agrupación (Grouper - Tabs):

```json
{
  "id": "perfil-form",
  "title": "Perfil de Usuario",
  "fields": [
    {
      "type": "grouper",
      "mode": "tabs",
      "groups": [
        {
          "title": "Datos Personales",
          "fields": [
            {
              "name": "nombre",
              "label": "Nombre",
              "type": "text"
            },
            {
              "name": "email",
              "label": "Email",
              "type": "email"
            }
          ]
        },
        {
          "title": "Dirección",
          "fields": [
            {
              "name": "calle",
              "label": "Calle",
              "type": "text"
            },
            {
              "name": "ciudad",
              "label": "Ciudad",
              "type": "text"
            }
          ]
        }
      ]
    }
  ]
}
```

### Formulario con columnas (Group):

```json
{
  "id": "producto-form",
  "title": "Producto",
  "fields": [
    {
      "type": "group",
      "columns": 2,
      "gap": "normal",
      "fields": [
        {
          "name": "nombre",
          "label": "Nombre",
          "type": "text"
        },
        {
          "name": "precio",
          "label": "Precio",
          "type": "number"
        }
      ]
    },
    {
      "name": "descripcion",
      "label": "Descripción",
      "type": "textarea"
    }
  ]
}
```

### Formulario con Validaciones:

```json
{
  "id": "user-form",
  "title": "Formulario de Usuario",
  "fields": [
    {
      "name": "nombre",
      "label": "Nombre",
      "type": "text",
      "required": true,
      "validation": "required|min:3|max:50"
    },
    {
      "name": "email",
      "label": "Email",
      "type": "email",
      "required": true,
      "validation": "required|email"
    },
    {
      "name": "edad",
      "label": "Edad",
      "type": "number",
      "validation": "number|minValue:18|maxValue:100"
    },
    {
      "name": "website",
      "label": "Sitio Web",
      "type": "text",
      "validation": "url"
    },
    {
      "name": "username",
      "label": "Usuario",
      "type": "text",
      "validation": "required|alpha_num|min:4"
    }
  ]
}
```

**Validaciones disponibles:**
- `required` - Campo obligatorio
- `email` - Email válido
- `min:n` - Mínimo n caracteres
- `max:n` - Máximo n caracteres
- `minValue:n` - Valor mínimo (números)
- `maxValue:n` - Valor máximo (números)
- `number` - Solo números
- `url` - URL válida
- `alpha_num` - Solo letras y números

**Nota:** También puedes usar `"required": true` como propiedad booleana, pero `validation` permite combinar múltiples reglas.

### Formulario con Condiciones (campos condicionales):

Los campos pueden mostrarse u ocultarse según el valor de otros campos usando el sistema de `conditions`.

```json
{
  "id": "proyecto-form",
  "title": "Formulario de Proyecto",
  "fields": [
    {
      "name": "tipo_proyecto",
      "label": "Tipo de Proyecto",
      "type": "select",
      "required": true,
      "options": [
        {"value": "web", "label": "Web"},
        {"value": "mobile", "label": "Mobile"},
        {"value": "desktop", "label": "Desktop"}
      ]
    },
    {
      "name": "url_proyecto",
      "label": "URL del Proyecto",
      "type": "text",
      "placeholder": "https://...",
      "condition": [
        {"field": "tipo_proyecto", "operator": "==", "value": "web"}
      ],
      "conditionContext": "form",
      "conditionLogic": "AND"
    },
    {
      "name": "plataforma",
      "label": "Plataforma",
      "type": "select",
      "options": [
        {"value": "ios", "label": "iOS"},
        {"value": "android", "label": "Android"}
      ],
      "condition": [
        {"field": "tipo_proyecto", "operator": "==", "value": "mobile"}
      ]
    },
    {
      "name": "requiere_api",
      "label": "¿Requiere API?",
      "type": "checkbox"
    },
    {
      "name": "url_api",
      "label": "URL del API",
      "type": "text",
      "condition": [
        {"field": "requiere_api", "operator": "==", "value": true}
      ]
    }
  ]
}
```

**Operadores de condiciones disponibles:**
- `==` - Igual a
- `!=` - Diferente de
- `>` - Mayor que
- `<` - Menor que
- `>=` - Mayor o igual
- `<=` - Menor o igual
- `any` - Valor está en lista (ej: "admin,manager")
- `not-any` - Valor NO está en lista
- `empty` - Campo vacío
- `not-empty` - Campo NO vacío
- `contains` - Contiene texto
- `not-contains` - NO contiene texto

**Contextos de condiciones:**
- `form` - Busca el campo en todo el formulario (default)
- `repeatable` - Solo dentro del item del repeatable (útil para repetibles)
- `group` - Dentro del grupo más cercano
- `view` - En todo el documento

**Lógica de condiciones:**
- `AND` - Todas las condiciones deben cumplirse (default)
- `OR` - Al menos una condición debe cumplirse

### Condiciones con Repetibles:

```json
{
  "id": "presupuesto-form",
  "fields": [
    {
      "name": "items",
      "label": "Items del Presupuesto",
      "type": "repeatable",
      "addButtonText": "➕ Agregar Item",
      "fields": [
        {
          "name": "tipo",
          "label": "Tipo",
          "type": "select",
          "options": [
            {"value": "producto", "label": "Producto"},
            {"value": "servicio", "label": "Servicio"}
          ]
        },
        {
          "name": "sku",
          "label": "SKU",
          "type": "text",
          "condition": [
            {"field": "tipo", "operator": "==", "value": "producto"}
          ],
          "conditionContext": "repeatable"
        },
        {
          "name": "horas",
          "label": "Horas",
          "type": "number",
          "condition": [
            {"field": "tipo", "operator": "==", "value": "servicio"}
          ],
          "conditionContext": "repeatable"
        }
      ]
    }
  ]
}
```

**⚠️ Importante:** Cuando uses condiciones dentro de repetibles, asegúrate de usar `"conditionContext": "repeatable"` para que cada item evalúe las condiciones de forma independiente.

---

## 4️⃣ Rutas y Referencias

### Cargar vistas del plugin actual:

```javascript
// Desde index.json del plugin
"view": "dashboard"  // ✅ Relativo al plugin

// Desde código JavaScript
modal.open('miPlugin|sections/detalle')  // ✅ Especificando plugin
```

### Cargar vistas del core:

```javascript
modal.open('core:dashboard/dashboard')
view.loadView('core:user/sections/user-list')
```

### Cargar formularios del plugin:

```javascript
modal.open('inventario|forms/producto')
modal.openWithData('botmaster|forms/bot-form', {id: 123})
```

### Cargar formularios del core:

```javascript
modal.open('core:user/forms/user-form')
```

---

## 5️⃣ Anidación y Recursividad

El sistema permite anidar componentes de forma recursiva:

### Vista → Tabs → DataTable:

```json
{
  "id": "panel",
  "title": "Panel de Control",
  "tabs": [
    {
      "id": "usuarios",
      "title": "Usuarios",
      "content": [
        {
          "type": "component",
          "component": "datatable",
          "config": {
            "pluginName": "admin",
            "columns": ["id", "nombre", "email"],
            "dataSource": {
              "type": "auto",
              "api": {"endpoint": "/api/users"}
            }
          }
        }
      ]
    }
  ]
}
```

### Vista → HTML → Modal con Formulario:

```json
{
  "id": "vista-principal",
  "title": "Principal",
  "content": [
    {
      "type": "html",
      "content": "<button onclick=\"modal.open('miPlugin|forms/crear', {title: 'Crear Item'})\">Crear</button>"
    }
  ]
}
```

### Vista → Tabs → Form → Grouper → Repeatable:

```json
{
  "id": "configuracion-avanzada",
  "tabs": [
    {
      "id": "config",
      "title": "Configuración",
      "content": [
        {
          "type": "form",
          "form_json": "forms/config"
        }
      ]
    }
  ]
}
```

**Y el formulario (forms/config.json):**
```json
{
  "id": "config-form",
  "fields": [
    {
      "type": "grouper",
      "mode": "tabs",
      "groups": [
        {
          "title": "Fuentes",
          "fields": [
            {
              "name": "fuentes",
              "type": "repeatable",
              "addButtonText": "Agregar",
              "fields": [
                {"name": "url", "type": "text"}
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 6️⃣ Componentes del Sistema

### Modal - Ventanas Emergentes

El sistema de modales permite abrir formularios, vistas completas y HTML en ventanas emergentes.

**Abrir modal con formulario nuevo:**
```javascript
modal.open('miPlugin|forms/item-form', {
  title: 'Nuevo Item',
  width: '80%',
  maxWidth: '900px'
})
```

**Abrir modal con formulario para editar (carga datos automáticamente):**
```javascript
modal.openWithData('miPlugin|forms/item-form', {
  id: 123,
  title: 'Editar Item',
  width: '70%'
})
```

**Abrir modal con una vista (section) completa:**
```javascript
// Vista de plugin
modal.open('miPlugin|sections/detalle', {
  title: 'Detalles del Item',
  width: '90%',
  maxWidth: '1200px'
})

// Vista del core
modal.open('core:sections/dashboard', {
  title: 'Dashboard',
  showFooter: false
})

// Vista simple
modal.open('sections/report', {
  title: 'Reporte'
})
```

**Abrir modal con HTML:**
```javascript
modal.open('<div><h3>Título</h3><p>Contenido HTML</p></div>', {
  html: true,
  title: 'Información',
  showFooter: false
})
```

**Cerrar modal:**
```javascript
modal.closeAll()  // Cierra todos los modales
modal.close(modalId)  // Cierra un modal específico
```

**💡 Tip:** Las vistas (sections) en modales pueden contener DataTables, widgets, tabs, formularios y cualquier otro componente. Es útil para mostrar información detallada sin salir de la vista actual.

### Toast - Notificaciones

Sistema de notificaciones emergentes no intrusivas.

```javascript
// Tipos de notificaciones
toast.success('Operación exitosa');
toast.error('Ha ocurrido un error');
toast.warning('Advertencia importante');
toast.info('Información adicional');

// Con duración personalizada (en milisegundos)
toast.success('Guardado', { duration: 5000 });

// Con posición personalizada
toast.info('Mensaje', {
  position: 'top-right'  // top-right|top-left|bottom-right|bottom-left
});
```

### Grouper - Agrupación de Campos (en formularios)

Ya explicado en la sección de formularios. Permite agrupar campos en tabs o acordeón.

### Tabs - Sistema de Pestañas (en vistas)

Las vistas pueden tener tabs para organizar contenido:

```json
{
  "id": "mi-vista",
  "title": "Vista con Tabs",
  "tabs": [
    {
      "id": "tab1",
      "title": "Información General",
      "content": [
        {
          "type": "html",
          "content": "<h3>Contenido del Tab 1</h3>"
        }
      ]
    },
    {
      "id": "tab2",
      "title": "Configuración",
      "content": [
        {
          "type": "form",
          "form_json": "forms/config"
        }
      ]
    },
    {
      "id": "tab3",
      "title": "Datos",
      "content": [
        {
          "type": "component",
          "component": "datatable",
          "config": {
            "pluginName": "miPlugin",
            "columns": ["id", "nombre"],
            "dataSource": {
              "type": "auto",
              "api": {"endpoint": "/api/datos"}
            }
          }
        }
      ]
    }
  ]
}
```

---

## 7️⃣ Acciones Comunes

### Abrir modal con formulario nuevo:

```javascript
modal.open('miPlugin|forms/item-form', {
  title: 'Nuevo Item'
})
```

### Abrir modal con formulario para editar:

```javascript
modal.openWithData('miPlugin|forms/item-form', {
  id: 123,
  title: 'Editar Item'
})
```

### Abrir modal con una vista completa:

```javascript
// Útil para mostrar detalles, reportes, o información compleja, aparte de poder combinar form dentro de la vista sections tambien.
modal.open('inventario|sections/detalle-producto', {
  title: 'Detalle del Producto',
  width: '90%',
  showFooter: false
})
```

### Eliminar con confirmación:

```javascript
if(confirm('¿Eliminar?')) {
  api.delete('/api/items/123').then(() => {
    toast.success('Eliminado');
    datatable.refreshFirst();
  }).catch(e => {
    toast.error('Error al eliminar');
  });
}
```

### Llamada API personalizada:

```javascript
api.post('/api/blog/123/scrape').then(() => {
  toast.success('Scraping iniciado');
}).catch(e => {
  toast.error('Error: ' + e.message);
});
```

---

## 8️⃣ DataSource - Carga de Datos

### Solo API:

```json
{
  "type": "api",
  "api": {
    "endpoint": "/api/items",
    "method": "GET"
  }
}
```

### Solo Mock (datos locales):

```json
{
  "type": "mock",
  "mock": {
    "file": "mock/items.json"
  }
}
```

### Auto (API con fallback a Mock):

```json
{
  "type": "auto",
  "api": {
    "endpoint": "/api/items",  // ⚠️ Si el endpoint termina en .json, se cargará como archivo JSON estático
    "method": "GET"
  },
  "mock": {
    "file": "mock/items.json"  // Fallback si falla el API
  }
}
```

**Nota importante:** El componente `datatable` detecta automáticamente si un endpoint termina en `.json` y lo carga como archivo estático en lugar de hacer una llamada API. Ejemplo:
- `/api/items` → Llamada API al backend
- `data/items.json` → Carga de archivo JSON estático
- `/api/items.json` → Carga de archivo JSON estático (no es API)

---

## 9️⃣ Registrar el Plugin

Una vez creado el plugin, registrarlo en `/public/plugins/index.json`:

```json
{
  "plugins": [
    "admin",
    "botmaster",
    "ejemplos",
    "inventario",
    "miPlugin"
  ]
}
```

---

## 🔟 Ejemplo Completo: Plugin "TaskManager"

### Estructura:
```
public/plugins/taskmanager/
├── index.json
├── assets/
│   ├── css/
│   │   └── taskmanager.css
│   └── js/
│       └── taskmanager.js
├── lang/
│   ├── es.json
│   └── en.json
└── views/
    ├── sections/
    │   ├── dashboard.json
    │   └── tasks.json
    └── forms/
        └── task-form.json
```

### index.json:
```json
{
  "name": "taskmanager",
  "version": "1.0.0",

  "hasMenu": true,
  "hasViews": true,
  "styles": ["assets/css/taskmanager.css"],
  "scripts": ["assets/js/taskmanager.js"],
  "menu": {
    "title": "Tareas",
    "icon": "✅",
    "order": 15,
    "items": [
      {
        "id": "botmaster-dashboard",
        "title": "Dashboard",
        "view": "dashboard",
        "order": 1
      },
      {
        "id": "tasks",
        "title": "Mis Tareas",
        "view": "tasks",
        "order": 2
      }
    ]
  }
}
```

### views/sections/dashboard.json:
```json
{
  "id": "taskmanager-dashboard",
  "title": "Dashboard de Tareas",
  "content": [
    {
      "type": "component",
      "component": "widget",
      "order": 1,
      "config": {
        "title": "Tareas Pendientes",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/tasks/count?status=pending",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>{{count}}</h2><p>Pendientes</p></div>"
      }
    },
    {
      "type": "component",
      "component": "widget",
      "order": 2,
      "config": {
        "title": "Completadas Hoy",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/tasks/count?status=completed&period=today",
            "method": "GET"
          }
        },
        "html": "<div class='widget-stat'><h2>{{count}}</h2><p>Hoy</p></div>"
      }
    }
  ]
}
```

### views/sections/tasks.json:
```json
{
  "id": "taskmanager-tasks",
  "title": "Gestión de Tareas",
  "content": [
    {
      "type": "html",
      "order": 1,
      "content": "<div class='view-toolbar'><button class='btn btn-primary' onclick=\"modal.open('taskmanager|forms/task-form', {title: '➕ Nueva Tarea'})\">➕ Nueva Tarea</button></div>"
    },
    {
      "type": "component",
      "component": "datatable",
      "order": 2,
      "config": {
        "pluginName": "taskmanager",
        "dataSource": {
          "type": "auto",
          "api": {
            "endpoint": "/api/tasks",
            "method": "GET"
          }
        },
        "columns": ["id", "title", "status", "priority", "due_date"],
        "actions": {
          "edit": {
            "name": "✏️ Editar",
            "dataLoader": {
              "type": "auto",
              "api": {
                "endpoint": "/api/tasks/{id}",
                "method": "GET"
              }
            },
            "onclick": "modal.openWithData('taskmanager|forms/task-form', {id: {id}, title: 'Editar Tarea'})"
          },
          "complete": {
            "name": "✓ Completar",
            "onclick": "api.post('/api/tasks/{id}/complete').then(() => { toast.success('Tarea completada'); datatable.refreshFirst(); });"
          },
          "delete": {
            "name": "🗑️ Eliminar",
            "onclick": "if(confirm('¿Eliminar tarea?')) { api.delete('/api/tasks/{id}').then(() => { toast.success('Eliminado'); datatable.refreshFirst(); }); }"
          }
        }
      }
    }
  ]
}
```

### views/forms/task-form.json:
```json
{
  "id": "task-form",
  "title": "Formulario de Tarea",
  "fields": [
    {
      "name": "title",
      "label": "Título",
      "type": "text",
      "required": true,
      "validation": "required|min:3"
    },
    {
      "name": "description",
      "label": "Descripción",
      "type": "textarea",
      "rows": 4
    },
    {
      "type": "group",
      "columns": 2,
      "fields": [
        {
          "name": "status",
          "label": "Estado",
          "type": "select",
          "options": [
            {"value": "pending", "label": "Pendiente"},
            {"value": "in_progress", "label": "En Progreso"},
            {"value": "completed", "label": "Completada"}
          ]
        },
        {
          "name": "priority",
          "label": "Prioridad",
          "type": "select",
          "options": [
            {"value": "low", "label": "Baja"},
            {"value": "medium", "label": "Media"},
            {"value": "high", "label": "Alta"}
          ]
        }
      ]
    },
    {
      "name": "due_date",
      "label": "Fecha de Vencimiento",
      "type": "date"
    },
    {
      "name": "subtasks",
      "label": "Subtareas",
      "type": "repeatable",
      "addButtonText": "➕ Agregar Subtarea",
      "fields": [
        {
          "name": "title",
          "label": "Título de Subtarea",
          "type": "text",
          "required": true
        },
        {
          "name": "completed",
          "label": "Completada",
          "type": "checkbox"
        }
      ]
    }
  ]
}
```

### lang/es.json (Sistema de traducciones semánticas):

**⚠️ IMPORTANTE:** Usa keys semánticas descriptivas en lugar de valores literales. Esto hace el código más mantenible y fácil de interpretar.

```json
{
  "task.column.id": "ID",
  "task.column.title": "Título",
  "task.column.status": "Estado",
  "task.column.priority": "Prioridad",
  "task.column.due_date": "Fecha de Vencimiento",
  "task.action.edit": "Editar Tarea",
  "task.action.delete": "Eliminar Tarea",
  "task.action.complete": "Marcar como Completada",
  "task.status.pending": "Pendiente",
  "task.status.in_progress": "En Progreso",
  "task.status.completed": "Completada",
  "task.priority.low": "Baja",
  "task.priority.medium": "Media",
  "task.priority.high": "Alta",
  "title.tasks": "Gestión de Tareas",
  "title.dashboard": "Dashboard de Tareas",
  "description.tasks": "Administra tus tareas diarias",
  "button.new_task": "Nueva Tarea",
  "message.task_completed": "Tarea completada exitosamente",
  "message.task_deleted": "Tarea eliminada",
  "message.confirm_delete": "¿Está seguro de eliminar esta tarea?"
}
```

**Uso en el código:**
```javascript
// En lugar de texto hardcodeado:
toast.success('Tarea completada');

// Usar traducciones:
toast.success(__('taskmanager:message.task_completed'));

// En formularios JSON:
{
  "label": "i18n:taskmanager:task.column.title",
  "placeholder": "i18n:taskmanager:placeholder.enter_title"
}
```

---

## 🔑 Reglas de Oro

1. **Nombres de componentes en minúsculas:** `"datatable"` no `"dataTable"`
2. **DataTable requiere `pluginName`:** Siempre especificar el plugin
3. **Columnas como array simple:** `["id", "nombre"]` no objetos
4. **Acciones con `onclick`:** Código JavaScript ejecutable
5. **Rutas relativas en index.json:** `"sections/dashboard"` no `"miPlugin/sections/dashboard"`
6. **Content es array:** Todo va dentro del array `content`
7. **Registrar en plugins/index.json:** No olvides agregarlo a la lista

---

## 📚 Referencia Rápida de Tipos

### Tipos de content:
- `"type": "html"` - HTML directo
- `"type": "component"` - Componente (widget, datatable)
- `"type": "form"` - Formulario

**💡 Formularios y componentes dinámicos:**
También puedes cargar formularios y componentes dentro de HTML usando:
- `<div class='dynamic-form' data-form-json='ruta/formulario'></div>` - Carga formulario automáticamente
- `<div class='dynamic-component' data-component='nombre' data-config='{...}'></div>` - Carga componente automáticamente

### Componentes disponibles:
- `"component": "widget"` - Widgets para dashboard
- `"component": "datatable"` - Tablas de datos
- `modal` - Sistema de ventanas emergentes (ver sección Acciones Comunes)
- `grouper` - Agrupación de campos en formularios (tabs/acordeón)
- `toast` - Notificaciones emergentes
- `tabs` - Sistema de pestañas para vistas

### Tipos de campos de formulario:
- `"type": "text"` - Texto simple
- `"type": "email"` - Email
- `"type": "number"` - Número
- `"type": "textarea"` - Texto largo
- `"type": "select"` - Selector
- `"type": "checkbox"` - Casilla
- `"type": "radio"` - Opciones
- `"type": "date"` - Fecha
- `"type": "repeatable"` - Campos repetibles
- `"type": "grouper"` - Agrupación (tabs/acordeón)
- `"type": "group"` - Columnas

### Validaciones:
- `"required"` - Obligatorio
- `"email"` - Email válido
- `"min:n"` - Mínimo n caracteres
- `"max:n"` - Máximo n caracteres
- `"numeric"` - Solo números

---

**Última actualización:** Noviembre 2025
**Framework Version:** 1.0