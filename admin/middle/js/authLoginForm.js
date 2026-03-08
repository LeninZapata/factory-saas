/**
 * @doc-start
 * FILE: middle/js/authLoginForm.js
 * CLASS: ogAuthLoginForm
 * TYPE: middle-auth
 * PROMPT: fe-middle
 *
 * ROLE:
 *   Manejo del formulario de login en el DOM. Registra el handler del submit,
 *   valida campos requeridos, gestiona el estado del botón durante la petición
 *   y muestra errores inline en el formulario.
 *   Sub-módulo de ogAuth — no se usa directamente desde extensiones.
 *
 * HANDLER (setupLoginHandler):
 *   Usa ogEvents.on() para escuchar submit en form[data-form-id*="login-form"].
 *   Solo se registra una vez (_loginHandlerRegistered). Extrae user/pass del
 *   FormData, llama ogAuthCore.login(data), muestra error si falla.
 *
 * ERRORES (showLoginError):
 *   Crea o reutiliza un div.form-error en el primer hijo del form.
 *   Muestra el mensaje con fondo rojo durante 5 segundos y luego lo elimina.
 *
 * REGISTRO:
 *   window.ogAuthLoginForm
 *   ogFramework.core.authLoginForm
 * @doc-end
 */
class ogAuthLoginForm {
  static _loginHandlerRegistered = false;

  static setupLoginHandler() {
    const events = ogModule('events');
    if (!events) {
      ogLogger.error('core:auth', 'events no está cargado');
      return;
    }

    if (this._loginHandlerRegistered) return;
    this._loginHandlerRegistered = true;

    events.on('form[data-form-id*="login-form"]', 'submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const form = this;
      const data = Object.fromEntries(new FormData(form));

      if (!data.user || !data.pass) {
        ogAuthLoginForm.showLoginError(form, __('core.auth.error.required_fields'));
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = __('core.auth.login.loading');
      }

      const result = await ogAuthCore.login(data);

      if (btn) {
        btn.disabled = false;
        btn.textContent = __('core.auth.login.submit_text');
      }

      if (!result.success) {
        ogAuthLoginForm.showLoginError(form, result.error || __('core.auth.error.login_failed'));
      }
    }, document);

    ogLogger.info('core:auth', 'Handler de login registrado');
  }

  static showLoginError(form, message) {
    let error = form.querySelector('.form-error');

    if (!error) {
      error = document.createElement('div');
      error.className = 'form-error';
      form.insertBefore(error, form.firstChild);
    }

    error.innerHTML = `
      <div style="background:#f8d7da;color:#721c24;padding:12px;border-radius:4px;border:1px solid #f5c6cb;margin-bottom:1rem;">
        ⚠️ ${message}
      </div>
    `;

    setTimeout(() => error.remove(), 5000);
  }
}

window.ogAuthLoginForm = ogAuthLoginForm;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.authLoginForm = ogAuthLoginForm;
}