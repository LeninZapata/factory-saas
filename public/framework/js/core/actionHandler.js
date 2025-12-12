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
    
    // Parsear query params si existen
    const [fullAction, queryString] = action.split('?');
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((val, key) => {
        params[key] = val;
      });
    }
    
    const [type, ...valueParts] = fullAction.split(':');
    const value = valueParts.join(':'); // Por si el valor tiene ':'
    
    if (!type || !value) {
      logger.warn('cor:actionHandler', 'Formato inválido:', action);
      return;
    }
    
    logger.debug('cor:actionHandler', `Ejecutando: ${type}:${value}`, params);
    
    switch(type.toLowerCase()) {
      case 'navigate':
        return this.handleNavigate(value, params, context);
        
      case 'modal':
        return this.handleModal(value, params, context);
        
      case 'api':
        return this.handleApi(value, params, context);
        
      case 'call':
      case 'method':
        return this.handleMethodCall(value, params, context);
        
      case 'custom':
        return this.handleCustom(value, params, context);
        
      default:
        logger.warn('cor:actionHandler', `Tipo de acción desconocido: ${type}`);
    }
  }
  
  static handleNavigate(screen, params, context) {
    logger.debug('cor:actionHandler', `Navigate to: ${screen}`, params);
    
    // Web: usar view.loadView()
    if (window.view && typeof view.loadView === 'function') {
      view.loadView(screen, context.container || null, context.extensionContext || null, null, null, context.menuId || null);
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

  static handleMethodCall(methodPath, params, context) {
    try {
      // Formato: "object.method:param1:param2:param3"
      // Ejemplo: "toast.success:Guardado correctamente"
      // Ejemplo: "toast.info:Usuario actualizado:5000"
      
      const parts = methodPath.split(':');
      const objectMethod = parts[0]; // "toast.success"
      const args = parts.slice(1); // ["Guardado correctamente"]
      
      // Separar objeto y método
      const methodParts = objectMethod.split('.');
      
      if (methodParts.length === 1) {
        // Función global simple: "alert:Hola"
        const funcName = methodParts[0];
        if (typeof window[funcName] === 'function') {
          logger.debug('cor:actionHandler', `Llamando función global: ${funcName}`, args);
          return window[funcName](...args);
        } else {
          logger.error('cor:actionHandler', `Función global no encontrada: ${funcName}`);
          return;
        }
      }
      
      // Objeto.método: "toast.success"
      let obj = window;
      for (let i = 0; i < methodParts.length - 1; i++) {
        obj = obj[methodParts[i]];
        if (!obj) {
          logger.error('cor:actionHandler', `Objeto no encontrado: ${methodParts.slice(0, i + 1).join('.')}`);
          return;
        }
      }
      
      const methodName = methodParts[methodParts.length - 1];
      const method = obj[methodName];
      
      if (typeof method !== 'function') {
        logger.error('cor:actionHandler', `Método no es una función: ${objectMethod}`);
        return;
      }
      
      logger.debug('cor:actionHandler', `Llamando: ${objectMethod}(${args.join(', ')})`);
      return method.apply(obj, args);
      
    } catch (error) {
      logger.error('cor:actionHandler', `Error ejecutando método: ${methodPath}`, error);
    }
  }
}

window.actionHandler = actionHandler;