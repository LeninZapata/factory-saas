class authJwtAuthProvider {
  static init() {
    if (!window.events) {
      logger.error('p:auth-jwt', 'events.js no está cargado!');
      return;
    }

    this.setupLoginHandler();
  }

  static setupLoginHandler() {
    const listenerId = events.on('form[data-form-id*="login-form"]', 'submit', async function(e) {
      logger.info('p:auth-jwt', 'Interceptando submit del login');

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const form = this;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // Validar campos requeridos
      if (!data.user || !data.pass) {
        authJwtAuthProvider.showError(form, 'Usuario y contraseña son requeridos');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Ingresando...';
      }

      // Llamar al login del provider
      const result = await auth.login(data);

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }

      if (!result.success) {
        logger.warn('p:auth-jwt', 'Login falló:', result.error);
        authJwtAuthProvider.showError(form, result.error || 'Error al iniciar sesión');
      } else {
        logger.success('p:auth-jwt', 'Login exitoso');
      }
    }, document);

    logger.debug('p:auth-jwt', 'Handler registrado con ID:', listenerId);
  }

  static showError(form, message) {
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

authJwtAuthProvider.init();
window.authJwtAuthProvider = authJwtAuthProvider;