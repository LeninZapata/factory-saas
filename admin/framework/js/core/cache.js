// No se requieren cambios, ya cumple con la convención actual.
class ogCache {
  static memoryCache = new Map();
  static defaultTTL = 60 * 60 * 1000;
  static prefix = null;
  static customSpace = null; // Para override de space

  static getPrefix() {
    if (!this.prefix) {
      const config = window.ogFramework?.activeConfig || window.appConfig;
      const slug = config?.slug || 'default';
      const space = this.customSpace || config?.space || 'default';

      // Construir prefijo SIN version (para evitar problemas con version dinámica)
      this.prefix = `cache_${slug}_${space}_`;
    }
    return this.prefix;
  }

  // Configurar space personalizado (ej: multi-tenancy)
  static setSpace(space) {
    this.customSpace = space;
    this.resetPrefix();
  }

  static getSpace() {
    const config = window.ogFramework?.activeConfig || window.appConfig;
    return this.customSpace || config?.space || 'default';
  }

  static getPrefixedKey(key) {
    return `${this.getPrefix()}${key}`;
  }

  static resetPrefix() {
    this.prefix = null;
  }

  static setMemory(key, data, ttl = this.defaultTTL) {
    const prefixedKey = this.getPrefixedKey(key);
    const item = {
      data,
      expiry: Date.now() + ttl,
      ttl
    };
    this.memoryCache.set(prefixedKey, item);
    return true;
  }

  static getMemory(key) {
    const prefixedKey = this.getPrefixedKey(key);
    const item = this.memoryCache.get(prefixedKey);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(prefixedKey);
      return null;
    }

    return item.data;
  }

  static setLocal(key, data, ttl = this.defaultTTL) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = {
        data,
        expiry: Date.now() + ttl,
        ttl
      };
      localStorage.setItem(prefixedKey, JSON.stringify(item));
      return true;
    } catch (error) {
      return false;
    }
  }

  static getLocal(key) {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const stored = localStorage.getItem(prefixedKey);
      if (!stored) return null;

      const item = JSON.parse(stored);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(prefixedKey);
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
    const prefixedKey = this.getPrefixedKey(key);
    this.memoryCache.delete(prefixedKey);
    localStorage.removeItem(prefixedKey);
  }

  static clear() {
    // Forzar recalcular prefix con el contexto actual
    this.resetPrefix();
    const prefix = this.getPrefix();

    // Limpiar memoryCache solo del proyecto actual
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar localStorage solo del proyecto actual
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // Limpiar TODO el cache de TODOS los slugs
  static clearAll() {
    // Limpiar TODO el memoryCache
    this.memoryCache.clear();

    // Limpiar TODO el localStorage que tenga prefijo cache_
    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => localStorage.removeItem(key));

    ogLogger?.info('core:cache', '🗑️ Cache completo eliminado (todos los slugs)');
  }

  static isExpired(key) {
    const prefixedKey = this.getPrefixedKey(key);
    const stored = localStorage.getItem(prefixedKey);
    if (!stored) return true;

    try {
      const item = JSON.parse(stored);
      return Date.now() > item.expiry;
    } catch (error) {
      return true;
    }
  }

  static getTimeToExpire(key) {
    const prefixedKey = this.getPrefixedKey(key);
    const stored = localStorage.getItem(prefixedKey);
    if (!stored) return 0;

    try {
      const item = JSON.parse(stored);
      const remaining = item.expiry - Date.now();
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      return 0;
    }
  }

  static getStats() {
    const prefix = this.getPrefix();
    const memoryKeys = Array.from(this.memoryCache.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));

    const localKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));

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
    const prefix = this.getPrefix();

    // Limpiar memoryCache
    for (const [key, item] of this.memoryCache.entries()) {
      if (key.startsWith(prefix) && Date.now() > item.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // Limpiar localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
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

  static enableDebug(slug = null) {
    // Si no se pasa slug, usar el del activeConfig
    if (!slug) {
      const config = window.ogFramework?.activeConfig || window.appConfig;
      slug = config?.slug || 'default';
    }

    const debugKey = `debugCache_${slug}`;

    window[debugKey] = {
      stats: () => this.getStats(),
      clear: () => this.clear(),
      clearAll: () => this.clearAll(),
      list: (type = 'all') => {
        const stats = this.getStats();
        if (type === 'memory') return stats.memory;
        if (type === 'local') return stats.localStorage;
        return stats;
      },
      get: (key) => this.get(key),
      delete: (key) => this.delete(key),
      isExpired: (key) => this.isExpired(key),
      timeToExpire: (key) => this.getTimeToExpire(key),
      prefix: () => this.getPrefix(),
      space: () => this.getSpace(),
      setSpace: (space) => this.setSpace(space),
      slug: () => slug,
      info: () => {
        const config = window.ogFramework?.activeConfig || window.appConfig;
        return {
          slug: config?.slug || 'default',
          version: config?.version || '1.0.0',
          space: this.getSpace(),
          prefix: this.getPrefix()
        };
      }
    };

    // También mantener window.debugCache genérico (apunta al último)
    window.debugCache = window[debugKey];
  }
}

setInterval(() => window?.ogCache?.cleanup(), 5 * 60 * 1000);

window.addEventListener('load', () => window?.ogCache?.cleanup());

// Global
window.ogCache = ogCache;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.cache = ogCache;
}
/**
 * @doc-start
 * FILE: framework/js/core/cache.js
 * CLASS: ogCache
 * TYPE: core-service
 * PROMPT: fe-core-services
 *
 * ROLE:
 *   Cache de dos capas: memoria (Map) y localStorage, con TTL y prefijo por slug+space.
 *   get/set usan ambas capas automáticamente: primero memoria, luego localStorage.
 *   El prefijo se construye como cache_{slug}_{space}_ para aislar datos entre instancias.
 *
 * MÉTODOS PRINCIPALES:
 *   get(key)                    → memoria → localStorage → null
 *   set(key, data, ttl?)        → guarda en memoria y localStorage
 *   delete(key)                 → elimina de ambas capas
 *   clear()                     → limpia todas las keys del slug+space activo
 *   clearAll()                  → limpia memoria + todo localStorage del prefijo
 *   memoryGet(key, default?)    → solo memoria, retorna default si no existe
 *
 * CAPAS INDIVIDUALES:
 *   getMemory(key) / setMemory(key, data, ttl?)   → solo Map en memoria
 *   getLocal(key)  / setLocal(key, data, ttl?)    → solo localStorage
 *
 * TTL:
 *   Por defecto: 1 hora (3.600.000 ms)
 *   Personalizable por llamada: ogCache.set('key', data, 30 * 60 * 1000)
 *
 * ESPACIO (multi-tenancy):
 *   ogCache.setSpace('tenant-123')  → cambia el space y resetea el prefijo
 *   Útil para aislar datos de distintos tenants en la misma instancia
 *
 * USO:
 *   ogCache.set('user_list', data);
 *   const users = ogCache.get('user_list');
 *   ogCache.delete('user_list');
 *
 * REGISTRO:
 *   window.ogCache
 *   ogFramework.core.cache
 * @doc-end
 */