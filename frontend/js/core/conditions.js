class conditions {
  static rules = new Map();
  static watchers = new Map();
  static initialized = false;

  static init(formId) {
    if (!formId) return;

    const schema = window.form?.schemas?.get(formId);
    if (!schema || !schema.fields) return;

    // Limpiar reglas anteriores de este formulario
    this.rules.delete(formId);
    this.watchers.delete(formId);

    // Extraer todas las condiciones del schema
    const rulesMap = new Map();
    this.extractConditions(schema.fields, rulesMap, '');

    if (rulesMap.size === 0) return;

    this.rules.set(formId, rulesMap);

    // Configurar watchers
    this.setupWatchers(formId);

    // Evaluación inicial
    setTimeout(() => this.evaluate(formId), 50);
  }

  static extractConditions(fields, rulesMap, parentPath = '') {
    fields.forEach(field => {
      const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;

      // Si el campo tiene condiciones
      if (field.condition && Array.isArray(field.condition) && field.condition.length > 0) {
        rulesMap.set(fieldPath, {
          conditions: field.condition,
          context: field.conditionContext || 'form',
          logic: field.conditionLogic || 'AND' // AND | OR
        });
      }

      // Recursivo para repetibles
      if (field.type === 'repeatable' && field.fields) {
        this.extractConditions(field.fields, rulesMap, fieldPath);
      }
    });
  }

  static setupWatchers(formId) {
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
    const watcherId = window.events.on(
      `#${formId} input, #${formId} select, #${formId} textarea`,
      'change',
      (e) => {
        const fieldName = this.getFieldName(e.target);
        
        // Debug: ver qué campo cambió
        console.log('🔍 Campo cambiado:', fieldName, 'Valor:', e.target.value);
        
        if (watchedFields.has(fieldName)) {
          console.log('✅ Re-evaluando condiciones...');
          this.evaluate(formId);
        }
      },
      document
    );

    // También escuchar input para fields de texto (cambios en tiempo real)
    const inputWatcherId = window.events.on(
      `#${formId} input[type="text"], #${formId} input[type="email"], #${formId} input[type="number"], #${formId} textarea`,
      'input',
      (e) => {
        const fieldName = this.getFieldName(e.target);
        if (watchedFields.has(fieldName)) {
          this.evaluate(formId);
        }
      },
      document
    );

    this.watchers.set(formId, [watcherId, inputWatcherId]);
    
    console.log('👁️ Campos observados:', Array.from(watchedFields));
  }

  static evaluate(formId) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    const rulesMap = this.rules.get(formId);
    if (!rulesMap) return;

    rulesMap.forEach((rule, targetFieldPath) => {
      const { context } = rule;

      if (context === 'repeatable') {
        // Para contexto repeatable, evaluar cada item individualmente
        this.evaluateRepeatable(formEl, targetFieldPath, rule);
      } else {
        // Para otros contextos, evaluación normal
        const shouldShow = this.checkConditions(formEl, rule, targetFieldPath);
        this.applyVisibilitySimple(formEl, targetFieldPath, shouldShow);
      }
    });
  }

  static evaluateRepeatable(formEl, targetFieldPath, rule) {
    // Encontrar todos los repeatable-items
    const repeatableItems = formEl.querySelectorAll('.repeatable-item');
    
    if (repeatableItems.length === 0) {
      // Si no hay items todavía, ocultar todos los campos condicionales
      this.applyVisibilityToAll(formEl, targetFieldPath, false);
      return;
    }

    // Evaluar cada item individualmente
    repeatableItems.forEach(item => {
      const shouldShow = this.checkConditions(item, rule, targetFieldPath);
      
      // Buscar el campo target dentro de este item específico
      const pathParts = targetFieldPath.split('.');
      const fieldName = pathParts[pathParts.length - 1];
      
      const targetField = item.querySelector(`[name*=".${fieldName}"]`);
      if (targetField) {
        const fieldElement = targetField.closest('.form-group, .form-checkbox');
        
        if (fieldElement) {
          if (shouldShow) {
            fieldElement.style.display = '';
            fieldElement.classList.remove('wpfw-depend-on');
            targetField.disabled = false;
          } else {
            fieldElement.style.display = 'none';
            fieldElement.classList.add('wpfw-depend-on');
            targetField.disabled = true;
          }
        }
      }
    });
  }

  static applyVisibilityToAll(formEl, fieldPath, shouldShow) {
    const pathParts = fieldPath.split('.');
    const fieldName = pathParts[pathParts.length - 1];
    
    const matchingFields = formEl.querySelectorAll(`[name*=".${fieldName}"]`);
    
    matchingFields.forEach(field => {
      const fieldElement = field.closest('.form-group, .form-checkbox');
      
      if (fieldElement) {
        if (shouldShow) {
          fieldElement.style.display = '';
          fieldElement.classList.remove('wpfw-depend-on');
          field.disabled = false;
        } else {
          fieldElement.style.display = 'none';
          fieldElement.classList.add('wpfw-depend-on');
          field.disabled = true;
        }
      }
    });
  }

  static applyVisibilitySimple(formEl, fieldPath, shouldShow) {
    const fieldElement = this.findFieldElement(formEl, fieldPath);
    
    if (!fieldElement) {
      console.warn(`Conditions: No se encontró el elemento para "${fieldPath}"`);
      return;
    }

    if (shouldShow) {
      fieldElement.style.display = '';
      fieldElement.classList.remove('wpfw-depend-on');
      
      const inputs = fieldElement.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.disabled = false;
      });
    } else {
      fieldElement.style.display = 'none';
      fieldElement.classList.add('wpfw-depend-on');
      
      const inputs = fieldElement.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.disabled = true;
      });
    }
  }

  static checkConditions(formEl, rule, targetFieldPath) {
    const { conditions, logic, context } = rule;

    // Determinar el contexto de búsqueda
    const searchContext = this.getContext(formEl, targetFieldPath, context);

    if (logic === 'OR') {
      // Al menos una condición debe cumplirse
      return conditions.some(cond => this.checkCondition(searchContext, cond));
    } else {
      // Todas las condiciones deben cumplirse (AND por defecto)
      return conditions.every(cond => this.checkCondition(searchContext, cond));
    }
  }

  static checkCondition(context, condition) {
    const { field, operator, value } = condition;

    // Buscar el campo en el contexto
    let fieldEl = null;
    
    // Si el contexto es un repeatable-item, buscar solo dentro de él
    if (context.classList && context.classList.contains('repeatable-item')) {
      // Buscar por el nombre del campo sin índices
      const fields = context.querySelectorAll(`[name*=".${field}"]`);
      fieldEl = fields.length > 0 ? fields[0] : null;
      
      // Si no se encuentra, intentar con el nombre exacto
      if (!fieldEl) {
        fieldEl = context.querySelector(`[name="${field}"], [name*="${field}"]`);
      }
    } else {
      // Búsqueda normal en form/view
      fieldEl = context.querySelector(`[name="${field}"], [name*="${field}"]`);
    }
    
    if (!fieldEl) {
      console.warn(`Conditions: Campo "${field}" no encontrado en contexto`);
      return false;
    }

    const fieldValue = this.getFieldValue(fieldEl);

    return this.evalOperator(operator, fieldValue, value);
  }

  static evalOperator(operator, fieldValue, targetValue) {
    switch (operator) {
      case '==':
        return this.normalize(fieldValue) == this.normalize(targetValue);

      case '!=':
        return this.normalize(fieldValue) != this.normalize(targetValue);

      case '>':
        return parseFloat(fieldValue) > parseFloat(targetValue);

      case '<':
        return parseFloat(fieldValue) < parseFloat(targetValue);

      case '>=':
        return parseFloat(fieldValue) >= parseFloat(targetValue);

      case '<=':
        return parseFloat(fieldValue) <= parseFloat(targetValue);

      case 'any':
        // Si el valor del campo está en la lista separada por comas
        const anyList = String(targetValue).split(',').map(v => v.trim());
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(v => anyList.includes(String(v).trim()));
        }
        return anyList.includes(String(fieldValue).trim());

      case 'not-any':
        // Si el valor del campo NO está en la lista
        const notAnyList = String(targetValue).split(',').map(v => v.trim());
        if (Array.isArray(fieldValue)) {
          return !fieldValue.some(v => notAnyList.includes(String(v).trim()));
        }
        return !notAnyList.includes(String(fieldValue).trim());

      case 'empty':
        // Campo vacío (null, undefined, '', [])
        if (Array.isArray(fieldValue)) return fieldValue.length === 0;
        return !fieldValue || String(fieldValue).trim() === '';

      case 'not-empty':
        // Campo NO vacío
        if (Array.isArray(fieldValue)) return fieldValue.length > 0;
        return fieldValue && String(fieldValue).trim() !== '';

      case 'contains':
        // El campo contiene el texto
        return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());

      case 'not-contains':
        // El campo NO contiene el texto
        return !String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());

      default:
        console.warn(`Conditions: Operador desconocido "${operator}"`);
        return false;
    }
  }

  static normalize(value) {
    // Normalizar booleanos y strings
    if (value === true || value === 'true' || value === '1' || value === 1) return true;
    if (value === false || value === 'false' || value === '0' || value === 0) return false;
    return value;
  }

  static getFieldValue(fieldEl) {
    const type = fieldEl.type;
    const name = fieldEl.name;

    // Checkbox
    if (type === 'checkbox') {
      return fieldEl.checked;
    }

    // Radio buttons (buscar todos con el mismo name)
    if (type === 'radio') {
      const form = fieldEl.closest('form');
      const radios = form.querySelectorAll(`input[name="${name}"]`);
      const checked = Array.from(radios).find(r => r.checked);
      return checked ? checked.value : '';
    }

    // Select multiple
    if (fieldEl.tagName === 'SELECT' && fieldEl.multiple) {
      return Array.from(fieldEl.selectedOptions).map(opt => opt.value);
    }

    // Cualquier otro input
    return fieldEl.value;
  }

  static getFieldName(element) {
    const name = element.name || '';
    // Remover índices de repetibles: "proyectos[0].nombre" -> "nombre"
    // Extraer solo el último segmento después del punto
    const withoutIndexes = name.replace(/\[\d+\]/g, '');
    const parts = withoutIndexes.split('.');
    return parts[parts.length - 1]; // Retornar solo la última parte
  }

  static getContext(formEl, targetFieldPath, contextType) {
    switch (contextType) {
      case 'view':
        // Todo el documento
        return document;

      case 'form':
        // Solo dentro del formulario
        return formEl;

      case 'repeatable':
        // Dentro del repeatable más cercano
        const targetField = this.findFieldElement(formEl, targetFieldPath);
        if (targetField) {
          const repeatable = targetField.closest('.repeatable-item');
          return repeatable || formEl;
        }
        return formEl;

      case 'group':
        // Dentro del grupo más cercano (si existe)
        const targetFieldGroup = this.findFieldElement(formEl, targetFieldPath);
        if (targetFieldGroup) {
          const group = targetFieldGroup.closest('.form-group-container, .repeatable-item');
          return group || formEl;
        }
        return formEl;

      default:
        return formEl;
    }
  }

  static findFieldElement(formEl, fieldPath) {
    // Intentar encontrar por name exacto
    let field = formEl.querySelector(`[name="${fieldPath}"]`);
    if (field) return field.closest('.form-group, .form-checkbox');

    // Para repetibles: buscar considerando índices [0], [1], etc
    // Convertir "proyectos.tipo_proyecto" a selector que coincida con "proyectos[0].tipo_proyecto"
    const pathParts = fieldPath.split('.');
    if (pathParts.length > 1) {
      const baseField = pathParts[pathParts.length - 1]; // última parte
      
      // Buscar cualquier campo que termine con ese nombre
      const fields = formEl.querySelectorAll(`[name*=".${baseField}"]`);
      if (fields.length > 0) {
        // Si hay múltiples, devolver el contenedor del primero
        return fields[0].closest('.form-group, .form-checkbox');
      }
    }

    // Buscar por name parcial (fallback)
    field = formEl.querySelector(`[name*="${fieldPath}"]`);
    if (field) return field.closest('.form-group, .form-checkbox');

    return null;
  }

  static destroy(formId) {
    // Limpiar watchers
    const watchers = this.watchers.get(formId);
    if (watchers) {
      watchers.forEach(watcherId => {
        window.events?.off?.(watcherId);
      });
      this.watchers.delete(formId);
    }

    // Limpiar reglas
    this.rules.delete(formId);
  }

  static debug(formId) {
    console.group(`🔍 Conditions Debug: ${formId}`);
    
    const rules = this.rules.get(formId);
    if (!rules) {
      console.log('No hay reglas registradas para este formulario');
      console.groupEnd();
      return;
    }

    console.log('Reglas activas:', rules.size);
    rules.forEach((rule, fieldPath) => {
      console.log(`\n📋 Campo: ${fieldPath}`);
      console.log('  Contexto:', rule.context);
      console.log('  Lógica:', rule.logic);
      console.log('  Condiciones:', rule.conditions);
    });

    console.groupEnd();
  }
}

window.conditions = conditions;