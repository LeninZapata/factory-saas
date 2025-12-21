<?php
// app/lang/es.php - Orquestador: Framework + App
$langPath = __DIR__ . '/es/';

// Cargar traducciones del framework
$frameworkTranslations = require FRAMEWORK_PATH . '/lang/es.php';

// Cargar traducciones de la aplicación
$appTranslations = [
  'user'       => file_exists($langPath . 'user.php') ? require $langPath . 'user.php' : [],
  'product'    => file_exists($langPath . 'product.php') ? require $langPath . 'product.php' : [],
  'sale'       => file_exists($langPath . 'sale.php') ? require $langPath . 'sale.php' : [],
  'bot'        => file_exists($langPath . 'bot.php') ? require $langPath . 'bot.php' : [],
  'chat'       => file_exists($langPath . 'chat.php') ? require $langPath . 'chat.php' : [],
  'client'     => file_exists($langPath . 'client.php') ? require $langPath . 'client.php' : [],
  'credential' => file_exists($langPath . 'credential.php') ? require $langPath . 'credential.php' : [],
  'workFlow'   => file_exists($langPath . 'workFlow.php') ? require $langPath . 'workFlow.php' : [],
];

// Merge: App sobrescribe Framework si hay conflictos
return array_merge($frameworkTranslations, $appTranslations);