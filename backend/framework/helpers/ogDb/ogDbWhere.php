<?php
// Trait de condiciones WHERE
trait ogDbWhere {

  function where($col, $op = null, $val = null, $bool = 'AND') {
    $i = clone $this;
    if (is_array($col)) {
      foreach ($col as $k => $v) $i = $i->where($k, '=', $v);
      return $i;
    }

    // Ignorar columnas con prefijo "_" (parámetros de sistema: _delay, _debug, etc.)
    if (is_string($col) && str_starts_with($col, '_')) return $i;

    if ($val === null) { $val = $op; $op = '='; }

    $i->wheres[] = [
      'type' => 'basic',
      'column' => $col,
      'operator' => $op,
      'value' => $val,
      'boolean' => $bool
    ];
    return $i;
  }

  function orWhere($col, $op = null, $val = null) {
    return $this->where($col, $op, $val, 'OR');
  }

  function whereIn($col, $vals, $bool = 'AND') {
    $i = clone $this;
    $i->wheres[] = ['type' => 'in', 'column' => $col, 'values' => $vals, 'boolean' => $bool];
    return $i;
  }

  function whereNotIn($col, $vals) {
    $i = clone $this;
    $i->wheres[] = ['type' => 'notIn', 'column' => $col, 'values' => $vals, 'boolean' => 'AND'];
    return $i;
  }

  function whereNull($col) {
    $i = clone $this;
    $i->wheres[] = ['type' => 'null', 'column' => $col, 'boolean' => 'AND'];
    return $i;
  }

  function whereNotNull($col) {
    $i = clone $this;
    $i->wheres[] = ['type' => 'notNull', 'column' => $col, 'boolean' => 'AND'];
    return $i;
  }

  function whereBetween($col, $vals) {
    $i = clone $this;
    $i->wheres[] = ['type' => 'between', 'column' => $col, 'values' => $vals, 'boolean' => 'AND'];
    return $i;
  }

  // Filtros dinámicos desde array
  // Formato simple:  ['status' => 'active']
  // Formato extendido: [['campo', 'operador', 'valor']]
  // Operadores soportados: =, >, <, >=, <=, LIKE, IN, NOT IN, NULL, NOT NULL, BETWEEN
  function whereFilters($filters, $bool = 'AND') {
    $i = clone $this;
    if (empty($filters)) return $i;

    foreach ($filters as $k => $f) {
      if (is_string($k)) {
        $i = $i->where($k, '=', $f, $bool);
      } elseif (is_array($f) && count($f) >= 2) {
        $campo = $f[0];
        $op    = count($f) === 2 ? '=' : strtoupper(trim($f[1]));
        $val   = count($f) === 2 ? $f[1] : ($f[2] ?? null);

        switch ($op) {
          case 'IN':       if (is_array($val)) $i = $i->whereIn($campo, $val, $bool); break;
          case 'NOT IN':
          case 'NOTIN':    if (is_array($val)) $i = $i->whereNotIn($campo, $val); break;
          case 'NULL':
          case 'IS NULL':  $i = $i->whereNull($campo); break;
          case 'NOT NULL':
          case 'IS NOT NULL':
          case 'NOTNULL':  $i = $i->whereNotNull($campo); break;
          case 'BETWEEN':  if (is_array($val) && count($val) === 2) $i = $i->whereBetween($campo, $val); break;
          case 'LIKE':     $i = $i->where($campo, 'LIKE', $val, $bool); break;
          default:         $i = $i->where($campo, $op, $val, $bool);
        }
      }
    }
    return $i;
  }

  // Compilar WHEREs a SQL
  protected function compileWheres() {
    if (empty($this->wheres)) return ['', []];
    $sql   = [];
    $binds = [];

    foreach ($this->wheres as $idx => $w) {
      $bool   = $idx === 0 ? '' : "{$w['boolean']} ";
      $colName = $this->formatColumnName($w['column']);

      switch ($w['type']) {
        case 'basic':
          $sql[]   = $bool . "{$colName} {$w['operator']} ?";
          $binds[] = $w['value'];
          break;
        case 'in':
          $places  = implode(', ', array_fill(0, count($w['values']), '?'));
          $sql[]   = $bool . "{$colName} IN ($places)";
          $binds   = array_merge($binds, $w['values']);
          break;
        case 'notIn':
          $places  = implode(', ', array_fill(0, count($w['values']), '?'));
          $sql[]   = $bool . "{$colName} NOT IN ($places)";
          $binds   = array_merge($binds, $w['values']);
          break;
        case 'null':
          $sql[]   = $bool . "{$colName} IS NULL";
          break;
        case 'notNull':
          $sql[]   = $bool . "{$colName} IS NOT NULL";
          break;
        case 'between':
          $sql[]   = $bool . "{$colName} BETWEEN ? AND ?";
          $binds[] = $w['values'][0];
          $binds[] = $w['values'][1];
          break;
      }
    }
    return [implode(' ', $sql), $binds];
  }
}