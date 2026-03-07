<?php
class ogUrl {
  static function normalizeUrl($url) {
    if (empty($url) || !is_string($url)) return $url;
    $parts = explode('://', $url, 2);
    if (count($parts) === 2) {
      $protocol = $parts[0];
      $path = preg_replace('#/+#', '/', $parts[1]);
      $path = rtrim($path, '/');
      return $protocol . '://' . $path;
    }
    $url = preg_replace('#/+#', '/', $url);
    return rtrim($url, '/');
  }

  static function addQueryParams($url, $params) {
    if (empty($params) || !is_array($params)) return $url;
    $queryString = http_build_query($params);
    if (empty($queryString)) return $url;
    $separator = strpos($url, '?') !== false ? '&' : '?';
    return $url . $separator . $queryString;
  }

  static function isValid($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
  }

  static function getDomain($url) {
    $parsed = parse_url($url);
    return $parsed['host'] ?? null;
  }

  static function join(...$segments) {
    $url = implode('/', array_map(function($segment) {
      return trim($segment, '/');
    }, $segments));
    return self::normalizeUrl($url);
  }
}

/**
 * @doc-start
 * FILE: framework/helpers/ogUrl.php
 * ROLE: Helper de manipulación de URLs. Normalización, construcción y validación.
 *
 * MÉTODOS:
 *   ogUrl::normalizeUrl($url)
 *     → elimina slashes duplicados y trailing slash
 *     → preserva el protocolo (https://, http://)
 *     → usado internamente por ogHttp antes de cada request
 *     → ogUrl::normalizeUrl('https://api.com//users/') → 'https://api.com/users'
 *
 *   ogUrl::addQueryParams($url, $params)
 *     → agrega array de parámetros como query string
 *     → detecta si ya hay '?' para usar '&'
 *     → ogUrl::addQueryParams('https://api.com/users', ['page' => 1]) → 'https://api.com/users?page=1'
 *
 *   ogUrl::isValid($url)
 *     → valida URL via FILTER_VALIDATE_URL
 *     → retorna bool
 *
 *   ogUrl::getDomain($url)
 *     → extrae el dominio de una URL
 *     → ogUrl::getDomain('https://api.example.com/users') → 'api.example.com'
 *
 *   ogUrl::join(...$segments)
 *     → une segmentos de URL eliminando slashes duplicados
 *     → ogUrl::join('https://api.com', 'users', '42') → 'https://api.com/users/42'
 * @doc-end
 */