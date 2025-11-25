class dataLoader {
  static async load(config, pluginName = null) {
    console.log('📥 DATALOADER: Iniciando carga de datos', config);

    const type = config.type || 'auto';

    // Modo AUTO: Detecta automáticamente si usar API o Mock
    if (type === 'auto') {
      return await this.loadAuto(config, pluginName);
    }

    // Modo API explícito
    if (type === 'api') {
      return await this.loadFromApi(config);
    }

    // Modo MOCK explícito
    if (type === 'mock') {
      return await this.loadFromMock(config, pluginName);
    }

    console.error('❌ DATALOADER: Tipo de dataSource no válido:', type);
    return null;
  }

  static async loadAuto(config, pluginName) {
    console.log('🔍 DATALOADER AUTO: Detectando fuente de datos...');

    // 1. Verificar si el plugin tiene backend habilitado
    const pluginConfig = pluginName ? window.hook?.getPluginConfig(pluginName) : null;
    const backendEnabled = pluginConfig?.backend?.enabled || false;

    console.log(`🔧 Backend plugin ${pluginName}:`, backendEnabled ? 'ENABLED' : 'DISABLED');

    // 2. Verificar si el config tiene API habilitada
    const apiEnabled = config.api?.enabled !== false;

    // 3. Decidir fuente
    if (backendEnabled && apiEnabled && config.api?.endpoint) {
      console.log('✅ DATALOADER AUTO: Usando API');
      try {
        return await this.loadFromApi(config.api);
      } catch (error) {
        console.warn('⚠️ DATALOADER AUTO: API falló, fallback a mock', error);
        return await this.loadFromMock(config.mock, pluginName);
      }
    }

    // Fallback a mock
    console.log('✅ DATALOADER AUTO: Usando MOCK');
    return await this.loadFromMock(config.mock, pluginName);
  }

  static async loadFromApi(apiConfig) {
    console.log('🌐 DATALOADER API: Cargando desde API', apiConfig);

    const endpoint = apiConfig.endpoint;
    const method = apiConfig.method || 'GET';

    try {
      let response;

      if (method === 'GET') {
        response = await window.api.get(endpoint);
      } else if (method === 'POST') {
        response = await window.api.post(endpoint, apiConfig.body || {});
      }

      console.log('✅ DATALOADER API: Datos cargados', response);

      // Si la respuesta tiene estructura {success, data}
      if (response.success && response.data) {
        return response.data;
      }

      // Si la respuesta es directa
      return response;

    } catch (error) {
      console.error('❌ DATALOADER API: Error', error);
      throw error;
    }
  }

  static async loadFromMock(mockConfig, pluginName) {
    console.log('📄 DATALOADER MOCK: Cargando desde mock', mockConfig);

    if (!mockConfig || !mockConfig.file) {
      console.error('❌ DATALOADER MOCK: No se especificó archivo mock');
      return null;
    }

    try {
      // Construir ruta del archivo mock
      let mockPath;

      if (pluginName) {
        // Mock de plugin
        mockPath = `${window.BASE_URL}plugins/${pluginName}/${mockConfig.file}`;
      } else {
        // Mock global
        mockPath = `${window.BASE_URL}${mockConfig.file}`;
      }

      console.log('📂 DATALOADER MOCK: Ruta:', mockPath);

      const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : '';
      const response = await fetch(mockPath + cacheBuster);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ DATALOADER MOCK: Datos cargados', data);

      // Si tiene filtro (para obtener un registro específico)
      if (mockConfig.filterBy && mockConfig.filterValue) {
        const filtered = Array.isArray(data)
          ? data.find(item => item[mockConfig.filterBy] == mockConfig.filterValue)
          : data;

        console.log(`🔍 DATALOADER MOCK: Filtrado por ${mockConfig.filterBy}=${mockConfig.filterValue}`, filtered);
        return filtered;
      }

      return data;

    } catch (error) {
      console.error('❌ DATALOADER MOCK: Error cargando', error);
      throw error;
    }
  }

  static async loadList(dataSourceConfig, pluginName) {
    console.log('📋 DATALOADER: Cargando LISTA');
    return await this.load(dataSourceConfig, pluginName);
  }

  static async loadDetail(dataLoaderConfig, id, pluginName) {
    console.log(`🔍 DATALOADER: Cargando DETALLE (ID: ${id})`);

    // Configurar filtro para mock
    if (dataLoaderConfig.mock) {
      dataLoaderConfig.mock.filterValue = id;

      if (!dataLoaderConfig.mock.filterBy) {
        dataLoaderConfig.mock.filterBy = 'id';
      }
    }

    // Reemplazar {id} en endpoint de API
    if (dataLoaderConfig.api?.endpoint) {
      dataLoaderConfig.api.endpoint = dataLoaderConfig.api.endpoint.replace('{id}', id);
    }

    return await this.load(dataLoaderConfig, pluginName);
  }
}

window.dataLoader = dataLoader;