<?php
// middle/routes/docs-backend.php
// Módulos PHP: definición de archivos, generación de prompts backend y docs.md

function docsBackend($backendPath, $rootPath, $promptsPath, $copilotPath, $buildSection) {

  $modules = [

    'bootstrap' => [
      'title' => 'Bootstrap & Configuración',
      'desc'  => 'Flujo de arranque, entorno, configuración del framework y de la app.',
      'intro' => implode("\n", [
        '## Dos capas de configuración',
        '',
        'El sistema tiene dos carpetas `config/` con responsabilidades distintas:',
        '',
        '| Capa | Carpeta | Qué configura |',
        '|------|---------|---------------|',
        '| Framework | `framework/config/` | El SISTEMA — no se toca por proyecto |',
        '| App | `app/config/` | LA APLICACIÓN — específico por proyecto |',
        '',
        '### framework/config/ — configura el SISTEMA',
        '```',
        'environment.php  → define OG_IS_DEV (localhost = dev)',
        'consts.php       → constantes globales (tiempos, sesión, lang, timezone)',
        'requires.php     → carga helpers y cores críticos al boot',
        'execute.php      → idioma por defecto + configuración de logs',
        'init.php         → orquesta los 4 anteriores en orden estricto',
        '```',
        '',
        '### app/config/ — configura LA APLICACIÓN',
        '```',
        'database.php     → credenciales DB por entorno (localhost vs producción)',
        'tables.php       → alias de tablas del proyecto',
        'consts.php       → constantes del proyecto (tokens, claves externas)',
        'execute.php      → conecta DB + tablas + error reporting',
        'init.php         → carga framework/config/init.php + los 4 anteriores',
        '```',
        '',
        '**REGLA:** Si cambia por proyecto → `app/config/` | Si es del núcleo → `framework/config/`',
        '',
        '---',
        '',
      ]),
      'files' => [
        $backendPath . '/../funcs.php',
        $backendPath . '/bootstrap.php',
        $backendPath . '/framework/config/init.php',
        $backendPath . '/framework/config/environment.php',
        $backendPath . '/framework/config/consts.php',
        $backendPath . '/framework/config/requires.php',
        $backendPath . '/framework/config/execute.php',
        $backendPath . '/app/config/init.php',
        $backendPath . '/app/config/execute.php',
        $backendPath . '/app/config/database.php',
        $backendPath . '/app/config/tables.php',
        $backendPath . '/app/config/consts.php',
      ]
    ],

    'core' => [
      'title' => 'Core del Framework',
      'desc'  => 'ogApp, ogRouter, ogApi, ogApplication, ogController, ogResource.',
      'files' => [
        $backendPath . '/framework/core/ogApp.php',
        $backendPath . '/framework/core/ogRouter.php',
        $backendPath . '/framework/core/ogApi.php',
        $backendPath . '/framework/core/ogApplication.php',
        $backendPath . '/framework/core/ogController.php',
        $backendPath . '/framework/core/ogResource.php',
      ]
    ],

    'helpers' => [
      'title'  => 'Helpers — Parte 1: ogDb',
      'desc'   => 'Query builder ogDb completo (entry point + traits). Ver también: helpers-cache-log.prompt.md y helpers-utils.prompt.md',
      'intro'  => implode("\n", [
        '## Índice de todos los helpers',
        '',
        '| Helper       | Archivo prompt                     | Pre-Cargado |',
        '|--------------|-------------------------------------|-------------|',
        '| ogDb         | helpers.prompt.md (este archivo)    | YES         |',
        '| ogCache      | helpers-cache-log.prompt.md         | YES         |',
        '| ogLog        | helpers-cache-log.prompt.md         | YES         |',
        '| ogResponse   | helpers-cache-log.prompt.md         | YES         |',
        '| ogRequest    | helpers-cache-log.prompt.md         | YES         |',
        '| ogLang       | helpers-cache-log.prompt.md         | YES         |',
        '| ogStr        | helpers-utils.prompt.md             | NO          |',
        '| ogUtils      | helpers-utils.prompt.md             | NO          |',
        '| ogFile       | helpers-utils.prompt.md             | NO          |',
        '| ogHttp       | helpers-utils.prompt.md             | NO          |',
        '| ogUrl        | helpers-utils.prompt.md             | NO          |',
        '| ogDate       | helpers-utils.prompt.md             | NO          |',
        '| ogCountry    | helpers-utils.prompt.md             | NO          |',
        '| ogLogic      | helpers-utils.prompt.md             | NO          |',
        '| ogValidation | helpers-utils.prompt.md             | NO          |',
        '',
        '---',
        '',
      ]),
      'files' => [
        $backendPath . '/framework/helpers/ogDb.php',
        $backendPath . '/framework/helpers/ogDb/ogDbBuilder.php',
        $backendPath . '/framework/helpers/ogDb/ogDbWhere.php',
        $backendPath . '/framework/helpers/ogDb/ogDbQuery.php',
        $backendPath . '/framework/helpers/ogDb/ogDbExecute.php',
        $backendPath . '/framework/helpers/ogDb/ogRawExpr.php',
      ]
    ],

    'helpers-cache-log' => [
      'title' => 'Helpers — Parte 2: Cache, Log, Response, Request, Lang',
      'desc'  => 'Helpers pre-cargados en el boot. Ver también: helpers.prompt.md (ogDb) y helpers-utils.prompt.md.',
      'files' => [
        $backendPath . '/framework/helpers/ogCache.php',
        $backendPath . '/framework/helpers/ogLog.php',
        $backendPath . '/framework/helpers/ogResponse.php',
        $backendPath . '/framework/helpers/ogRequest.php',
        $backendPath . '/framework/helpers/ogLang.php',
      ]
    ],

    'helpers-utils' => [
      'title' => 'Helpers — Parte 3: Utils, File, Http, Str, Url, Date, Country, Logic, Validation',
      'desc'  => 'Helpers bajo demanda via ogApp()->helper(). Ver también: helpers.prompt.md (ogDb) y helpers-cache-log.prompt.md.',
      'files' => [
        $backendPath . '/framework/helpers/ogStr.php',
        $backendPath . '/framework/helpers/ogUtils.php',
        $backendPath . '/framework/helpers/ogFile.php',
        $backendPath . '/framework/helpers/ogHttp.php',
        $backendPath . '/framework/helpers/ogUrl.php',
        $backendPath . '/framework/helpers/ogDate.php',
        $backendPath . '/framework/helpers/ogCountry.php',
        $backendPath . '/framework/helpers/ogLogic.php',
        $backendPath . '/framework/helpers/ogValidation.php',
      ]
    ],

    'middleware' => [
      'title' => 'Middleware & Traits',
      'desc'  => 'Middleware disponibles en rutas y traits de validación.',
      'files' => [
        $backendPath . '/framework/middleware/ogAuthMiddleware.php',
        $backendPath . '/framework/middleware/ogJsonMiddleware.php',
        $backendPath . '/framework/middleware/ogThrottleMiddleware.php',
        $backendPath . '/framework/middleware/ogDevMiddleware.php',
        $backendPath . '/framework/traits/ogValidatesUnique.php',
      ]
    ],

    'auth' => [
      'title' => 'Módulo Auth & Users (No aplica para WordPress)',
      'desc'  => 'Login, sesiones, gestión de usuarios. Capa middle.',
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

    'routes' => [
      'title' => 'Rutas del Framework',
      'desc'  => 'Endpoints del sistema: system, logs, sessions, country.',
      'files' => [
        $backendPath . '/framework/routes/system.php',
        $backendPath . '/framework/routes/logs.php',
        $backendPath . '/framework/routes/sessions.php',
        $backendPath . '/framework/routes/country.php',
      ]
    ],

  ];

  // ── Generar prompt files backend ─────────────────────────────
  $allMissing = [];
  $totalDocs  = 0;
  $generated  = [];

  foreach ($modules as $key => $module) {
    $result  = $buildSection($module['files']);
    $missing = $result['missing'];
    $allMissing = array_merge($allMissing, $missing);
    $totalDocs += count($module['files']) - count($missing);

    $md   = [];
    $md[] = '# ' . $module['title'];
    $md[] = '';
    $md[] = '> ' . $module['desc'];
    $md[] = '> Generado: ' . date('Y-m-d H:i:s');
    $md[] = '';
    $md[] = '---';
    $md[] = '';
    if (!empty($module['intro'])) {
      $md[] = $module['intro'];
    }
    $md[] = $result['content'];

    file_put_contents($promptsPath . '/' . $key . '.prompt.md', implode("\n", $md));
    $generated[] = '.github/prompts/' . $key . '.prompt.md';
  }

  // ── Generar docs.md completo ──────────────────────────────────
  $fullMd   = [];
  $fullMd[] = '# Backend Documentation';
  $fullMd[] = '';
  $fullMd[] = '> Generado automáticamente desde bloques `@doc-start`/`@doc-end`';
  $fullMd[] = '> Fecha: ' . date('Y-m-d H:i:s');
  $fullMd[] = '';
  $fullMd[] = '---';
  $fullMd[] = '';
  $fullMd[] = '## Índice';
  $fullMd[] = '';

  foreach ($modules as $key => $module) {
    $anchor   = preg_replace('/[^a-z0-9]+/', '-', strtolower($module['title']));
    $fullMd[] = '- [' . $module['title'] . '](#' . trim($anchor, '-') . ')';
  }

  $fullMd[] = '';
  $fullMd[] = '---';
  $fullMd[] = '';

  foreach ($modules as $key => $module) {
    $result   = $buildSection($module['files']);
    $fullMd[] = '## ' . $module['title'];
    $fullMd[] = '';
    $fullMd[] = $result['content'];
    $fullMd[] = '---';
    $fullMd[] = '';
  }

  $totalMissing = count(array_unique($allMissing));
  $fullMd[]     = '## Resumen';
  $fullMd[]     = '';
  $fullMd[]     = '- **Documentados:** ' . $totalDocs;
  $fullMd[]     = '- **Sin documentación:** ' . $totalMissing;
  $fullMd[]     = '';

  if (!empty($allMissing)) {
    $fullMd[] = '### Archivos sin bloque @doc-start';
    $fullMd[] = '';
    foreach (array_unique($allMissing) as $m) {
      $fullMd[] = '- `' . $m . '`';
    }
  }

  $fullContent = implode("\n", $fullMd);
  file_put_contents($rootPath . '/docs.md', $fullContent);
  $generated[] = 'docs.md';



  // ── Generar docs-backend.md ─────────────────────────────────
  // GENERAR docs-backend.md
  // ============================================================
  $ctx   = [];
  $ctx[] = '#file:.github/copilot-instructions.md';
  $ctx[] = '#file:.github/prompts/bootstrap.prompt.md';
  $ctx[] = '#file:.github/prompts/core.prompt.md';
  $ctx[] = '#file:.github/prompts/helpers.prompt.md';
  $ctx[] = '#file:.github/prompts/helpers-cache-log.prompt.md';
  $ctx[] = '#file:.github/prompts/helpers-utils.prompt.md';
  $ctx[] = '#file:.github/prompts/middleware.prompt.md';
  $ctx[] = '#file:.github/prompts/auth.prompt.md';
  $ctx[] = '#file:.github/prompts/routes.prompt.md';
  $ctx[] = '#file:.github/prompts/crud.prompt.md';
  $ctx[] = '';
  $ctx[] = 'Lee y memoriza este contexto. Son las docs del backend.';

  $ctxFile = $copilotPath . '/docs-backend.md';
  file_put_contents($ctxFile, implode("\n", $ctx));
  $generated[] = '.github/docs-backend.md';


    return compact('generated', 'totalDocs', 'allMissing', 'fullContent');
}