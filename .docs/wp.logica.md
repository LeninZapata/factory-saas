# 🔍 Uso del Flag isWordPress

## ✅ Actualización en ogApp

**ogApp ahora acepta tercer parámetro:**
```php
ogApp($pluginName, $pluginPath, $isWordPress)
```

---

## 📋 Ejemplos de Uso

### **1. En Controllers/Handlers**

```php
class AuthHandler {
  static function login($params) {
    // Verificar si es WordPress
    if (ogApp()->isWordPress()) {
      // Auth de WordPress
      return self::loginWordPress($params);
    } else {
      // Auth standalone (sesiones en archivos)
      return self::loginStandalone($params);
    }
  }

  private static function loginWordPress($params) {
    $data = ogRequest::data();
    
    // Usar wp_authenticate()
    $user = wp_authenticate($data['user'], $data['pass']);
    
    if (is_wp_error($user)) {
      return ['success' => false, 'error' => $user->get_error_message()];
    }
    
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID);
    
    return [
      'success' => true,
      'user' => [
        'id' => $user->ID,
        'name' => $user->display_name,
        'email' => $user->user_email
      ]
    ];
  }

  private static function loginStandalone($params) {
    $data = ogRequest::data();
    
    // Buscar en base de datos custom
    $user = ogDb::table('users')
      ->where('user', $data['user'])
      ->first();
    
    if (!$user || !password_verify($data['pass'], $user['pass'])) {
      return ['success' => false, 'error' => __('auth.invalid')];
    }
    
    // Crear sesión en archivos
    $utils = ogApp()->helper('utils');
    $token = $utils->token(64);
    self::saveSession($user, $token);
    
    return [
      'success' => true,
      'user' => $user,
      'token' => $token
    ];
  }
}
```

### **2. En Middleware**

```php
class ogAuthMiddleware {
  function handle() {
    if (ogApp()->isWordPress()) {
      // Verificar con WordPress
      return $this->handleWordPress();
    } else {
      // Verificar con tokens
      return $this->handleStandalone();
    }
  }

  private function handleWordPress() {
    if (!is_user_logged_in()) {
      ogResponse::unauthorized(__('auth.not_logged_in'));
      return false;
    }
    
    $user = wp_get_current_user();
    $GLOBALS['auth_user_id'] = $user->ID;
    $GLOBALS['auth_user'] = [
      'id' => $user->ID,
      'name' => $user->display_name,
      'email' => $user->user_email
    ];
    
    return true;
  }

  private function handleStandalone() {
    $token = $this->getToken();
    
    if (!$token) {
      ogResponse::unauthorized(__('auth.token_missing'));
      return false;
    }
    
    $session = $this->getSessionFromToken($token);
    
    if (!$session) {
      ogResponse::unauthorized(__('auth.token_invalid'));
      return false;
    }
    
    $GLOBALS['auth_user_id'] = $session['user_id'];
    $GLOBALS['auth_user'] = $session['user'];
    
    return true;
  }
}
```

### **3. En Servicios**

```php
class ogStorageService {
  function upload($file) {
    if (ogApp()->isWordPress()) {
      // Usar WordPress Media Library
      return $this->uploadToWordPress($file);
    } else {
      // Usar storage local o cloud
      return $this->uploadToLocal($file);
    }
  }

  private function uploadToWordPress($file) {
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    $attachment_id = media_handle_upload('file', 0);
    
    if (is_wp_error($attachment_id)) {
      return ['success' => false, 'error' => $attachment_id->get_error_message()];
    }
    
    return [
      'success' => true,
      'url' => wp_get_attachment_url($attachment_id),
      'id' => $attachment_id
    ];
  }

  private function uploadToLocal($file) {
    $uploadDir = ogApp()->getPath('storage/uploads');
    // Lógica de upload local...
  }
}
```

### **4. En Configuración**

```php
class ogEmailService {
  function send($to, $subject, $body) {
    if (ogApp()->isWordPress()) {
      // Usar wp_mail()
      $sent = wp_mail($to, $subject, $body);
      
      return [
        'success' => $sent,
        'provider' => 'wordpress'
      ];
    } else {
      // Usar servicio externo (SendGrid, etc)
      $http = ogApp()->helper('http');
      $response = $http->post('https://api.sendgrid.com/v3/mail/send', [
        'to' => $to,
        'subject' => $subject,
        'html' => $body
      ]);
      
      return [
        'success' => $response['status'] === 202,
        'provider' => 'sendgrid'
      ];
    }
  }
}
```

---

## 🎯 Casos de Uso Comunes

| Funcionalidad | WordPress | Standalone |
|---------------|-----------|------------|
| **Auth** | `wp_authenticate()` | Sesiones en archivos |
| **Usuarios** | `wp_get_current_user()` | `ogDb::table('users')` |
| **Storage** | Media Library | Filesystem/S3 |
| **Email** | `wp_mail()` | SendGrid/SMTP |
| **Roles** | `current_user_can()` | Custom permisos |
| **Cache** | `wp_cache_set()` | Archivos/Redis |

---

## 📊 Ejemplo Completo: User Controller

```php
class UserController extends ogController {
  function profile() {
    if (ogApp()->isWordPress()) {
      // WordPress
      $user = wp_get_current_user();
      
      ogResponse::success([
        'id' => $user->ID,
        'name' => $user->display_name,
        'email' => $user->user_email,
        'roles' => $user->roles
      ]);
    } else {
      // Standalone
      $userId = $GLOBALS['auth_user_id'];
      
      $user = ogDb::table('users')
        ->where('id', $userId)
        ->first();
      
      ogResponse::success([
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role']
      ]);
    }
  }

  function update() {
    $data = ogRequest::data();
    
    if (ogApp()->isWordPress()) {
      // WordPress
      $user_id = get_current_user_id();
      
      wp_update_user([
        'ID' => $user_id,
        'display_name' => $data['name'],
        'user_email' => $data['email']
      ]);
      
      ogResponse::success(['message' => 'Usuario actualizado']);
    } else {
      // Standalone
      $userId = $GLOBALS['auth_user_id'];
      
      ogDb::table('users')
        ->where('id', $userId)
        ->update([
          'name' => $data['name'],
          'email' => $data['email']
        ]);
      
      ogResponse::success(['message' => 'Usuario actualizado']);
    }
  }
}
```

---

## ✅ Resumen

```php
// Registrar (en bootstrap.php)
ogApp($pluginName, $appPath, $isWordPress);

// Verificar (en cualquier código)
if (ogApp()->isWordPress()) {
  // Lógica WordPress
} else {
  // Lógica standalone
}

// También funciona con instancias específicas
if (ogApp('factory-saas')->isWordPress()) {
  // ...
}
```

**Mismo código, comportamiento diferente según el entorno.** 🎯