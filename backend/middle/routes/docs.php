<?php
// middle/routes/docs.php
// Genera documentación del backend y frontend — solo en desarrollo
// Se divide en archivos auxiliares (mismo directorio):
//   docs-helpers.php      → extractors y builders
//   docs-backend.php      → módulos PHP + docs.md + copilot-context.md
//   docs-frontend.php     → módulos JS/JSON + copilot-context-frontend.md
//   docs-form.php         → módulos fe-form, fe-conditions, fe-components (contenido extra)
//   docs-instructions.php → copilot-instructions.md (instrucciones globales)
//   docs-entry.php        → fe-entry.prompt.md (index.html, appConfig, arranque, standalone vs WP)

require_once __DIR__ . '/docs/docs-helpers.php';
require_once __DIR__ . '/docs/docs-backend.php';
require_once __DIR__ . '/docs/docs-frontend.php';
require_once __DIR__ . '/docs/docs-form.php';
require_once __DIR__ . '/docs/docs-instructions.php';
require_once __DIR__ . '/docs/docs-entry.php';
require_once __DIR__ . '/docs/docs-crud.php';
require_once __DIR__ . '/docs/docs-fe-crud.php';

$router->get('/api/docs/build', function()
  use ($buildSection, $buildSectionJs, $buildSectionJson) {

  if (!OG_IS_DEV) {
    ogResponse::forbidden('Documentación solo disponible en desarrollo');
  }

  $backendPath = ogCache::memoryGet('path_backend');

  if (!$backendPath) {
    ogResponse::error('path_backend no encontrado en memoria. Verificar bootstrap.php', 500);
  }

  $rootPath    = $backendPath . '/..';
  $promptsPath = $rootPath . '/.github/prompts';
  $copilotPath = $rootPath . '/.github';
  $adminPath   = $rootPath . '/admin';

  // Limpiar archivos anteriores antes de regenerar
  // 1. Vaciar carpeta .github/prompts/*.prompt.md
  if (is_dir($promptsPath)) {
    foreach (glob($promptsPath . '/*.prompt.md') as $f) {
      unlink($f);
    }
  } else {
    mkdir($promptsPath, 0755, true);
  }

  // 2. Eliminar archivos .md sueltos en .github/
  foreach (['copilot-context.md', 'copilot-context-frontend.md'] as $f) {
    $file = $copilotPath . '/' . $f;
    if (file_exists($file)) unlink($file);
  }

  // 3. Eliminar docs.md en la raíz del proyecto
  if (file_exists($rootPath . '/docs.md')) unlink($rootPath . '/docs.md');

  // ── Backend: prompts PHP + docs.md ──────────────────────────
  $backendResult = docsBackend($backendPath, $rootPath, $promptsPath, $copilotPath, $buildSection);

  // ── Frontend: prompts JS/JSON + copilot-*.md ─────────────────
  $frontendResult = docsFrontend(
    $adminPath,
    $promptsPath,
    $copilotPath,
    $buildSectionJs,
    $buildSectionJson
  );

  // ── Instructions: copilot-instructions.md ───────────────────
  $instructionsResult = docsInstructions($copilotPath);

  // ── Entry: fe-entry.prompt.md (index.html, appConfig, arranque) ─
  $entryResult = docsEntry($promptsPath, $copilotPath);

  // ── CRUD: crud.prompt.md (playbook módulos backend) ──────────
  $crudResult = docsCrud($promptsPath);

  // ── FE-CRUD: fe-crud.prompt.md (playbook CRUD frontend) ──────
  $feCrudResult = docsFeCrud($promptsPath);

  $generated = array_merge(
    $backendResult['generated'],
    $frontendResult['generated'],
    $instructionsResult['generated'],
    $entryResult['generated'],
    $crudResult['generated'],
    $feCrudResult['generated']
  );

  $fullContent = $backendResult['fullContent'];

  // ── Respuesta ────────────────────────────────────────────────
  $totalMissing   = count(array_unique($backendResult['allMissing']));
  $totalMissingJs = count(array_unique($frontendResult['allMissingJs']));

  ogResponse::success([
    'generated' => $generated,
    'backend'   => [
      'documented'    => $backendResult['totalDocs'],
      'missing'       => $totalMissing,
      'missing_files' => array_unique($backendResult['allMissing']),
    ],
    'frontend'  => [
      'documented'    => $frontendResult['totalDocsJs'],
      'missing'       => $totalMissingJs,
      'missing_files' => array_unique($frontendResult['allMissingJs']),
    ],
    'sizes_kb'  => [
      'docs.md'                 => round(strlen($fullContent) / 1024, 2),
      'copilot-instructions.md' => $frontendResult['copilotSize'] ?? 0,
    ]
  ], 'Documentación generada: ' . count($generated) . ' archivos');

})->middleware(['dev']);