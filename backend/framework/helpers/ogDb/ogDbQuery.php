<?php
// Trait de construcción de query (select, joins, order, group, limit, paginación)
trait ogDbQuery {

  function select($cols = ['*']) {
    $i = clone $this;
    $i->columns = is_array($cols) ? $cols : func_get_args();
    return $i;
  }

  function distinct() {
    $i = clone $this;
    $i->distinct = true;
    return $i;
  }

  // Joins
  function join($table, $first, $op = null, $second = null, $type = 'INNER') {
    $i = clone $this;
    if ($op === null) { $op = '='; $second = $first; }
    $i->joins[] = compact('type', 'table', 'first', 'op', 'second');
    return $i;
  }

  function leftJoin($table, $first, $op = null, $second = null) {
    return $this->join($table, $first, $op, $second, 'LEFT');
  }

  function rightJoin($table, $first, $op = null, $second = null) {
    return $this->join($table, $first, $op, $second, 'RIGHT');
  }

  // Order, Group, Having
  function orderBy($col, $dir = 'ASC') {
    $i = clone $this;
    $i->orders[] = ['column' => $col, 'direction' => strtoupper($dir)];
    return $i;
  }

  function groupBy(...$cols) {
    $i = clone $this;
    $flattened = [];
    foreach ($cols as $col) {
      $flattened = array_merge($flattened, is_array($col) ? $col : [$col]);
    }
    $i->groups = array_merge($i->groups, $flattened);
    return $i;
  }

  function having($col, $op, $val) {
    $i = clone $this;
    $i->havings[] = compact('col', 'op', 'val');
    return $i;
  }

  // Limit, Offset
  function limit($limit)   { $i = clone $this; $i->limit  = $limit;  return $i; }
  function offset($offset) { $i = clone $this; $i->offset = $offset; return $i; }
  function take($n)        { return $this->limit($n); }
  function skip($n)        { return $this->offset($n); }

  function paginate($page = 1, $perPage = 15) {
    return $this->offset(($page - 1) * $perPage)->limit($perPage);
  }

  // Compilar SELECT completo
  protected function compileSelect() {
    $sql = $this->distinct ? 'SELECT DISTINCT ' : 'SELECT ';
    $sql .= $this->columns === ['*'] ? '*' : implode(', ', $this->columns);
    $sql .= " FROM {$this->table}";

    foreach ($this->joins as $j) {
      $first  = $this->formatJoinColumn($j['first']);
      $second = $this->formatJoinColumn($j['second']);
      $sql   .= " {$j['type']} JOIN `{$j['table']}` ON {$first} {$j['op']} {$second}";
    }

    [$whereSql, $binds] = $this->compileWheres();
    if ($whereSql) $sql .= " WHERE $whereSql";

    if ($this->groups) $sql .= ' GROUP BY ' . implode(', ', $this->groups);

    if ($this->havings) {
      $havs = [];
      foreach ($this->havings as $h) {
        $havs[]  = "`{$h['col']}` {$h['op']} ?";
        $binds[] = $h['val'];
      }
      $sql .= ' HAVING ' . implode(' AND ', $havs);
    }

    if ($this->orders) {
      $ords = array_map(fn($o) => "{$o['column']} {$o['direction']}", $this->orders);
      $sql .= ' ORDER BY ' . implode(', ', $ords);
    }

    if ($this->limit) {
      $sql .= " LIMIT {$this->limit}";
      if ($this->offset) $sql .= " OFFSET {$this->offset}";
    }

    return [$sql, $binds];
  }

  // Formatear columna en JOINs (tabla.columna → `tabla`.`columna`)
  protected function formatJoinColumn($column) {
    if ($column instanceof ogRawExpr) return (string)$column;
    if (strpos($column, '`') !== false) return $column;
    if (strpos($column, '.') !== false) {
      [$t, $c] = explode('.', $column, 2);
      return "`{$t}`.`{$c}`";
    }
    return "`{$this->table}`.`{$column}`";
  }

  // Formatear nombre de columna simple (agrega backticks si es necesario)
  protected function formatColumnName($column) {
    if ($column instanceof ogRawExpr) return (string)$column;
    if (strpos($column, '`') !== false ||
        strpos($column, '(') !== false ||
        strpos($column, '.') !== false) {
      return $column;
    }
    return "`{$column}`";
  }
}