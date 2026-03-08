class ogLoader {
  static loaded = new Set();

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  static async loadScript(url, options = {}) {
    const normalizedUrl = this.normalizeUrl(url);

    if (this.loaded.has(normalizedUrl)) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = normalizedUrl;
      script.onload = () => {
        this.loaded.add(normalizedUrl);
        ogLogger?.success('core:loader', `✅ Script cargado: ${normalizedUrl}`);
        resolve(true);
      };
      script.onerror = () => {
        if (options.optional) {
          resolve(false);
        } else {
          ogLogger?.error('core:loader', `❌ Error cargando script: ${normalizedUrl}`);
          reject(new Error(`Failed to load: ${normalizedUrl}`));
        }
      };
      document.head.appendChild(script);
    });
  }

  static async loadStyle(url, options = {}) {
    const normalizedUrl = this.normalizeUrl(url);

    if (this.loaded.has(normalizedUrl)) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = normalizedUrl;
      link.onload = () => {
        this.loaded.add(normalizedUrl);
        ogLogger?.success('core:loader', `✅ Style cargado: ${normalizedUrl}`);
        resolve(true);
      };
      link.onerror = () => {
        if (options.optional) {
          resolve(false);
        } else {
          ogLogger?.error('core:loader', `❌ Error cargando style: ${normalizedUrl}`);
          reject(new Error(`Failed to load: ${normalizedUrl}`));
        }
      };
      document.head.appendChild(link);
    });
  }

  static async loadResources(scripts = [], styles = []) {
    if (!Array.isArray(scripts)) {
      ogLogger?.error('core:loader', '❌ scripts no es un array:', scripts);
      scripts = [];
    }

    if (!Array.isArray(styles)) {
      ogLogger?.error('core:loader', '❌ styles no es un array:', styles);
      styles = [];
    }

    const validScripts = scripts.filter(url => {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        ogLogger?.warn('core:loader', '⚠️ Script inválido encontrado:', url);
        return false;
      }
      return true;
    });

    const validStyles = styles.filter(url => {
      if (!url || typeof url !== 'string' || url.trim() === '') {
        ogLogger?.warn('core:loader', '⚠️ Style inválido encontrado:', url);
        return false;
      }
      return true;
    });

    // loadScript y loadStyle normalizan internamente, no normalizar aquí
    const promises = [
      ...validScripts.map(url => this.loadScript(url)),
      ...validStyles.map(url => this.loadStyle(url))
    ];

    return Promise.all(promises);
  }

  static normalizeUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const config = this.getConfig();
    const BASE_URL = config.baseUrl || '/';

    if (url.startsWith(BASE_URL)) {
      return url;
    }

    if (url.startsWith('/')) {
      const baseWithoutSlash = BASE_URL.slice(0, -1);
      if (url.startsWith(baseWithoutSlash)) {
        return url;
      }
      return BASE_URL + url.substring(1);
    }

    return BASE_URL + url;
  }

  static async loadJson(url, options = {}) {
    try {
      const normalizedUrl = this.normalizeUrl(url);

      const response = await fetch(normalizedUrl);

      if (!response.ok) {
        if (options.optional) {
          return null;
        }

        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        ogLogger?.error('core:loader', `❌ Error cargando JSON: ${normalizedUrl} - ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const data = await response.json();

      return data;

    } catch (error) {
      if (options.optional) {
        return null;
      }

      ogLogger?.error('core:loader', `❌ Error cargando JSON: ${url}`, error);
      throw error;
    }
  }
}

window.ogLoader = ogLoader;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.loader = ogLoader;
}
/**
 * @doc-start
 * FILE: framework/js/core/loader.js
 * CLASS: ogLoader
 * TYPE: core-util
 * PROMPT: fe-framework
 *
 * ROLE:
 *   Carga dinámica de scripts, estilos y JSON con deduplicación automática.
 *   Mantiene un Set interno de URLs ya cargadas para no insertar duplicados.
 *   Normaliza todas las rutas relativas contra baseUrl del config activo.
 *
 * MÉTODOS PRINCIPALES:
 *   loadScript(url, opts?)          → inserta <script> en head, retorna Promise<bool>
 *   loadStyle(url, opts?)           → inserta <link rel=stylesheet>, retorna Promise<bool>
 *   loadResources(scripts, styles)  → carga arrays en paralelo con Promise.all
 *   loadJson(url, opts?)            → fetch + JSON.parse, retorna Promise<data|null>
 *   normalizeUrl(url)               → resuelve rutas relativas contra baseUrl
 *
 * OPCIONES:
 *   optional: true  → si el recurso falla, resuelve false en vez de rechazar
 *   silent: true    → suprime logs de error (usado en tryLoadPluginLang)
 *
 * DEDUPLICACIÓN:
 *   Guarda URLs normalizadas en static loaded = new Set().
 *   Si la URL ya está cargada, retorna true inmediatamente sin reinsertar.
 *
 * USO:
 *   await ogLoader.loadScript('extensions/admin/assets/js/admin.js');
 *   await ogLoader.loadResources(['ext.js'], ['ext.css']);
 *   const data = await ogLoader.loadJson('extensions/admin/mock/users.json', { optional: true });
 *
 * REGISTRO:
 *   window.ogLoader
 *   ogFramework.core.loader
 * @doc-end
 */