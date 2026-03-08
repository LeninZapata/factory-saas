// Carga de datos (API y JSON local), normalización de respuestas y helpers de caché
class ogDatatableSource {
  static async loadData(config, extensionName) {
    const source = config.source;
    const api = ogModule('api');
    const cache = ogModule('cache');

    if (!source) {
      ogLogger.warn('com:datatable', 'No source specified');
      return [];
    }

    const cacheKey = `datatable_${source.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const cacheTTL = config.cacheTTL || 5 * 60 * 1000;

    try {
      const appConfig = ogDatatableCore.getConfig();
      const isApi = source.startsWith('api/');
      const isExternal = source.startsWith('http://') || source.startsWith('https://');
      const isAbsolute = source.startsWith('/');
      const hasExtensions = source.startsWith('extensions/');
      const hasPipe = source.includes('|');

      let finalUrl;
      let data;

      if (isApi) {
        const response = await api.get(source);
        data = this.normalizeData(response);
        cache.set(cacheKey, data, cacheTTL);

      } else if (isExternal) {
        finalUrl = source;

      } else if (isAbsolute) {
        finalUrl = `${appConfig.baseUrl || '/'}${source.substring(1)}`;

      } else if (hasPipe) {
        // Notación extension|path (ej: ejemplos|mock/users-mock.json)
        const [extName, restPath] = source.split('|');
        const extensionsBase = appConfig.extensionsPath || `${appConfig.baseUrl}app/extensions/`;
        finalUrl = `${extensionsBase}${extName}/${restPath}`;

      } else if (hasExtensions) {
        finalUrl = `${appConfig.baseUrl || '/'}${source}`;

      } else {
        let extName = extensionName;
        let restPath = source;

        if (!extName && source.includes('/')) {
          const parts = source.split('/');
          extName = parts[0];
          restPath = parts.slice(1).join('/');
        }

        const extensionsBase = appConfig.extensionsPath || `${appConfig.baseUrl}app/extensions/`;

        if (extName) {
          finalUrl = `${extensionsBase}${extName}/${restPath}`;
        } else {
          finalUrl = `${appConfig.baseUrl || '/'}${source}`;
        }
      }

      if (finalUrl) {
        const cacheBuster = `?v=${appConfig.version || '1.0.0'}`;
        const response = await fetch(finalUrl + cacheBuster);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        data = await response.json();
        data = this.normalizeData(data);
        cache.set(cacheKey, data, cacheTTL);
      }

      return data;

    } catch (error) {
      ogLogger.error('com:datatable', `Error cargando datos desde ${source}:`, error);

      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        ogLogger.warn('com:datatable', `Usando datos cacheados debido a error: ${cacheKey}`);
        return cachedData;
      }

      return [];
    }
  }

  static normalizeData(response) {
    if (!response) return [];

    if (Array.isArray(response)) return response;

    if (typeof response === 'object' && response.data !== undefined) {
      if (Array.isArray(response.data)) return response.data;
      ogLogger.warn('com:datatable', 'response.data exists but is not an array', response.data);
      return [];
    }

    if (typeof response === 'object' && response.results !== undefined) {
      if (Array.isArray(response.results)) return response.results;
      ogLogger.warn('com:datatable', 'response.results exists but is not an array', response.results);
      return [];
    }

    if (typeof response === 'object' && response.items !== undefined) {
      if (Array.isArray(response.items)) return response.items;
      ogLogger.warn('com:datatable', 'response.items exists but is not an array', response.items);
      return [];
    }

    if (typeof response === 'object' && response.success !== undefined && !response.data) {
      ogLogger.warn('com:datatable', 'Response has success but no data property - returning empty array', response);
      return [];
    }

    if (typeof response === 'object' && Object.keys(response).length > 0) {
      const hasDataFields = Object.keys(response).some(key =>
        !['success', 'message', 'error', 'status'].includes(key)
      );
      if (hasDataFields) return [response];
    }

    ogLogger.warn('com:datatable', 'Unexpected response format - returning empty array', response);
    return [];
  }

  static getCached(source) {
    const cache = ogModule('cache');
    const cacheKey = `datatable_${source.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const cached = cache.get(cacheKey);

    if (!cached) return null;
    if (Array.isArray(cached)) return cached;
    if (cached.data && Array.isArray(cached.data)) return cached.data;
    if (typeof cached === 'object') return [cached];

    return null;
  }

  static findInCache(source, id, idField = 'id') {
    const data = this.getCached(source);
    if (!data || !Array.isArray(data)) return null;
    return data.find(item => item[idField] == id);
  }

  static filterInCache(source, filterFn) {
    const data = this.getCached(source);
    if (!data || !Array.isArray(data)) return [];
    return data.filter(filterFn);
  }

  static clearCache(source) {
    const cache = ogModule('cache');
    const cacheKey = `datatable_${source.replace(/[^a-zA-Z0-9]/g, '_')}`;
    cache.delete(cacheKey);
  }
}

window.ogDatatableSource = ogDatatableSource;
/**
 * @doc-start
 * FILE: framework/js/components/datatableSource.js
 * CLASS: ogDatatableSource
 * TYPE: component-internal
 * PROMPT: fe-components
 *
 * ROLE:
 *   Carga y normalización de datos para el datatable. Soporta múltiples
 *   formatos de source y mantiene una caché propia por source URL.
 *   Sub-módulo de ogDatatable — no se usa directamente.
 *
 * FORMATOS DE SOURCE:
 *   'api/users'                  → GET relativo via ogApi
 *   'https://...'                → fetch externo directo
 *   '/ruta/absoluta.json'        → relativo a baseUrl
 *   'extensions/admin/mock.json' → ruta desde baseUrl
 *   'admin|mock/users.json'      → notación extensión con pipe
 *   'js/views/mock/data.json'    → ruta framework
 *
 * NORMALIZACIÓN (normalizeData):
 *   Acepta respuestas del backend en cualquier formato:
 *   { success, data: [] }  →  extrae data
 *   { data: [] }           →  extrae data
 *   []                     →  usa directamente
 *   Siempre retorna un array plano.
 *
 * CACHÉ:
 *   getCached(source)               → retorna datos cacheados por source
 *   findInCache(source, id, field)  → busca un ítem por ID en cache (para modales de edición)
 *   filterInCache(source, fn)       → filtra items en cache (para búsquedas locales)
 *   clearCache(source)              → invalida cache de un source específico
 *
 * REGISTRO:
 *   window.ogDatatableSource
 *   ogFramework.components.datatableSource
 * @doc-end
 */