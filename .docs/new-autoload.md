# 🎯 Guía Simple: Carga Bajo Demanda

## ✅ Regla Simple

**Usa `ogApp()->helper('nombre')` para cualquier helper que no esté pre-cargado**

---

## 📋 Pre-Cargados (Uso Directo)

```php
ogResponse::success($data);
ogRequest::data();
ogLog::error('mensaje');
ogDb::table('users')->get();
ogLang::get('key');  // o __('key')
```

**NO necesitan cargarse**, están siempre disponibles.

---

## 🔄 Carga Bajo Demanda (Via ogApp)

```php
// ✅ SIEMPRE usa ogApp()->helper()
$cache = ogApp()->helper('cache');
$cache->get('key');

$validator = ogApp()->helper('validation');
$validator->email($email);

$file = ogApp()->helper('file');
$file->read($path);

$http = ogApp()->helper('http');
$http->get($url);

$str = ogApp()->helper('str');
$str->normalize($text);
```

**Ventajas:**
- ✅ Se carga automáticamente si no existe
- ✅ Se cachea en memoria (no se carga 2 veces)
- ✅ No importa desde dónde lo llames
- ✅ Código más limpio

---

## 💡 Ejemplos Prácticos

### **Controller**
```php
class UserController extends ogController {
  function create() {
    // Pre-cargado
    $data = ogRequest::data();
    
    // Bajo demanda
    $validator = ogApp()->helper('validation');
    if (!$validator->email($data['email'])) {
      ogResponse::error('Email inválido');
    }
    
    // Pre-cargado
    $id = ogDb::table('users')->insert($data);
    ogResponse::success(['id' => $id]);
  }
}
```

### **Middleware**
```php
class ogAuthMiddleware {
  private function validatePhpVersion() {
    // Bajo demanda
    $cache = ogApp()->helper('cache');
    
    $isValid = $cache->remember('php_version_check', function() {
      return version_compare(PHP_VERSION, '8.1.0', '>=');
    });
    
    if (!$isValid) {
      // Pre-cargado
      ogResponse::error('PHP 8.1+ required', 500);
      return false;
    }
    
    return true;
  }
}
```

### **Service**
```php
class ogEmailService {
  function send($to, $subject, $body) {
    // Bajo demanda
    $http = ogApp()->helper('http');
    $response = $http->post('https://api.email.com/send', [
      'to' => $to,
      'subject' => $subject,
      'body' => $body
    ]);
    
    // Pre-cargado
    ogLog::info('Email sent', ['to' => $to]);
    
    return $response;
  }
}
```

---

## 📊 Tabla de Referencia

| Helper | Pre-Cargado | Cómo Usar |
|--------|-------------|-----------|
| ogResponse | ✅ | `ogResponse::success()` |
| ogRequest | ✅ | `ogRequest::data()` |
| ogLog | ✅ | `ogLog::error()` |
| ogDb | ✅ | `ogDb::table()` |
| ogLang | ✅ | `__('key')` |
| **ogCache** | ❌ | `ogApp()->helper('cache')` |
| **ogValidation** | ❌ | `ogApp()->helper('validation')` |
| **ogFile** | ❌ | `ogApp()->helper('file')` |
| **ogHttp** | ❌ | `ogApp()->helper('http')` |
| **ogStr** | ❌ | `ogApp()->helper('str')` |
| **ogUtils** | ❌ | `ogApp()->helper('utils')` |
| **ogUrl** | ❌ | `ogApp()->helper('url')` |
| **ogCountry** | ❌ | `ogApp()->helper('country')` |

---

## ⚠️ Error Común

```php
// ❌ ERROR: Class "ogCache" not found
$data = ogCache::get('key');

// ✅ CORRECTO
$cache = ogApp()->helper('cache');
$data = $cache->get('key');
```

---

## 🎯 Resumen

1. **Pre-cargados**: Usa directo (`ogResponse`, `ogRequest`, `ogLog`, `ogDb`, `ogLang`)
2. **Todo lo demás**: Usa `ogApp()->helper('nombre')`
3. **Siempre limpio**: No importa desde dónde llames `ogApp()->helper()`, funciona igual

**Una regla simple, código limpio.** ✨