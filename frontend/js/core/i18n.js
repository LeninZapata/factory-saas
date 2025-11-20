class i18n {
  static currentLang = 'es';
  static translations = new Map();
  static pluginTranslations = new Map();
  static defaultLang = 'es';
  static availableLangs = ['es', 'en'];

  static async init(config = {}) {
    // ✅ Prioridad: storage > config > default
    const storedLang = this.getLangFromStorage();
    this.currentLang = storedLang || config.defaultLang || 'es';
    this.defaultLang = config.defaultLang || 'es';
    this.availableLangs = config.availableLangs || ['es', 'en'];

    await this.loadCoreLang(this.currentLang);
    
    // Debug: mostrar de dónde viene el idioma
    if (window.appConfig?.isDevelopment) {
      const source = storedLang ? 'localStorage' : (config.defaultLang ? 'config' : 'default');
      console.log(`i18n: Idioma '${this.currentLang}' desde ${source}`);
    }
  }

  static async loadCoreLang(lang) {
    const cacheKey = `i18n_core_${lang}`;
    let data = cache.get(cacheKey);

    if (!data) {
      try {
        const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : '';
        const response = await fetch(`${window.BASE_URL}js/lang/${lang}.json${cacheBuster}`);
        
        if (response.ok) {
          data = await response.json();
          cache.set(cacheKey, data, 60 * 60 * 1000);
        } else {
          console.warn(`i18n: Idioma ${lang} no encontrado`);
          return;
        }
      } catch (error) {
        console.error('i18n: Error cargando idioma core:', error);
        return;
      }
    }

    this.translations.set(lang, data);
  }

  static async loadPluginLang(pluginName, lang) {
    const cacheKey = `i18n_plugin_${pluginName}_${lang}`;
    let data = cache.get(cacheKey);

    if (!data) {
      try {
        const cacheBuster = window.appConfig?.isDevelopment
        ? `?v=${Date.now()}`
        : `?v=${window.appConfig.version}`;
        const response = await fetch(`${window.BASE_URL}plugins/${pluginName}/lang/${lang}.json${cacheBuster}`);
        
        if (response.ok) {
          data = await response.json();
          cache.set(cacheKey, data, 60 * 60 * 1000);
        } else {
          return;
        }
      } catch (error) {
        return;
      }
    }

    if (!this.pluginTranslations.has(pluginName)) {
      this.pluginTranslations.set(pluginName, new Map());
    }
    
    this.pluginTranslations.get(pluginName).set(lang, data);
  }

  static t(key, params = {}) {
    const lang = this.currentLang;
    const [prefix, ...rest] = key.split('.');
    
    let translation = null;

    // Buscar en plugin primero (si key empieza con nombre de plugin)
    if (this.pluginTranslations.has(prefix)) {
      const pluginLangs = this.pluginTranslations.get(prefix);
      const pluginData = pluginLangs.get(lang);
      
      if (pluginData) {
        translation = pluginData[key];
      }
    }

    // Si no encontró, buscar en core
    if (!translation) {
      const coreData = this.translations.get(lang);
      translation = coreData?.[key];
    }

    // Fallback a idioma por defecto
    if (!translation && lang !== this.defaultLang) {
      const defaultData = this.translations.get(this.defaultLang);
      translation = defaultData?.[key];
    }

    // Si aún no hay traducción, retornar la key
    if (!translation) {
      console.warn(`i18n: Key no encontrada: ${key}`);
      return key;
    }

    // Reemplazar parámetros {param}
    return translation.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  static async setLang(lang) {
    if (!this.availableLangs.includes(lang)) {
      console.warn(`i18n: Idioma ${lang} no disponible`);
      return;
    }

    await this.loadCoreLang(lang);

    // Recargar idiomas de plugins activos
    for (const pluginName of this.pluginTranslations.keys()) {
      await this.loadPluginLang(pluginName, lang);
    }

    this.currentLang = lang;
    this.saveLangToStorage(lang);

    // Trigger evento para actualizar UI
    if (window.events) {
      document.dispatchEvent(new CustomEvent('lang-changed', { detail: { lang } }));
    }
  }

  static getLang() {
    return this.currentLang;
  }

  static getAvailableLangs() {
    return this.availableLangs;
  }

  static getLangFromStorage() {
    return localStorage.getItem('app_lang') || null;
  }

  static saveLangToStorage(lang) {
    localStorage.setItem('app_lang', lang);
  }

  static clearCache() {
    this.translations.clear();
    this.pluginTranslations.clear();
  }
}

window.i18n = i18n;
window.__ = (key, params) => i18n.t(key, params);