class ogGrouper {
  static async render(config, container) {
    ogLogger.info('com:grouper', '🔎 render() llamado', { config, container });

    if (!config?.groups) {
      ogLogger.error('com:grouper', 'Config inválido o sin groups');
      return;
    }

    const mode = config.mode || 'linear';
    ogLogger.info('com:grouper', `📦 Creando grouper ${mode} con ${config.groups.length} grupos`);

    if (mode === 'linear') {
      await this.renderLinear(config, container);
    } else if (mode === 'tabs') {
      await this.renderTabs(config, container);
    }

    ogLogger.info('com:grouper', '✅ render completado');
  }

  static async renderLinear(config, container) {
    const grouperId = `og-grouper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const collapsible = config.collapsible !== false;
    const openFirst = config.openFirst !== false;

    let html = `<div class="og-grouper og-grouper-linear" id="${grouperId}">`;

    config.groups.forEach((group, index) => {
      const isOpen = openFirst && index === 0;
      const contentId = `${grouperId}-content-${index}`;

      html += `
        <div class="og-grouper-section ${isOpen ? 'open' : ''}" data-group-index="${index}">
          <div class="og-grouper-header ${collapsible ? 'collapsible' : 'non-collapsible'}" data-toggle="${contentId}">
            <h3 class="og-grouper-title">${group.title || `Grupo ${index + 1}`}</h3>
            ${collapsible ? '<span class="og-grouper-toggle">▼</span>' : ''}
          </div>
          <div class="og-grouper-content" id="${contentId}" style="${isOpen ? '' : 'display:none'}">
            ${group.content || ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    if (collapsible) {
      const headers = container.querySelectorAll('.og-grouper-header.collapsible');

      headers.forEach(header => {
        header.addEventListener('click', () => {
          const contentId = header.dataset.toggle;
          const content = document.getElementById(contentId);
          const section = header.closest('.og-grouper-section');
          const isOpen = section.classList.contains('open');

          const allSections = container.querySelectorAll('.og-grouper-section');
          allSections.forEach(s => s.classList.remove('open'));

          const allContents = container.querySelectorAll('.og-grouper-content');
          allContents.forEach(c => c.style.display = 'none');

          if (!isOpen) {
            section.classList.add('open');
            content.style.display = '';
          }
        });
      });
    }

    await this.initDynamicContent(container);
  }

  static async renderTabs(config, container) {
    const grouperId = `og-grouper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const activeIndex = config.activeIndex || 0;

    let html = `<div class="og-grouper og-grouper-tabs" id="${grouperId}">`;
    html += '<div class="og-grouper-tabs-header-wrap"><div class="og-grouper-tabs-header">';

    config.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <button class="og-grouper-tab-btn ${isActive ? 'active' : ''}" data-tab-index="${index}">
          ${group.title || `Tab ${index + 1}`}
        </button>
      `;
    });

    html += '</div></div><div class="og-grouper-tabs-content">';

    config.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <div class="og-grouper-tab-panel ${isActive ? 'active' : ''}" data-tab-index="${index}">
          ${group.content || ''}
        </div>
      `;
    });

    html += '</div></div>';
    container.innerHTML = html;

    // Detectar overflow para mostrar degradados
    setTimeout(() => {
      this.checkTabsOverflow(container.querySelector('.og-grouper-tabs-header'));
    }, 100);

    const buttons = container.querySelectorAll('.og-grouper-tab-btn');
    const panels = container.querySelectorAll('.og-grouper-tab-panel');

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        button.classList.add('active');
        panels[index].classList.add('active');
      });
    });

    await this.initDynamicContent(container);
  }

  static checkTabsOverflow(header) {
    if (!header) return;
    const wrap = header.closest('.og-grouper-tabs-header-wrap') || header;

    const update = () => {
      const hasOverflow = header.scrollWidth > header.clientWidth;
      if (!hasOverflow) {
        wrap.classList.remove('has-overflow-right', 'has-overflow-left');
        return;
      }
      wrap.classList.toggle('has-overflow-left', header.scrollLeft > 5);
      wrap.classList.toggle('has-overflow-right', header.scrollLeft + header.clientWidth < header.scrollWidth - 5);
    };

    update();
    header.addEventListener('scroll', update);
  }

  static async initDynamicContent(container) {
    const dynamicForms = container.querySelectorAll('.dynamic-form[data-form-json]');
    const form = ogModule('form');

    for (const formContainer of dynamicForms) {
      const formJson = formContainer.dataset.formJson;
      if (formJson && form) {
        try {
          ogLogger.info('com:grouper', `Cargando form: ${formJson}`);
          await form.load(formJson, formContainer);
        } catch (error) {
          ogLogger.error('com:grouper', `Error cargando form ${formJson}:`, error);
        }
      }
    }
  }
}

window.ogGrouper = ogGrouper;

if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.components.grouper = ogGrouper;
  ogLogger.info('com:grouper', '✅ Registrado en ogFramework.components.grouper');
}

ogLogger.info('com:grouper', '✅ Registrado en window.grouper');
/**
 * @doc-start
 * FILE: framework/js/components/grouper.js
 * CLASS: ogGrouper
 * TYPE: component
 * PROMPT: fe-components
 *
 * ROLE:
 *   Contenedor visual que agrupa secciones de contenido en dos modos:
 *   acordeón colapsable (linear) o pestañas horizontales (tabs).
 *   Usado como componente dinámico en vistas y como field type:'grouper'
 *   dentro de formularios (renderizado por ogFormRender).
 *
 * MODOS:
 *   linear  → acordeón: cada grupo tiene header clicable y body colapsable
 *             solo un grupo abierto a la vez, primero abierto por defecto
 *   tabs    → pestañas horizontales con contenido por tab
 *             soporta overflow con flecha de scroll
 *
 * CONFIG:
 *   {
 *     mode: 'linear' | 'tabs',        // default: linear
 *     collapsible: true,              // default: true (solo linear)
 *     openFirst: true,                // default: true (solo linear)
 *     groups: [
 *       { title: 'Grupo 1', content: '<html>' },
 *       { title: 'Grupo 2', content: '<html>' }
 *     ]
 *   }
 *
 * CONTENIDO DINÁMICO:
 *   initDynamicContent(container) → después de renderizar, busca
 *   .dynamic-form y .dynamic-component dentro del grouper y los inicializa
 *   igual que ogViewComponents.loadDynamicComponents().
 *
 * USO:
 *   await ogGrouper.render(config, containerEl);
 *
 * REGISTRO:
 *   window.ogGrouper
 *   ogFramework.components.grouper
 * @doc-end
 */