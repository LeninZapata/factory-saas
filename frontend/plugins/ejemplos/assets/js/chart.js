class ejemploChart {
  static charts = {};
  static registeredEvents = new Set();
  static initialized = false;

  static init() {
    if (this.initialized) {
      console.log('📊 Gráficos ya inicializados, recreando...');
    }
    
    console.log('📊 Inicializando componente de gráficos');
    
    // Verificar que los containers existan
    const chart1 = document.getElementById('chart1');
    const chart2 = document.getElementById('chart2');
    
    if (!chart1 && !chart2) {
      console.warn('⚠️ Containers de gráficos no encontrados');
      return;
    }
    
    // Limpiar charts anteriores
    this.charts = {};
    
    // Crear gráficos de ejemplo
    if (chart1) {
      this.createChart('chart1', {
        title: '📈 Ventas Mensuales',
        data: [65, 59, 80, 81, 56, 55, 40],
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
        color: '#3498db'
      });
    }
    
    if (chart2) {
      this.createChart('chart2', {
        title: '👥 Usuarios Activos',
        data: [28, 48, 40, 19, 86, 27, 90],
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        color: '#2ecc71'
      });
    }
    
    this.bindEventsOnce();
    this.initialized = true;
  }

  static createChart(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`⚠️ Container ${containerId} no encontrado`);
      return;
    }
    
    const maxValue = Math.max(...config.data);
    
    const html = `
      <div class="chart-card">
        <h3 class="chart-title">${config.title}</h3>
        <div class="chart-bars">
          ${config.data.map((value, index) => {
            const percentage = (value / maxValue) * 100;
            return `
              <div class="chart-bar-container">
                <div class="chart-bar" 
                     style="height: ${percentage}%; background: ${config.color};"
                     data-value="${value}">
                  <span class="chart-value">${value}</span>
                </div>
                <span class="chart-label">${config.labels[index]}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    this.charts[containerId] = config;
  }

  static bindEventsOnce() {
    if (this.registeredEvents.has('chart-events')) return;
    
    events.on('.chart-bar', 'mouseenter', function(e) {
      this.style.opacity = '0.8';
      this.style.transform = 'scale(1.05)';
    }, document);
    
    events.on('.chart-bar', 'mouseleave', function(e) {
      this.style.opacity = '1';
      this.style.transform = 'scale(1)';
    }, document);
    
    this.registeredEvents.add('chart-events');
  }

  static randomize() {
    Object.keys(this.charts).forEach(chartId => {
      const config = this.charts[chartId];
      config.data = config.data.map(() => Math.floor(Math.random() * 100));
      this.createChart(chartId, config);
    });
  }

  static reset() {
    this.init();
  }
}

// ✅ NO auto-inicializar - dejar que view.js lo haga
window.ejemploChart = ejemploChart;