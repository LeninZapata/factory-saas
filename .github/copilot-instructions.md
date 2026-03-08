# Copilot — Reglas de Estilo

## General
- Indentación: 2 espacios (nunca tabs)
- Archivos: máximo 450 líneas — si supera, considerar dividir en 2 archivos
- Comentarios: solo línea simple `//` — nunca bloques `/* */` ni `/** */`

## PHP
- Comillas: simples `'` por defecto — dobles `"` solo para HTML embebido en strings
- Nombres de archivos:
  - Controllers y Handlers → PascalCase: `ProductController.php`, `SaleHandler.php`
  - Schemas, rutas, helpers → minúsculas con guión: `product.json`, `sale.php`
- Return inline si ≤ 3 keys, multilínea si ≥ 4 keys:
  ```php
  return ['success' => true, 'id' => $id];          // ≤ 3 → inline
  return [                                            // ≥ 4 → multilínea
    'success' => true,
    'id'      => $id,
    'data'    => $data,
    'total'   => $total,
  ];
  ```

## JavaScript
- Comillas: dobles `"` por defecto — backticks solo para interpolación
- Punto y coma: sí, siempre
- Nombres de archivos JS: camelCase: `infoproductProduct.js`, `saleStats.js`
- Nombres de archivos JSON (vistas/forms): minúsculas con guiones: `categoria-form.json`, `product-list.json`
- Return inline si ≤ 3 keys, multilínea si ≥ 4 keys (igual que PHP)