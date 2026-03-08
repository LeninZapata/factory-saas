class ogApi {

  static getConfig(options = {}) {
    // Si viene contexto en las opciones, usarlo (prioridad)
    if (options._context) {
      return options._context;
    }

    // Fallback a activeConfig
    return window.ogFramework?.activeConfig || {};
  }

  static getBaseURL(options = {}) {
    const config = this.getConfig(options);

    // Usar apiBaseUrl si existe, sino usar baseUrl sin /admin/
    if (config.apiBaseUrl) {
      return config.apiBaseUrl;
    }

    // Fallback: remover /admin/ de baseUrl
    let baseUrl = config.baseUrl || '';
    baseUrl = baseUrl.replace(/\/admin\/?$/, '/');

    return baseUrl || config.api?.baseURL || '';
  }

  static getHeaders(options = {}) {
    const config = this.getConfig(options);
    return {
      'Content-Type': 'application/json',
      ...config.api?.headers
    };
  }

  static async request(endpoint, options = {}) {
    const baseURL = this.getBaseURL(options);
    let fullURL = `${baseURL}${endpoint}`;

    const protocolMatch = fullURL.match(/^(https?:\/\/)/);
    const protocol = protocolMatch ? protocolMatch[1] : '';
    const urlWithoutProtocol = protocol ? fullURL.slice(protocol.length) : fullURL;
    const normalizedPath = urlWithoutProtocol.replace(/\/+/g, '/');
    fullURL = protocol + normalizedPath;

    const config = this.getConfig(options);

    const headers = { ...this.getHeaders(options) };
    const auth = ogModule('auth');
    const toast = ogModule('toast');

    if (!options.skipAuth) {
      const token = auth?.getToken?.();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;

        if (config.isDevelopment) {
          const tokenDisplay = token.substring(0, 20) + '...';
          ogLogger.info('core:api', `🔑 Token incluido: ${tokenDisplay}`);
        }
      } else {
        ogLogger.warn('core:api', '⚠️ NO se encontró token para esta petición');
      }
    }

    try {
      const res = await fetch(fullURL, { ...options, headers });

      if (res.status === 400) {

        ogLogger.error('core:api', `❌ Bad Request (400) - ${fullURL}`);

        const contentType = res.headers.get('content-type') || '';
        let errorMsg = window.__?.('core.api.bad_request') || 'Bad Request';

        if (contentType.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (parseError) {}
        }

        toast.error(errorMsg);

        throw new Error(errorMsg);
      }

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const text = await res.text();

          try {
            let errorData;

            try {
              errorData = JSON.parse(text);
            } catch (parseError) {
              // Si falla el parsing, usar el texto directamente
              errorData = { error: text };
            }

            const errorMsg = errorData.message || errorData.error || `HTTP ${res.status}`;

            // MANEJO ESPECIAL PARA ERROR 401 (Unauthorized)
            if (res.status === 401) {
              ogLogger.warn('core:api', '🔒 Sesión expirada o no autorizado - redirigiendo a login');

              // Mostrar mensaje al usuario
              toast.error(errorMsg);
              /*if (typeof ogToast.error === 'function') {
              }*/

              // Redirigir al login después de un breve delay
              setTimeout(() => {
                if (window.ogFramework?.core?.auth?.showLogin) {
                  window.ogFramework.core.auth.showLogin();
                } else if (window.ogAuth?.showLogin) {
                  window.ogAuth.showLogin();
                } else {
                  // Fallback: recargar la página para forzar login
                  window.location.reload();
                }
              }, 1500);

              throw new Error(errorMsg);
            }else {
              ogLogger.error('core:api', `❌ Error#: (${res.status}) - ${fullURL}`);
              // Mostrar mensaje al usuario
              // toast.error(errorMsg);
            }

            // Para otros errores, solo mostrar toast
            if (typeof toast.error === 'function') {
              toast.error(errorMsg);
            }

            throw new Error(errorMsg);

          } catch (parseError) {

            // Si es error 401 que lanzamos nosotros, re-lanzarlo
            if (res.status === 401) {
              throw parseError;
            }

            ogLogger.error('core:api', `❌ Error ${res.status} - JSON corrupto`);

            console.group(`🚨 JSON Corrupto - ${fullURL}`);
            console.error('Status:', res.status);
            console.error('Content-Type:', contentType);
            console.error('Parse Error:', parseError.message);
            console.log('--- RESPUESTA COMPLETA ---');
            console.log(text);
            console.groupEnd();

            const errorMatch = text.match(/<b>(Warning|Fatal error|Error)<\/b>:([^<]+)/);
            const errorMsg = errorMatch ? errorMatch[2].trim() : (window.__?.('core.api.json_corrupted') || 'JSON corrupto');
            throw new Error(`${window.__?.('core.api.backend_error') || 'Error de backend'}: ${errorMsg}`);
          }
        } else if (contentType.includes('text/html')) {
          const htmlError = await res.text();

          ogLogger.error('core:api', `❌ Error ${res.status} - Respuesta HTML`);

          console.group(`🚨 Error HTML Backend - ${fullURL}`);
          console.error('Status:', res.status);
          console.log(htmlError);
          console.groupEnd();

          const errorMatch = htmlError.match(/<b>(Warning|Fatal error|Error)<\/b>:([^<]+)/);
          const errorMsg = errorMatch ? errorMatch[2].trim() : (window.__?.('core.api.backend_error') || 'Error de backend');
          throw new Error(`${window.__?.('core.api.backend_error') || 'Error de backend'}: ${errorMsg}`);
        } else {
          const textError = await res.text();

          ogLogger.error('core:api', `❌ Error ${res.status}`);

          throw new Error(`HTTP ${res.status}: ${textError.substring(0, 100)}`);
        }
      }

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const text = await res.text();

        try {
          return JSON.parse(text);
        } catch (parseError) {

          ogLogger.error('core:api', `⚠️ Respuesta exitosa pero JSON corrupto`);

          console.group(`⚠️ JSON Corrupto (200 OK) - ${fullURL}`);
          console.warn('Status:', res.status);
          console.error('Parse Error:', parseError.message);
          console.log(text);
          console.groupEnd();

          throw new Error(window.__?.('core.api.json_corrupted_success') || 'JSON corrupto en respuesta exitosa');
        }
      } else if (contentType.includes('text/html')) {
        const htmlResponse = await res.text();

        ogLogger.error('core:api', `⚠️ Backend devolvió HTML en lugar de JSON`);

        console.group(`⚠️ Respuesta HTML inesperada - ${fullURL}`);
        console.log(htmlResponse);
        console.groupEnd();

        throw new Error(window.__?.('core.api.html_instead_json') || 'Backend devolvió HTML en lugar de JSON');
      } else {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`${window.__?.('core.api.invalid_content_type') || 'Content-Type inválido'}: ${contentType}`);
        }
      }

    } catch (error) {

      ogLogger.error('core:api', `Error: ${fullURL}`, error.message);
      throw error;
    }
  }

  static get = (e, opts = {}) => this.request(e, opts);
  static post = (e, d, opts = {}) => this.request(e, { method: 'POST', body: JSON.stringify(d), ...opts });
  static put = (e, d, opts = {}) => this.request(e, { method: 'PUT', body: JSON.stringify(d), ...opts });
  static delete = (e, opts = {}) => this.request(e, { method: 'DELETE', ...opts });
}

// Global
window.ogApi = ogApi;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.api = ogApi;
}
/**
 * @doc-start
 * FILE: framework/js/core/api.js
 * CLASS: ogApi
 * TYPE: core-service
 * PROMPT: fe-core-services
 *
 * ROLE:
 *   HTTP client con autenticación Bearer automática, manejo de errores 401/400
 *   y soporte de contexto multi-instancia. Todos los requests pasan por request().
 *   En 401 dispara el flujo de logout de auth automáticamente.
 *
 * MÉTODOS:
 *   get(endpoint, opts?)              → GET
 *   post(endpoint, data, opts?)       → POST con JSON body
 *   put(endpoint, data, opts?)        → PUT con JSON body
 *   delete(endpoint, opts?)           → DELETE
 *   request(endpoint, opts?)          → método base, todos los anteriores lo usan
 *
 * AUTENTICACIÓN:
 *   Lee el token desde ogAuth (si existe) y lo agrega como Authorization: Bearer {token}.
 *   En respuesta 401 → llama ogAuth.logout() automáticamente.
 *
 * BASE URL:
 *   Usa apiBaseUrl del config activo. Si no existe, deriva de baseUrl removiendo /admin/.
 *   Los endpoints deben comenzar con /api/... (ej: '/api/user')
 *
 * MULTI-CONTEXTO:
 *   opts._context → permite pasar una config específica en vez de usar activeConfig.
 *   Usado por ogApp(slug).api para requests contextualizados por instancia.
 *
 * RESPUESTA ESPERADA DEL BACKEND:
 *   { success: true, data: {...} }   → éxito
 *   { success: false, message: '' }  → error de negocio
 *
 * USO:
 *   const res = await ogApi.get('/api/user');
 *   const res = await ogApi.post('/api/user', { name: 'Juan' });
 *   if (res.success) { ... }
 *
 * REGISTRO:
 *   window.ogApi
 *   ogFramework.core.api
 * @doc-end
 */