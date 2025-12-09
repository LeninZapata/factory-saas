class loader {
  static loaded = new Set();

  static async loadScript(url, options = {}) {
    if (this.loaded.has(url)) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        this.loaded.add(url);
        resolve(true);
      };
      script.onerror = () => {
        if (options.optional) {
          logger.warn('core:loader', `Script opcional no encontrado: ${url}`);
          resolve(false);
        } else {
          reject(new Error(`Failed to load: ${url}`));
        }
      };
      document.head.appendChild(script);
    });
  }

  static async loadStyle(url, options = {}) {
    if (this.loaded.has(url)) return true;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        this.loaded.add(url);
        resolve(true);
      };
      link.onerror = () => {
        if (options.optional) {
          logger.warn('core:loader', `Style opcional no encontrado: ${url}`);
          resolve(false);
        } else {
          reject(new Error(`Failed to load: ${url}`));
        }
      };
      document.head.appendChild(link);
    });
  }

  static async loadResources(scripts = [], styles = []) {
    const promises = [
      ...scripts.map(url => this.loadScript(url)),
      ...styles.map(url => this.loadStyle(url))
    ];

    return Promise.all(promises);
  }

  // Cargar archivo JSON opcional (idiomas, config, etc)
  static async loadJson(url, options = {}) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404 && options.optional) {
          if (options.silent !== true) {
            logger.debug('core:loader', `JSON opcional no encontrado: ${url}`);
          }
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (options.optional) {
        if (options.silent !== true) {
          logger.warn('core:loader', `Error cargando JSON opcional: ${url}`);
        }
        return null;
      }
      throw error;
    }
  }
}

window.loader = loader;