class ejemplosHooks {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 CASO 1: Hooks en Vista con Tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static hook_hooksCaso1() {
    logger.debug('p:ejemplos', 'hook_hooksCaso1 ejecutado');

    return [
      // ✅ Hook 1: ANTES de los tabs (aparece encima de todo)
      {
        id: 'hook-antes-tabs',
        type: 'html',
        order: 1,
        context: 'view',
        position: 'before',
        content: `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin:0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">🎯</span>
              Hook ANTES de Tabs
            </h3>
            <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 4px; font-size: 0.9rem;">
              <div><strong>context:</strong> view</div>
              <div><strong>position:</strong> before</div>
              <div><strong>order:</strong> 1</div>
            </div>
            <p style="margin:0.75rem 0 0 0; opacity: 0.9;">Este hook aparece ANTES de los tabs, encima de todo.</p>
          </div>
        `
      },
      
      // ✅ Hook 2: DENTRO del Tab 1, al inicio (order 5 < 10)
      {
        id: 'hook-tab1-inicio',
        type: 'html',
        order: 5,
        context: 'tab',
        target: 'tab1',
        content: `
          <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #166534;">🎯 Hook DENTRO de Tab 1 (Inicio)</h4>
            <div style="background: #f0fdf4; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> tab</div>
              <div><strong>target:</strong> tab1</div>
              <div><strong>order:</strong> 5</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook está DENTRO del Tab 1, aparece al inicio porque su order (5) es menor que el contenido original (10).</p>
          </div>
        `
      },
      
      // ✅ Hook 3: DENTRO del Tab 1, en medio (order 15: entre 10 y 20)
      {
        id: 'hook-tab1-medio',
        type: 'html',
        order: 15,
        context: 'tab',
        target: 'tab1',
        content: `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #92400e;">🎯 Hook EN MEDIO de Tab 1</h4>
            <div style="background: #fefce8; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> tab</div>
              <div><strong>target:</strong> tab1</div>
              <div><strong>order:</strong> 15</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook está EN MEDIO porque su order (15) está entre 10 y 20.</p>
          </div>
        `
      },
      
      // ✅ Hook 4: DENTRO del Tab 1, al final (order 25 > 20)
      {
        id: 'hook-tab1-final',
        type: 'html',
        order: 25,
        context: 'tab',
        target: 'tab1',
        content: `
          <div style="background: #e0e7ff; border-left: 4px solid #6366f1; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #4338ca;">🎯 Hook AL FINAL de Tab 1</h4>
            <div style="background: #eef2ff; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> tab</div>
              <div><strong>target:</strong> tab1</div>
              <div><strong>order:</strong> 25</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook aparece al final porque su order (25) es mayor que todo el contenido (10, 20).</p>
          </div>
        `
      },
      
      // ✅ Hook 5: DENTRO del Tab 2
      {
        id: 'hook-tab2',
        type: 'html',
        order: 5,
        context: 'tab',
        target: 'tab2',
        content: `
          <div style="background: #fce7f3; border-left: 4px solid #db2777; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #9f1239;">🎯 Hook DENTRO de Tab 2</h4>
            <div style="background: #fdf2f8; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> tab</div>
              <div><strong>target:</strong> tab2</div>
              <div><strong>order:</strong> 5</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook está DENTRO del Tab 2. El Tab 3 NO tiene hooks.</p>
          </div>
        `
      },
      
      // ✅ Hook 6: DESPUÉS de los tabs (debajo de todo)
      {
        id: 'hook-despues-tabs',
        type: 'html',
        order: 999,
        context: 'view',
        position: 'after',
        content: `
          <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 1.5rem; border-radius: 8px; margin-top: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin:0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">🎯</span>
              Hook DESPUÉS de Tabs
            </h3>
            <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 4px; font-size: 0.9rem;">
              <div><strong>context:</strong> view</div>
              <div><strong>position:</strong> after</div>
              <div><strong>order:</strong> 999</div>
            </div>
            <p style="margin:0.75rem 0 0 0; opacity: 0.9;">Este hook aparece DESPUÉS de los tabs, debajo de todo.</p>
          </div>
        `
      }
    ];
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 CASO 2: Hooks en Vista con Content
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  static hook_hooksCaso2() {
    logger.debug('p:ejemplos', 'hook_hooksCaso2 ejecutado');

    return [
      // Hook al inicio (order 5 < 10)
      {
        id: 'hook-content-inicio',
        type: 'html',
        order: 5,
        context: 'content',
        content: `
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #065f46;">🎯 Hook al INICIO del Content</h4>
            <div style="background: #ecfdf5; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> content</div>
              <div><strong>order:</strong> 5</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook aparece al inicio porque order (5) < 10.</p>
          </div>
        `
      },
      
      // Hook en medio (order 15: entre 10 y 20)
      {
        id: 'hook-content-medio',
        type: 'html',
        order: 15,
        context: 'content',
        content: `
          <div style="background: #fce7f3; border-left: 4px solid #db2777; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #9f1239;">🎯 Hook en MEDIO del Content</h4>
            <div style="background: #fdf2f8; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> content</div>
              <div><strong>order:</strong> 15</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook aparece entre 10 y 20 porque order = 15.</p>
          </div>
        `
      },
      
      // Hook en medio-final (order 25: entre 20 y 30)
      {
        id: 'hook-content-medio2',
        type: 'html',
        order: 25,
        context: 'content',
        content: `
          <div style="background: #e0e7ff; border-left: 4px solid #6366f1; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #4338ca;">🎯 Hook entre 20 y 30</h4>
            <div style="background: #eef2ff; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> content</div>
              <div><strong>order:</strong> 25</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook aparece entre contenido de order 20 y 30.</p>
          </div>
        `
      },
      
      // Hook al final (order 35 > 30)
      {
        id: 'hook-content-final',
        type: 'html',
        order: 35,
        context: 'content',
        content: `
          <div style="background: #ddd6fe; border-left: 4px solid #8b5cf6; padding: 1rem; border-radius: 6px; margin: 0.5rem 0;">
            <h4 style="margin:0 0 0.5rem 0; color: #6b21a8;">🎯 Hook al FINAL del Content</h4>
            <div style="background: #ede9fe; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <div><strong>context:</strong> content</div>
              <div><strong>order:</strong> 35</div>
            </div>
            <p style="margin:0; font-size: 0.9rem;">Este hook aparece al final porque order (35) > 30.</p>
          </div>
        `
      }
    ];
  }
}

window.ejemplosHooks = ejemplosHooks;