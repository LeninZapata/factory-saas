class toast {
  static container = null;
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
    this.ensureContainer(config.position);
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${config.type}`;
    toastEl.innerHTML = `
      <span class="toast-icon">${this.getIcon(config.type)}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="toast.remove(this.parentElement)">×</button>
    `;

    this.container.appendChild(toastEl);
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
    if (this.container?.dataset.position === position) return;
    
    this.container?.remove();
    this.active = [];
    this.container = document.createElement('div');
    this.container.className = `toast-container toast-${position}`;
    this.container.dataset.position = position;
    document.body.appendChild(this.container);
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