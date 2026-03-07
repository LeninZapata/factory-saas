<?php
// Trait de ejecución (lectura, escritura, debugging, transacciones)
trait ogDbExecute {

  // Lectura
  function get() {
    [$sql, $binds] = $this->compileSelect();
    return $this->exec($sql, $binds)->fetchAll();
  }

  function first() {
    $res = $this->limit(1)->get();
    return $res[0] ?? null;
  }

  function find($id) {
    return $this->where('id', $id)->first();
  }

  function count() {
    $i = clone $this;
    $i->columns = ['COUNT(*) as count'];
    $res = $i->first();
    return (int)($res['count'] ?? 0);
  }

  function exists() {
    return $this->count() > 0;
  }

  function pluck($col) {
    return array_column($this->select([$col])->get(), $col);
  }

  function value($col) {
    $res = $this->select([$col])->first();
    return $res[$col] ?? null;
  }

  function chunk($size, $callback) {
    $page = 1;
    do {
      $res = $this->paginate($page++, $size)->get();
      if (empty($res)) break;
      if ($callback($res) === false) break;
    } while (count($res) === $size);
  }

  // Escritura
  function insert($vals) {
    return is_array(reset($vals)) ? $this->insertBatch($vals) : $this->insertSingle($vals);
  }

  protected function insertSingle($vals) {
    $cols   = array_keys($vals);
    $places = array_fill(0, count($cols), '?');
    $sql    = sprintf("INSERT INTO `%s` (`%s`) VALUES (%s)",
      $this->table, implode('`, `', $cols), implode(', ', $places));
    $this->exec($sql, array_values($vals));
    return $this->conn->lastInsertId();
  }

  protected function insertBatch($recs) {
    if (empty($recs)) return 0;
    $cols = array_keys($recs[0]);
    $vals = [];
    $rows = [];
    foreach ($recs as $rec) {
      $rows[] = '(' . implode(', ', array_fill(0, count($cols), '?')) . ')';
      $vals   = array_merge($vals, array_values($rec));
    }
    $sql = sprintf("INSERT INTO `%s` (`%s`) VALUES %s",
      $this->table, implode('`, `', $cols), implode(', ', $rows));
    return $this->exec($sql, $vals)->rowCount();
  }

  function update($vals) {
    $sets  = [];
    $binds = [];
    foreach ($vals as $col => $val) {
      if ($val instanceof ogRawExpr) {
        $sets[] = "`$col` = $val";
      } else {
        $sets[]  = "`$col` = ?";
        $binds[] = $val;
      }
    }
    [$whereSql, $whereBinds] = $this->compileWheres();
    $binds = array_merge($binds, $whereBinds);
    $sql   = "UPDATE `{$this->table}` SET " . implode(', ', $sets);
    if ($whereSql) $sql .= " WHERE $whereSql";
    return $this->exec($sql, $binds)->rowCount();
  }

  function delete() {
    [$whereSql, $binds] = $this->compileWheres();
    $sql = "DELETE FROM `{$this->table}`";
    if ($whereSql) $sql .= " WHERE $whereSql";
    return $this->exec($sql, $binds)->rowCount();
  }

  // Raw SQL directo
  function raw($sql, $binds = []) {
    return $this->exec($sql, $binds)->fetchAll();
  }

  // Debugging
  function toSql() {
    [$sql] = $this->compileSelect();
    return $sql;
  }

  function getSql() {
    [$sql, $binds] = $this->compileSelect();
    foreach ($binds as $val) {
      $r   = is_null($val) ? 'NULL' : (is_numeric($val) ? $val : "'" . addslashes($val) . "'");
      $sql = preg_replace('/\?/', $r, $sql, 1);
    }
    return $sql;
  }

  // Ejecutar query PDO
  protected function exec($sql, $binds = []) {
    try {
      if (OG_IS_DEV) {
        $interpolated = $sql;
        foreach ($binds as $val) {
          if (is_array($val) || is_object($val)) $val = json_encode($val, JSON_UNESCAPED_UNICODE);
          $r            = is_null($val) ? 'NULL' : (is_numeric($val) ? $val : "'" . addslashes($val) . "'");
          $interpolated = preg_replace('/\?/', $r, $interpolated, 1);
        }
      }
      $stmt = $this->conn->prepare($sql);
      $stmt->execute($binds);
      return $stmt;
    } catch (PDOException $e) {
      throw new Exception("SQL Error: {$e->getMessage()} | Query: $sql");
    }
  }

  // Transacciones
  function transaction($callback) {
    $this->conn->beginTransaction();
    try {
      $res = $callback($this);
      $this->conn->commit();
      return $res;
    } catch (Exception $e) {
      $this->conn->rollBack();
      throw $e;
    }
  }

  function getConnection() {
    return $this->conn;
  }
}