# Módulo Auth & Users (No aplica para WordPress)

> Login, sesiones, gestión de usuarios. Capa middle.
> Generado: 2026-03-08 14:28:20

---

### `middle/resources/handlers/AuthHandler.php`

```
FILE: middle/resources/handlers/AuthHandler.php
ROLE: Núcleo del módulo de autenticación. Maneja login, logout, perfil
      y gestión de sesiones via archivos JSON usando ogCache.

CAPA: middle/ — solo para sistemas standalone. En WordPress esta capa
      no se carga ya que el login lo maneja el propio WordPress.

ARCHIVOS DEL MÓDULO:
  middle/resources/handlers/AuthHandler.php   → lógica de auth y sesiones
  middle/resources/controllers/UserController → CRUD de usuarios (extiende ogController)
  middle/resources/handlers/UserHandler.php   → acciones extra de usuario (updateConfig)
  middle/resources/schemas/user.json          → schema CRUD del recurso user
  middle/routes/auth.php                      → rutas /api/auth/*
  middle/routes/user.php                      → rutas extra /api/user/*
  middle/routes/sessions.php                  → rutas /api/sessions/*

FLUJO DE LOGIN:
  1. POST /api/auth/login → AuthHandler::login()
  2. Valida credenciales contra tabla users (user o email + bcrypt)
  3. Genera token de 64 chars via ogUtils::token()
  4. Guarda sesión en storage/sessions/{expires}_{userId}_{token16}.json
  5. Retorna token + datos del usuario (sin password)

FLUJO DE REQUEST AUTENTICADA:
  1. ogAuthMiddleware extrae Bearer token del header Authorization
  2. Busca archivo de sesión por primeros 16 chars del token
  3. Verifica expiración
  4. Inyecta $GLOBALS['auth_user_id'] y ogCache::memory('auth_user_id')

SESIONES (via ogCache config 'session'):
  Archivo: {expires}_{userId}_{token16}.json
  Ejemplo: 1767200468_3_3f1101d2254c65f5.json
  TTL: OG_SESSION_TTL (default: 1 día)
  Limpieza: ogApp()->helper('cache')::cleanup('session')
           o DELETE /api/sessions/cleanup

ENDPOINTS AUTH:
  POST /api/auth/login    → login [json, throttle:10,1]
  POST /api/auth/logout   → logout [auth]
  GET  /api/auth/profile  → perfil usuario autenticado [auth]
  GET  /api/auth/me       → alias de profile [auth]

ENDPOINTS SESIONES:
  GET    /api/sessions              → listar sesiones activas y expiradas [auth]
  GET    /api/sessions/stats        → estadísticas de sesiones [auth]
  GET    /api/sessions/user/{id}    → sesiones de un usuario [auth]
  DELETE /api/sessions/cleanup      → limpiar sesiones expiradas [auth]
  DELETE /api/sessions/user/{id}    → invalidar sesiones de un usuario

ENDPOINTS USER (CRUD automático via user.json):
  GET    /api/user         → listar usuarios [auth, throttle:100,1]
  GET    /api/user/{id}    → ver usuario [auth]
  POST   /api/user         → crear usuario [json, throttle:100,1]
  PUT    /api/user/{id}    → actualizar usuario [auth, json]
  DELETE /api/user/{id}    → eliminar usuario [auth]
  PUT    /api/user/{id}/config → actualizar config [auth, json]
```

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleresourceshandlersUserHandler.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleresourcescontrollersUserController.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddlehelpersogLogReader.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleroutesauth.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleroutesuser.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleroutessessions.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendmiddleroutescleanup.php` — sin bloque `@doc-start`/`@doc-end`
