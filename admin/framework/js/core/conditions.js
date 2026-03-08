// ====================================================================
// OGCONDITIONS - FACHADA PRINCIPAL
// Integra: Core, Evaluator y Operators en una sola interfaz
// ====================================================================

class ogConditions {
  // Delegar propiedades al Core
  static get rules() { return ogConditionsCore.rules; }
  static get watchers() { return ogConditionsCore.watchers; }
  static get initialized() { return ogConditionsCore.initialized; }
  static get evaluateTimeout() { return ogConditionsCore.evaluateTimeout; }
  static get isFillingForm() { return ogConditionsCore.isFillingForm; }
  
  static set isFillingForm(value) { ogConditionsCore.isFillingForm = value; }

  // ============================================================================
  // MÉTODOS DEL CORE (Inicialización y Gestión)
  // ============================================================================
  
  static init(formId) {
    return ogConditionsCore.init(formId);
  }

  static setupRepeatableObserver(formId) {
    return ogConditionsCore.setupRepeatableObserver(formId);
  }

  static extractConditions(fields, rulesMap, parentPath = '') {
    return ogConditionsCore.extractConditions(fields, rulesMap, parentPath);
  }

  static setupWatchers(formId) {
    return ogConditionsCore.setupWatchers(formId);
  }

  static destroy(formId) {
    return ogConditionsCore.destroy(formId);
  }

  static debug(formId) {
    return ogConditionsCore.debug(formId);
  }

  // ============================================================================
  // MÉTODOS DEL EVALUATOR (Evaluación y Visibilidad)
  // ============================================================================
  
  static evaluate(formId) {
    return ogConditionsEvaluator.evaluate(formId);
  }

  static pauseEvaluations() {
    return ogConditionsEvaluator.pauseEvaluations();
  }

  static resumeEvaluations(formId) {
    return ogConditionsEvaluator.resumeEvaluations(formId);
  }

  static evaluateRepeatable(formEl, targetFieldPath, rule) {
    return ogConditionsEvaluator.evaluateRepeatable(formEl, targetFieldPath, rule);
  }

  static applyVisibilityToAll(formEl, fieldPath, shouldShow) {
    return ogConditionsEvaluator.applyVisibilityToAll(formEl, fieldPath, shouldShow);
  }

  static applyVisibilitySimple(formEl, fieldPath, shouldShow) {
    return ogConditionsEvaluator.applyVisibilitySimple(formEl, fieldPath, shouldShow);
  }

  static checkConditions(formEl, rule, targetFieldPath) {
    return ogConditionsEvaluator.checkConditions(formEl, rule, targetFieldPath);
  }

  static checkConditionsWithContext(context, rule) {
    return ogConditionsEvaluator.checkConditionsWithContext(context, rule);
  }

  static checkCondition(context, condition) {
    return ogConditionsEvaluator.checkCondition(context, condition);
  }

  static getContext(formEl, targetFieldPath, contextType) {
    return ogConditionsEvaluator.getContext(formEl, targetFieldPath, contextType);
  }

  static findFieldElement(formEl, fieldPath) {
    return ogConditionsEvaluator.findFieldElement(formEl, fieldPath);
  }

  // ============================================================================
  // MÉTODOS DE OPERATORS (Operadores y Utilidades)
  // ============================================================================
  
  static evalOperator(operator, fieldValue, targetValue) {
    return ogConditionsOperators.checkOperator(fieldValue, operator, targetValue);
  }

  static checkOperator(fieldValue, operator, targetValue) {
    return ogConditionsOperators.checkOperator(fieldValue, operator, targetValue);
  }

  static normalize(value) {
    return ogConditionsOperators.normalize(value);
  }

  static getFieldValue(fieldEl) {
    return ogConditionsOperators.getFieldValue(fieldEl);
  }

  static getFieldName(element) {
    return ogConditionsOperators.getFieldName(element);
  }
}

// Global
window.ogConditions = ogConditions;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.conditions = ogConditions;
}
/**
@doc-start
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
@doc-end
 */