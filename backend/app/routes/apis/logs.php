<?php
/**
 * routes/apis/log.php - Endpoints para consultar logs
 *
 * EJEMPLOS DE USO:
 *
 * 1. Logs de hoy (últimos 100):
 *    GET /api/logs/today
 *    GET /api/logs/today?limit=50
 *
 * 2. Logs de una fecha específica:
 *    GET /api/logs/2025/12/08
 *    GET /api/logs/2025/12/08?module=auth
 *    GET /api/logs/2025/12/08?level=ERROR
 *
 * 3. Últimos logs (sin importar fecha):
 *    GET /api/logs/latest
 *    GET /api/logs/latest?limit=20
 *
 * 4. Buscar por criterios (híbrido):
 *    GET /api/logs/2025/12?module=bot&limit=50
 *    GET /api/logs/2025?level=ERROR
 *
 * 5. Buscar con custom vars:
 *    GET /api/logs/search?bot_id=5&date=2025-12-08
 *    GET /api/logs/search?module=payment&from=2025-12-01&to=2025-12-08
 *
 * QUERY PARAMS DISPONIBLES:
 * - limit: Número máximo de logs (default: 100)
 * - level: Filtrar por nivel (DEBUG, INFO, WARNING, ERROR)
 * - module: Filtrar por módulo
 * - search: Buscar en mensaje o contexto
 * - from: Fecha inicio (YYYY-MM-DD)
 * - to: Fecha fin (YYYY-MM-DD)
 */

$router->group('/api/logs', function($router) {

  // Middleware condicional: solo auth si NO es dev
  $middleware = IS_DEV ? [] : ['auth'];

  // GET /api/logs/today - Logs de hoy
  $router->get('/today', function() {
    $limit = request::query('limit', 100);
    $logs = log::today($limit);

    // Filtros adicionales
    $logs = applyLogFilters($logs);

    response::success([
      'logs' => $logs,
      'count' => count($logs),
      'date' => date('Y-m-d')
    ]);
  })->middleware($middleware);

  // GET /api/logs/latest - Últimos logs
  $router->get('/latest', function() {
    $limit = request::query('limit', 50);
    $logs = log::latest($limit);

    // Filtros adicionales
    $logs = applyLogFilters($logs);

    response::success([
      'logs' => $logs,
      'count' => count($logs)
    ]);
  })->middleware($middleware);

  // GET /api/logs/{year}/{month}/{day} - Logs de fecha específica
  $router->get('/{year}/{month}/{day}', function($year, $month, $day) {
    $files = log::find([
      'year' => $year,
      'month' => str_pad($month, 2, '0', STR_PAD_LEFT),
      'day' => str_pad($day, 2, '0', STR_PAD_LEFT)
    ]);

    if (empty($files)) {
      response::success([
        'logs' => [],
        'count' => 0,
        'message' => 'No logs found for this date'
      ]);
      return;
    }

    // Parsear logs de todos los archivos encontrados
    $allLogs = [];
    foreach ($files as $file) {
      $logs = log::parse($file);
      $allLogs = array_merge($allLogs, $logs);
    }

    // Ordenar por timestamp DESC
    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Filtros adicionales
    $allLogs = applyLogFilters($allLogs);

    // Limitar resultados
    $limit = request::query('limit', 1000);
    $allLogs = array_slice($allLogs, 0, $limit);

    response::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'date' => "$year-$month-$day",
      'files' => array_map('basename', $files)
    ]);
  })->middleware($middleware);

  // GET /api/logs/{year}/{month} - Logs de un mes
  $router->get('/{year}/{month}', function($year, $month) {
    $files = log::find([
      'year' => $year,
      'month' => str_pad($month, 2, '0', STR_PAD_LEFT)
    ]);

    if (empty($files)) {
      response::success([
        'logs' => [],
        'count' => 0,
        'message' => 'No logs found for this month'
      ]);
      return;
    }

    // Parsear logs
    $allLogs = [];
    foreach ($files as $file) {
      $logs = log::parse($file);
      $allLogs = array_merge($allLogs, $logs);
    }

    // Ordenar
    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Filtros
    $allLogs = applyLogFilters($allLogs);

    // Limitar
    $limit = request::query('limit', 1000);
    $allLogs = array_slice($allLogs, 0, $limit);

    response::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'month' => "$year-$month",
      'files' => count($files)
    ]);
  })->middleware($middleware);

  // GET /api/logs/search - Búsqueda avanzada
  $router->get('/search', function() {
    $from = request::query('from'); // YYYY-MM-DD
    $to = request::query('to');     // YYYY-MM-DD
    $limit = request::query('limit', 500);

    // Si no hay fechas, usar últimos 7 días
    if (!$from) {
      $from = date('Y-m-d', strtotime('-7 days'));
    }
    if (!$to) {
      $to = date('Y-m-d');
    }

    // Buscar archivos en el rango de fechas
    $allLogs = [];
    $currentDate = strtotime($from);
    $endDate = strtotime($to);

    while ($currentDate <= $endDate) {
      $date = date('Y-m-d', $currentDate);
      list($year, $month, $day) = explode('-', $date);

      $files = log::find([
        'year' => $year,
        'month' => $month,
        'day' => $day
      ]);

      foreach ($files as $file) {
        $logs = log::parse($file);
        $allLogs = array_merge($allLogs, $logs);
      }

      $currentDate = strtotime('+1 day', $currentDate);
    }

    // Ordenar
    usort($allLogs, function($a, $b) {
      return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Filtros
    $allLogs = applyLogFilters($allLogs);

    // Limitar
    $allLogs = array_slice($allLogs, 0, $limit);

    response::success([
      'logs' => $allLogs,
      'count' => count($allLogs),
      'range' => ['from' => $from, 'to' => $to]
    ]);
  })->middleware($middleware);

  // GET /api/logs/stats - Estadísticas de logs
  $router->get('/stats', function() {
    $logs = log::today(0); // Todos los de hoy

    $stats = [
      'total' => count($logs),
      'by_level' => [],
      'by_module' => [],
      'date' => date('Y-m-d')
    ];

    foreach ($logs as $log) {
      // Por nivel
      $level = $log['level'];
      $stats['by_level'][$level] = ($stats['by_level'][$level] ?? 0) + 1;

      // Por módulo
      $module = $log['module'];
      $stats['by_module'][$module] = ($stats['by_module'][$module] ?? 0) + 1;
    }

    response::success($stats);
  })->middleware($middleware);
});

/**
 * Aplicar filtros a logs
 *
 * Filtros disponibles vía query params:
 * - level: Filtrar por nivel (DEBUG, INFO, WARNING, ERROR)
 * - module: Filtrar por módulo
 * - search: Buscar en mensaje o contexto
 *
 * @param array $logs Array de logs
 * @return array Logs filtrados
 */
function applyLogFilters($logs) {
  // Filtro por nivel
  $level = request::query('level');
  if ($level) {
    $logs = array_filter($logs, function($log) use ($level) {
      return strtoupper($log['level']) === strtoupper($level);
    });
  }

  // Filtro por módulo
  $module = request::query('module');
  if ($module) {
    $logs = array_filter($logs, function($log) use ($module) {
      return $log['module'] === $module;
    });
  }

  // Búsqueda en mensaje o contexto
  $search = request::query('search');
  if ($search) {
    $logs = array_filter($logs, function($log) use ($search) {
      // Buscar en mensaje
      if (stripos($log['message'], $search) !== false) {
        return true;
      }

      // Buscar en contexto
      if ($log['context'] && is_array($log['context'])) {
        $contextStr = json_encode($log['context']);
        if (stripos($contextStr, $search) !== false) {
          return true;
        }
      }

      return false;
    });
  }

  // Reindexar array
  return array_values($logs);
}
