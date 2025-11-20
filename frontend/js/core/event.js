class events {
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

      if (target.matches(selector)) {
        handler.call(target, e);
        return;
      }

      const closest = target.closest(selector);
      if (closest) {
        handler.call(closest, e);
        return;
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
    console.log('EVENT: Listeners activos:');
    this.listeners.forEach((listener, id) => {
      console.log(`  #${id}: ${listener.eventType} en ${listener.selector}`);
    });
  }
}

window.events = events;