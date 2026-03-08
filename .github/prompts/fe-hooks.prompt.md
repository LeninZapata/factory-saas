# Frontend — Hook System

> hookRegistry, hookLoader, hook.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/core/hookRegistry.js`

```
FILE: framework/js/core/hookRegistry.js
CLASS: ogHookRegistry
TYPE: core-hook
PROMPT: fe-view-hook

ROLE:
  Estado y registro de extensiones. Almacena la configuración normalizada
  de cada extensión en dos Maps: pluginRegistry (activo, filtrable por
  permisos) y pluginRegistryOriginal (sin filtrar, para el sistema de permisos).
  Sub-módulo de ogHook — accedido via ogHook como proxy transparente.

ESTADO:
  pluginRegistry         → Map<name, config> con extensiones activas
  pluginRegistryOriginal → Map<name, config> copia sin modificar (para permisos)

REGISTRO (register):
  Normaliza la config, procesa el menú llamando a ogHook.processMenuItems()
  y guarda en ambos Maps. Retorna la config normalizada.

CONFIG NORMALIZADA:
  { name, enabled, hasMenu, hasViews, hasLanguages, hasHooks,
    backend: { enabled }, description, version, menu?, scripts?, styles? }

CONSULTAS:
  getPluginConfig(name)          → config completa de una extensión
  isExtensionEnabled(name)       → bool
  getEnabledExtensions()         → array de extensiones con enabled:true
  getAllExtensionsForPermissions() → array simplificado para el panel de permisos

NORMALIZACIÓN DE RUTAS:
  normalizeResourcePath(path)  → agrega 'extensions/' si no tiene prefijo
  normalizeResources(paths[])  → aplica normalizeResourcePath a cada item

NOTA:
  ogHook expone pluginRegistry y pluginRegistryOriginal como getters/setters
  que delegan aquí — sidebar.js y auth.js acceden via ogHook.pluginRegistry
  sin saber que vive en este archivo.

REGISTRO:
  window.ogHookRegistry
  ogFramework.core.hookRegistry
```

### `framework/js/core/hookLoader.js`

```
FILE: framework/js/core/hookLoader.js
CLASS: ogHookLoader
TYPE: core-hook
PROMPT: fe-view-hook

ROLE:
  Carga de extensiones desde disco. Lee el índice global de extensiones,
  carga la config de cada una, ejecuta hooks.js si corresponde y carga
  las traducciones del idioma activo.
  Sub-módulo de ogHook — no se usa directamente desde extensiones.

FLUJO loadPluginHooks:
  1. fetch extensions/index.json   → lista de { name } de extensiones
  2. por cada extensión → loadPlugin(name)

FLUJO loadPlugin(name):
  1. fetch extensions/{name}/index.json → ogHookRegistry.register(name, config)
  2. Si config.hasHooks === true:
     fetch extensions/{name}/hooks.js → new Function(script)()
     → ogHook.loadedHooks.add(name)
  3. ogI18n.loadExtensionLang(name, currentLang)

IDIOMAS (tryLoadPluginLang):
  fetch extensions/{name}/lang/{lang}.json → guarda en i18n.exntesionTranslations
  y en ogCache. Si el archivo no existe retorna false silenciosamente.

extensions/index.json ESPERADO:
  { "extensions": [ { "name": "admin" }, { "name": "ejemplos" } ] }

REGISTRO:
  window.ogHookLoader
  ogFramework.core.hookLoader
```

### `framework/js/core/hook.js`

```
FILE: framework/js/core/hook.js
CLASS: ogHook
TYPE: core-hook
PROMPT: fe-view-hook

ROLE:
  Fachada del sistema de extensiones. Centraliza registro, carga, menús
  y ejecución de hooks. Es el único punto de acceso desde extensiones y
  otros módulos del framework — hookRegistry y hookLoader son internos.

ESTADO PROPIO:
  loadedHooks  → Set<name> de extensiones con hooks.js cargado y ejecutable
  menuItems    → array (uso interno del sidebar)

PROXIES DE ESTADO (transparentes para sidebar.js y auth.js):
  ogHook.pluginRegistry         → ogHookRegistry.pluginRegistry
  ogHook.pluginRegistryOriginal → ogHookRegistry.pluginRegistryOriginal

EJECUCIÓN DE HOOKS (execute):
  Por cada extensión en loadedHooks (si enabled):
    busca window['{ext}Hooks'] y llama al método hook_{viewId}()
    El resultado debe ser un array de items con { id, type, order, ... }
  Los resultados se ordenan por order y se retornan como array unificado.

  Normalización del nombre: 'admin-panel' → 'hook_adminPanel' (camelCase)

MENÚS (getMenuItems):
  Recorre pluginRegistry, filtra enabled:true y hasMenu:true, construye
  el array de ítems resolviendo delegates. Ordenado por order.

DELEGATES EN MENÚ:
  Un ítem con delegate:'otra-extension' hereda los items de esa extensión.
  resolveMenuDelegates() los resuelve recursivamente en getMenuItems().

DELEGACIÓN COMPLETA DE API:
  Todos los métodos de hookRegistry y hookLoader están re-expuestos en ogHook
  para que el código externo solo necesite importar ogHook.

USO DESDE EXTENSIONES:
  const hook = ogModule('hook');
  hook.isExtensionEnabled('admin')
  hook.getPluginConfig('admin')
  hook.execute('hook_dashboard')   // normalmente llamado por ogViewRender

REGISTRO:
  window.ogHook
  ogFramework.core.hook
```
