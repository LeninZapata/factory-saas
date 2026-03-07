<?php

$router->group('/api/country', function($router) {

  $router->get(['/all',''], function() {
    $countries = ogApp()->helper('country')::all();

    $region = ogApp()->helper('request')::query('region');
    if ($region) {
      $countries = array_filter($countries, fn($c) => $c['region'] === strtolower($region));
    }

    $codes = ogApp()->helper('request')::query('codes');
    if ($codes) {
      $codeArray = explode(',', $codes);
      $countries = array_filter($countries, fn($c, $code) => in_array($code, $codeArray), ARRAY_FILTER_USE_BOTH);
    }

    $sort = ogApp()->helper('request')::query('sort', 'name');
    $order = ogApp()->helper('request')::query('order', 'asc');

    $sorted = $countries;
    uasort($sorted, function($a, $b) use ($sort, $order) {
      $cmp = $a[$sort] <=> $b[$sort];
      return $order === 'desc' ? -$cmp : $cmp;
    });

    $result = [];
    foreach ($sorted as $code => $data) {
      $result[] = array_merge(['code' => $code], $data);
    }

    ogApp()->helper('response')::success($result);
  });

  $router->get('/{code}', function($code) {
    $data = ogApp()->helper('country')::get($code);

    if (!$data) {
      ogApp()->helper('response')::notFound(__('country.not_found'));
    }

    $includeTime = ogApp()->helper('request')::query('time');
    if ($includeTime) {
      $data['current_time'] = ogApp()->helper('country')::now($code);
    }

    $data['code'] = strtoupper($code);

    ogApp()->helper('response')::success($data);
  });

  // @example {"datetime": "2025-01-12 10:00:00", "from": "EC", "to": "ES"}
  $router->post('/convert', function() {
    $data = ogApp()->helper('request')::data();

    if (!isset($data['datetime']) || !isset($data['from']) || !isset($data['to'])) {
      ogApp()->helper('response')::json(['success' => false, 'error' => __('country.convert.missing_params')], 400);
    }

    $result = ogApp()->helper('country')::convert($data['datetime'], $data['from'], $data['to']);

    if (!$result) {
      ogApp()->helper('response')::json(['success' => false, 'error' => __('country.convert.error')], 400);
    }

    ogApp()->helper('response')::success(['converted_time' => $result]);
  })->middleware('json');

});

/**
 * @doc-start
 * FILE: framework/routes/country.php
 * ROLE: Endpoints de consulta de países usando ogCountry.
 *
 * ENDPOINTS:
 *   GET  /api/country/all            → todos los países
 *     ?region=america|europa         → filtrar por región
 *     ?codes=EC,CO,PE                → filtrar por códigos ISO
 *     ?sort=name|currency            → ordenar por campo (default: name)
 *     ?order=asc|desc                → dirección (default: asc)
 *   GET  /api/country/{code}         → datos de un país por código ISO
 *     ?time=1                        → incluir hora actual del país
 *   POST /api/country/convert        → convertir fecha entre timezones de dos países
 *     { "datetime": "2025-01-12 10:00:00", "from": "EC", "to": "ES" }
 *     → requiere middleware 'json'
 * @doc-end
 */