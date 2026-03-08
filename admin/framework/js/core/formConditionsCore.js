class ogConditionsCore {
  static rules = new Map();
  static watchers = new Map();
  static initialized = false;
  static evaluateTimeout = null;
  static isFillingForm = false;

  static init(formId) {
    if (!formId) return;

    const form = ogModule('form');
    const schema = form?.schemas?.get(formId);
    if (!schema || !schema.fields) return;

    // Limpiar reglas anteriores de este formulario
    this.rules.delete(formId);
    this.watchers.delete(formId);

    // Extraer todas las condiciones del schema
    const rulesMap = new Map();
    this.extractConditions(schema.fields, rulesMap, '');

    if (rulesMap.size === 0) return;

    this.rules.set(formId, rulesMap);
    ogLogger?.info('core:conditions', `[init] 📋 Total de reglas extraídas: ${rulesMap.size} para formulario "${formId}"`);

    // Configurar watchers
    this.setupWatchers(formId);

    // Configurar observer para detectar nuevos items de repeatable
    this.setupRepeatableObserver(formId);

    // Evaluación inicial
    setTimeout(() => {
      const evaluator = ogModule('conditionsEvaluator');
      evaluator?.evaluate(formId);
    }, 50);
  }

  static setupRepeatableObserver(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    // Función recursiva para observar todos los contenedores de repetibles
    const observeRepeatableContainers = (rootElement) => {
      const repeatableContainers = rootElement.querySelectorAll('.og-repeatable-items');

      repeatableContainers.forEach(container => {
        // Verificar si ya está siendo observado para evitar duplicados
        if (container.dataset.conditionsObserved === 'true') {
          return;
        }

        // Marcar como observado
        container.dataset.conditionsObserved = 'true';

        // Crear un MutationObserver para detectar cuando se agregan nuevos items
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach(node => {
                // Solo procesar elementos (no nodos de texto)
                if (node.nodeType === 1 && node.classList.contains('og-repeatable-item')) {
                  // Solo observar repetibles anidados sin evaluar condiciones
                  observeRepeatableContainers(node);
                }
              });
            }
          });
        });

        // Observar cambios en los hijos del contenedor
        observer.observe(container, {
          childList: true,
          subtree: false
        });

        // Guardar referencia al observer para limpiarlo después
        if (!this.watchers.has(formId)) {
          this.watchers.set(formId, []);
        }
        const watchers = this.watchers.get(formId);
        watchers.push({ type: 'observer', observer, container });
      });
    };

    // Iniciar observación desde el formulario raíz
    observeRepeatableContainers(formEl);
  }

  static extractConditions(fields, rulesMap, parentPath = '') {
    fields.forEach((field, index) => {
      let fieldPath;

      // Construir fieldPath según el tipo de campo
      if (field.name) {
        fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
      } else if (field.type === 'grouper') {
        // Grouper sin name: usar índice como fallback
        fieldPath = parentPath ? `${parentPath}.__grouper_${index}` : `__grouper_${index}`;
      } else {
        // Otro tipo sin name: usar índice
        fieldPath = parentPath ? `${parentPath}.__field_${index}` : `__field_${index}`;
      }

      // Si el campo tiene condiciones
      if (field.condition && Array.isArray(field.condition) && field.condition.length > 0) {
        rulesMap.set(fieldPath, {
          conditions: field.condition,
          context: field.conditionContext || 'form',
          logic: field.conditionLogic || 'AND',
          isGrouper: field.type === 'grouper'
        });
      }

      // Recursivo para repetibles
      if (field.type === 'repeatable' && field.fields) {
        this.extractConditions(field.fields, rulesMap, fieldPath);
      }

      // Recursivo para grouper
      if (field.type === 'grouper') {
        if (field.groups && Array.isArray(field.groups)) {
          field.groups.forEach((group, groupIndex) => {
            if (group.fields && Array.isArray(group.fields)) {
              this.extractConditions(group.fields, rulesMap, parentPath);
            }
          });
        } else if (field.fields) {
          this.extractConditions(field.fields, rulesMap, parentPath);
        }
      }

      // Recursivo para groups
      if (field.type === 'group') {
        // Si el group tiene condiciones, extraerlas primero
        if (field.condition && Array.isArray(field.condition) && field.condition.length > 0) {
          rulesMap.set(fieldPath, {
            conditions: field.condition,
            context: field.conditionContext || 'form',
            logic: field.conditionLogic || 'AND',
            isGroup: true
          });
        }
        
        // Luego procesar campos internos
        if (field.fields) {
          this.extractConditions(field.fields, rulesMap, parentPath);
        }
      }
    });
  }

  static setupWatchers(formId) {
    const events = ogModule('events');
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    const rulesMap = this.rules.get(formId);
    const watchedFields = new Set();

    // Identificar qué campos necesitan ser observados
    rulesMap.forEach((rule, targetField) => {
      rule.conditions.forEach(cond => {
        watchedFields.add(cond.field);
      });
    });

    // Registrar evento de cambio delegado
    const watcherId = events.on(
      `#${formId} input, #${formId} select, #${formId} textarea`,
      'change',
      (e) => {
        // No evaluar si se está llenando el formulario
        if (this.isFillingForm) {
          return;
        }

        const operators = ogModule('conditionsOperators');
        const fieldName = operators?.getFieldName(e.target);
        if (watchedFields.has(fieldName)) {
          const evaluator = ogModule('conditionsEvaluator');
          evaluator?.evaluate(formId);
        }
      },
      document
    );

    // También escuchar input para fields de texto (cambios en tiempo real)
    const inputWatcherId = events.on(
      `#${formId} input[type="text"], #${formId} input[type="email"], #${formId} input[type="number"], #${formId} textarea`,
      'input',
      (e) => {
        // No evaluar si se está llenando el formulario
        if (this.isFillingForm) {
          return;
        }

        const operators = ogModule('conditionsOperators');
        const fieldName = operators?.getFieldName(e.target);
        if (watchedFields.has(fieldName)) {
          const evaluator = ogModule('conditionsEvaluator');
          evaluator?.evaluate(formId);
        }
      },
      document
    );

    // Inicializar array de watchers si no existe
    if (!this.watchers.has(formId)) {
      this.watchers.set(formId, []);
    }

    // Agregar los event listener IDs al array existente
    const watchers = this.watchers.get(formId);
    watchers.push(watcherId, inputWatcherId);
  }

  static destroy(formId) {
    // Limpiar watchers y observers
    const watchers = this.watchers.get(formId);
    if (watchers) {
      watchers.forEach(watcher => {
        if (typeof watcher === 'number') {
          // Es un event listener ID
          window.events?.off?.(watcher);
        } else if (watcher.type === 'observer') {
          // Es un MutationObserver
          watcher.observer.disconnect();

          // Limpiar marca de observado
          if (watcher.container) {
            delete watcher.container.dataset.conditionsObserved;
          }
        }
      });
      this.watchers.delete(formId);
    }

    // Limpiar reglas
    this.rules.delete(formId);
  }

  static debug(formId) {
    ogLogger?.info('core:conditions', `Debug: ${formId}`);

    const rules = this.rules.get(formId);
    if (!rules) {
      ogLogger?.info('core:conditions', 'No hay reglas registradas para este formulario');
      return;
    }

    ogLogger?.info('core:conditions', `Reglas activas: ${rules.size}`);
  }
}

// Global
window.ogConditionsCore = ogConditionsCore;

// Registrar en ogFramework
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.conditionsCore = ogConditionsCore;
}
/**
 * @doc-start
 * FILE: framework/js/core/formConditionsCore.js
 * CLASS: ogConditionsCore
 * TYPE: core-form
 * PROMPT: fe-form
 *
 * ROLE:
 *   Motor de condiciones de visibilidad de campos. Extrae las reglas del schema,
 *   configura watchers en los campos fuente y dispara evaluaciones al cambiar.
 *   Sub-módulo de ogConditions — no se usa directamente.
 *
 * FLUJO init(formId):
 *   1. extractConditions() recorre todos los fields buscando field.conditions[]
 *   2. Construye rulesMap: fieldPath → { conditions[], operator }
 *   3. setupWatchers() → addEventListener 'change'/'input' en campos fuente
 *   4. setupRepeatableObserver() → MutationObserver para detectar nuevos items
 *   5. Evaluación inicial con timeout 50ms
 *
 * ESTRUCTURA DE CONDICIÓN EN SCHEMA:
 *   {
 *     "conditions": [
 *       { "field": "tipo", "operator": "=", "value": "empresa" }
 *     ],
 *     "conditionsOperator": "AND"  // o "OR", default AND
 *   }
 *
 * CONTEXTO DE EVALUACIÓN:
 *   Para campos en repeatables, getContext() obtiene los valores del mismo item
 *   (contexto 'sibling') o del formulario completo (contexto 'form').
 *
 * PAUSA DURANTE FILL:
 *   isFillingForm = true suspende las evaluaciones mientras ogFormData.fill()
 *   está en ejecución para evitar parpadeos o efectos no deseados.
 *
 * REGISTRO:
 *   window.ogConditionsCore
 *   ogFramework.core.conditionsCore
 * @doc-end
 */
