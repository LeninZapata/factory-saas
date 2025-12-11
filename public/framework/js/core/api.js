class api {
  static baseURL = window.BASE_URL || window.appConfig?.api?.baseURL || '';
  static headers = { 'Content-Type': 'application/json', ...window.appConfig?.api?.headers };

  static async request(endpoint, options = {}) {
    // Normalizar URL: eliminar slashes duplicados (excepto en protocolo)
    let fullURL = `${this.baseURL}${endpoint}`;

    // Separar protocolo del resto
    const protocolMatch = fullURL.match(/^(https?:\/\/)/);
    const protocol = protocolMatch ? protocolMatch[1] : '';
    const urlWithoutProtocol = protocol ? fullURL.slice(protocol.length) : fullURL;

    // Eliminar slashes duplicados en la ruta
    const normalizedPath = urlWithoutProtocol.replace(/\/+/g, '/');

    // Reconstruir URL
    fullURL = protocol + normalizedPath;

    logger.info('core:api', `📡 Ejecutando: ${options.method || 'GET'} ${fullURL}`);

    const headers = { ...this.headers };
    const token = auth?.getToken?.();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      logger.debug('core:api', `🔐 Token incluido: ${token.substring(0, 20)}...`);
    } else {
      logger.warn('core:api', '⚠️ NO se encontró token para esta petición');
    }

    try {
      const res = await fetch(fullURL, { ...options, headers });

      // Manejo mejorado de 401
      if (res.status === 401) {
        if (auth?.isAuthenticated?.()) {
          logger.warn('core:api', 'Token inválido (401), cerrando sesión');
          auth.handleExpiredSession();
        }
        throw new Error('No autorizado');
      }

      if (!res.ok) {
        // ❌ Error HTTP - intentar obtener detalles
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          // Dice ser JSON - pero puede estar corrupto
          const text = await res.text();

          try {
            const errorData = JSON.parse(text);
            logger.error('core:api', `❌ Error ${res.status}:`, errorData);
            throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
          } catch (parseError) {
            // JSON corrupto - probablemente tiene HTML mezclado
            logger.error('core:api', `❌ Error ${res.status} - JSON corrupto (contiene HTML/PHP)`);

            console.group(`🚨 JSON Corrupto - ${fullURL}`);
            console.error('Status:', res.status);
            console.error('Content-Type:', contentType);
            console.error('Parse Error:', parseError.message);
            console.log('--- RESPUESTA COMPLETA (con HTML mezclado) ---');
            console.log(text);
            console.log('--- FIN RESPUESTA ---');
            console.groupEnd();

            // Intentar extraer mensaje útil
            const errorMatch = text.match(/<b>(Warning|Fatal error|Error)<\/b>:([^<]+)/);
            const errorMsg = errorMatch ? errorMatch[2].trim() : 'JSON corrupto con HTML mezclado';

            throw new Error(`Backend Error: ${errorMsg}`);
          }
        } else if (contentType.includes('text/html')) {
          // Es HTML puro
          const htmlError = await res.text();
          logger.error('core:api', `❌ Error ${res.status} - Respuesta HTML del backend:`);

          console.group(`🚨 Error HTML Backend - ${fullURL}`);
          console.error('Status:', res.status);
          console.error('Content-Type:', contentType);
          console.log('--- HTML COMPLETO ---');
          console.log(htmlError);
          console.log('--- FIN HTML ---');
          console.groupEnd();

          const errorMatch = htmlError.match(/<b>(Warning|Fatal error|Error)<\/b>:([^<]+)/);
          const errorMsg = errorMatch ? errorMatch[2].trim() : 'Error en el backend (HTML)';

          throw new Error(`Backend Error: ${errorMsg}`);
        } else {
          // Otro tipo de contenido
          const textError = await res.text();
          logger.error('core:api', `❌ Error ${res.status} - Content-Type: ${contentType}`);
          console.error('Respuesta completa:', textError);
          throw new Error(`HTTP ${res.status}: ${textError.substring(0, 100)}`);
        }
      }

      // ✅ Respuesta exitosa - verificar tipo de contenido
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // Dice ser JSON - pero verificar que realmente lo sea
        const text = await res.text();

        try {
          return JSON.parse(text);
        } catch (parseError) {
          // ⚠️ JSON corrupto en respuesta exitosa (200)
          logger.error('core:api', `⚠️ Respuesta exitosa pero JSON corrupto:`);

          console.group(`⚠️ JSON Corrupto (200 OK) - ${fullURL}`);
          console.warn('Status:', res.status);
          console.warn('Content-Type:', contentType);
          console.error('Parse Error:', parseError.message);
          console.log('--- RESPUESTA COMPLETA (con HTML/PHP mezclado) ---');
          console.log(text);
          console.log('--- FIN RESPUESTA ---');
          console.groupEnd();

          throw new Error('Backend devolvió JSON corrupto (contiene HTML/PHP warnings)');
        }
      } else if (contentType.includes('text/html')) {
        // Backend devolvió HTML cuando esperábamos JSON
        const htmlResponse = await res.text();
        logger.error('core:api', `⚠️ Backend devolvió HTML en lugar de JSON:`);

        console.group(`⚠️ Respuesta HTML inesperada - ${fullURL}`);
        console.warn('Status:', res.status, '(success)');
        console.warn('Content-Type:', contentType);
        console.log('--- HTML COMPLETO ---');
        console.log(htmlResponse);
        console.log('--- FIN HTML ---');
        console.groupEnd();

        throw new Error('Backend devolvió HTML en lugar de JSON');
      } else {
        // Otro tipo de contenido
        const text = await res.text();
        logger.warn('core:api', `⚠️ Content-Type inesperado: ${contentType}`);
        console.warn('Respuesta:', text);

        // Intentar parsear como JSON de todas formas
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Respuesta no es JSON: ${contentType}`);
        }
      }

    } catch (error) {
      logger.error('core:api', `Error: ${fullURL}`, error.message);
      throw error;
    }
  }

  static get = (e) => this.request(e);
  static post = (e, d) => this.request(e, { method: 'POST', body: JSON.stringify(d) });
  static put = (e, d) => this.request(e, { method: 'PUT', body: JSON.stringify(d) });
  static delete = (e) => this.request(e, { method: 'DELETE' });
}

window.api = api;