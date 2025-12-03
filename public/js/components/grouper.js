/**
 * Grouper Component - Agrupa elementos visualmente
 * Modos: linear (acordeón) y tabs
 */
class grouper {
  static counter = 0;
  static instances = new Map();

  static render(config, container) {
    const grouperId = `grouper-${++this.counter}`;
    const mode = config.mode || 'linear';

    if (!['linear', 'tabs'].includes(mode)) {
      logger.error('com:grouper', `Modo "${mode}" no válido`);
      return;
    }

    container.innerHTML = mode === 'linear' ? 
      this.renderLinear(grouperId, config) : 
      this.renderTabs(grouperId, config);

    this.instances.set(grouperId, { mode, config, container });
    this.bindEvents(grouperId);
    logger.success('com:grouper', `Renderizado en modo "${mode}" con ${config.groups?.length || 0} grupos`);

    return grouperId;
  }

  static renderLinear(grouperId, config) {
    const collapsible = config.collapsible !== false;
    const openFirst = config.openFirst !== false;
    let html = `<div class="grouper grouper-linear" id="${grouperId}">`;

    config.groups.forEach((group, index) => {
      const isOpen = openFirst && index === 0;
      const groupId = `${grouperId}-group-${index}`;
      html += `
        <div class="grouper-section ${isOpen ? 'open' : ''}" data-group-index="${index}">
          <div class="grouper-header ${collapsible ? 'collapsible' : ''}" ${collapsible ? `data-toggle="${groupId}"` : ''}>
            <h3 class="grouper-title">${group.title || `Grupo ${index + 1}`}</h3>
            ${collapsible ? '<span class="grouper-toggle">▼</span>' : ''}
          </div>
          <div class="grouper-content" id="${groupId}" ${!isOpen ? 'style="display:none"' : ''}>
            ${group.content || ''}
          </div>
        </div>`;
    });

    return html + `</div>`;
  }

  static renderTabs(grouperId, config) {
    const activeIndex = config.activeIndex || 0;
    let html = `<div class="grouper grouper-tabs" id="${grouperId}"><div class="grouper-tabs-header">`;

    config.groups.forEach((group, index) => {
      html += `<button class="grouper-tab-btn ${index === activeIndex ? 'active' : ''}" data-tab-index="${index}">
          ${group.title || `Tab ${index + 1}`}</button>`;
    });

    html += `</div><div class="grouper-tabs-content">`;

    config.groups.forEach((group, index) => {
      html += `<div class="grouper-tab-panel ${index === activeIndex ? 'active' : ''}" data-panel-index="${index}">
          ${group.content || ''}</div>`;
    });

    return html + `</div></div>`;
  }

  static bindEvents(grouperId) {
    const container = document.getElementById(grouperId);
    if (!container) return;

    const instance = this.instances.get(grouperId);
    if (!instance) return;

    instance.mode === 'linear' ? 
      this.bindLinearEvents(grouperId, container) : 
      this.bindTabsEvents(grouperId, container);
  }

  static bindLinearEvents(grouperId, container) {
    container.querySelectorAll('.grouper-header.collapsible').forEach(header => {
      header.addEventListener('click', () => {
        const content = document.getElementById(header.dataset.toggle);
        const section = header.closest('.grouper-section');
        if (!content) return;

        const isOpen = section.classList.contains('open');
        section.classList.toggle('open', !isOpen);
        content.style.display = isOpen ? 'none' : 'block';
      });
    });
  }

  static bindTabsEvents(grouperId, container) {
    const tabButtons = container.querySelectorAll('.grouper-tab-btn');
    const tabPanels = container.querySelectorAll('.grouper-tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.dataset.tabIndex);
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        button.classList.add('active');
        const targetPanel = container.querySelector(`[data-panel-index="${index}"]`);
        if (targetPanel) targetPanel.classList.add('active');
        logger.debug('com:grouper', `Tab ${index} activado`);
      });
    });
  }

  static switchTab(grouperId, tabIndex) {
    const button = document.getElementById(grouperId)?.querySelector(`[data-tab-index="${tabIndex}"]`);
    if (button) {
      button.click();
    } else {
      logger.error('com:grouper', `Tab ${tabIndex} no encontrado en ${grouperId}`);
    }
  }

  static toggleSection(grouperId, sectionIndex, forceOpen = null) {
    const section = document.getElementById(grouperId)?.querySelector(`[data-group-index="${sectionIndex}"]`);
    if (!section) {
      logger.error('com:grouper', `Sección ${sectionIndex} no encontrada en ${grouperId}`);
      return;
    }

    const header = section.querySelector('.grouper-header');
    const isOpen = section.classList.contains('open');

    if (forceOpen === null || (forceOpen && !isOpen) || (!forceOpen && isOpen)) {
      header.click();
    }
  }

  static openAll(grouperId) {
    document.getElementById(grouperId)?.querySelectorAll('.grouper-section').forEach((_, index) => {
      this.toggleSection(grouperId, index, true);
    });
    logger.debug('com:grouper', `Todas las secciones abiertas en ${grouperId}`);
  }

  static closeAll(grouperId) {
    document.getElementById(grouperId)?.querySelectorAll('.grouper-section').forEach((_, index) => {
      this.toggleSection(grouperId, index, false);
    });
    logger.debug('com:grouper', `Todas las secciones cerradas en ${grouperId}`);
  }
}

window.grouper = grouper;