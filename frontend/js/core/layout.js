class layout {
  static init(mode = 'app') {
    const app = document.getElementById('app');
    if (!app) return;

    if (mode === 'auth') {
      app.innerHTML = `
        <div class="layout">
          <main class="content" id="content"></main>
        </div>
      `;
    } else {
      app.innerHTML = `
        <div class="layout">
          <header class="header" id="header">Sistema</header>
          <aside class="sidebar" id="sidebar"></aside>
          <main class="content" id="content">
            <div class="view-container">
              <div class="welcome-message">
                <p>Cargando...</p>
              </div>
            </div>
            <footer class="footer">© 2024 - Sistema</footer>
          </main>
        </div>
      `;
    }
  }
}

window.layout = layout;