class inventarioHooks {
  static hook_dashboard() {
    console.log('✅ inventarioHooks: hook_dashboard ejecutado');
    
    return [
      {
        id: 'inventario-resumen',
        type: 'html',
        order: 7,
        content: `
          <div class="dashboard-widget" style="border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); margin: 10px 0; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);">
            <h3 style="margin: 0 0 10px 0; color: #92400e; display: flex; align-items: center; gap: 8px;">
              📦 Resumen de Inventario
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px;">
              <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #3b82f6;">387</div>
                <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">Total Unidades</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.8rem; font-weight: bold; color: #10b981;">10</div>
                <div style="font-size: 0.85rem; color: #6b7280; margin-top: 4px;">Productos</div>
              </div>
            </div>
            <div style="background: #fee2e2; border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px;">
              <strong style="color: #991b1b;">⚠️ Alerta:</strong>
              <span style="color: #7f1d1d; font-size: 0.9rem;"> 2 productos con stock bajo</span>
            </div>
            <button class="btn btn-sm btn-primary" onclick="view.loadView('sections/stock'); toast.info('Cargando control de stock...')" style="width: 100%;">
              📊 Ver Stock Completo
            </button>
          </div>
        `
      },
      {
        id: 'productos-recientes',
        type: 'html',
        order: 12,
        content: `
          <div class="dashboard-widget" style="border: 2px solid #8b5cf6; padding: 15px; border-radius: 8px; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); margin: 10px 0; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);">
            <h4 style="margin: 0 0 12px 0; color: #5b21b6; display: flex; align-items: center; gap: 8px;">
              🆕 Productos Recientes
            </h4>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px; background: white; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">Laptop Dell XPS 15</span>
                <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">15 unid.</span>
              </li>
              <li style="padding: 8px; background: white; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">Monitor Samsung 27"</span>
                <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">12 unid.</span>
              </li>
              <li style="padding: 8px; background: white; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">Tablet iPad Pro 12.9"</span>
                <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">3 unid. ⚠️</span>
              </li>
            </ul>
            <button class="btn btn-sm btn-primary" onclick="modal.open('inventario|forms/producto', {title: '➕ Nuevo Producto', width: '60%', maxWidth: '700px'})" style="width: 100%; margin-top: 10px;">
              ➕ Agregar Producto
            </button>
          </div>
        `
      }
    ];
  }
}

// ✅ REGISTRAR GLOBALMENTE
window.inventarioHooks = inventarioHooks;