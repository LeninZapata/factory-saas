<?php
// FRAMEWORK/CONFIG/INIT.PHP - Inicialización del framework
// Cargar configuración de entorno
require_once __DIR__ . '/environment.php';

// Cargar constantes del framework
require_once __DIR__ . '/consts.php';

// Cargar helpers críticos
require_once __DIR__ . '/requires.php';

// Ejecutar scripts de inicialización
require_once __DIR__ . '/execute.php';

/**
 * @doc-start
 * FILE: framework/config/init.php
 * ROLE: Orquesta el arranque del framework en orden estricto:
 *   1. environment.php → define OG_IS_DEV
 *   2. consts.php      → constantes globales
 *   3. requires.php    → carga helpers y cores críticos
 *   4. execute.php     → idioma + config de logs
 * Cargado desde app/config/init.php vía require_once (solo 1 vez).
 * @doc-end
 */