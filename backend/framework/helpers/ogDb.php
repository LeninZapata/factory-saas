<?php
// Cargar clases dependientes
require_once __DIR__ . '/ogDb/ogRawExpr.php';
require_once __DIR__ . '/ogDb/ogDbBuilder.php';

// DB - Entry point estático del query builder
class ogDb {
  protected static $instance = null;
  protected static $config = [];
  protected static $tables = [];

  // Configurar conexión
  static function setConfig($config) {
    self::$config = $config;
    self::$instance = null; // Reset para reconectar
  }

  // Configurar alias de tablas
  static function setTables($tables) {
    self::$tables = $tables;
  }

  // Shortcut: ogDb::t('users') en lugar de ogDb::table('prefix_users')
  static function t($key, $returnName = false) {
    $tableName = self::$tables[$key] ?? $key;
    return $returnName ? $tableName : self::table($tableName);
  }

  // Inicializar conexión PDO (singleton)
  protected static function init() {
    if (!self::$instance) {
      if (empty(self::$config)) {
        throw new Exception('Database config not set. Call ogDb::setConfig() first.');
      }
      self::$instance = new ogDbBuilder(
        self::$config['host'],
        self::$config['name'],
        self::$config['user'],
        self::$config['pass']
      );
    }
    return self::$instance;
  }

  // Punto de entrada principal
  static function table($table) {
    return self::init()->table($table);
  }

  // Raw SQL
  // $bindings = null  → retorna ogRawExpr (para usar como valor en UPDATE/INSERT)
  // $bindings = []    → ejecuta query y retorna resultados
  static function raw($sql, $bindings = null) {
    return is_null($bindings) ? new ogRawExpr($sql) : self::init()->raw($sql, $bindings);
  }
}

/**
 * @doc-start
 * FILE: framework/helpers/ogDb.php
 * ROLE: Entry point estático del query builder. Gestiona la conexión PDO (singleton)
 *       y expone los métodos de acceso a la base de datos.
 *       La lógica está separada en helpers/ogDb/:
 *       - ogDbBuilder.php → construcción y ejecución de queries
 *       - ogRawExpr.php   → wrapper para expresiones SQL crudas
 *
 * CONFIGURACIÓN (en app/config/database.php):
 *   ogDb::setConfig(['host'=>'', 'name'=>'', 'user'=>'', 'pass'=>'']);
 *   ogDb::setTables(['users' => 'prefix_users']); // alias de tablas (opcional)
 *
 * ACCESO PRINCIPAL:
 *   ogDb::table('users')       → inicia query builder sobre tabla
 *   ogDb::t('users')           → igual pero usando alias configurado en setTables()
 *   ogDb::t('users', true)     → retorna solo el nombre de la tabla (sin query builder)
 *
 * QUERY BUILDER (métodos encadenables):
 *   ->select(['id', 'name'])
 *   ->distinct()
 *   ->where('status', 'active')
 *   ->where('age', '>', 18)
 *   ->orWhere('role', 'admin')
 *   ->whereIn('id', [1,2,3])
 *   ->whereNotIn('id', [4,5])
 *   ->whereNull('deleted_at')
 *   ->whereNotNull('email')
 *   ->whereBetween('created_at', ['2025-01-01', '2025-12-31'])
 *   ->whereFilters($array)     → filtros dinámicos desde array (soporta IN, LIKE, BETWEEN...)
 *   ->join('orders', 'users.id', '=', 'orders.user_id')
 *   ->leftJoin('orders', 'users.id', 'orders.user_id')
 *   ->orderBy('created_at', 'DESC')
 *   ->groupBy('status')
 *   ->having('total', '>', 100)
 *   ->limit(10)->offset(20)
 *   ->paginate($page, $perPage)
 *
 * EJECUCIÓN:
 *   ->get()           → array de resultados
 *   ->first()         → primer resultado o null
 *   ->find($id)       → buscar por id
 *   ->count()         → total de registros
 *   ->exists()        → bool
 *   ->pluck('name')   → array de valores de una columna
 *   ->value('name')   → valor de una columna del primer resultado
 *   ->chunk(100, fn)  → procesar en lotes (callback retorna false para detener)
 *
 * ESCRITURA:
 *   ->insert(['name' => 'Juan'])              → retorna lastInsertId
 *   ->insert([['name'=>'A'], ['name'=>'B']])  → insert batch, retorna rowCount
 *   ->update(['name' => 'Juan'])              → retorna rowCount
 *   ->delete()                               → retorna rowCount
 *
 * RAW SQL:
 *   ogDb::raw('NOW()')                        → ogRawExpr (para usar en insert/update)
 *   ogDb::raw('SELECT * FROM users', [])      → ejecuta query, retorna array
 *   ->update(['updated_at' => ogDb::raw('NOW()')])
 *
 * TRANSACCIONES:
 *   ogDb::table('users')->transaction(function($db) {
 *     $db->table('users')->insert([...]);
 *     $db->table('orders')->insert([...]);
 *   });
 *
 * DEBUGGING:
 *   ->toSql()   → SQL sin valores interpolados
 *   ->getSql()  → SQL con valores interpolados (solo dev)
 *
 * ESTILO DE ESCRITURA:
 *   Inline cuando hay 1 o 2 where (query simple):
 *     $res = ogDb::t('assets')->where('product_id', $id)->get();
 *     $res = ogDb::t('assets')->where('product_id', $id)->where('status', 1)->first();
 *   Multilínea cuando hay 3 o más where:
 *     $res = ogDb::t('assets')
 *       ->where('product_id', $id)
 *       ->where('status', 1)
 *       ->where('is_active', 1)
 *       ->get();
 *
 * NOTAS:
 *   - Conexión PDO singleton (se resetea al llamar setConfig())
 *   - Columnas con prefijo '_' son ignoradas en where() (ej: _delay, _debug)
 *   - En OG_IS_DEV el exec() interpola valores para facilitar debugging
 * @doc-end
 */