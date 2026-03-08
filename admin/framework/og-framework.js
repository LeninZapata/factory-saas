;(function(window, document, undefined) {
  'use strict';

  // ==========================================
  // ONLY GROW FRAMEWORK - MULTI-INSTANCE
  // ==========================================

  if (window.ogFramework && window.ogFramework._initialized) {
    console.log('ℹ️ ogFramework already initialized');
    return;
  }

  var ogFramework = window.ogFramework || {
    version:        '1.0.0',
    _initialized:   false,
    _scriptsLoaded: false,
    _pendingInits:  [],
    instances:      {},
    configs:        {},
    activeConfig:   null,
    core:           {},
    components:     {},
    utils:          {}
  };

  // ==========================================
  // HELPERS SEMÁNTICOS GLOBALES
  // Declarados primero — los módulos los usan durante su propia carga
  // ==========================================

  window.ogModule = function(moduleName) {
    if (!moduleName) return null;
    const mod = window.ogFramework?.core?.[moduleName];
    if (mod) return mod;
    const globalName = 'og' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    return window[globalName] || null;
  };

  window.ogComponent = function(componentName) {
    if (!componentName) return null;
    const comp = window.ogFramework?.components?.[componentName];
    if (comp) return comp;
    const globalName = 'og' + componentName.charAt(0).toUpperCase() + componentName.slice(1);
    return window[globalName] || null;
  };

  // ==========================================
  // NORMALIZACIÓN DE CONFIG
  // ==========================================

  function normalizeConfig(config) {
    const defaults = {
      slug:          'default',
      version:       '1.0.0',
      environment:   'production',
      isDevelopment: false,
      baseUrl:       '/',
      frameworkUrl:  'framework/',
      publicUrl:     window.location.origin + '/',
      frameworkPath: 'framework',
      container:     '#app',
      defaultView:   'middle:dashboard/dashboard',
      i18n:          { enabled: false },
      auth:          { enabled: false },
      routes:        {},
      cache:         {},
      custom:        {}
    };

    const normalized = { ...defaults, ...config };

    // Merge profundo para objetos anidados
    ['i18n', 'auth', 'routes', 'cache', 'custom'].forEach(key => {
      if (config[key]) normalized[key] = { ...defaults[key], ...config[key] };
    });

    return normalized;
  }

  // ==========================================
  // REGISTRO DE CONFIGURACIONES
  // ==========================================

  ogFramework.register = async function(slug, config) {
    if (!slug || !config) {
      console.error('❌ ogFramework.register requiere slug y config');
      return;
    }

    console.log(`✅ Registering config for: ${slug}`);

    const normalizedConfig = normalizeConfig(config);

    this.instances[slug] = normalizedConfig;
    this.configs[slug]   = normalizedConfig;

    if (!this._scriptsLoading) {
      this._scriptsLoading = true;
      await this.loadFrameworkScripts();
    }

    this.setActiveContext(slug);

    if (this._scriptsLoaded) {
      await this.initInstance(slug, normalizedConfig);
    } else {
      this._pendingInits.push({ slug, config: normalizedConfig });
    }

    ogLogger.info('framework', `Config registered and activated for: ${slug}`);
  };

  // ==========================================
  // CARGA DE SCRIPTS — desde framework-manifest.json
  // ==========================================

  ogFramework.loadFrameworkScripts = async function() {
    if (this._scriptsLoaded) return;

    console.log('🔄 Loading framework scripts...');

    try {
      const firstConfig  = Object.values(this.instances)[0];
      if (!firstConfig)  throw new Error('No config found for loading scripts');

      const frameworkUrl = firstConfig.frameworkUrl || 'framework/';
      const cacheBuster  = '?v=' + (firstConfig.version || Date.now());

      // 1. Cargar el manifiesto
      const manifestRes  = await fetch(frameworkUrl + 'framework-manifest.json' + cacheBuster);
      if (!manifestRes.ok) throw new Error('No se pudo cargar framework-manifest.json');

      const manifest = await manifestRes.json();
      const allScripts = [...(manifest.core || []), ...(manifest.components || [])];

      // 2. Fetch en paralelo
      const scriptContents = await Promise.all(
        allScripts.map(url =>
          fetch(frameworkUrl + url + cacheBuster)
            .then(r => {
              if (!r.ok) throw new Error('Failed to load ' + url);
              return r.text();
            })
        )
      );

      // 3. Ejecutar en orden
      scriptContents.forEach(content => new Function(content)());

      // Asegurar ogLogger global
      if (window.ogLogger) ogFramework.logger = window.ogLogger;

      ogLogger.success('framework', '✅ Framework scripts loaded');

      // 4. Cargar middle/auth si está habilitado
      await this.loadAuthMiddle(firstConfig, manifest, cacheBuster);

      this._scriptsLoaded = true;
      ogLogger.success('framework', '✅ Todos los scripts core cargados');

      this.initPendingInstances();

    } catch (error) {
      console.error('❌ Error loading framework scripts:', error);
      throw error;
    }
  };

  ogFramework.loadAuthMiddle = async function(config, manifest, cacheBuster) {
    if (config.auth?.enabled !== true) {
      ogLogger.info('framework', '⚠️ Auth deshabilitado — saltando middle/auth');
      return;
    }

    ogLogger.info('framework', '🔐 Auth habilitado — cargando middle/auth');

    const BASE_URL = config.baseUrl || '/';

    try {
      // CSS
      const cssLink = document.createElement('link');
      cssLink.rel   = 'stylesheet';
      cssLink.href  = BASE_URL + 'middle/css/auth.css' + cacheBuster;
      document.head.appendChild(cssLink);

      // Scripts — usar sección 'middle' del manifiesto si existe,
      // fallback al archivo único para compatibilidad con setups sin split
      const middleScripts = manifest.middle || ['middle/js/auth.js'];

      const contents = await Promise.all(
        middleScripts.map(url =>
          fetch(BASE_URL + url + cacheBuster)
            .then(r => {
              if (!r.ok) throw new Error('Failed to load ' + url);
              return r.text();
            })
        )
      );

      // Ejecutar en orden — importante: cada sub-módulo depende del anterior
      contents.forEach(code => new Function(code)());

      ogLogger.success('framework', `✅ middle/auth cargado (${middleScripts.length} archivos)`);

    } catch (error) {
      ogLogger.error('framework', '❌ Error cargando middle/auth:', error);
    }
  };

  // ==========================================
  // INICIALIZACIÓN DE INSTANCIAS
  // ==========================================

  ogFramework.initPendingInstances = function() {
    ogLogger.info('framework', `🚀 Initializing ${this._pendingInits.length} pending instances`);
    this._pendingInits.forEach(({ slug, config }) => this.initInstance(slug, config));
    this._pendingInits = [];
  };

  ogFramework.initInstance = async function(slug, config) {
    try {
      ogLogger.info('framework', `🎯 Initializing instance: ${slug}`);

      const container = document.querySelector(config.container);
      if (!container) {
        console.warn(`⚠️ Container "${config.container}" not found for ${slug}`);
        this.waitForContainer(slug, config);
        return;
      }

      this.setActiveContext(slug);

      // i18n
      if (config.i18n?.enabled && this.core.i18n) {
        await this.core.i18n.init(config.i18n);
      }

      // Auth
      if (config.auth?.enabled && this.core.auth) {
        await this.core.auth.init(config.auth);

        if (!this.core.auth.isAuthenticated()) {
          this.instances[slug] = { slug, config, container, context: {} };
          return;
        }
      }

      // Layout → hooks → sidebar → vista por defecto
      await this.bootApp(slug, config, container);

      this.instances[slug] = { slug, config, container, context: {} };
      ogLogger.success('framework', `✅ Instance initialized: ${slug}`);

    } catch (error) {
      console.error(`❌ Error initializing ${slug}:`, error);
      this.showError(error, config);
    }
  };

  // Secuencia de arranque compartida (con y sin auth)
  ogFramework.bootApp = async function(slug, config, container) {
    if (this.core.layout) {
      this.core.layout.init('app', container);
    }

    if (this.core.hook) {
      await this.core.hook.loadPluginHooks();
      if (this.core.auth?.filterExtensionsByPermissions) {
        this.core.auth.filterExtensionsByPermissions();
      }
    }

    if (this.core.sidebar) {
      await this.core.sidebar.init();
    }

    if (this.core.view) {
      this.core.view.loadView(config.defaultView || 'middle:dashboard/dashboard');
    }
  };

  // ==========================================
  // GESTIÓN DE CONTEXTO Y UTILIDADES
  // ==========================================

  ogFramework.setActiveContext = function(slug) {
    if (!this.configs[slug]) throw new Error('No configuration found for: ' + slug);

    this.activeConfig  = this.configs[slug];
    window.appConfig   = this.activeConfig; // compatibilidad

    if (window.ogCache?.resetPrefix) window.ogCache.resetPrefix();
  };

  ogFramework.waitForContainer = function(slug, config) {
    const observer = new MutationObserver((mutations, obs) => {
      const container = document.querySelector(config.container);
      if (container) {
        obs.disconnect();
        this.initInstance(slug, config);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      console.error(`❌ Timeout waiting for container: ${config.container}`);
    }, 10000);
  };

  ogFramework.getInstance = function(slug) { return this.instances[slug] || null; };
  ogFramework.getConfig   = function(slug) { return this.configs[slug]   || null; };

  ogFramework.showError = function(error, config) {
    const container = document.querySelector(config?.container || '#app');
    if (container) {
      container.innerHTML =
        '<div style="padding:20px;color:#dc3545;background:#f8d7da;border:1px solid #f5c6cb;border-radius:5px;margin:20px;">' +
          '<h2>Error de Carga</h2>' +
          '<p><strong>Instancia:</strong> ' + (config?.slug || 'unknown') + '</p>' +
          '<p><strong>Detalle:</strong> ' + error.message + '</p>' +
          '<button onclick="location.reload()" style="padding:10px 20px;background:#dc3545;color:white;border:none;border-radius:3px;cursor:pointer;">Recargar</button>' +
        '</div>';
    }
  };

  // Compatibilidad con index.html que usa ogFramework.init('configKey')
  ogFramework.init = function(configKey) {
    const config = window[configKey];
    if (!config)       throw new Error('Configuration "' + configKey + '" not found in window');
    if (!config.slug)  throw new Error('Config must have a "slug" property');
    return this.register(config.slug, config);
  };

  // ==========================================
  // EXPONER Y MARCAR COMO INICIALIZADO
  // ==========================================

  window.ogFramework       = ogFramework;
  ogFramework._initialized = true;

  console.log('📦 ogFramework v' + ogFramework.version + ' initialized');
  console.log('✨ Use ogFramework.register(slug, config) to add instances');

})(window, document);

/**
 * @doc-start
 * FILE: framework/og-framework.js
 * TYPE: bootstrap
 * PROMPT: fe-framework
 *
 * ROLE:
 *   Punto de entrada del framework. Se carga directamente desde index.html via <script src>.
 *   Gestiona múltiples instancias del framework (multi-slug), carga todos los scripts del
 *   core y componentes desde framework-manifest.json, y orquesta el arranque completo de
 *   la aplicación (layout → hooks → sidebar → defaultView).
 *
 * PATTERN:
 *   IIFE autoejecutada — envuelve todo para no contaminar el scope global.
 *   ogFramework es el único objeto global que expone. El resto se accede via ogModule() y ogComponent().
 *
 * BOOT SEQUENCE (orden garantizado):
 *   1. index.html carga og-framework.js via <script src>
 *   2. ogFramework.register(slug, appConfig) — llamado desde index.html
 *   3. loadFrameworkScripts() — fetch framework-manifest.json → fetch+eval todos los scripts
 *   4. loadAuthMiddle() — si auth.enabled: carga middle/js/auth.js + middle/css/auth.css
 *   5. initInstance() — i18n.init → auth.init → bootApp()
 *   6. bootApp() — layout.init → hook.loadPluginHooks → sidebar.init → view.loadView(defaultView)
 *
 * MULTI-INSTANCE:
 *   Cada instancia tiene un slug único. ogFramework.configs[slug] guarda su config normalizada.
 *   ogFramework.activeConfig apunta a la instancia actualmente activa.
 *   setActiveContext(slug) cambia la instancia activa y resetea el prefijo del cache.
 *
 * GLOBALS EXPUESTOS:
 *   ogModule(name)      → busca en ogFramework.core[name], fallback a window['og'+Name]
 *   ogComponent(name)   → busca en ogFramework.core.components[name], fallback a window['og'+Name]
 *   window.ogFramework  → objeto principal del framework
 *   window.appConfig    → alias de activeConfig (compatibilidad)
 *
 * MÉTODOS PRINCIPALES:
 *   ogFramework.register(slug, config)   → registra config, arranca carga de scripts
 *   ogFramework.initInstance(slug, cfg)  → inicializa una instancia (i18n, auth, bootApp)
 *   ogFramework.bootApp(slug, cfg, el)   → layout → hooks → sidebar → defaultView
 *   ogFramework.setActiveContext(slug)   → cambia instancia activa
 *   ogFramework.getInstance(slug)        → retorna instancia por slug
 *   ogFramework.getConfig(slug)          → retorna config normalizada por slug
 *
 * CONFIG (appConfig desde index.html):
 *   slug, version, environment, isDevelopment
 *   baseUrl, frameworkUrl, publicUrl, frameworkPath, extensionsPath, apiBaseUrl
 *   container          → selector CSS del contenedor raíz (ej: '#app')
 *   defaultView        → vista inicial (ej: 'middle:dashboard/dashboard')
 *   i18n               → { enabled, defaultLang, availableLangs }
 *   auth               → { enabled, loginView, redirectAfterLogin, sessionCheckInterval, api:{login,logout,me} }
 *   routes             → { coreViews, extensionViews }
 *   cache              → { views, forms }
 *
 * RELATED:
 *   framework-manifest.json — lista de scripts a cargar (core + components)
 *   middle/js/auth.js       — cargado condicionalmente si auth.enabled
 * @doc-end
 */