/**
 * Grouper Component
 * Agrupa elementos visualmente con título
 * Soporta dos modos: linear (acordeón) y tabs
 */
class grouper {
  static counter = 0;
  static instances = new Map();

  /**
   * Renderiza grupos
   * @param {Object} config - Configuración
   * @param {HTMLElement} container - Contenedor
   * 
   * Ejemplo config:
   * {
   *   mode: 'linear' | 'tabs',
   *   groups: [
   *     {
   *       title: 'Información Básica',
   *       content: '<div>...</div>' // HTML o config de elementos
   *     }
   *   ]
   * }
   */
  static render(config, container) {
    const grouperId = `grouper-${++this.counter}`;
    const mode = config.mode || 'linear';

    let html = '';

    if (mode === 'linear') {
      html = this.renderLinear(grouperId, config);
    } else if (mode === 'tabs') {
      html = this.renderTabs(grouperId, config);
    } else {
      logger.error('com:grouper', `Modo "${mode}" no válido`);
      return;
    }

    container.innerHTML = html;

    // Guardar instancia
    this.instances.set(grouperId, {
      mode,
      config,
      container
    });

    // Bind eventos
    this.bindEvents(grouperId);

    logger.success('com:grouper', `Renderizado en modo "${mode}" con ${config.groups?.length || 0} grupos`);

    return grouperId;
  }

  /**
   * Renderiza grupos en modo linear (acordeón/secciones)
   */
  static renderLinear(grouperId, config) {
    const collapsible = config.collapsible !== false; // Por defecto es colapsable
    const openFirst = config.openFirst !== false; // Por defecto abre el primero

    let html = `<div class="grouper grouper-linear" id="${grouperId}">`;

    config.groups.forEach((group, index) => {
      const isOpen = openFirst && index === 0;
      const groupId = `${grouperId}-group-${index}`;

      html += `
        <div class="grouper-section ${isOpen ? 'open' : ''}" data-group-index="${index}">
          <div class="grouper-header ${collapsible ? 'collapsible' : ''}" 
               ${collapsible ? `data-toggle="${groupId}"` : ''}>
            <h3 class="grouper-title">${group.title || `Grupo ${index + 1}`}</h3>
            ${collapsible ? '<span class="grouper-toggle">▼</span>' : ''}
          </div>
          <div class="grouper-content" id="${groupId}" ${!isOpen ? 'style="display:none"' : ''}>
            ${group.content || ''}
          </div>
        </div>
      `;
    });

    html += `</div>`;

    return html;
  }

  /**
   * Renderiza grupos en modo tabs
   */
  static renderTabs(grouperId, config) {
    const activeIndex = config.activeIndex || 0;

    let html = `<div class="grouper grouper-tabs" id="${grouperId}">`;

    // Tabs header
    html += `<div class="grouper-tabs-header">`;
    config.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <button class="grouper-tab-btn ${isActive ? 'active' : ''}" 
                data-tab-index="${index}">
          ${group.title || `Tab ${index + 1}`}
        </button>
      `;
    });
    html += `</div>`;

    // Tabs content
    html += `<div class="grouper-tabs-content">`;
    config.groups.forEach((group, index) => {
      const isActive = index === activeIndex;
      html += `
        <div class="grouper-tab-panel ${isActive ? 'active' : ''}" 
             data-panel-index="${index}">
          ${group.content || ''}
        </div>
      `;
    });
    html += `</div>`;

    html += `</div>`;

    return html;
  }

  /**
   * Bind eventos
   */
  static bindEvents(grouperId) {
    const container = document.getElementById(grouperId);
    if (!container) return;

    const instance = this.instances.get(grouperId);
    if (!instance) return;

    if (instance.mode === 'linear') {
      this.bindLinearEvents(grouperId, container);
    } else if (instance.mode === 'tabs') {
      this.bindTabsEvents(grouperId, container);
    }
  }

  /**
   * Eventos para modo linear (acordeón)
   */
  static bindLinearEvents(grouperId, container) {
    // Click en header para colapsar/expandir
    container.querySelectorAll('.grouper-header.collapsible').forEach(header => {
      header.addEventListener('click', (e) => {
        const targetId = header.dataset.toggle;
        const content = document.getElementById(targetId);
        const section = header.closest('.grouper-section');

        if (!content) return;

        const isOpen = section.classList.contains('open');

        if (isOpen) {
          // Cerrar
          section.classList.remove('open');
          content.style.display = 'none';
        } else {
          // Abrir
          section.classList.add('open');
          content.style.display = 'block';
        }
      });
    });
  }

  /**
   * Eventos para modo tabs
   */
  static bindTabsEvents(grouperId, container) {
    const tabButtons = container.querySelectorAll('.grouper-tab-btn');
    const tabPanels = container.querySelectorAll('.grouper-tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.dataset.tabIndex);

        // Desactivar todos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        // Activar el seleccionado
        button.classList.add('active');
        const targetPanel = container.querySelector(`[data-panel-index="${index}"]`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        logger.debug('com:grouper', `Tab ${index} activado`);
      });
    });
  }

  /**
   * Cambiar a un tab específico (solo modo tabs)
   */
  static switchTab(grouperId, tabIndex) {
    const container = document.getElementById(grouperId);
    if (!container) {
      logger.error('com:grouper', `Container no encontrado: ${grouperId}`);
      return;
    }

    const button = container.querySelector(`[data-tab-index="${tabIndex}"]`);
    if (button) {
      button.click();
    } else {
      logger.error('com:grouper', `Tab ${tabIndex} no encontrado en ${grouperId}`);
    }
  }

  /**
   * Abrir/cerrar sección específica (solo modo linear)
   */
  static toggleSection(grouperId, sectionIndex, forceOpen = null) {
    const container = document.getElementById(grouperId);
    if (!container) {
      logger.error('com:grouper', `Container no encontrado: ${grouperId}`);
      return;
    }

    const section = container.querySelector(`[data-group-index="${sectionIndex}"]`);
    if (!section) {
      logger.error('com:grouper', `Sección ${sectionIndex} no encontrada en ${grouperId}`);
      return;
    }

    const header = section.querySelector('.grouper-header');
    const isOpen = section.classList.contains('open');

    if (forceOpen === null) {
      // Toggle
      header.click();
    } else if (forceOpen && !isOpen) {
      // Abrir si está cerrado
      header.click();
    } else if (!forceOpen && isOpen) {
      // Cerrar si está abierto
      header.click();
    }
  }

  /**
   * Abrir todas las secciones (solo modo linear)
   */
  static openAll(grouperId) {
    const container = document.getElementById(grouperId);
    if (!container) {
      logger.error('com:grouper', `Container no encontrado: ${grouperId}`);
      return;
    }

    const sections = container.querySelectorAll('.grouper-section');
    sections.forEach((section, index) => {
      this.toggleSection(grouperId, index, true);
    });

    logger.debug('com:grouper', `Todas las secciones abiertas en ${grouperId}`);
  }

  /**
   * Cerrar todas las secciones (solo modo linear)
   */
  static closeAll(grouperId) {
    const container = document.getElementById(grouperId);
    if (!container) {
      logger.error('com:grouper', `Container no encontrado: ${grouperId}`);
      return;
    }

    const sections = container.querySelectorAll('.grouper-section');
    sections.forEach((section, index) => {
      this.toggleSection(grouperId, index, false);
    });

    logger.debug('com:grouper', `Todas las secciones cerradas en ${grouperId}`);
  }
}

window.grouper = grouper;