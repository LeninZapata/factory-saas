console.log('🔥 auth-provider.js: Archivo cargado');

class authJwtAuthProvider {
  static init() {
    console.log('🔥 authJwtAuthProvider.init(): EJECUTADO');
    
    if (!window.events) {
      console.error('❌ AUTH PROVIDER: events.js no está cargado!');
      return;
    }
    
    console.log('🔥 AUTH PROVIDER: events existe, configurando handler...');
    this.setupLoginHandler();
  }

  static setupLoginHandler() {
    console.log('🔥 AUTH PROVIDER: setupLoginHandler() INICIADO');
    
    // Verificar si el formulario existe
    setTimeout(() => {
      const form = document.querySelector('form[data-form-id*="login-form"]');
      console.log('🔥 AUTH PROVIDER: Formulario en DOM?', form ? 'SÍ' : 'NO');
      if (form) {
        console.log('🔥 AUTH PROVIDER: Form ID:', form.id);
        console.log('🔥 AUTH PROVIDER: Form data-form-id:', form.getAttribute('data-form-id'));
      }
    }, 500);
    
    console.log('🔥 AUTH PROVIDER: Registrando evento submit...');
    
    const listenerId = events.on('form[data-form-id*="login-form"]', 'submit', async function(e) {
      console.log('🔥🔥🔥 AUTH PROVIDER: ==========================================');
      console.log('🔥🔥🔥 AUTH PROVIDER: SUBMIT INTERCEPTADO!!!');
      console.log('🔥🔥🔥 AUTH PROVIDER: ==========================================');
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const form = this;
      const data = Object.fromEntries(new FormData(form));
      
      console.log('🔐 AUTH PROVIDER: Datos del formulario:', data);
      
      const btn = form.querySelector('button[type="submit"]');
      
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Ingresando...';
      }

      console.log('🔐 AUTH PROVIDER: Llamando a auth.login()...');
      const result = await auth.login(data);
      console.log('🔐 AUTH PROVIDER: Resultado de login:', result);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
      }

      if (!result.success) {
        console.log('🔐 AUTH PROVIDER: Login falló, mostrando error');
        authJwtAuthProvider.showError(form, result.error || 'Error al iniciar sesión');
      } else {
        console.log('🔐 AUTH PROVIDER: Login exitoso!');
      }
    }, document);
    
    console.log('🔥 AUTH PROVIDER: Evento registrado con ID:', listenerId);
    console.log('🔥 AUTH PROVIDER: setupLoginHandler() COMPLETADO');
  }

  static showError(form, message) {
    console.log('🔐 AUTH PROVIDER: Mostrando error:', message);
    
    let error = form.querySelector('.form-error');
    if (!error) {
      error = document.createElement('div');
      error.className = 'form-error';
      form.insertBefore(error, form.firstChild);
    }
    
    error.innerHTML = `
      <div style="background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; border: 1px solid #f5c6cb; margin-bottom: 1rem;">
        ⚠️ ${message}
      </div>
    `;
    
    setTimeout(() => error.remove(), 5000);
  }
}

console.log('🔥 auth-provider.js: Clase definida');
console.log('🔥 auth-provider.js: Llamando a init()...');

authJwtAuthProvider.init();

console.log('🔥 auth-provider.js: init() ejecutado');

window.authJwtAuthProvider = authJwtAuthProvider;

console.log('🔥 auth-provider.js: Exportado a window');