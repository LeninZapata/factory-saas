/**
 * ActionHandler - Manejador de acciones genéricas
 * Abstrae las acciones para que funcionen en web Y React Native (futuro)
 *
 * Uso:
 * actionHandler.handle('navigate:products');
 * actionHandler.handle('modal:user-form');
 * actionHandler.handle('api:save', {data: {...}});
 */
class actionHandler {
  static handle(action, params = {}, context = {}) {
    if (!action || typeof action !== 'string') {
      logger.warn('cor:actionHandler', 'Acción inválida:', action);
      return;
    }

    // Formato: "tipo:valor" o "tipo:valor?param1=x&param2=y"
    const [fullAction, queryString] = action.split('?');
    const [type, value] = fullAction.split(':');

    if (!type || !value) {
      logger.warn('cor:actionHandler', 'Formato inválido:', action);
      return;
    }

    // Parsear query params si existen
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    logger.debug('cor:actionHandler', `Ejecutando: ${type}:${value}`, params);

    switch(type.toLowerCase()) {
      case 'navigate':
        return this.handleNavigate(value, params, context);

      case 'modal':
        return this.handleModal(value, params, context);

      case 'api':
        return this.handleApi(value, params, context);

      case 'custom':
        return this.handleCustom(value, params, context);

      default:
        logger.warn('cor:actionHandler', `Tipo de acción desconocido: ${type}`);
    }
  }

  static handleNavigate(screen, params, context) {
    logger.debug('cor:actionHandler', `Navigate to: ${screen}`, params);

    // Web: usar view.load()
    if (window.view && typeof view.load === 'function') {
      view.load(screen, context.container || null, params);
    }

    // React Native (futuro):
    // if (context.navigation) {
    //   context.navigation.navigate(screen, params);
    // }
  }

  static handleModal(viewPath, params, context) {
    logger.debug('cor:actionHandler', `Open modal: ${viewPath}`, params);

    if (window.modal && typeof modal.open === 'function') {
      modal.open(viewPath, params);
    } else {
      logger.error('cor:actionHandler', 'Modal no disponible');
    }
  }

  static async handleApi(endpoint, params, context) {
    logger.debug('cor:actionHandler', `API call: ${endpoint}`, params);

    const method = params.method || 'POST';

    if (!window.api) {
      logger.error('cor:actionHandler', 'API no disponible');
      return;
    }

    try {
      switch(method.toUpperCase()) {
        case 'GET':
          return await api.get(endpoint, params);
        case 'POST':
          return await api.post(endpoint, params.data || params);
        case 'PUT':
          return await api.put(endpoint, params.data || params);
        case 'DELETE':
          return await api.delete(endpoint);
        default:
          logger.warn('cor:actionHandler', `Método HTTP desconocido: ${method}`);
      }
    } catch (error) {
      logger.error('cor:actionHandler', `Error en API ${endpoint}:`, error);
      throw error;
    }
  }

  static handleCustom(functionName, params, context) {
    logger.debug('cor:actionHandler', `Custom function: ${functionName}`, params);

    // Buscar función en window
    if (window[functionName] && typeof window[functionName] === 'function') {
      return window[functionName](params, context);
    }

    logger.warn('cor:actionHandler', `Función custom no encontrada: ${functionName}`);
  }
}

window.actionHandler = actionHandler;