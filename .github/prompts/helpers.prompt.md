# Helpers — Parte 1: ogDb

> Query builder ogDb completo (entry point + traits). Ver también: helpers-cache-log.prompt.md y helpers-utils.prompt.md
> Generado: 2026-03-08 14:28:20

---

## Índice de todos los helpers

| Helper       | Archivo prompt                     | Pre-Cargado |
|--------------|-------------------------------------|-------------|
| ogDb         | helpers.prompt.md (este archivo)    | YES         |
| ogCache      | helpers-cache-log.prompt.md         | YES         |
| ogLog        | helpers-cache-log.prompt.md         | YES         |
| ogResponse   | helpers-cache-log.prompt.md         | YES         |
| ogRequest    | helpers-cache-log.prompt.md         | YES         |
| ogLang       | helpers-cache-log.prompt.md         | YES         |
| ogStr        | helpers-utils.prompt.md             | NO          |
| ogUtils      | helpers-utils.prompt.md             | NO          |
| ogFile       | helpers-utils.prompt.md             | NO          |
| ogHttp       | helpers-utils.prompt.md             | NO          |
| ogUrl        | helpers-utils.prompt.md             | NO          |
| ogDate       | helpers-utils.prompt.md             | NO          |
| ogCountry    | helpers-utils.prompt.md             | NO          |
| ogLogic      | helpers-utils.prompt.md             | NO          |
| ogValidation | helpers-utils.prompt.md             | NO          |

---

### `framework/helpers/ogDb.php`

```
FILE: framework/helpers/ogDb.php
ROLE: Entry point estático del query builder. Gestiona la conexión PDO (singleton)
      y expone los métodos de acceso a la base de datos.
      La lógica está separada en helpers/ogDb/:
      - ogDbBuilder.php → construcción y ejecución de queries
      - ogRawExpr.php   → wrapper para expresiones SQL crudas

CONFIGURACIÓN (en app/config/database.php):
  ogDb::setConfig(['host'=>'', 'name'=>'', 'user'=>'', 'pass'=>'']);
  ogDb::setTables(['users' => 'prefix_users']); // alias de tablas (opcional)

ACCESO PRINCIPAL:
  ogDb::table('users')       → inicia query builder sobre tabla
  ogDb::t('users')           → igual pero usando alias configurado en setTables()
  ogDb::t('users', true)     → retorna solo el nombre de la tabla (sin query builder)

QUERY BUILDER (métodos encadenables):
  ->select(['id', 'name'])
  ->distinct()
  ->where('status', 'active')
  ->where('age', '>', 18)
  ->orWhere('role', 'admin')
  ->whereIn('id', [1,2,3])
  ->whereNotIn('id', [4,5])
  ->whereNull('deleted_at')
  ->whereNotNull('email')
  ->whereBetween('created_at', ['2025-01-01', '2025-12-31'])
  ->whereFilters($array)     → filtros dinámicos desde array (soporta IN, LIKE, BETWEEN...)
  ->join('orders', 'users.id', '=', 'orders.user_id')
  ->leftJoin('orders', 'users.id', 'orders.user_id')
  ->orderBy('created_at', 'DESC')
  ->groupBy('status')
  ->having('total', '>', 100)
  ->limit(10)->offset(20)
  ->paginate($page, $perPage)

EJECUCIÓN:
  ->get()           → array de resultados
  ->first()         → primer resultado o null
  ->find($id)       → buscar por id
  ->count()         → total de registros
  ->exists()        → bool
  ->pluck('name')   → array de valores de una columna
  ->value('name')   → valor de una columna del primer resultado
  ->chunk(100, fn)  → procesar en lotes (callback retorna false para detener)

ESCRITURA:
  ->insert(['name' => 'Juan'])              → retorna lastInsertId
  ->insert([['name'=>'A'], ['name'=>'B']])  → insert batch, retorna rowCount
  ->update(['name' => 'Juan'])              → retorna rowCount
  ->delete()                               → retorna rowCount

RAW SQL:
  ogDb::raw('NOW()')                        → ogRawExpr (para usar en insert/update)
  ogDb::raw('SELECT * FROM users', [])      → ejecuta query, retorna array
  ->update(['updated_at' => ogDb::raw('NOW()')])

TRANSACCIONES:
  ogDb::table('users')->transaction(function($db) {
    $db->table('users')->insert([...]);
    $db->table('orders')->insert([...]);
  });

DEBUGGING:
  ->toSql()   → SQL sin valores interpolados
  ->getSql()  → SQL con valores interpolados (solo dev)

ESTILO DE ESCRITURA:
  Inline cuando hay 1 o 2 where (query simple):
    $res = ogDb::t('assets')->where('product_id', $id)->get();
    $res = ogDb::t('assets')->where('product_id', $id)->where('status', 1)->first();
  Multilínea cuando hay 3 o más where:
    $res = ogDb::t('assets')
      ->where('product_id', $id)
      ->where('status', 1)
      ->where('is_active', 1)
      ->get();

NOTAS:
  - Conexión PDO singleton (se resetea al llamar setConfig())
  - Columnas con prefijo '_' son ignoradas en where() (ej: _delay, _debug)
  - En OG_IS_DEV el exec() interpola valores para facilitar debugging
```

> ⚠️ `backend/D:\laragon\www\factory-saasbackendframeworkhelpersogDbogDbBuilder.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendframeworkhelpersogDbogDbWhere.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendframeworkhelpersogDbogDbQuery.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendframeworkhelpersogDbogDbExecute.php` — sin bloque `@doc-start`/`@doc-end`

> ⚠️ `backend/D:\laragon\www\factory-saasbackendframeworkhelpersogDbogRawExpr.php` — sin bloque `@doc-start`/`@doc-end`
