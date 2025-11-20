// lang-selector.js - Componente para cambiar idioma
class langSelector {
  static render(container) {
    if (!window.i18n) return;

    const langs = i18n.getAvailableLangs();
    // ✅ Obtener idioma del storage primero, luego de i18n
    const current = i18n.getLangFromStorage() || i18n.getLang();

    const html = `
      <div class="lang-selector">
        <select id="lang-selector" class="lang-select">
          ${langs.map(lang => `
            <option value="${lang}" ${lang === current ? 'selected' : ''}>
              ${this.getLangName(lang)}
            </option>
          `).join('')}
        </select>
      </div>
    `;

    if (container) {
      container.innerHTML = html;
    } else {
      return html;
    }

    this.bindEvents();
  }

  static bindEvents() {
    const selector = document.getElementById('lang-selector');
    if (!selector) return;

    selector.addEventListener('change', async (e) => {
      const newLang = e.target.value;

      toast.info(i18n.t('core.loading'));

      await i18n.setLang(newLang);

      // Recargar página para aplicar todos los cambios
      location.reload();
    });
  }

  static getLangName(code) {
    const names = {
      'es': '🇪🇸 Español',
      'en': '🇬🇧 English',
      'pt': '🇵🇹 Português',
      'fr': '🇫🇷 Français'
    };
    return names[code] || code.toUpperCase();
  }

  // ✅ Función de inicialización automática
  static init() {
    if (!window.i18n) return;

    const header = document.getElementById('header');
    if (!header) return;

    // Evitar duplicados
    const existing = document.getElementById('lang-selector-container');
    if (existing) {
      existing.remove();
    }

    const langContainer = document.createElement('div');
    langContainer.id = 'lang-selector-container';
    langContainer.style.marginLeft = 'auto';
    header.appendChild(langContainer);

    this.render(langContainer);
  }
}

window.langSelector = langSelector;

// ✅ Auto-registrar función de inicialización global
window.initLangSelector = function() {
  if (window.langSelector) {
    langSelector.init();
  }
};