window.appConfig = {
  environment: IS_DEV ? 'development' : 'production',
  version: VERSION,
  isDevelopment: IS_DEV,
  
  i18n: {
    enabled: true,
    defaultLang: 'es',
    availableLangs: ['es', 'en']
  },
  
  auth: {
    enabled: true,
    provider: 'auth-jwt',
    loginView: 'auth/login',
    redirectAfterLogin: 'dashboard',
    storageKey: 'fabrica_auth',
    tokenTTL: 24 * 60 * 60 * 1000,
    api: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      me: '/api/auth/me'
    }
  },
  
  routes: {
    coreSections: 'js/views',
    coreForms: 'js/views/forms',
    coreModals: 'js/views/modals',
    pluginViews: 'plugins/{pluginName}/views',
    pluginForms: 'plugins/{pluginName}/views/forms',
    pluginModals: 'plugins/{pluginName}/views/modals',
    pluginModels: 'plugins/{pluginName}/models',
    coreModels: 'js/models',
    components: 'js/components',
    utils: 'js/utils',
    validation: 'js/validation'
  },
  
  cache: {
    modals: !IS_DEV,
    forms: !IS_DEV,
    views: !IS_DEV,
    validation: !IS_DEV,
    ttl: 60 * 60 * 1000
  }
};

const SCRIPTS_TO_LOAD = [
  'js/core/loader.js',
  'js/core/i18n.js',
  'js/core/api.js',
  'js/core/event.js',
  'js/core/cache.js',
  'js/core/hook.js',
  'js/core/auth.js',
  'js/core/layout.js',
  'js/core/view.js',
  'js/core/sidebar.js',
  'js/core/validator.js',
  'js/core/conditions.js',
  'js/components/form.js',
  'js/components/modal.js',
  'js/components/tabs.js',
  'js/components/widget.js',
  'js/components/toast.js',
  'js/components/dataTable.js',
  'js/components/langSelector.js',
];

async function initializeApp() {
  try {
    console.log(`Sistema v${window.appConfig.version} [${window.appConfig.environment}]`);
    
    const cacheBuster = IS_DEV ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
    
    const scriptPromises = SCRIPTS_TO_LOAD.map(url =>
      fetch(url + cacheBuster).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${url}`);
        return r.text();
      })
    );
    
    const scripts = await Promise.all(scriptPromises);
    scripts.forEach(scriptContent => new Function(scriptContent)());

    // Inicializar i18n
    if (window.appConfig.i18n?.enabled && window.i18n) {
      await i18n.init(window.appConfig.i18n);
      console.log(`i18n: Idioma ${i18n.getLang()} cargado`);
    }

    // Inicializar auth
    if (window.appConfig.auth?.enabled && window.auth) {
      await auth.init(window.appConfig.auth);

      if (!auth.isAuthenticated()) {
        return;
      }

      await auth.showApp();

      // ✅ Inicializar langSelector (ahora desde el componente)
      if (window.initLangSelector) {
        window.initLangSelector();
      }
    }

    // Cleanup
    window.cache?.cleanup?.();

    console.log('Sistema inicializado');

  } catch (error) {
    console.error('Error crítico:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; color: #dc3545; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px;">
        <h2>Error de Carga</h2>
        <p><strong>Detalle:</strong> ${error.message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
          Recargar
        </button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}