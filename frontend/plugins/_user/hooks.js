class userHooks {
  static hook_dashboard() {
    console.log('✅ userHooks: hook_dashboard ejecutado');
    
    return [
      {
        id: 'user-stats',
        type: 'html',
        order: 5,
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
      }
    ];
  }

  // ✅ NUEVO: Hook para agregar campo al formulario de producto
  static hook_form_producto_form() {
    console.log('✅ userHooks: hook_form_producto_form ejecutado');
    console.log('📋 Agregando campo de usuario al formulario de producto');
    
    return [
      {
        name: 'usuario_responsable',
        label: '👤 Usuario Responsable',
        type: 'select',
        required: false,
        order: 100, // Se agrega al final
        options: [
          { value: '', label: 'Seleccionar usuario...' },
          { value: '1', label: '👤 Juan Pérez (Admin)' },
          { value: '2', label: '👤 María García (Editor)' },
          { value: '3', label: '👤 Carlos López (Usuario)' },
          { value: '4', label: '👤 Ana Martínez (Editor)' },
          { value: '5', label: '👤 Pedro Sánchez (Usuario)' }
        ]
      },
      {
        name: 'nota_usuario',
        label: '📝 Nota del Usuario',
        type: 'textarea',
        required: false,
        order: 101,
        placeholder: 'Notas adicionales del usuario responsable...'
      }
    ];
  }

  // ✅ Ejemplo adicional: Hook para el formulario de login
  /*static hook_form_login_form() {
    console.log('✅ userHooks: hook_form_login_form ejecutado');
    
    return [
      {
        name: 'language',
        label: '🌐 Idioma',
        type: 'select',
        required: false,
        order: 50,
        options: [
          { value: 'es', label: '🇪🇸 Español' },
          { value: 'en', label: '🇺🇸 English' }
        ]
      }
    ];
  }*/
}

// ✅ REGISTRAR GLOBALMENTE
window.userHooks = userHooks;