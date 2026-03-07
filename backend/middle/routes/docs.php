<?php
// middle/routes/createDocs.php
// Genera documentación del backend escaneando bloques @doc-start/@doc-end
// Solo disponible en entorno de desarrollo

$router->get('/api/docs/build', function() {

  // Solo en desarrollo
  if (!OG_IS_DEV) {
    ogResponse::forbidden('Documentación solo disponible en desarrollo');
  }

  $backendPath = ogCache::memoryGet('path_backend');

  if (!$backendPath) {
    ogResponse::error('path_backend no encontrado en memoria. Verificar bootstrap.php', 500);
  }

  // ============================================================
  // ORDEN DE ESCANEO (determina el orden en el .md generado)
  // ============================================================
  $scanOrder = [

    // 1. Arranque y bootstrap
    [
      'title'  => 'Arranque del Sistema',
      'files'  => [
        $backendPath . '/../funcs.php',
        $backendPath . '/bootstrap.php',
      ]
    ],

    // 2. Framework - Config
    [
      'title' => 'Framework / Config',
      'files' => [
        $backendPath . '/framework/config/requires.php',
        $backendPath . '/framework/config/execute.php',
      ]
    ],

    // 3. Framework - Core
    [
      'title' => 'Framework / Core',
      'files' => [
        $backendPath . '/framework/core/ogApp.php',
        $backendPath . '/framework/core/ogRouter.php',
        $backendPath . '/framework/core/ogApi.php',
        $backendPath . '/framework/core/ogApplication.php',
        $backendPath . '/framework/core/ogController.php',
        $backendPath . '/framework/core/ogResource.php',
      ]
    ],

    // 4. Framework - Helpers
    [
      'title' => 'Framework / Helpers',
      'files' => [
        $backendPath . '/framework/helpers/ogCache.php',
        $backendPath . '/framework/helpers/ogDate.php',
        $backendPath . '/framework/helpers/ogFile.php',
        $backendPath . '/framework/helpers/ogCountry.php',
        $backendPath . '/framework/helpers/ogHttp.php',
        $backendPath . '/framework/helpers/ogLang.php',
        $backendPath . '/framework/helpers/ogLog.php',
        $backendPath . '/framework/helpers/ogLogic.php',
        $backendPath . '/framework/helpers/ogRequest.php',
        $backendPath . '/framework/helpers/ogResponse.php',
        $backendPath . '/framework/helpers/ogStr.php',
        $backendPath . '/framework/helpers/ogUrl.php',
        $backendPath . '/framework/helpers/ogUtils.php',
        $backendPath . '/framework/helpers/ogValidation.php',
        // ogDb entry point + sub-archivos
        $backendPath . '/framework/helpers/ogDb.php',
        $backendPath . '/framework/helpers/ogDb/ogDbBuilder.php',
        $backendPath . '/framework/helpers/ogDb/ogDbWhere.php',
        $backendPath . '/framework/helpers/ogDb/ogDbQuery.php',
        $backendPath . '/framework/helpers/ogDb/ogDbExecute.php',
        $backendPath . '/framework/helpers/ogDb/ogRawExpr.php',
      ]
    ],

    // 5. Framework - Traits
    [
      'title' => 'Framework / Traits',
      'files' => [
        $backendPath . '/framework/traits/ogValidatesUnique.php',
      ]
    ],

    // 6. Framework - Middleware
    [
      'title' => 'Framework / Middleware',
      'files' => [
        $backendPath . '/framework/middleware/ogAuthMiddleware.php',
        $backendPath . '/framework/middleware/ogDevMiddleware.php',
        $backendPath . '/framework/middleware/ogJsonMiddleware.php',
        $backendPath . '/framework/middleware/ogThrottleMiddleware.php',
      ]
    ],

    // 7. Framework - Routes
    [
      'title' => 'Framework / Routes',
      'files' => [
        $backendPath . '/framework/routes/system.php',
        $backendPath . '/framework/routes/logs.php',
        $backendPath . '/framework/routes/sessions.php',
        $backendPath . '/framework/routes/country.php',
      ]
    ],

    // 8. Middle - Auth module (handlers, controllers, routes)
    [
      'title' => 'Middle / Auth Module',
      'files' => [
        $backendPath . '/middle/resources/handlers/AuthHandler.php',
        $backendPath . '/middle/resources/handlers/UserHandler.php',
        $backendPath . '/middle/resources/controllers/UserController.php',
        $backendPath . '/middle/helpers/ogLogReader.php',
        $backendPath . '/middle/routes/auth.php',
        $backendPath . '/middle/routes/user.php',
        $backendPath . '/middle/routes/sessions.php',
        $backendPath . '/middle/routes/cleanup.php',
      ]
    ],

    // 9. App - Config
    [
      'title' => 'App / Config',
      'files' => [
        $backendPath . '/app/config/init.php',
        $backendPath . '/app/config/execute.php',
        $backendPath . '/app/config/database.php',
        $backendPath . '/app/config/tables.php',
        $backendPath . '/app/config/consts.php',
      ]
    ],

  ];

  // ============================================================
  // EXTRACTOR DE BLOQUES @doc-start / @doc-end
  // ============================================================
  $extractDoc = function($filePath) {
    if (!file_exists($filePath)) return null;

    $content = file_get_contents($filePath);
    if (!$content) return null;

    // Buscar bloque entre @doc-start y @doc-end
    if (!preg_match('/@doc-start(.*?)@doc-end/s', $content, $matches)) {
      return null;
    }

    $raw = $matches[1];

    // Limpiar líneas: quitar " * " al inicio de cada línea del bloque PHPDoc
    $lines = explode("\n", $raw);
    $cleaned = [];

    foreach ($lines as $line) {
      // Quitar prefijo de bloque PHPDoc: " * " o " *" al inicio
      $line = preg_replace('/^\s*\*\s?/', '', $line);
      $cleaned[] = $line;
    }

    // Unir y quitar líneas vacías al inicio y final
    return trim(implode("\n", $cleaned));
  };

  // ============================================================
  // CONSTRUIR MARKDOWN
  // ============================================================
  $md = [];
  $md[] = '# Backend Documentation';
  $md[] = '';
  $md[] = '> Generado automáticamente desde bloques `@doc-start`/`@doc-end`';
  $md[] = '> Fecha: ' . date('Y-m-d H:i:s');
  $md[] = '';
  $md[] = '---';
  $md[] = '';

  // Índice
  $md[] = '## Índice';
  $md[] = '';
  foreach ($scanOrder as $section) {
    $anchor = strtolower(str_replace(['/', ' ', '-'], ['-', '-', '-'], $section['title']));
    $anchor = preg_replace('/-+/', '-', $anchor);
    $md[] = '- [' . $section['title'] . '](#' . $anchor . ')';
  }
  $md[] = '';
  $md[] = '---';
  $md[] = '';

  $totalDocs    = 0;
  $totalMissing = 0;
  $missing      = [];

  foreach ($scanOrder as $section) {
    $md[] = '## ' . $section['title'];
    $md[] = '';

    foreach ($section['files'] as $filePath) {
      $relativePath = str_replace($backendPath . '/../', '', $filePath);
      $relativePath = str_replace($backendPath . '/', 'backend/', $relativePath);

      $doc = $extractDoc($filePath);

      if ($doc === null) {
        $totalMissing++;
        $missing[] = $relativePath;

        if (!file_exists($filePath)) {
          $md[] = '> ⚠️ `' . $relativePath . '` — archivo no encontrado';
        } else {
          $md[] = '> ⚠️ `' . $relativePath . '` — sin bloque `@doc-start`/`@doc-end`';
        }
        $md[] = '';
        continue;
      }

      $totalDocs++;

      // Título del bloque: primera línea que empiece con FILE:
      $firstLine = strtok($doc, "\n");
      $blockTitle = str_replace('FILE: ', '', $firstLine);

      $md[] = '### `' . $blockTitle . '`';
      $md[] = '';
      $md[] = '```';
      $md[] = $doc;
      $md[] = '```';
      $md[] = '';
    }

    $md[] = '---';
    $md[] = '';
  }

  // Resumen al final
  $md[] = '## Resumen';
  $md[] = '';
  $md[] = '- **Documentados:** ' . $totalDocs;
  $md[] = '- **Sin documentación:** ' . $totalMissing;
  $md[] = '';

  if (!empty($missing)) {
    $md[] = '### Archivos sin bloque @doc-start';
    $md[] = '';
    foreach ($missing as $m) {
      $md[] = '- `' . $m . '`';
    }
    $md[] = '';
  }

  $markdownContent = implode("\n", $md);

  // ============================================================
  // GUARDAR ARCHIVO
  // ============================================================
  $outputPath = $backendPath . '/../.docs/docs.md';

  if (file_put_contents($outputPath, $markdownContent) === false) {
    ogResponse::error('No se pudo escribir el archivo docs.md en ' . $outputPath, 500);
  }

  ogResponse::success([
    'output'      => $outputPath,
    'documented'  => $totalDocs,
    'missing'     => $totalMissing,
    'missing_files' => $missing,
    'size_kb'     => round(strlen($markdownContent) / 1024, 2)
  ], 'Documentación generada correctamente → .docs/docs.md');

})->middleware(['dev']);