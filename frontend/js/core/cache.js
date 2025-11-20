class cache {
  static memoryCache = new Map();
  static defaultTTL = 60 * 60 * 1000;

  static setMemory(key, data, ttl = this.defaultTTL) {
    const item = {
      data,
      expiry: Date.now() + ttl,
      ttl
    };
    this.memoryCache.set(key, item);
    return true;
  }

  static getMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  static setLocal(key, data, ttl = this.defaultTTL) {
    try {
      const item = {
        data,
        expiry: Date.now() + ttl,
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      return true;
    } catch (error) {
      return false;
    }
  }

  static getLocal(key) {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) return null;

      const item = JSON.parse(stored);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      return null;
    }
  }

  static get(key) {
    const memoryData = this.getMemory(key);
    if (memoryData) return memoryData;

    const localData = this.getLocal(key);
    if (localData) {
      this.setMemory(key, localData);
      return localData;
    }

    return null;
  }

  static set(key, data, ttl = this.defaultTTL) {
    this.setMemory(key, data, ttl);
    this.setLocal(key, data, ttl);
    return true;
  }

  static delete(key) {
    this.memoryCache.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  static clear() {
    this.memoryCache.clear();

    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => localStorage.removeItem(key));
  }

  static getStats() {
    const memoryKeys = Array.from(this.memoryCache.keys());
    const localKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .map(key => key.replace('cache_', ''));

    return {
      memory: {
        count: memoryKeys.length,
        keys: memoryKeys
      },
      localStorage: {
        count: localKeys.length,
        keys: localKeys
      }
    };
  }

  static cleanup() {
    let cleaned = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (Date.now() > item.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (error) {
          localStorage.removeItem(key);
          cleaned++;
        }
      });

    return cleaned;
  }

  static enableDebug() {
    window.debugCache = {
      stats: () => this.getStats(),
      clear: () => this.clear(),
      list: (type = 'all') => {
        const stats = this.getStats();
        if (type === 'memory') return stats.memory;
        if (type === 'local') return stats.localStorage;
        return stats;
      },
      get: (key) => this.get(key),
      delete: (key) => this.delete(key)
    };
  }
}

setInterval(() => cache.cleanup(), 5 * 60 * 1000);

window.addEventListener('load', () => cache.cleanup());

window.cache = cache;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  cache.enableDebug();
}