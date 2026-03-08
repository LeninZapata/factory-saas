<?php
// middle/routes/docs-frontend.php
// Módulos JS/JSON: definición, generación de prompts frontend y copilot-*.md

function docsFrontend($adminPath, $promptsPath, $copilotPath, $buildSectionJs, $buildSectionJson) {

  // ============================================================
  $modulesJs = array_merge(
    docsFormModules($adminPath),
    [

    'fe-framework' => [
      'title' => 'Frontend — Framework & Core Utils',
      'desc'  => 'og-framework.js, logger, trigger, event, loader, style, validator.',
      'files' => [
        $adminPath . '/framework/og-framework.js',
        $adminPath . '/framework/js/core/logger.js',
        $adminPath . '/framework/js/core/trigger.js',
        $adminPath . '/framework/js/core/event.js',
        $adminPath . '/framework/js/core/loader.js',
        $adminPath . '/framework/js/core/style.js',
        $adminPath . '/framework/js/core/validator.js',
      ]
    ],

    'fe-core-services' => [
      'title' => 'Frontend — Core Services',
      'desc'  => 'cache, api, i18n, action, dataLoader.',
      'files' => [
        $adminPath . '/framework/js/core/cache.js',
        $adminPath . '/framework/js/core/api.js',
        $adminPath . '/framework/js/core/i18n.js',
        $adminPath . '/framework/js/core/action.js',
        $adminPath . '/framework/js/core/dataLoader.js',
      ]
    ],

    'fe-hooks' => [
      'title' => 'Frontend — Hook System',
      'desc'  => 'hookRegistry, hookLoader, hook.',
      'files' => [
        $adminPath . '/framework/js/core/hookRegistry.js',
        $adminPath . '/framework/js/core/hookLoader.js',
        $adminPath . '/framework/js/core/hook.js',
      ]
    ],

    'fe-view' => [
      'title' => 'Frontend — View System',
      'desc'  => 'layout, sidebar, viewLoader, viewRender, viewComponents, view.',
      'files' => [
        $adminPath . '/framework/js/core/layout.js',
        $adminPath . '/framework/js/core/sidebar.js',
        $adminPath . '/framework/js/core/viewLoader.js',
        $adminPath . '/framework/js/core/viewRender.js',
        $adminPath . '/framework/js/core/viewComponents.js',
        $adminPath . '/framework/js/core/view.js',
      ]
    ],

    // fe-form, fe-conditions, fe-components → ver docs-form.php

        'fe-datatable' => [
      'title' => 'Frontend — DataTable',
      'desc'  => 'datatableCore, datatableSource, datatableColumns, datatableRender, datatableEvents, dataTable, datatableFixedCols, datatableResizeCols.',
      'files' => [
        $adminPath . '/framework/js/components/datatableCore.js',
        $adminPath . '/framework/js/components/datatableSource.js',
        $adminPath . '/framework/js/components/datatableColumns.js',
        $adminPath . '/framework/js/components/datatableRender.js',
        $adminPath . '/framework/js/components/datatableEvents.js',
        $adminPath . '/framework/js/components/dataTable.js',
        $adminPath . '/framework/js/components/datatableFixedCols.js',
        $adminPath . '/framework/js/components/datatableResizeCols.js',
      ]
    ],

    'fe-css' => [
      'title'   => 'Frontend — CSS Framework',
      'desc'    => 'Sistema de clases CSS utilitarias: grid, flex, spacing, botones, alertas, colores, tipografía.',
      'css'     => true,
      'content' => <<<'FE_CSS_END'
```
@doc-start
FILE: admin/framework/css/core/grid.css
FILE: admin/framework/css/core/button.css
FILE: admin/framework/css/components/alerts.css
FILE: admin/framework/css/core/colors.css
FILE: admin/framework/css/core/typography.css
FILE: admin/framework/css/core/view.css
FILE: admin/framework/css/core/vars.css
TYPE: css-framework
PROMPT: fe-css

ROLE:
  Sistema de clases CSS utilitarias del framework. Siempre usar estas clases
  en el HTML generado para vistas, forms y componentes. Evitar CSS inline
  salvo para valores dinámicos que no existen como clase (colores calculados,
  anchos en %, gradientes ad-hoc).

  Si una necesidad de estilo NO tiene clase disponible:
  1. Usar CSS inline como solución temporal
  2. Avisar: "⚠️ CSS inline usado — considerar agregar clase al framework"
  3. Sugerir el nombre y valor para la nueva clase (ej: .og-rounded-sm { border-radius: 4px })

---

LAYOUT Y ESPACIADO (grid.css)

  GRID:
    og-grid              → display: grid; gap: 1rem (base)
    og-cols-{1..6}       → columnas fijas iguales (responsive: colapsa a 1 col en móvil)
    og-cols-2.og-keep-mobile → mantiene 2 columnas en móvil
    og-auto-fit          → auto-fit minmax(250px, 1fr)
    og-auto-fit-sm       → auto-fit minmax(150px, 1fr)
    og-auto-fit-lg       → auto-fit minmax(350px, 1fr)

  GRID GAPS:
    og-gap-xs   → 0.25rem
    og-gap-sm   → 0.5rem
    og-gap-md   → 1rem (default del grid)
    og-gap-lg   → 1.5rem
    og-gap-xl   → 2rem
    og-gap-none → 0

  FLEX:
    og-flex              → display: flex; gap: 1rem; align-items: center
    og-wrap / og-nowrap  → flex-wrap
    og-column / og-row   → flex-direction
    og-toolbar-split     → último hijo margin-left: auto (toolbar izq/der)

  FLEX JUSTIFY:
    og-center | og-start | og-end | og-between | og-around | og-evenly

  FLEX ALIGN:
    og-items-start | og-items-center | og-items-end | og-items-stretch | og-items-baseline

  SPACING (margin):
    og-mt-{0..4}   → margin-top:    0 | 0.5 | 1 | 1.5 | 2 rem
    og-mb-{0..4}   → margin-bottom
    og-my-{0..4}   → margin-top + bottom

  SPACING (padding):
    og-p-{0..4}    → padding:       0 | 0.5 | 1 | 1.5 | 2 rem
    og-px-{0..4}   → padding-left + right
    og-py-{0..4}   → padding-top + bottom

---

BOTONES (button.css)

  BASE:        btn               → botón primario (color accent)
  COLORES:     btn-primary | btn-secondary | btn-danger | btn-success | btn-warning | btn-info
  TAMAÑOS:     btn-sm | btn-lg
  VARIANTES:   btn-outline | btn-link
  ESTADOS:     btn-loading | btn-processing | btn-success-temp | btn-error-temp
  GRUPOS:      btn-group-item    → botones agrupados visualmente

  EJEMPLO:
    <button class="btn btn-primary">Guardar</button>
    <button class="btn btn-danger btn-sm">Eliminar</button>
    <button class="btn btn-outline btn-secondary">Cancelar</button>

---

ALERTAS / NOTAS (alerts.css)

  TIPOS:
    alert-info    → azul
    alert-success → verde
    alert-warning → amarillo/naranja
    alert-danger  → rojo
    alert-note    → gris
    alert-tip     → púrpura

  VARIANTES (se combinan con el tipo):
    alert-border      → solo borde izquierdo, fondo neutro
    alert-filled      → borde izquierdo + fondo de color
    alert-with-desc   → borde izq + línea separadora + .alert-desc abajo
    alert-header      → header de color + cuerpo blanco con .alert-title y .alert-body

  ESTRUCTURA alert-header:
    <div class="alert alert-info alert-header">
      <div class="alert-title">Título</div>
      <div class="alert-body">Cuerpo del mensaje</div>
    </div>

  ESTRUCTURA alert-with-desc:
    <div class="alert alert-warning alert-with-desc">
      <strong>Título</strong> Descripción breve
      <div class="alert-desc">Detalle adicional más pequeño</div>
    </div>

  EJEMPLOS DIRECTOS:
    <div class="alert alert-info alert-border">Mensaje informativo</div>
    <div class="alert alert-success alert-filled"><strong>✓</strong> Guardado correctamente</div>
    <div class="alert alert-danger alert-border">Error al procesar</div>
    <div class="alert alert-tip alert-border">💡 Consejo útil</div>

---

COLORES UTILITARIOS (colors.css)

  TEXTO:
    og-text-white | og-text-black
    og-text-gray-{400,500,600,700,800,900}
    og-text-blue-{500,600,700}
    og-text-green-{500,600,700}
    og-text-red-{500,700}
    og-text-yellow-{600,700}
    og-text-indigo-{500,600,700}
    og-text-purple-{600,700}

  FONDO:
    og-bg-white | og-bg-black
    og-bg-gray-{50,100,200,300,400,500,600,700,800,900}
    og-bg-blue-{50,100,200,500,600}
    og-bg-green-{50,100,200,500,600}
    og-bg-red-{50,100,200,500,600}
    og-bg-yellow-{50,100,200,500,600}
    og-bg-orange-{50,100,200,500,600}
    og-bg-purple-{50,100,200,500,600}
    og-bg-pink-{50,100,200,500,600}
    og-bg-indigo-{50,100,200,500,600}
    og-bg-cyan-{50,100,200,500,600}

  BORDES:
    og-border | og-border-2 | og-border-4
    og-border-t | og-border-b | og-border-l | og-border-r
    og-border-l-2 | og-border-l-3 | og-border-l-4
    og-border-gray-{200,300}
    og-border-blue-500 | og-border-green-500 | og-border-red-500
    og-border-yellow-500 | og-border-purple-500

  BORDER-RADIUS:
    og-rounded | og-rounded-md | og-rounded-lg | og-rounded-xl | og-rounded-2xl | og-rounded-full

---

TIPOGRAFÍA Y VISTA (typography.css, view.css)

  VARIABLES DE TAMAÑO (usar en style="" si no hay clase):
    --og-font-xs:   0.75rem
    --og-font-sm:   0.875rem
    --og-font-md:   1rem
    --og-font-lg:   1.125rem
    --og-font-xl:   1.25rem
    --og-font-2xl:  1.5rem

  BLOQUES DE VISTA:
    og-content-section   → card con borde y padding (sección de contenido)
    og-section-title     → título dentro de og-content-section
    og-section-description → subtítulo/descripción dentro de og-content-section
    og-code-block        → bloque de código con fondo y fuente monospace
    og-view-statusbar    → barra de estado gris inferior

  TOOLBAR EN VISTAS:
    Patrón HTML (no tiene clase dedicada — usar og-flex og-gap-sm og-mb-2):
    <div class="og-flex og-gap-sm og-mb-2">
      <button class="btn btn-primary">Acción</button>
      <button class="btn btn-secondary">Otra</button>
      <div class="og-toolbar-split"></div>       <!-- empuja lo siguiente a la derecha -->
      <button class="btn btn-danger btn-sm">Eliminar</button>
    </div>

    Alternativa con og-view-toolbar (clase sin CSS propio, semántica):
    <div class="og-view-toolbar left">
      <div class="og-toolbar-left og-flex og-gap-sm">...</div>
    </div>

---

REGLAS DE USO

  1. SIEMPRE preferir clases del framework sobre CSS inline
  2. Para colores de fondo de tarjetas usar og-bg-gray-50 o og-bg-white
  3. Para layouts responsivos usar og-grid + og-cols-N
  4. Para mensajes/notas usar alert con su variante, nunca divs con style de color
  5. Spacing con og-p-*, og-mb-*, og-mt-* antes de usar margin/padding inline
  6. Si el diseño necesita gradientes, imágenes de fondo u otros estilos no disponibles:
     → usar style="" puntualmente y agregar comentario:
     <!-- ⚠️ CSS inline: considerar og-gradient-X en framework -->

@doc-end
```

FE_CSS_END,
    ],

        'fe-middle' => [
      'title' => 'Frontend — Middle / Auth System',
      'desc'  => 'authLoginForm, authSession, authPermissions, authUI, authCore, auth (fachada).',
      'files' => [
        $adminPath . '/middle/js/authLoginForm.js',
        $adminPath . '/middle/js/authSession.js',
        $adminPath . '/middle/js/authPermissions.js',
        $adminPath . '/middle/js/authUI.js',
        $adminPath . '/middle/js/authCore.js',
        $adminPath . '/middle/js/auth.js',
      ]
    ],


    'fe-extensions' => [
      'title' => 'Frontend — Extensions (JSON index)',
      'desc'  => 'Archivos index.json de extensiones con _comments: mapa de vistas, partes, mocks y ejemplos.',
      'json'  => true,
      'files' => [
        $adminPath . '/app/extensions/ejemplos/index.json',
      ]
    ],

  ]);



  // GENERAR PROMPT FILES — FRONTEND
  // ============================================================
  $allMissingJs = [];
  $totalDocsJs  = 0;

  foreach ($modulesJs as $key => $module) {
    if (!empty($module['css'])) {
      // Para módulos CSS: contenido estático curado manualmente
      $cssContent = $module['content'] ?? '';
      $outputFile = $promptsPath . '/' . $key . '.prompt.md';
      $md   = [];
      $md[] = '# ' . $module['title'];
      $md[] = '';
      $md[] = '> ' . $module['desc'];
      $md[] = '> Generado: ' . date('Y-m-d H:i:s');
      $md[] = '';
      $md[] = '---';
      $md[] = '';
      $md[] = $cssContent;
      file_put_contents($outputFile, implode("\n", $md));
      $generated[] = '.github/prompts/' . $key . '.prompt.md';
      continue;
    }
    $result  = !empty($module['json'])
      ? $buildSectionJson($module['files'])
      : $buildSectionJs($module['files']);
    $missing = $result['missing'];
    $allMissingJs = array_merge($allMissingJs, $missing);

    $docsInModule = count($module['files']) - count($missing);
    $totalDocsJs += $docsInModule;

    $md   = [];
    $md[] = '# ' . $module['title'];
    $md[] = '';
    $md[] = '> ' . $module['desc'];
    $md[] = '> Generado: ' . date('Y-m-d H:i:s');
    $md[] = '';
    $md[] = '---';
    $md[] = '';
    $md[] = $result['content'];

    // Si el módulo tiene contenido extra curado (convenciones JSON, etc.)
    if (!empty($module['extra'])) {
      $md[] = '';
      $md[] = '---';
      $md[] = '';
      $md[] = $module['extra'];
    }

    $outputFile = $promptsPath . '/' . $key . '.prompt.md';
    file_put_contents($outputFile, implode("\n", $md));
    $generated[] = '.github/prompts/' . $key . '.prompt.md';
  }



  // GENERAR docs-frontend.md
  // ============================================================
  $ctxFe   = [];
  $ctxFe[] = '#file:.github/copilot-instructions.md';
  $ctxFe[] = '#file:.github/prompts/fe-entry.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-framework.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-core-services.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-hooks.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-view.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-form.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-conditions.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-components.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-datatable.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-css.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-middle.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-extensions.prompt.md';
  $ctxFe[] = '#file:.github/prompts/fe-crud.prompt.md';
  $ctxFe[] = '';
  $ctxFe[] = 'Lee y memoriza este contexto. Son las docs del frontend.';

  file_put_contents($copilotPath . '/docs-frontend.md', implode("\n", $ctxFe));
  $generated[] = '.github/docs-frontend.md';


  $copilotSize = round(strlen(implode("\n", $ctxFe)) / 1024, 2);
  return compact('generated', 'totalDocsJs', 'allMissingJs', 'copilotSize');
}