<?php
// Inicializar idioma
ogLang::load(OG_DEFAULT_LANG);

// Opción 2: Detectar desde header HTTP (descomenta para usar)
// $lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'es', 0, 2);
// ogLang::load($lang);

// Opción 3: Desde query param (descomenta para usar)
// $lang = $_GET['lang'] ?? OG_DEFAULT_LANG;
// ogLang::load($lang);

// Configurar logs
ogLog::setConfig([
  'format' => 'custom',
  'template' => '{year}/{month}/{day}/{module}.log',
  'level' => OG_IS_DEV ? 'debug' : 'info',
  'max_size' => 1048576,
  'enabled' => true
]);

/**
 * @doc-start
 * FILE: framework/config/execute.php
 * ROLE: Ejecuta configuraciones iniciales del framework en cada request.
 *
 * Responsabilidades:
 * - Carga el idioma por defecto (OG_DEFAULT_LANG = 'es')
 * - Configura el sistema de logs con template diario por módulo
 *
 * Log config:
 * - template: storage/logs/{year}/{month}/{day}/{module}.log
 * - level: 'debug' en desarrollo, 'info' en producción (basado en OG_IS_DEV)
 * - max_size: 1MB por archivo
 *
 * Alternativas de idioma disponibles (comentadas en el archivo):
 * - Detección automática desde header HTTP_ACCEPT_LANGUAGE
 * - Detección desde query param ?lang=
 * @doc-end
 */