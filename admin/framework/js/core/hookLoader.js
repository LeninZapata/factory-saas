class ogHookLoader {

  static getConfig() {
    return window.ogFramework?.activeConfig || window.appConfig || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // CARGA GLOBAL DE EXTENSIONES
  // ─────────────────────────────────────────────────────────────────

  // Lee extensions/index.json y carga cada extensión listada
  static async loadPluginHooks() {
    const config = this.getConfig();

    try {
      const extensionsBase = config.extensionsPath || `${config.baseUrl}extensions/`;
      const indexUrl       = `${extensionsBase}index.json?v=${config.version || '1.0.0'}`;

      ogLogger?.info('core:hookLoader', `📦 Cargando index de extensions desde: ${indexUrl}`);

      const response = await fetch(indexUrl);

      if (!response.ok) {
        ogLogger?.error('core:hookLoader', `❌ No se pudo cargar index.json: ${response.status}`);
        return;
      }

      const indexData  = await response.json();
      const extensions = indexData.extensions || [];

      ogLogger?.info('core:hookLoader', `✅ Extensions encontradas: ${extensions.length}`);

      for (const ext of extensions) {
        await this.loadPlugin(ext.name);
      }

    } catch (error) {
      ogLogger?.error('core:hookLoader', '❌ Error cargando extensions:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CARGA DE UNA EXTENSIÓN INDIVIDUAL
  // ─────────────────────────────────────────────────────────────────

  static async loadPlugin(extensionName) {
    const config = this.getConfig();

    try {
      const extensionsBase = config.extensionsPath || `${config.baseUrl}extensions/`;

      // 1. Cargar index.json del extension (configuración y menú)
      const indexUrl      = `${extensionsBase}${extensionName}/index.json?v=${config.version || '1.0.0'}`;
      ogLogger?.info('core:hookLoader', `📦 Cargando config de: ${extensionName}`);

      const indexResponse = await fetch(indexUrl);

      if (indexResponse.ok) {
        const extensionConfig = await indexResponse.json();
        ogHookRegistry.register(extensionName, extensionConfig);
      } else {
        ogLogger?.warn('core:hookLoader', `⚠️ No se encontró index.json para ${extensionName}`);
        ogHookRegistry.register(extensionName, { enabled: true, hasMenu: false });
      }

      // 2. Cargar hooks.js SOLO si hasHooks es true
      const pluginConfig = ogHookRegistry.getPluginConfig(extensionName);

      if (pluginConfig?.hasHooks) {
        const hooksUrl      = `${extensionsBase}${extensionName}/hooks.js?v=${config.version || '1.0.0'}`;
        const hooksResponse = await fetch(hooksUrl);

        if (hooksResponse.ok) {
          const script = await hooksResponse.text();
          new Function(script)();
          ogHook.loadedHooks.add(extensionName);
          ogLogger?.success('core:hookLoader', `✅ Hooks de ${extensionName} cargados`);
        } else {
          ogLogger?.warn('core:hookLoader', `⚠️ hasHooks=true pero no se encontró hooks.js para ${extensionName}`);
        }
      } else {
        ogLogger?.info('core:hookLoader', `⏭️ Skipping hooks para ${extensionName} (hasHooks=false)`);
      }

      // 3. Cargar idioma del extension
      const i18n = ogModule('i18n');
      if (i18n) {
        const currentLang = i18n.getLang();
        ogLogger?.info('core:hookLoader', `🌐 Cargando idioma ${currentLang} para ${extensionName}`);
        await i18n.loadExtensionLang(extensionName, currentLang);
      }

    } catch (error) {
      ogLogger?.error('core:hookLoader', `❌ Error cargando ${extensionName}:`, error);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // IDIOMAS
  // ─────────────────────────────────────────────────────────────────

  static async loadPluginLanguages(extensionName) {
    const i18n = ogModule('i18n');
    if (!window.ogFramework?.core?.i18n) return;

    const currentLang = i18n.getLang();
    const loaded      = await this.tryLoadPluginLang(extensionName, currentLang);

    if (loaded) {
      const pluginConfig = ogHookRegistry.getPluginConfig(extensionName);
      if (pluginConfig) {
        pluginConfig.hasLanguages   = true;
        pluginConfig.loadedLanguages = [currentLang];
      }
    }
  }

  static async tryLoadPluginLang(extensionName, lang) {
    const loader = ogModule('loader');
    const i18n   = ogModule('i18n');
    const cache  = ogModule('cache');
    const config = this.getConfig();

    try {
      const langPath    = `${config.baseUrl || '/'}extensions/${extensionName}/lang/${lang}.json`;
      const cacheBuster = `?v=${config.version || '1.0.0'}`;

      const translations = await loader.loadJson(langPath + cacheBuster, {
        optional: true,
        silent:   true
      });

      if (!translations) return false;

      if (!i18n.exntesionTranslations.has(extensionName)) {
        i18n.exntesionTranslations.set(extensionName, new Map());
      }
      i18n.exntesionTranslations.get(extensionName).set(lang, translations);
      cache.set(`i18n_extension_${extensionName}_${lang}_v${config.version || '1.0.0'}`, translations, 60 * 60 * 1000);

      ogLogger?.success('core:hookLoader', `✅ Idioma ${lang} cargado para ${extensionName}`);
      return true;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RECURSOS
  // ─────────────────────────────────────────────────────────────────

  static async loadPluginResources(scripts = [], styles = []) {
    const loader = ogModule('loader');
    if (loader && typeof loader.loadResources === 'function') {
      try {
        await loader.loadResources(scripts, styles);
      } catch {}
    }
  }
}

window.ogHookLoader = ogHookLoader;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.hookLoader = ogHookLoader;
}
/**
 * @doc-start
 * FILE: framework/js/core/hookLoader.js
 * CLASS: ogHookLoader
 * TYPE: core-hook
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Carga de extensiones desde disco. Lee el índice global de extensiones,
 *   carga la config de cada una, ejecuta hooks.js si corresponde y carga
 *   las traducciones del idioma activo.
 *   Sub-módulo de ogHook — no se usa directamente desde extensiones.
 *
 * FLUJO loadPluginHooks:
 *   1. fetch extensions/index.json   → lista de { name } de extensiones
 *   2. por cada extensión → loadPlugin(name)
 *
 * FLUJO loadPlugin(name):
 *   1. fetch extensions/{name}/index.json → ogHookRegistry.register(name, config)
 *   2. Si config.hasHooks === true:
 *      fetch extensions/{name}/hooks.js → new Function(script)()
 *      → ogHook.loadedHooks.add(name)
 *   3. ogI18n.loadExtensionLang(name, currentLang)
 *
 * IDIOMAS (tryLoadPluginLang):
 *   fetch extensions/{name}/lang/{lang}.json → guarda en i18n.exntesionTranslations
 *   y en ogCache. Si el archivo no existe retorna false silenciosamente.
 *
 * extensions/index.json ESPERADO:
 *   { "extensions": [ { "name": "admin" }, { "name": "ejemplos" } ] }
 *
 * REGISTRO:
 *   window.ogHookLoader
 *   ogFramework.core.hookLoader
 * @doc-end
 */