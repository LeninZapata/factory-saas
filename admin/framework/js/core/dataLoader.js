class ogDataLoader {


  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  static async load(config, extensionName = null) {
    const type = config.type || 'auto';

    if (type === 'auto') {
      return await this.loadAuto(config, extensionName);
    }

    if (type === 'api') {
      return await this.loadFromApi(config);
    }

    if (type === 'mock') {
      return await this.loadFromMock(config, extensionName);
    }

    ogLogger?.error('core:dataLoader', `Tipo de dataSource no válido: ${type}`);
    return null;
  }

  static async loadAuto(config, extensionName) {

    const hook = ogModule('hook');
    const pluginConfig = extensionName ? hook?.getPluginConfig(extensionName) : null;
    const backendEnabled = pluginConfig?.backend?.enabled || false;

    const apiEnabled = config.api?.enabled !== false;

    if (backendEnabled && apiEnabled && config.api?.endpoint) {
      try {
        return await this.loadFromApi(config.api);
      } catch (error) {
        ogLogger?.warn('core:dataLoader', `API falló, fallback a mock: ${error.message}`);
        return await this.loadFromMock(config.mock, extensionName);
      }
    }

    return await this.loadFromMock(config.mock, extensionName);
  }

  static async loadFromApi(apiConfig) {
    const api = ogModule('api');
    const endpoint = apiConfig.endpoint;
    const method = apiConfig.method || 'GET';

    try {
      let response;

      if (method === 'GET') {
        response = await api.get(endpoint);
      } else if (method === 'POST') {
        response = await api.post(endpoint, apiConfig.body || {});
      } else if (method === 'PUT') {
        response = await api.put(endpoint, apiConfig.body || {});
      } else if (method === 'DELETE') {
        response = await api.delete(endpoint);
      }

      if (response.success && response.data) {
        return response.data;
      }

      return response;

    } catch (error) {
      ogLogger?.error('core:dataLoader', `Error en API ${endpoint}: ${error.message}`);
      throw error;
    }
  }

  static async loadFromMock(mockConfig, extensionName) {
    
    if (!mockConfig || !mockConfig.file) {
      ogLogger?.error('core:dataLoader', 'No se especificó archivo mock');
      return null;
    }

    try {
      const globalConfig = this.getConfig();
      const BASE_URL = globalConfig.baseUrl || '/';
      const VERSION = globalConfig.version || '1.0.0';

      let mockPath;

      if (extensionName) {
        mockPath = `${BASE_URL}extensions/${extensionName}/${mockConfig.file}`;
      } else {
        mockPath = `${BASE_URL}${mockConfig.file}`;
      }

      const cacheBuster = `?v=${VERSION}`;
      
      const response = await fetch(mockPath + cacheBuster);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (mockConfig.filterBy && mockConfig.filterValue) {
        const filtered = Array.isArray(data)
          ? data.find(item => item[mockConfig.filterBy] == mockConfig.filterValue)
          : data;

        return filtered;
      }

      return data;

    } catch (error) {
      ogLogger?.error('core:dataLoader', `Error cargando mock: ${error.message}`);
      throw error;
    }
  }

  static async loadList(dataSourceConfig, extensionName) {
    return await this.load(dataSourceConfig, extensionName);
  }

  static async loadDetail(dataLoaderConfig, id, extensionName) {
    if (dataLoaderConfig.mock) {
      dataLoaderConfig.mock.filterValue = id;

      if (!dataLoaderConfig.mock.filterBy) {
        dataLoaderConfig.mock.filterBy = 'id';
      }
    }

    if (dataLoaderConfig.api?.endpoint) {
      dataLoaderConfig.api.endpoint = dataLoaderConfig.api.endpoint.replace('{id}', id);
    }

    return await this.load(dataLoaderConfig, extensionName);
  }
}

// Global
window.ogDataLoader = ogDataLoader;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.dataLoader = ogDataLoader;
}
/**
 * @doc-start
 * FILE: framework/js/core/dataLoader.js
 * CLASS: ogDataLoader
 * TYPE: core-service
 * PROMPT: fe-core-services
 *
 * ROLE:
 *   Carga datos desde API o archivos mock JSON con estrategia auto-fallback.
 *   Usado por ogDatatable y ogModal para obtener datos antes de renderizar.
 *   En modo 'auto': intenta API si backend.enabled, si falla cae a mock.
 *
 * MODOS:
 *   auto   → API si backend habilitado en pluginConfig → fallback a mock
 *   api    → solo API (falla si no responde)
 *   mock   → solo archivo JSON local
 *
 * MÉTODOS:
 *   load(config, extensionName?)         → carga según type (auto/api/mock)
 *   loadList(dataSourceConfig, ext)      → alias de load() para listas
 *   loadDetail(config, id, ext)          → carga un ítem por ID (reemplaza {id} en endpoint)
 *
 * CONFIG DE DATASOURCE:
 *   {
 *     type: 'auto',
 *     api: { enabled: true, endpoint: '/api/user', method: 'GET' },
 *     mock: { file: 'mock/users.json', filterBy: 'id', filterValue: null }
 *   }
 *
 * USO:
 *   const data = await ogDataLoader.load({ type: 'mock', mock: { file: 'mock/users.json' } }, 'admin');
 *   const user = await ogDataLoader.loadDetail(config, userId, 'admin');
 *
 * NOTA:
 *   El archivo navigation.js contiene esta misma clase (duplicado por error de naming).
 *   El archivo canónico es dataLoader.js. navigation.js debe eliminarse o renombrarse.
 *
 * REGISTRO:
 *   window.ogDataLoader
 *   ogFramework.core.dataLoader
 * @doc-end
 */