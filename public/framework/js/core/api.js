class api {
  static baseURL = window.BASE_URL || window.appConfig?.api?.baseURL || '';
  static headers = { 'Content-Type': 'application/json', ...window.appConfig?.api?.headers };

  static async request(endpoint, options = {}) {
    // ✅ Normalizar URL: eliminar slashes duplicados (excepto en protocolo)
    let fullURL = `${this.baseURL}${endpoint}`;

    // Separar protocolo del resto
    const protocolMatch = fullURL.match(/^(https?:\/\/)/);
    const protocol = protocolMatch ? protocolMatch[1] : '';
    const urlWithoutProtocol = protocol ? fullURL.slice(protocol.length) : fullURL;

    // Eliminar slashes duplicados en la ruta
    const normalizedPath = urlWithoutProtocol.replace(/\/+/g, '/');

    // Reconstruir URL
    fullURL = protocol + normalizedPath;

    // 🔍 Log temporal para debug
    logger.info('cor:api', `📡 Ejecutando: ${options.method || 'GET'} ${fullURL}`);

    const headers = { ...this.headers };
    const token = auth?.getToken?.();
    
    console.log(`token:`, token);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      logger.debug('cor:api', `🔑 Token incluido: ${token.substring(0, 20)}...`);
    } else {
      logger.warn('cor:api', '⚠️ NO se encontró token para esta petición');
    }

    try {
      const res = await fetch(fullURL, { ...options, headers });

      // Manejo mejorado de 401
      if (res.status === 401) {
        if (auth?.isAuthenticated?.()) {
          logger.warn('cor:api', 'Token inválido (401), cerrando sesión');
          auth.handleExpiredSession();
        }
        throw new Error('No autorizado');
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      logger.error('cor:api', `Error: ${fullURL}`, error.message);
      throw error;
    }
  }

  static get = (e) => this.request(e);
  static post = (e, d) => this.request(e, { method: 'POST', body: JSON.stringify(d) });
  static put = (e, d) => this.request(e, { method: 'PUT', body: JSON.stringify(d) });
  static delete = (e) => this.request(e, { method: 'DELETE' });
}

window.api = api;