class widget {
  static grids = new Map();
  static draggedWidget = null;

  static async render(config, container) {
    const gridId = `widget-grid-${Date.now()}`;
    this.grids.set(gridId, config);

    const cols = config.columns || 2;
    container.innerHTML = `<div class="widget-grid" id="${gridId}" data-cols="${cols}"></div>`;

    const grid = document.getElementById(gridId);

    for (const widgetConfig of config.widgets || []) {
      await this.addWidget(grid, widgetConfig);
    }

    this.bindDragEvents(grid);
  }

  static async addWidget(grid, config) {
    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    await this.loadWidgetContent(widgetId, config);
  }

  static async loadWidgetContent(widgetId, config) {
    const body = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (!body) return;

    try {
      if (config.component) {
        const compConfig = config.config || {};
        const placeholder = document.createElement('div');
        placeholder.className = 'dynamic-component';
        body.innerHTML = '';
        body.appendChild(placeholder);

        if (window[config.component]?.render) {
          await window[config.component].render(compConfig, placeholder);
        }
      } else if (config.view) {
        await view.loadView(config.view, body);
      } else if (config.form) {
        await form.load(config.form, body);
      } else if (config.html) {
        body.innerHTML = config.html;
      } else if (config.content) {
        body.innerHTML = this.renderContent(config.content);
      }
    } catch (error) {
      logger.error('com:widget', `Error cargando widget:`, error);
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
    const widgets = grid.querySelectorAll('.widget-item');

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