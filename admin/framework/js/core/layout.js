class ogLayout {
  static init(mode = 'app', container = null) {
    // OBTENER EL CONTENEDOR DE LA CONFIGURACIÓN ACTIVA
    let app = container;

    if (!app) {
      const config = window.ogFramework?.activeConfig;
      if (config && config.container) {
        app = document.querySelector(config.container);
      } else {
        app = document.getElementById('app');
      }
    }

    if (!app) {
      ogLogger?.error('core:layout', '❌ Layout: Contenedor no encontrado');
      return;
    }


    if (mode === 'auth') {
      app.innerHTML = `
        <div class="og-layout auth-mode">
          <div class="og-content" id="content"></div>
        </div>
      `;
    } else {
      const html = `
        <div class="og-layout sidebar-compact2">
          <header class="og-header" id="header">
            <button class="og-menu-toggle" id="menu-toggle" style="display: none;">☰</button>
            <span>${__('core.layout.system_title')}</span>
          </header>
          <div class="og-sidebar-overlay" id="sidebar-overlay"></div>
          <aside class="og-sidebar" id="sidebar"></aside>
          <main class="og-content" id="content">
            <div class="view-container">
              <div class="welcome-message">
                <p>${__('core.layout.loading')}</p>
              </div>
            </div>
            <footer class="og-footer">${__('core.layout.footer')}</footer>
          </main>
        </div>
      `;
      
      app.innerHTML = html;
      
      
      // Verificar que el sidebar existe después de insertar
      const sidebarCheck = document.getElementById('sidebar');
      
      if (sidebarCheck) {
        ogLogger?.success('core:layout', `✅ #sidebar creado exitosamente`);
      } else {
        ogLogger?.error('core:layout', `❌ #sidebar NO encontrado después de insertar HTML`);
      }
      
      this.initResponsive();
    }
    
    ogLogger?.success('core:layout', `✅ Layout init completado`);
  }

  static initResponsive() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const updateUI = () => {
      if (window.innerWidth <= 1024) {
        toggle.style.display = 'flex';
      } else {
        toggle.style.display = 'none';
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    };

    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });

    window.addEventListener('resize', updateUI);
    updateUI();
  }
}

// Global
window.ogLayout = ogLayout;

// Registrar en ogFramework (preferido)
if (typeof window.ogFramework !== 'undefined') {
  window.ogFramework.core.layout = ogLayout;
}
/**
 * @doc-start
 * FILE: framework/js/core/layout.js
 * CLASS: ogLayout
 * TYPE: core-view
 * PROMPT: fe-view-hook
 *
 * ROLE:
 *   Genera la estructura HTML base de la aplicación e inyecta dentro del
 *   contenedor raíz (#app). Crea el esqueleto DOM que sidebar, view y auth
 *   necesitan antes de poder operar. Se llama una sola vez desde bootApp().
 *
 * MODOS:
 *   'app'   → estructura completa: header + sidebar + main#content + footer
 *             usada en la aplicación principal autenticada
 *   'auth'  → estructura mínima: solo div#content sin sidebar ni header
 *             usada por ogAuth para mostrar el login
 *
 * ESTRUCTURA HTML GENERADA (modo app):
 *   .og-layout.sidebar-compact2
 *     header.og-header#header
 *     .og-sidebar-overlay#sidebar-overlay
 *     aside.og-sidebar#sidebar          ← ogSidebar escribe aquí
 *     main.og-content#content           ← ogView escribe aquí
 *       footer.og-footer
 *
 * RESPONSIVE:
 *   initResponsive() activa el toggle del sidebar en pantallas ≤1024px.
 *   El botón #menu-toggle aparece solo en mobile.
 *
 * USO:
 *   ogLayout.init('app', containerElement);   // desde bootApp()
 *   ogLayout.init('auth', containerElement);  // desde ogAuth cuando no autenticado
 *
 * REGISTRO:
 *   window.ogLayout
 *   ogFramework.core.layout
 * @doc-end
 */