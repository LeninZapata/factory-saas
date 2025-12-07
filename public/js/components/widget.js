class widget {
  static grids = new Map();
  static draggedWidget = null;

  static async render(config, container) {
    // ✅ ESTANDARIZADO: render(config, container)
    // Mismo orden que: dataTable, grouper, tabs
    // view.js y tabs.js ahora llaman igual
    
    if (!container || typeof container.appendChild !== 'function') {
      logger.error('com:widget', 'Container no válido');
      return;
    }

    if (!config || !config.widgets) {
      logger.error('com:widget', 'Config no válido o sin widgets');
      return;
    }

    const gridId = `widget-grid-${Date.now()}`;
    this.grids.set(gridId, config);
    const cols = config.columns || 2;
    
    const grid = document.createElement('div');
    grid.className = 'widget-grid';
    grid.id = gridId;
    grid.dataset.cols = cols;
    
    container.innerHTML = '';
    container.appendChild(grid);

    for (const widgetConfig of config.widgets || []) {
      await this.addWidget(grid, widgetConfig);
    }

    this.bindDragEvents(grid);
  }

  static async addWidget(grid, config) {
    if (!grid) return;

    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.debug('com:widget', `Creando widget ${widgetId} con título: ${config.title}`);
    
    const widget = document.createElement('div');
    widget.className = 'widget-item';
    widget.id = widgetId;
    widget.draggable = true;
    widget.dataset.order = config.order || 999;

    widget.innerHTML = `
      <div class="widget-header">
        <h4>${config.title || 'Widget'}</h4>
        <span class="widget-drag">⋮⋮</span>
      </div>
      <div class="widget-body" data-widget-id="${widgetId}">
        <div class="widget-loading">Cargando...</div>
      </div>
    `;

    grid.appendChild(widget);
    
    logger.debug('com:widget', `Widget ${widgetId} agregado al DOM, llamando loadWidgetContent`);
    
    // ✅ Esperar a que el navegador renderice el elemento
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    await this.loadWidgetContent(widgetId, config);
  }

  static async loadWidgetContent(widgetId, config) {
    logger.debug('com:widget', `Buscando body para widget ${widgetId}`);
    
    const body = document.querySelector(`[data-widget-id="${widgetId}"]`);
    
    if (!body) {
      logger.error('com:widget', `No se encontró body para widget ${widgetId}`);
      // Mostrar qué widgets SÍ existen
      const allWidgets = document.querySelectorAll('[data-widget-id]');
      logger.debug('com:widget', `Widgets en DOM:`, Array.from(allWidgets).map(w => w.getAttribute('data-widget-id')));
      return;
    }

    logger.debug('com:widget', `Body encontrado para widget ${widgetId}. Config:`, config);

    try {
      if (config.component) {
        logger.debug('com:widget', `Cargando componente: ${config.component}`);
        const compConfig = config.config || {};
        const placeholder = document.createElement('div');
        placeholder.className = 'dynamic-component';
        body.innerHTML = '';
        body.appendChild(placeholder);

        if (window[config.component]?.render) {
          await window[config.component].render(compConfig, placeholder);
        } else {
          logger.error('com:widget', `Componente ${config.component} no existe en window`);
        }
      } else if (config.view) {
        logger.debug('com:widget', `Cargando vista: ${config.view}`);
        await view.loadView(config.view, body);
      } else if (config.form) {
        logger.debug('com:widget', `Cargando formulario: ${config.form}`);
        await form.load(config.form, body);
      } else if (config.html) {
        logger.debug('com:widget', `Cargando HTML directo (${config.html.length} caracteres)`);
        body.innerHTML = config.html;
        logger.debug('com:widget', `HTML insertado. Body innerHTML length: ${body.innerHTML.length}`);
      } else if (config.content) {
        logger.debug('com:widget', `Cargando content array`);
        body.innerHTML = this.renderContent(config.content);
      } else {
        logger.warn('com:widget', `Widget sin contenido. Config:`, config);
      }
      
      logger.debug('com:widget', `Widget ${widgetId} procesado`);
    } catch (error) {
      logger.error('com:widget', `Error cargando widget ${widgetId}:`, error);
      body.innerHTML = '<div class="widget-error">Error al cargar</div>';
    }
  }

  static renderContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(item => {
        if (typeof item === 'string') return item;
        if (item.type === 'html') return item.content || '';
        return '';
      }).join('');
    }
    return '';
  }

  static bindDragEvents(grid) {
    if (!grid) return;
    
    const widgets = grid.querySelectorAll('.widget-item');
    if (!widgets || widgets.length === 0) return;

    widgets.forEach(w => {
      w.addEventListener('dragstart', (e) => {
        this.draggedWidget = w;
        w.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      w.addEventListener('dragend', () => {
        w.classList.remove('dragging');
        this.draggedWidget = null;
      });

      w.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!this.draggedWidget || this.draggedWidget === w) return;

        const rect = w.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        if (e.clientY < midY) {
          w.parentNode.insertBefore(this.draggedWidget, w);
        } else {
          w.parentNode.insertBefore(this.draggedWidget, w.nextSibling);
        }
      });
    });
  }
}

window.widget = widget;