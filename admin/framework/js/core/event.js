class ogEvents {
  static listeners = new Map();
  static counter = 0;

  static on(selector, eventType, handler, context = document) {
    const id = ++this.counter;

    const listener = {
      id,
      selector,
      eventType,
      handler,
      context
    };

    this.listeners.set(id, listener);
    this.attach(listener);

    return id;
  }

  static attach(listener) {
    const { selector, eventType, handler, context } = listener;

    const delegatedHandler = (e) => {
      let target = e.target;

      if (!target || target.nodeType !== 1) return;

      if (target.matches && target.matches(selector)) {
        handler.call(target, e);
        return;
      }

      if (target.closest) {
        const closest = target.closest(selector);
        if (closest) {
          handler.call(closest, e);
          return;
        }
      }
    };

    context.addEventListener(eventType, delegatedHandler, true);
  }

  static refresh() {
    // Método mantenido para compatibilidad
  }

  static off(id) {
    if (this.listeners.has(id)) {
      this.listeners.delete(id);
    }
  }

  static clear() {
    this.listeners.clear();
  }

  static debug() {
    this.listeners.forEach((listener, id) => {
    });
  }
}

// Global
window.ogEvents = ogEvents;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.events = ogEvents;
}
/**
 * @doc-start
 * FILE: framework/js/core/event.js
 * CLASS: ogEvents
 * TYPE: core-util
 * PROMPT: fe-framework
 *
 * ROLE:
 *   Event delegation con IDs para cleanup. Envuelve addEventListener con
 *   soporte de delegación — el handler se dispara tanto si el target es
 *   el elemento exacto como si es un descendiente que hace matches(selector).
 *
 * USO:
 *   const id = ogEvents.on('.btn-save', 'click', (e) => save(), formContainer);
 *   ogEvents.off(id);    // elimina el listener por ID
 *   ogEvents.clear();    // elimina todos
 *
 * MÉTODOS:
 *   on(selector, eventType, handler, context?)  → retorna ID numérico del listener
 *   off(id)                                     → elimina listener por ID
 *   clear()                                     → elimina todos los listeners
 *
 * NOTA:
 *   El context por defecto es document. Pasar el contenedor del formulario
 *   o vista limita el scope del evento y evita colisiones.
 *
 * REGISTRO:
 *   window.ogEvents
 *   ogFramework.core.events
 * @doc-end
 */