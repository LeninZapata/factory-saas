<?php
// middle/routes/docs-helpers.php
// Extractors y builders reutilizables para docs.php

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

$extractComments = function($filePath) {
  if (!file_exists($filePath)) return null;
  $content = file_get_contents($filePath);
  if (!$content) return null;
  $data = json_decode($content, true);
  if (!$data || !isset($data['_comments'])) return null;
  return $data['_comments'];
};

$commentsToText = function($comments, $indent = '') use (&$commentsToText) {
  $lines = [];
  foreach ($comments as $key => $value) {
    if (is_array($value)) {
      $lines[] = $indent . $key . ':';
      foreach ($commentsToText($value, $indent . '  ') as $line) {
        $lines[] = $line;
      }
    } else {
      $lines[] = $indent . $key . ': ' . $value;
    }
  }
  return $lines;
};

$buildSection = function($files) use ($extractDoc, &$backendPath) {
  $lines   = [];
  $missing = [];

  foreach ($files as $filePath) {
    $relativePath = 'backend/' . str_replace($backendPath . '/', '', $filePath);
    $doc = $extractDoc($filePath);

    if ($doc === null) {
      $missing[] = $relativePath;
      $lines[] = !file_exists($filePath)
        ? '> ⚠️ `' . $relativePath . '` — archivo no encontrado'
        : '> ⚠️ `' . $relativePath . '` — sin bloque `@doc-start`/`@doc-end`';
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

$buildSectionJs = function($files) use ($extractDoc, &$adminPath) {
  $lines   = [];
  $missing = [];

  foreach ($files as $filePath) {
    $relativePath = 'admin/' . str_replace($adminPath . '/', '', $filePath);
    $doc = $extractDoc($filePath);

    if ($doc === null) {
      $missing[] = $relativePath;
      $lines[] = !file_exists($filePath)
        ? '> ⚠️ `' . $relativePath . '` — archivo no encontrado'
        : '> ⚠️ `' . $relativePath . '` — sin bloque `@doc-start`/`@doc-end`';
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

$buildSectionJson = function($files) use ($extractComments, $commentsToText, &$adminPath) {
  $lines   = [];
  $missing = [];

  foreach ($files as $filePath) {
    $relativePath = 'admin/' . str_replace($adminPath . '/', '', $filePath);
    $comments = $extractComments($filePath);

    if ($comments === null) {
      $missing[] = $relativePath;
      $lines[] = !file_exists($filePath)
        ? '> ⚠️ `' . $relativePath . '` — archivo no encontrado'
        : '> ⚠️ `' . $relativePath . '` — sin clave `_comments`';
      $lines[] = '';
      continue;
    }

    $lines[] = '### `' . $relativePath . '`';
    $lines[] = '';
    $lines[] = '```';
    foreach ($commentsToText($comments) as $line) {
      $lines[] = $line;
    }
    $lines[] = '```';
    $lines[] = '';
  }

  return ['content' => implode("\n", $lines), 'missing' => $missing];
};