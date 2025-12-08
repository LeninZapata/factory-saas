class toast {
  static containers = {}; // Mapa de contenedores por posición
  static queue = [];
  static active = [];
  static maxVisible = 5;

  static show(message, options = {}) {
    const config = {
      type: options.type || 'info',
      duration: options.duration || 3000,
      position: options.position || 'top-right',
      ...options
    };

    if (this.active.length < this.maxVisible) {
      this.display(message, config);
    } else {
      this.queue.push({ message, config });
    }
  }

  static success(message, options = {}) {
    this.show(message, { ...options, type: 'success' });
  }

  static error(message, options = {}) {
    this.show(message, { ...options, type: 'error' });
  }

  static info(message, options = {}) {
    this.show(message, { ...options, type: 'info' });
  }

  static warning(message, options = {}) {
    this.show(message, { ...options, type: 'warning' });
  }

  static display(message, config) {
    const container = this.ensureContainer(config.position);

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${config.type}`;
    toastEl.innerHTML = `
      <span class="toast-icon">${this.getIcon(config.type)}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="toast.remove(this.parentElement)">×</button>
    `;

    container.appendChild(toastEl);
    this.active.push(toastEl);

    setTimeout(() => toastEl.classList.add('toast-show'), 10);

    setTimeout(() => this.remove(toastEl), config.duration);
  }

  static remove(toastEl) {
    if (!toastEl || !toastEl.classList.contains('toast-show')) return;

    toastEl.classList.remove('toast-show');

    setTimeout(() => {
      toastEl.remove();
      this.active = this.active.filter(t => t !== toastEl);

      if (this.queue.length > 0) {
        const { message, config } = this.queue.shift();
        this.display(message, config);
      }
    }, 300);
  }

  static ensureContainer(position) {
    // Si ya existe el contenedor para esta posición, retornarlo
    if (this.containers[position]) {
      return this.containers[position];
    }

    // Crear nuevo contenedor para esta posición
    const container = document.createElement('div');
    container.className = `toast-container toast-${position}`;
    container.dataset.position = position;
    document.body.appendChild(container);

    // Guardar referencia
    this.containers[position] = container;

    return container;
  }

  static getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }
}

window.toast = toast;