<?php
$router->group('/api/logs', function($router) {

  $middleware = OG_IS_DEV ? [] : ['auth'];

  // Obtener logs del día actual
  $router->get('/today', function() {
    $limit = (int) ogRequest::query('limit', 100);
    $logs = ogApp()->helper('logReader')->today($limit);

    // Aplicar filtros
    $logs = applyLogFilters($logs);

    ogResponse::success([
      'logs' => $logs,
      'count' => count($logs),
      'date' => date('Y-m-d')
    ]);
  })->middleware($middleware);

  // Obtener los últimos logs registrados
  $router->get(['/latest','','/'], function() {
    $limit = (int) ogRequest::query('limit', 50);
    $logs = ogApp()->helper('logReader')->latest($limit);

    $logs = applyLogFilters($logs);

    ogResponse::success([
      'logs' => $logs,
      'count' => count($logs)
    ]);
  })->middleware($middleware);

  // Obtener logs de una fecha específica
  $router->get('/{year}/{month}/{day}', function($year, $month, $day) {
    $files = ogApp()->helper('logReader')->find([
      'year' => $year,
      'month' => str_pad($month, 2, '0', STR_PAD_LEFT),
      'day' => str_pad($day, 2, '0', STR_PAD_LEFT)
    ]);

    if (empty($files)) {
      ogResponse::success([
        'logs' => [],
        'count' => 0,
        'message' => __('logs.not_found_date')
      ]);
      return;
    }

    $allLogs = [];
    foreach ($files as $file) {
      $logs = ogApp()->helper('logReader')->parse($file);
      $allLogs = array_merge($allLogs, $logs);
    }

    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    $allLogs = applyLogFilters($allLogs);

    $limit = (int) ogRequest::query('limit', 1000);
    $allLogs = array_slice($allLogs, 0, $limit);

    ogResponse::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'date' => "$year-$month-$day",
      'files' => array_map('basename', $files)
    ]);
  })->middleware($middleware);

  // Obtener logs de un mes completo
  $router->get('/{year}/{month}', function($year, $month) {
    $files = ogApp()->helper('logReader')->find([
      'year' => $year,
      'month' => str_pad($month, 2, '0', STR_PAD_LEFT)
    ]);

    if (empty($files)) {
      ogResponse::success([
        'logs' => [],
        'count' => 0,
        'message' => __('logs.not_found_month')
      ]);
      return;
    }

    $allLogs = [];
    foreach ($files as $file) {
      $logs = ogApp()->helper('logReader')->parse($file);
      $allLogs = array_merge($allLogs, $logs);
    }

    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    $allLogs = applyLogFilters($allLogs);

    $limit = (int) ogRequest::query('limit', 1000);
    $allLogs = array_slice($allLogs, 0, $limit);

    ogResponse::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'month' => "$year-$month",
      'files' => count($files)
    ]);
  })->middleware($middleware);

  // Buscar logs con filtros y rango de fechas
  $router->get('/search', function() {
    $from = ogRequest::query('from');
    $to = ogRequest::query('to');
    $limit = (int) ogRequest::query('limit', 500);

    if (!$from) {
      $from = date('Y-m-d', strtotime('-7 days'));
    }
    if (!$to) {
      $to = date('Y-m-d');
    }

    $allLogs = ogApp()->helper('logReader')->range($from, $to, 0);

    $allLogs = applyLogFilters($allLogs);

    $allLogs = array_slice($allLogs, 0, $limit);

    ogResponse::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'range' => ['from' => $from, 'to' => $to]
    ]);
  })->middleware($middleware);

  // Obtener estadísticas de logs del sistema
  $router->get('/stats', function() {
    $logs = ogLogReader::today(0);

    $logs = applyLogFilters($logs);

    $stats = ogApp()->helper('logReader')->stats($logs);
    $stats['date'] = date('Y-m-d');

    ogResponse::success($stats);
  })->middleware($middleware);
});

/**
 * Aplicar filtros desde query params
 *
 * Filtros soportados:
 * - level: Nivel del log
 * - module: Módulo específico
 * - tags: Tags (string o array separado por comas)
 * - search: Búsqueda en mensaje o contexto
 * - [custom_var]: number, bot_id, user_id, etc.
 */
function applyLogFilters($logs) {
  $filters = [];

  // Filtro por nivel
  if ($level = ogRequest::query('level')) {
    $filters['level'] = $level;
  }

  // Filtro por módulo
  if ($module = ogRequest::query('module')) {
    $filters['module'] = $module;
  }

  // Filtro por TAGS
  if ($tags = ogRequest::query('tags')) {
    $filters['tags'] = is_array($tags) ? $tags : explode(',', $tags);
  }

  // Búsqueda en mensaje
  if ($search = ogRequest::query('search')) {
    $filters['search'] = $search;
  }

  // Filtros por CUSTOM VARS (number, bot_id, user_id, etc.)
  $standardParams = ['limit', 'level', 'module', 'tags', 'search', 'from', 'to', 'page', 'per_page'];

  foreach ($_GET as $key => $value) {
    if (!in_array($key, $standardParams)) {
      $filters[$key] = $value;
    }
  }

  if (empty($filters)) {
    return $logs;
  }

  return ogApp()->helper('logReader')->filter($logs, $filters);
}

/**
 * @doc-start
 * FILE: framework/routes/logs.php
 * ROLE: Endpoints de consulta y filtrado de logs del sistema.
 *       Lógica de lectura delegada a helper logReader.
 *       En producción todos los endpoints requieren middleware 'auth'.
 *
 * ENDPOINTS:
 *   GET /api/logs/today              → logs de hoy (default: 100)
 *   GET /api/logs/latest             → últimos N logs (default: 50)
 *   GET /api/logs/{year}/{month}     → logs de un mes completo
 *   GET /api/logs/{year}/{month}/{day} → logs de una fecha específica
 *   GET /api/logs/search             → búsqueda con rango de fechas
 *     ?from=2025-12-01&to=2025-12-10 → rango (default: últimos 7 días)
 *   GET /api/logs/stats              → estadísticas de logs de hoy
 *
 * FILTROS DISPONIBLES (todos los endpoints):
 *   ?level=ERROR                     → DEBUG, INFO, WARNING, ERROR
 *   ?module=integrations/whatsapp    → módulo específico
 *   ?tags=whatsapp,error             → tags separados por coma
 *   ?search=login                    → busca en mensaje y contexto
 *   ?user_id=5                       → filtrar por usuario
 *   ?limit=100                       → límite de resultados
 *   ?number=593987654321             → custom var: número de teléfono
 *   ?bot_id=10                       → custom var: ID de bot
 *   ?client_id=3                     → custom var: ID de cliente
 *   ?[custom_var]=valor              → cualquier custom var registrada en el log
 *
 * EJEMPLOS COMBINADOS:
 *   GET /api/logs/today?module=integrations/whatsapp&number=593987654321&tags=error
 *   GET /api/logs/search?bot_id=10&level=ERROR&from=2025-12-01&to=2025-12-08
 *   GET /api/logs/2025/12/08?tags=whatsapp,telegram&level=WARNING
 *   GET /api/logs/today?user_id=5&level=INFO
 * @doc-end
 */