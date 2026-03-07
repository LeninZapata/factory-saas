<?php
// Cargar helpers y core del framework desde el inicio
// solo estos helpers y cores, el resto se cargan bajo demanda en los controllers o donde se necesiten
$helpers = ['lang', 'log', 'response', 'request', 'db', 'cache'];
$cores = ['app', 'controller', 'application'];
foreach ($helpers as $helper) require_once OG_FRAMEWORK_PATH . '/helpers/og' . ucfirst($helper) . '.php';
foreach ($cores as $core) require_once OG_FRAMEWORK_PATH . '/core/og' . ucfirst($core) . '.php';

/**
 * @doc-start
 * FILE: framework/config/requires.php
 * ROLE: Carga inicial de helpers y cores críticos del framework.
 *
 * Se cargan automáticamente en el boot (vía init.php):
 * - Helpers: lang, log, response, request, db, cache
 * - Cores: app, controller, application
 *
 * El resto de helpers se cargan bajo demanda desde controllers u otros archivos.
 * Agregar aquí solo lo que toda request necesita desde el primer ciclo.
 *
 * TABLA DE HELPERS:
 * | Helper        | Pre-Cargado | Cómo Usar                       |
 * |---------------|-------------|---------------------------------|
 * | ogResponse    | YES         | ogResponse::success()           |
 * | ogRequest     | YES         | ogRequest::data()               |
 * | ogLog         | YES         | ogLog::error()                  |
 * | ogDb          | YES         | ogDb::table() / ogDb::t()       |
 * | ogLang        | YES         | __('key')                       |
 * | ogCache       | YES         | ogCache::memorySet/Get()        |
 * | ogCache arch. | YES         | ogApp()->helper('cache')::set() |
 * | ogValidation  | NO          | ogApp()->helper('validation')   |
 * | ogFile        | NO          | ogApp()->helper('file')         |
 * | ogHttp        | NO          | ogApp()->helper('http')         |
 * | ogStr         | NO          | ogApp()->helper('str')          |
 * | ogUtils       | NO          | ogApp()->helper('utils')        |
 * | ogUrl         | NO          | ogApp()->helper('url')          |
 * | ogDate        | NO          | ogApp()->helper('date')         |
 * | ogCountry     | NO          | ogApp()->helper('country')      |
 * | ogLogic       | NO          | ogApp()->helper('logic')        |
 * @doc-end
 */