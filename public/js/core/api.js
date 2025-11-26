class api {
  static baseURL = window.BASE_URL || window.appConfig?.api?.baseURL || '';
  static headers = { 'Content-Type': 'application/json', ...window.appConfig?.api?.headers };

  static async request(endpoint, options = {}) {
    const fullURL = `${this.baseURL}${endpoint}`;

    // Auto-agregar token si existe
    const headers = { ...this.headers };
    if (auth?.getToken?.()) headers['Authorization'] = `Bearer ${auth.getToken()}`;

    try {
      const res = await fetch(fullURL, { ...options, headers });

      // Logout automático si 401
      if (res.status === 401 && auth?.isAuthenticated?.()) auth.logout();

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`API Error: ${fullURL}`, error);
      throw error;
    }
  }

  static get = (e) => this.request(e);
  static post = (e, d) => this.request(e, { method: 'POST', body: JSON.stringify(d) });
  static put = (e, d) => this.request(e, { method: 'PUT', body: JSON.stringify(d) });
  static delete = (e) => this.request(e, { method: 'DELETE' });
}

window.api = api;