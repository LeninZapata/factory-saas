<?php
// API.PHP - Entry Point
ob_start();

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Cargar bootstrap (maneja todo)
require_once __DIR__ . '/bootstrap.php';

// Ejecutar aplicación
$app = new ogApplication();
$app->run();