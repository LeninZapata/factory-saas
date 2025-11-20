class userHooks {
  static hook_dashboard() {
    console.log('✅ userHooks: hook_dashboard ejecutado');
    
    return [
      {
        id: 'user-stats',
        type: 'html',
        order: 5, // ✅ Entre welcome (0) y system-stats (10)
        content: `
          <div class="dashboard-widget" style="border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; background: #f0f9ff; margin: 10px 0;">
            <h3>👥 Estadísticas de Usuarios</h3>
            <p>Usuarios activos: <strong>150</strong></p>
            <p>Nuevos hoy: <strong>5</strong></p>
            <button class="btn btn-sm btn-primary" onclick="alert('Agregar usuario')">
              Agregar Usuario
            </button>
          </div>
        `
      },
      {
        id: 'recent-users', 
        type: 'html',
        order: 15, // ✅ Después de system-stats (10)
        content: `
          <div class="dashboard-widget" style="border: 2px solid #10b981; padding: 15px; border-radius: 8px; background: #f0fdf4; margin: 10px 0;">
            <h4>🆕 Usuarios Recientes</h4>
            <ul>
              <li>Juan Pérez - hoy</li>
              <li>María García - hoy</li>
              <li>Carlos López - ayer</li>
            </ul>
          </div>
        `
      }
    ];
  }
}

// ✅ REGISTRAR GLOBALMENTE - ESTO ES IMPORTANTE
window.userHooks = userHooks;