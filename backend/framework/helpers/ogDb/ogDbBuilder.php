<?php
// Cargar traits
require_once __DIR__ . '/ogDbWhere.php';
require_once __DIR__ . '/ogDbQuery.php';
require_once __DIR__ . '/ogDbExecute.php';

// Query Builder - Clase base que compone los traits
class ogDbBuilder {
  use ogDbWhere, ogDbQuery, ogDbExecute;

  protected $conn;
  protected $table;
  protected $columns  = ['*'];
  protected $wheres   = [];
  protected $joins    = [];
  protected $orders   = [];
  protected $groups   = [];
  protected $havings  = [];
  protected $limit;
  protected $offset;
  protected $distinct = false;

  function __construct($host, $db, $user, $pass) {
    try {
      $this->conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false
      ]);
    } catch (PDOException $e) {
      throw new Exception("DB Error: " . $e->getMessage());
    }
  }

  function table($table) {
    $i = clone $this;
    $i->table = $table;
    return $i;
  }
}