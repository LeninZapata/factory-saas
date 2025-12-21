<?php
// routes/apis/client.php - Rutas custom de client

$router->group('/api/client', function($router) {

  // Eliminar todos los datos de un cliente
  $router->delete('/{id}/all-data', function($id) {
    $result = ClientHandler::deleteAllData(['id' => $id]);
    response::json($result);
  })->middleware(['auth', 'throttle:100,1']);

  // Buscar cliente por número de teléfono
  $router->get('/number/{number}', function($number) {
    $result = ClientHandler::getByNumber(['number' => $number]);
    response::json($result);
  })->middleware(['auth', 'throttle:100,1']);

  // Obtener ranking de mejores clientes por ventas
  $router->get('/top', function() {
    $result = ClientHandler::topClients([]);
    response::json($result);
  })->middleware(['auth', 'throttle:100,1']);
});