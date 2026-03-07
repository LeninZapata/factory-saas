<?php
// Raw Expression - Wrapper para SQL crudo sin escapar
class ogRawExpr {
  protected $expr;
  function __construct($expr) { $this->expr = $expr; }
  function __toString() { return $this->expr; }
}