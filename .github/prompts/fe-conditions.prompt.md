# Frontend — Conditions System

> formConditionsCore, formConditionsOperators, formConditionsEvaluator, conditions.
> Generado: 2026-03-08 14:28:20

---

### `framework/js/core/formConditionsCore.js`

```
FILE: framework/js/core/formConditionsCore.js
CLASS: ogConditionsCore
TYPE: core-form
PROMPT: fe-form

ROLE:
  Motor de condiciones de visibilidad de campos. Extrae las reglas del schema,
  configura watchers en los campos fuente y dispara evaluaciones al cambiar.
  Sub-módulo de ogConditions — no se usa directamente.

FLUJO init(formId):
  1. extractConditions() recorre todos los fields buscando field.conditions[]
  2. Construye rulesMap: fieldPath → { conditions[], operator }
  3. setupWatchers() → addEventListener 'change'/'input' en campos fuente
  4. setupRepeatableObserver() → MutationObserver para detectar nuevos items
  5. Evaluación inicial con timeout 50ms

ESTRUCTURA DE CONDICIÓN EN SCHEMA:
  {
    "conditions": [
      { "field": "tipo", "operator": "=", "value": "empresa" }
    ],
    "conditionsOperator": "AND"  // o "OR", default AND
  }

CONTEXTO DE EVALUACIÓN:
  Para campos en repeatables, getContext() obtiene los valores del mismo item
  (contexto 'sibling') o del formulario completo (contexto 'form').

PAUSA DURANTE FILL:
  isFillingForm = true suspende las evaluaciones mientras ogFormData.fill()
  está en ejecución para evitar parpadeos o efectos no deseados.

REGISTRO:
  window.ogConditionsCore
  ogFramework.core.conditionsCore
```

### `framework/js/core/formConditionsOperators.js`

```
FILE: framework/js/core/formConditionsOperators.js
CLASS: ogConditionsOperators
TYPE: core-form
PROMPT: fe-form

ROLE:
  Librería pura de operadores de comparación para el sistema de condiciones.
  checkOperator(fieldValue, operator, targetValue) → bool.
  Sin estado, sin efectos secundarios. Usado por ogConditionsEvaluator.

OPERADORES DISPONIBLES:
  =, ==, equals     → igualdad (normalizada, insensible a tipo)
  !=                → desigualdad
  >, <, >=, <=      → comparación numérica
  any               → fieldValue está en lista CSV de targetValue
  not-any           → fieldValue NO está en lista CSV
  empty             → vacío (null, '', [], undefined)
  not-empty         → no vacío
  contains          → fieldValue contiene targetValue (string)
  not-contains      → no contiene
  starts-with       → empieza con
  ends-with         → termina con

NORMALIZACIÓN:
  normalize(value) convierte a string en minúsculas para comparaciones
  insensibles a mayúsculas/minúsculas y tipo.

REGISTRO:
  window.ogConditionsOperators
  ogFramework.core.conditionsOperators
```

### `framework/js/core/formConditionsEvaluator.js`

```
FILE: framework/js/core/formConditionsEvaluator.js
CLASS: ogConditionsEvaluator
TYPE: core-form
PROMPT: fe-form

ROLE:
  Evaluación y aplicación de condiciones de visibilidad al DOM.
  Recorre todas las reglas del formulario, evalúa cada condición usando
  ogConditionsOperators y muestra/oculta los campos correspondientes.
  Sub-módulo de ogConditions — no se usa directamente.

FLUJO evaluate(formId):
  1. Por cada regla en rules.get(formId):
     a. getContext(formEl, targetFieldPath, contextType) → obtiene valor del campo fuente
     b. checkConditions() → evalúa array de conditions con operator AND/OR
     c. applyVisibilitySimple() → show/hide del .og-field-wrapper[data-path]
  2. Soporta evaluación dentro de repeatables (evaluateRepeatable)

APLICACIÓN DE VISIBILIDAD:
  applyVisibilitySimple(formEl, fieldPath, shouldShow)
    → añade/quita clase 'og-hidden' en el wrapper del campo
    → también oculta el label (og-field-label) si corresponde

  applyVisibilityToAll(formEl, fieldPath, shouldShow)
    → aplica a todos los elementos con ese data-path (útil en repeatables)

DEBOUNCE:
  Las evaluaciones disparadas por 'input' tienen debounce de 150ms para
  no ejecutarse en cada tecla al escribir en un campo de texto.

REGISTRO:
  window.ogConditionsEvaluator
  ogFramework.core.conditionsEvaluator
```

### `framework/js/core/conditions.js`

```
FILE: framework/js/core/conditions.js
CLASS: ogConditions
TYPE: core-form
PROMPT: fe-conditions

ROLE:
  Motor de condiciones para mostrar/ocultar campos dinámicamente según
  el valor de otros campos. ~200 líneas, sin dependencias.
  Se evalúa en tiempo real al cambiar cualquier campo del formulario.

CONFIG EN CAMPO:
  {
    "condition": [
      { "field": "pais",   "operator": "==",  "value": "EC" },
      { "field": "activo", "operator": "==",  "value": true }
    ],
    "conditionLogic":   "AND",   // 'AND'(default) | 'OR'
    "conditionContext": "form"   // 'form'(default) | 'view' | 'repeatable' | 'group'
  }

OPERADORES:
  ==          igual a
  !=          diferente de
  >           mayor que
  <           menor que
  >=          mayor o igual
  <=          menor o igual
  any         el valor está en la lista  → value: "rojo,verde,azul"
  not-any     el valor NO está en la lista
  empty       campo vacío
  not-empty   campo NO vacío
  contains    contiene el texto
  not-contains  NO contiene el texto

CONTEXTOS (conditionContext):
  form        → busca el campo trigger dentro del mismo formulario (default)
  view        → busca en toda la vista (útil con múltiples formularios)
  repeatable  → busca dentro del mismo item repeatable
  group       → busca dentro del mismo grupo

DEBUG:
  conditions.debug('form-id')   → imprime todas las reglas del formulario
  conditions.rules              → map de todas las reglas activas

REGISTRO:
  window.ogConditions
  ogFramework.core.conditions
```


---

### CONDICIONES — REFERENCIA JSON

```json
{
  "name": "campo",
  "condition": [
    { "field": "tipo",   "operator": "==", "value": "empresa" },
    { "field": "activo", "operator": "==", "value": true }
  ],
  "conditionLogic":   "AND",
  "conditionContext": "form"
}
```

`condition`: array de reglas. `conditionLogic` omitido = AND implícito.

**conditionContext:**
| Valor          | Cuándo usarlo |
|----------------|---------------|
| `"form"`       | Default. Busca el campo fuente en todo el formulario |
| `"repeatable"` | Busca el campo fuente dentro del mismo item del repeatable |
| `"view"`       | Contexto de vista (fuera de formulario) |
| `"group"`      | Dentro de un group |

**Condition en grouper** (oculta/muestra el grouper completo):
```json
{ "type": "grouper", "condition": [...], "conditionContext": "form", "groups": [...] }
```

**Condition en repeatable** (oculta/muestra el repeatable completo):
```json
{ "name": "fases", "type": "repeatable",
  "condition": [{ "field": "tiene_fases", "operator": "==", "value": true }],
  "conditionContext": "repeatable",
  "fields": [...]
}
```

**Condiciones encadenadas** (campo_c depende de campo_b que depende de campo_a) — funcionan sin configuración extra.

**Operadores disponibles:**
```
==, !=             → igualdad / desigualdad
>, <, >=, <=       → comparación numérica
any                → valor está en lista CSV: "value": "ec,co,pe"
not-any            → valor NO está en lista CSV
empty              → vacío (null, '', [], undefined)
not-empty          → no vacío
contains           → string contiene valor
not-contains       → string no contiene
starts-with        → empieza con
ends-with          → termina con
```