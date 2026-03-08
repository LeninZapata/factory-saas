# Frontend — Core Services

> cache, api, i18n, action, dataLoader.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/core/cache.js`

```
FILE: framework/js/core/cache.js
CLASS: ogCache
TYPE: core-service
PROMPT: fe-core-services

ROLE:
  Cache de dos capas: memoria (Map) y localStorage, con TTL y prefijo por slug+space.
  get/set usan ambas capas automáticamente: primero memoria, luego localStorage.
  El prefijo se construye como cache_{slug}_{space}_ para aislar datos entre instancias.

MÉTODOS PRINCIPALES:
  get(key)                    → memoria → localStorage → null
  set(key, data, ttl?)        → guarda en memoria y localStorage
  delete(key)                 → elimina de ambas capas
  clear()                     → limpia todas las keys del slug+space activo
  clearAll()                  → limpia memoria + todo localStorage del prefijo
  memoryGet(key, default?)    → solo memoria, retorna default si no existe

CAPAS INDIVIDUALES:
  getMemory(key) / setMemory(key, data, ttl?)   → solo Map en memoria
  getLocal(key)  / setLocal(key, data, ttl?)    → solo localStorage

TTL:
  Por defecto: 1 hora (3.600.000 ms)
  Personalizable por llamada: ogCache.set('key', data, 30 * 60 * 1000)

ESPACIO (multi-tenancy):
  ogCache.setSpace('tenant-123')  → cambia el space y resetea el prefijo
  Útil para aislar datos de distintos tenants en la misma instancia

USO:
  ogCache.set('user_list', data);
  const users = ogCache.get('user_list');
  ogCache.delete('user_list');

REGISTRO:
  window.ogCache
  ogFramework.core.cache
```

### `framework/js/core/api.js`

```
FILE: framework/js/core/api.js
CLASS: ogApi
TYPE: core-service
PROMPT: fe-core-services

ROLE:
  HTTP client con autenticación Bearer automática, manejo de errores 401/400
  y soporte de contexto multi-instancia. Todos los requests pasan por request().
  En 401 dispara el flujo de logout de auth automáticamente.

MÉTODOS:
  get(endpoint, opts?)              → GET
  post(endpoint, data, opts?)       → POST con JSON body
  put(endpoint, data, opts?)        → PUT con JSON body
  delete(endpoint, opts?)           → DELETE
  request(endpoint, opts?)          → método base, todos los anteriores lo usan

AUTENTICACIÓN:
  Lee el token desde ogAuth (si existe) y lo agrega como Authorization: Bearer {token}.
  En respuesta 401 → llama ogAuth.logout() automáticamente.

BASE URL:
  Usa apiBaseUrl del config activo. Si no existe, deriva de baseUrl removiendo /admin/.
  Los endpoints deben comenzar con /api/... (ej: '/api/user')

MULTI-CONTEXTO:
  opts._context → permite pasar una config específica en vez de usar activeConfig.
  Usado por ogApp(slug).api para requests contextualizados por instancia.

RESPUESTA ESPERADA DEL BACKEND:
  { success: true, data: {...} }   → éxito
  { success: false, message: '' }  → error de negocio

USO:
  const res = await ogApi.get('/api/user');
  const res = await ogApi.post('/api/user', { name: 'Juan' });
  if (res.success) { ... }

REGISTRO:
  window.ogApi
  ogFramework.core.api
```

### `framework/js/core/i18n.js`

```
FILE: framework/js/core/i18n.js
CLASS: ogI18n
TYPE: core-service
PROMPT: fe-core-services

ROLE:
  Sistema de internacionalización con carga lazy de traducciones por idioma.
  Maneja traducciones del core (framework/js/lang/) y de cada extensión
  (extensions/{ext}/lang/). El idioma persiste en localStorage entre sesiones.

INICIALIZACIÓN:
  await ogI18n.init({ defaultLang:'es', availableLangs:['es','en'], refreshOnChange:true })
  → carga el lang del localStorage o defaultLang, luego carga el archivo de traducciones.

TRADUCCIÓN:
  ogI18n.t('core.loading')                     → string traducido
  ogI18n.t('core.items', { count: 5 })          → con interpolación de parámetros
  __('core.loading')                             → alias global de ogI18n.t()
  'i18n:core.loading' en JSON de vista/form     → procesado automáticamente al renderizar
  '{i18n:core.key}' dentro de strings HTML      → procesado por processString()

CAMBIO DE IDIOMA:
  await ogI18n.setLang('en')  → carga traducciones del nuevo idioma y recarga la página
                                 (si refreshOnChange:true, por defecto)

ARCHIVOS DE TRADUCCIÓN:
  Core:       framework/js/lang/{lang}.json          → keys: core.*, form.*, modal.*, datatable.*...
  Extensión:  extensions/{ext}/lang/{lang}.json      → keys libres por extensión

MÉTODOS ÚTILES:
  getLang()              → idioma actual
  getAvailableLangs()    → array de idiomas configurados
  processString(str)     → reemplaza {i18n:key} en strings HTML
  loadExtensionLang(ext, lang)  → carga traducciones de una extensión

REGISTRO:
  window.ogI18n  (también accesible via ogModule('i18n'))
  ogFramework.core.i18n
  __ → función global alias de ogI18n.t()
```

### `framework/js/core/action.js`

```
FILE: framework/js/core/action.js
CLASS: ogAction
TYPE: core-service
PROMPT: fe-core-services

ROLE:
  Dispatcher de acciones con formato 'tipo:valor'. Abstrae la lógica de
  navegación, modales, llamadas API y métodos JS para que funcionen tanto
  en HTML (onclick) como desde código. Diseñado para ser portable a React Native.

FORMATO DE ACCIÓN:
  'navigate:products/list'          → carga vista
  'modal:admin|forms/user-form'     → abre modal con vista/form
  'api:save?method=POST'            → llamada HTTP
  'call:admin.save'                 → llama window.admin.save()
  'submit:admin.save'               → busca el form activo y llama admin.save(formId)
  'submit:'                         → dispara submit nativo del form activo
  'custom:miFuncion'                → llama window.miFuncion()

USO EN JSON (statusbar/toolbar de formularios):
  { "type": "button", "action": "submit:admin.save" }
  { "type": "button", "action": "navigate:admin|sections/admin-panel" }
  { "type": "button", "_action": "call:ogComponent(\"modal\")?.closeAll" }

USO EN CÓDIGO:
  ogAction.handle('navigate:admin|sections/panel', {}, { extensionContext: 'admin' });
  ogAction.handle('modal:admin|forms/user-form', { title: 'Nuevo' });

MÉTODOS INTERNOS (no usar directamente):
  handleNavigate, handleModal, handleApi, handleMethodCall, handleSubmit, handleCustom

REGISTRO:
  window.ogAction
  window.actionProxy.handle() → alias para uso en HTML onclick
  ogFramework.core.action
```

### `framework/js/core/dataLoader.js`

```
FILE: framework/js/core/dataLoader.js
CLASS: ogDataLoader
TYPE: core-service
PROMPT: fe-core-services

ROLE:
  Carga datos desde API o archivos mock JSON con estrategia auto-fallback.
  Usado por ogDatatable y ogModal para obtener datos antes de renderizar.
  En modo 'auto': intenta API si backend.enabled, si falla cae a mock.

MODOS:
  auto   → API si backend habilitado en pluginConfig → fallback a mock
  api    → solo API (falla si no responde)
  mock   → solo archivo JSON local

MÉTODOS:
  load(config, extensionName?)         → carga según type (auto/api/mock)
  loadList(dataSourceConfig, ext)      → alias de load() para listas
  loadDetail(config, id, ext)          → carga un ítem por ID (reemplaza {id} en endpoint)

CONFIG DE DATASOURCE:
  {
    type: 'auto',
    api: { enabled: true, endpoint: '/api/user', method: 'GET' },
    mock: { file: 'mock/users.json', filterBy: 'id', filterValue: null }
  }

USO:
  const data = await ogDataLoader.load({ type: 'mock', mock: { file: 'mock/users.json' } }, 'admin');
  const user = await ogDataLoader.loadDetail(config, userId, 'admin');

NOTA:
  El archivo navigation.js contiene esta misma clase (duplicado por error de naming).
  El archivo canónico es dataLoader.js. navigation.js debe eliminarse o renombrarse.

REGISTRO:
  window.ogDataLoader
  ogFramework.core.dataLoader
```
