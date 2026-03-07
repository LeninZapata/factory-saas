<?php
// Helpers de manipulación de strings
class ogStr {

  /**
   * Normalizar texto para comparación case-insensitive sin tildes
   */
  static function normalize($text) {
    if (empty($text)) return '';

    // Minúsculas
    $text = mb_strtolower($text, 'UTF-8');

    // Remover tildes
    $unwanted = [
      'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
      'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
      'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
      'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
      'ã' => 'a', 'õ' => 'o', 'ç' => 'c', 'ñ' => 'n'
    ];

    return strtr($text, $unwanted);
  }

  // Verificar si todas las palabras de needle están en haystack
  static function containsAllWords($needle, $haystack) {
    if (empty($needle) || empty($haystack)) return false;

    $needleNorm = self::normalize($needle);
    $haystackNorm = self::normalize($haystack);

    // Dividir needle en palabras
    $words = preg_split('/\s+/', $needleNorm, -1, PREG_SPLIT_NO_EMPTY);

    // Verificar que TODAS las palabras estén presentes
    foreach ($words as $word) {
      if (strpos($haystackNorm, $word) === false) {
        return false;
      }
    }

    return true;
  }

  // Validar si un string es JSON válido
  static function isJson($string) {
    if (empty($string) || !is_string($string)) return false;

    json_decode($string);
    return json_last_error() === JSON_ERROR_NONE;
  }

  // Convertir kebab-case o snake_case a camelCase
  static function toCamelCase($string) {
    if (empty($string)) return '';

    // Convertir kebab-case (ad-metrics) o snake_case (ad_metrics) a camelCase
    $string = str_replace(['-', '_'], ' ', $string);
    $string = ucwords($string);
    $string = str_replace(' ', '', $string);
    $string = lcfirst($string); // Primera letra en minúscula

    return $string;
  }

}

/**
 * @doc-start
 * FILE: framework/helpers/ogStr.php
 * ROLE: Helper de manipulación de strings. Normalización, conversión de casos
 *       y utilidades de comparación.
 *
 * MÉTODOS:
 *   ogStr::normalize($text)
 *     → minúsculas + remueve tildes (á→a, é→e, ñ→n, ç→c, etc.)
 *     → útil para comparaciones case-insensitive sin tildes
 *     → ogStr::normalize('Ñoño') → 'nono'
 *
 *   ogStr::containsAllWords($needle, $haystack)
 *     → true si TODAS las palabras de $needle están en $haystack
 *     → normaliza ambos strings antes de comparar
 *     → ogStr::containsAllWords('juan perez', 'Juan Pérez García') → true
 *
 *   ogStr::isJson($string)
 *     → true si el string es JSON válido
 *     → retorna false si está vacío o no es string
 *
 *   ogStr::toCamelCase($string)
 *     → convierte kebab-case o snake_case a camelCase
 *     → ogStr::toCamelCase('my-module')  → 'myModule'
 *     → ogStr::toCamelCase('my_module')  → 'myModule'
 *     → usado en ogApi.php para normalizar módulos de URL
 * @doc-end
 */