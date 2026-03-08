# Frontend — Middle / Auth System

> authLoginForm, authSession, authPermissions, authUI, authCore, auth (fachada).
> Generado: 2026-03-08 14:28:20

---

### `middle/js/authLoginForm.js`

```
FILE: middle/js/authLoginForm.js
CLASS: ogAuthLoginForm
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Manejo del formulario de login en el DOM. Registra el handler del submit,
  valida campos requeridos, gestiona el estado del botón durante la petición
  y muestra errores inline en el formulario.
  Sub-módulo de ogAuth — no se usa directamente desde extensiones.

HANDLER (setupLoginHandler):
  Usa ogEvents.on() para escuchar submit en form[data-form-id*="login-form"].
  Solo se registra una vez (_loginHandlerRegistered). Extrae user/pass del
  FormData, llama ogAuthCore.login(data), muestra error si falla.

ERRORES (showLoginError):
  Crea o reutiliza un div.form-error en el primer hijo del form.
  Muestra el mensaje con fondo rojo durante 5 segundos y luego lo elimina.

REGISTRO:
  window.ogAuthLoginForm
  ogFramework.core.authLoginForm
```

### `middle/js/authSession.js`

```
FILE: middle/js/authSession.js
CLASS: ogAuthSession
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Gestión del token y monitoreo periódico de sesión.
  Lee/escribe el token en ogCache.localStorage y verifica la sesión
  contra el servidor en intervalos configurables.
  Sub-módulo de ogAuth — no se usa directamente desde extensiones.

SESIÓN:
  getToken()       → lee token de ogCache.getLocal(storageKey_token)
  getUser()        → lee user de ogCache.getLocal(storageKey_user)
  clearSession()   → elimina token y user del cache
  isAuthenticated() → !!user && !!getToken()
  normalizeConfig() → parsea user.config si viene como JSON string

MONITOREO (startSessionMonitoring):
  setInterval cada config.sessionCheckInterval (default 5min).
  Cada tick llama checkSessionWithServer() → GET config.api.me.
  Si falla con 401 → handleSessionExpired() → reload tras 1.5s.

EXPIRACIÓN (handleSessionExpired):
  stopSessionMonitoring() → clearSession() → toast warning
  → setTimeout 1500ms → window.location.reload()

REGISTRO:
  window.ogAuthSession
  ogFramework.core.authSession
```

### `middle/js/authPermissions.js`

```
FILE: middle/js/authPermissions.js
CLASS: ogAuthPermissions
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Carga y aplicación de permisos del usuario sobre extensiones y menús.
  Lee los permisos desde user.config.permissions, los normaliza y los
  aplica sobre pluginRegistry para deshabilitar lo que el usuario no puede ver.
  Sub-módulo de ogAuth — no se usa directamente desde extensiones.

ESTRUCTURA DE PERMISOS (userPermissions):
  {
    extensions: {
      admin: {
        enabled: true,
        menus: {
          'admin-usuarios': { enabled: true, tabs: ['basicos', 'permisos'] },
          'admin-config':   true
        }
      }
    }
  }

FILTRADO (filterExtensionsByPermissions):
  Admin → no filtra nada.
  Por cada extensión en pluginRegistry:
    - Sin permisos o enabled:false → pluginConfig.enabled = false
    - menus:'*' → acceso total a todos los menús
    - menus:{} → filtra pluginConfig.menu.items por allowedMenuIds

TABS (getTabPermissions):
  Retorna la lista de tabs permitidas para un menuId específico.
  '*' → todas las tabs. Array → solo esas. null → sin restricción registrada.
  Usado por ogViewLoader.filterTabsByPermissions().

NORMALIZACIÓN:
  Soporta tanto 'plugins' como 'extensions' como key del objeto de permisos.
  Si viene 'plugins', lo renombra a 'extensions' automáticamente.

REGISTRO:
  window.ogAuthPermissions
  ogFramework.core.authPermissions
```

### `middle/js/authUI.js`

```
FILE: middle/js/authUI.js
CLASS: ogAuthUI
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Acciones de UI relacionadas con la autenticación: mostrar pantalla de login
  o app, limpiar caches al hacer logout, recargar la app tras cambio de
  permisos e inyectar el botón de logout en el sidebar.
  Sub-módulo de ogAuth — no se usa directamente desde extensiones.

SHOW LOGIN (showLogin):
  layout.init('auth') → estructura mínima sin sidebar
  document.body.setAttribute('data-view', 'login-view')
  view.loadView('middle:auth/login')

SHOW APP (showApp):
  Solo marca data-view='app-view' en body.
  og-framework.js es quien llama layout/hooks/sidebar/view después.

CLEAR APP CACHES (clearAppCaches):
  Limpia viewNavigationCache, schemas del form, pluginRegistry del hook,
  menuItems del sidebar y todo el cache localStorage del slug activo.
  Llamado antes de logout para dejar el estado limpio.

RELOAD APP (reloadAppAfterPermissionChange):
  Recarga extensiones (hook.loadPluginHooks), filtra por nuevos permisos
  y re-renderiza el sidebar. Útil desde el panel de administración de permisos.

INJECT LOGOUT BUTTON (injectLogoutButton):
  Llamado por ogTrigger.execute('sidebar:footer').
  Inyecta HTML con nombre de usuario y botón de logout en la zona footer
  del sidebar. El botón tiene confirm() antes de llamar ogAuthCore.logout().

REGISTRO:
  window.ogAuthUI
  ogFramework.core.authUI
```

### `middle/js/authCore.js`

```
FILE: middle/js/authCore.js
CLASS: ogAuthCore
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Estado central y ciclo de vida principal de la autenticación.
  Gestiona init, check de sesión activa, login y logout.
  Sub-módulo de ogAuth — no se usa directamente desde extensiones.

ESTADO:
  config             → config auth normalizada (de appConfig.auth)
  user               → objeto usuario autenticado (null si no hay sesión)
  userPermissions    → permisos del usuario (extensions, menus, tabs)
  userPreferences    → preferencias del usuario (tema, idioma, etc.)
  sessionCheckInterval → referencia al setInterval del monitoreo

FLUJO init():
  1. Normaliza config con defaults (loginView, api endpoints, TTLs)
  2. setupLoginHandler() → registra el handler del formulario de login
  3. check() → verifica token en localStorage contra /api/auth/profile
  4a. Autenticado: getUser() → loadUserPermissions() → startSessionMonitoring() → showApp()
  4b. No autenticado: showLogin()

LOGIN (login(formIdOrCredentials)):
  Acepta formId (string) o credenciales directas (objeto {user, pass}).
  POST a config.api.login → guarda token y user en ogCache.setLocal().
  Recarga la página para que og-framework reinicie todo desde cero.

LOGOUT (logout()):
  stopSessionMonitoring() → POST a config.api.logout → clearAppCaches()
  → clearSession() → window.location.reload()

CHECK (check()):
  GET a config.api.me con el token actual.
  Si responde 200 → sesión válida, refresca el user en cache.
  Si falla → clearSession() y retorna false.

CONFIG POR DEFECTO:
  loginView: 'middle:auth/login'
  redirectAfterLogin: 'middle:dashboard/dashboard'
  storageKey: 'auth'
  sessionCheckInterval: 5 min
  tokenTTL: 24 horas
  api: { login: '/api/auth/login', logout: '/api/auth/logout', me: '/api/auth/profile' }

REGISTRO:
  window.ogAuthCore
  ogFramework.core.authCore
```

### `middle/js/auth.js`

```
FILE: middle/js/auth.js
CLASS: ogAuth
TYPE: middle-auth
PROMPT: fe-middle

ROLE:
  Fachada del sistema de autenticación. Re-expone todos los métodos de
  ogAuthCore, ogAuthSession, ogAuthPermissions, ogAuthLoginForm y ogAuthUI
  bajo una sola clase. El código externo (og-framework, extensiones) solo
  necesita ogAuth — los sub-módulos son internos.

ORDEN DE CARGA (en framework-manifest.json o en auth.css):
  authLoginForm.js → authSession.js → authPermissions.js → authUI.js
  → authCore.js → auth.js (fachada)

MÉTODOS DELEGADOS:
  init, check, login, logout                              → ogAuthCore
  getToken, getUser, clearSession, isAuthenticated,
  normalizeConfig, startSessionMonitoring,
  stopSessionMonitoring, handleSessionExpired             → ogAuthSession
  loadUserPermissions, filterExtensionsByPermissions,
  getTabPermissions                                       → ogAuthPermissions
  setupLoginHandler, showLoginError                       → ogAuthLoginForm
  showLogin, showApp, clearAppCaches,
  reloadAppAfterPermissionChange, injectLogoutButton      → ogAuthUI

PROPIEDADES PROXY:
  ogAuth.user              → ogAuthCore.user
  ogAuth.userPermissions   → ogAuthCore.userPermissions
  ogAuth.userPreferences   → ogAuthCore.userPreferences
  ogAuth.config            → ogAuthCore.config

USO TÍPICO:
  ogAuth.isAuthenticated()
  ogAuth.login({ user: 'admin', pass: '1234' })
  ogAuth.logout()
  ogAuth.getTabPermissions('admin-usuarios')
  ogAuth.reloadAppAfterPermissionChange()

REGISTRO:
  window.ogAuth
  ogFramework.core.auth
```
