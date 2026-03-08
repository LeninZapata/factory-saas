<?php
// middle/routes/docs.php
// Genera documentación del backend escaneando bloques @doc-start/@doc-end
// Solo disponible en entorno de desarrollo

$router->get('/api/docs/build', function() {

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

  // Crear directorios si no existen
  if (!is_dir($promptsPath)) mkdir($promptsPath, 0755, true);

  // ============================================================
  // EXTRACTOR DE BLOQUES @doc-start / @doc-end
  // ============================================================
  $extractDoc = function($filePath) {
    if (!file_exists($filePath)) return null;
    $content = file_get_contents($filePath);
    if (!$content) return null;
    if (!preg_match('/@doc-start(.*?)@doc-end/s', $content, $matches)) return null;

    $lines   = explode("\n", $matches[1]);
    $cleaned = [];
    foreach ($lines as $line) {
      $cleaned[] = preg_replace('/^\s*\*\s?/', '', $line);
    }
    return trim(implode("\n", $cleaned));
  };

  // ============================================================
  // BUILDER DE SECCIONES PARA PROMPT FILES
  // ============================================================
  $buildSection = function($files) use ($extractDoc, $backendPath) {
    $lines   = [];
    $missing = [];

    foreach ($files as $filePath) {
      $relativePath = 'backend/' . str_replace($backendPath . '/', '', $filePath);
      $doc = $extractDoc($filePath);

      if ($doc === null) {
        $missing[] = $relativePath;
        if (!file_exists($filePath)) {
          $lines[] = '> ⚠️ `' . $relativePath . '` — archivo no encontrado';
        } else {
          $lines[] = '> ⚠️ `' . $relativePath . '` — sin bloque `@doc-start`/`@doc-end`';
        }
        $lines[] = '';
        continue;
      }

      $firstLine  = strtok($doc, "\n");
      $blockTitle = str_replace('FILE: ', '', $firstLine);
      $lines[]    = '### `' . $blockTitle . '`';
      $lines[]    = '';
      $lines[]    = '```';
      $lines[]    = $doc;
      $lines[]    = '```';
      $lines[]    = '';
    }

    return ['content' => implode("\n", $lines), 'missing' => $missing];
  };

  // ============================================================
  // DEFINICIÓN DE ARCHIVOS POR MÓDULO
  // ============================================================
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
        // framework/config/
        $backendPath . '/framework/config/init.php',
        $backendPath . '/framework/config/environment.php',
        $backendPath . '/framework/config/consts.php',
        $backendPath . '/framework/config/requires.php',
        $backendPath . '/framework/config/execute.php',
        // app/config/
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

  // ============================================================
  // GENERAR PROMPT FILES
  // ============================================================
  $allMissing = [];
  $totalDocs  = 0;
  $generated  = [];

  foreach ($modules as $key => $module) {
    $result  = $buildSection($module['files']);
    $missing = $result['missing'];
    $allMissing = array_merge($allMissing, $missing);

    $docsInModule = count($module['files']) - count($missing);
    $totalDocs   += $docsInModule;

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

    $outputFile = $promptsPath . '/' . $key . '.prompt.md';
    file_put_contents($outputFile, implode("\n", $md));
    $generated[] = '.github/prompts/' . $key . '.prompt.md';
  }

  // ============================================================
  // GENERAR copilot-context.md (para pegar en el chat de Copilot)
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
  $ctx[] = '';
  $ctx[] = 'Lee y memoriza este contexto. Son las docs del backend.';

  $ctxFile = $rootPath . '/.github/copilot-context.md';
  file_put_contents($ctxFile, implode("\n", $ctx));
  $generated[] = '.github/copilot-context.md';

  // ============================================================
  // GENERAR copilot-instructions.md
  // ============================================================
  $copilot   = [];
  $copilot[] = '# Backend – Copilot Instructions';
  $copilot[] = '';
  $copilot[] = '## Stack';
  $copilot[] = 'PHP 8+, framework propio (NO Laravel/Symfony/cualquier otro).';
  $copilot[] = 'Plugin WordPress o standalone. Raíz del backend: `backend/`';
  $copilot[] = '';
  $copilot[] = '## Arquitectura 3 capas (prioridad: app > middle > framework)';
  $copilot[] = 'Cada capa tiene la misma estructura interna:';
  $copilot[] = '- `resources/controllers/` → XxxController.php';
  $copilot[] = '- `resources/handlers/`    → XxxHandler.php';
  $copilot[] = '- `resources/schemas/`     → xxx.json (CRUD automático)';
  $copilot[] = '- `routes/`                → xxx.php (rutas manuales)';
  $copilot[] = '- `helpers/`               → helpers locales';
  $copilot[] = '- `services/`              → integraciones externas';
  $copilot[] = '';
  $copilot[] = '`app/` sobreescribe `middle/` y `framework/`. Un archivo puede moverse entre capas sin modificación.';
  $copilot[] = '';
  $copilot[] = '## Acceso global';
  $copilot[] = '```php';
  $copilot[] = 'ogApp()                              // singleton principal';
  $copilot[] = 'ogApp()->helper(\'str\')               // carga ogStr (bajo demanda)';
  $copilot[] = 'ogApp()->helper(\'cache\')             // carga ogCache';
  $copilot[] = 'ogApp()->service(\'ai\')               // carga AiService';
  $copilot[] = 'ogApp()->controller(\'user\')          // carga UserController';
  $copilot[] = 'ogApp()->handler(\'auth\')             // carga AuthHandler';
  $copilot[] = 'ogApp()->handler(\'folder/client\')    // con subcarpeta';
  $copilot[] = 'ogApp()->getPath(\'storage\')          // /backend/app/storage';
  $copilot[] = 'ogApp()->getPath(\'storage/json/x\')   // subpath dinámico';
  $copilot[] = 'ogApp()->db()                         // acceso a ogDb::table()';
  $copilot[] = 'ogResource(\'user\')                   // CRUD interno (no HTTP)';
  $copilot[] = '```';
  $copilot[] = '';
  $copilot[] = '## Helpers pre-cargados vs bajo demanda';
  $copilot[] = '| Helper       | Pre-Cargado | Cómo Usar                        |';
  $copilot[] = '|--------------|-------------|----------------------------------|';
  $copilot[] = '| ogResponse   | YES         | `ogResponse::success()`          |';
  $copilot[] = '| ogRequest    | YES         | `ogRequest::data()`              |';
  $copilot[] = '| ogLog        | YES         | `ogLog::error()`                 |';
  $copilot[] = '| ogDb         | YES         | `ogDb::table()` / `ogDb::t()`    |';
  $copilot[] = '| ogLang       | YES         | `__(\'key\')`                      |';
  $copilot[] = '| ogCache      | YES         | `ogCache::memorySet/Get()`       |';
  $copilot[] = '| ogValidation | NO          | `ogApp()->helper(\'validation\')`  |';
  $copilot[] = '| ogFile       | NO          | `ogApp()->helper(\'file\')`        |';
  $copilot[] = '| ogHttp       | NO          | `ogApp()->helper(\'http\')`        |';
  $copilot[] = '| ogStr        | NO          | `ogApp()->helper(\'str\')`         |';
  $copilot[] = '| ogUtils      | NO          | `ogApp()->helper(\'utils\')`       |';
  $copilot[] = '| ogUrl        | NO          | `ogApp()->helper(\'url\')`         |';
  $copilot[] = '| ogDate       | NO          | `ogApp()->helper(\'date\')`        |';
  $copilot[] = '| ogCountry    | NO          | `ogApp()->helper(\'country\')`     |';
  $copilot[] = '| ogLogic      | NO          | `ogApp()->helper(\'logic\')`       |';
  $copilot[] = '';
  $copilot[] = '## Convenciones estrictas para el backend/framework';
  $copilot[] = '- Controllers: `NombreController.php`, extienden `ogController`';
  $copilot[] = '- Handlers: `NombreHandler.php` para lógica de negocio compleja';
  $copilot[] = '- Helpers: prefijo `og` (ogDb, ogCache, ogStr, ogLog, ogResponse...)';
  $copilot[] = '- Rutas manuales: `routes/nombre.php`';
  $copilot[] = '- CRUD automático: `resources/schemas/nombre.json`';
  $copilot[] = '- Respuestas: SIEMPRE `ogResponse::success()` / `ogResponse::error()`';
  $copilot[] = '- DB: Usa `ogDb::table()` o `ogDb::t()`, evita queries raw directas (solo si el query es muy complejo o no encaja en el builder)';
  $copilot[] = '- Paths: SIEMPRE `ogApp()->getPath()`, nunca hardcodear rutas absolutas';
  $copilot[] = '- NO instanciar helpers directamente, usar `ogApp()->helper(\'nombre\')` para los No pre-cargados.';
  $copilot[] = '';
  $copilot[] = '## Estilo de código';
  $copilot[] = '- **ogLog**: inline si tiene ≤3 parámetros, multilínea si tiene ≥4 elementos en contexto o meta';
  $copilot[] = '- **ogDb**: inline si tiene ≤2 where, multilínea si tiene ≥3 where';
  $copilot[] = '- **return arrays**: inline si tiene ≤3 keys, multilínea si tiene ≥4 keys:';
  $copilot[] = '  ```php';
  $copilot[] = '  return [\'success\' => true, \'id\' => $id, \'affected\' => $n];  // inline (3 keys)';
  $copilot[] = '  return [                                                        // multilínea (4+ keys)';
  $copilot[] = '    \'success\'  => true,';
  $copilot[] = '    \'id\'       => $id,';
  $copilot[] = '    \'affected\' => $n,';
  $copilot[] = '    \'message\'  => \'ok\',';
  $copilot[] = '  ];';
  $copilot[] = '  ```';
  $copilot[] = '';
  $copilot[] = '## Middleware disponibles';
  $copilot[] = '`auth` | `json` | `throttle:N,M` | `dev`';
  $copilot[] = '';
  $copilot[] = '## Entorno';
  $copilot[] = '```php';
  $copilot[] = 'ogIsDev()        // bool — desarrollo';
  $copilot[] = 'ogIsLocalhost()  // bool — localhost';
  $copilot[] = 'ogIsProduction() // bool — producción';
  $copilot[] = 'OG_IS_DEV        // constante equivalente';
  $copilot[] = '```';
  $copilot[] = '';
  $copilot[] = '## Contexto adicional — cargar con #file: cuando lo necesites';
  $copilot[] = '| Archivo | Cuándo usarlo |';
  $copilot[] = '|---------|---------------|';
  $copilot[] = '| `.github/prompts/bootstrap.prompt.md`      | arranque, flujo wp.php→bootstrap→api, app/config |';
  $copilot[] = '| `.github/prompts/core.prompt.md`           | ogRouter, ogApi, ogApplication, ogController, ogResource |';
  $copilot[] = '| `.github/prompts/helpers.prompt.md`        | ogDb completo (query builder, traits) |';
  $copilot[] = '| `.github/prompts/helpers-cache-log.prompt.md` | ogCache, ogLog, ogResponse, ogRequest, ogLang |';
  $copilot[] = '| `.github/prompts/helpers-utils.prompt.md`  | ogStr, ogUtils, ogFile, ogHttp, ogUrl, ogDate, ogCountry, ogLogic, ogValidation |';
  $copilot[] = '| `.github/prompts/middleware.prompt.md`     | middleware auth/json/throttle/dev, ogValidatesUnique |';
  $copilot[] = '| `.github/prompts/auth.prompt.md`           | login, sesiones, UserController, endpoints /api/auth/* |';
  $copilot[] = '| `.github/prompts/routes.prompt.md`         | endpoints system, logs, sessions, country |';
  $copilot[] = '| `docs.md`                                  | documentación completa de todo el backend |';

  $copilotFile = $copilotPath . '/copilot-instructions.md';
  file_put_contents($copilotFile, implode("\n", $copilot));
  $generated[] = '.github/copilot-instructions.md';

  // ============================================================
  // GENERAR docs.md COMPLETO (raíz del proyecto)
  // ============================================================
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

  $docsFile    = $rootPath . '/docs.md';
  $fullContent = implode("\n", $fullMd);
  file_put_contents($docsFile, $fullContent);
  $generated[] = 'docs.md';

  // ============================================================
  // RESPUESTA
  // ============================================================
  ogResponse::success([
    'generated'     => $generated,
    'documented'    => $totalDocs,
    'missing'       => $totalMissing,
    'missing_files' => array_unique($allMissing),
    'sizes_kb'      => [
      'docs.md'                 => round(strlen($fullContent) / 1024, 2),
      'copilot-instructions.md' => round(strlen(implode("\n", $copilot)) / 1024, 2),
    ]
  ], 'Documentación generada: ' . count($generated) . ' archivos');

})->middleware(['dev']);