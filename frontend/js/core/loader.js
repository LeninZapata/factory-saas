class loader {
  static loaded = new Set();

  static async loadScript(url) {
    if (this.loaded.has(url)) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        this.loaded.add(url);
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load: ${url}`));
      document.head.appendChild(script);
    });
  }

  static async loadStyle(url) {
    if (this.loaded.has(url)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        this.loaded.add(url);
        resolve();
      };
      link.onerror = () => reject(new Error(`Failed to load: ${url}`));
      document.head.appendChild(link);
    });
  }

  static async loadResources(scripts = [], styles = []) {
    const promises = [
      ...scripts.map(url => this.loadScript(url)),
      ...styles.map(url => this.loadStyle(url))
    ];

    return Promise.all(promises);
  }
}

window.loader = loader;