class datatable {
  static tables = new Map();
  static counter = 0;

  static async render(config, container) {
    const tableId = `datatable-${++this.counter}`;
    
    console.log('📊 DATATABLE: Renderizando con config', config);
    
    // Detectar plugin name: primero desde config, luego desde container
    const pluginName = config.pluginName || this.detectPluginName(container);
    console.log('🔌 DATATABLE: Plugin Name:', pluginName || 'NONE');
    
    // Cargar datos usando dataLoader
    const data = await this.loadData(config, pluginName);
    
    // Guardar referencia
    this.tables.set(tableId, { config, data, pluginName });
    
    // Renderizar
    const html = this.generateHtml(tableId, config, data);
    container.innerHTML = html;
    
    // Bind events
    this.bindEvents(tableId);
  }

  static detectPluginName(container) {
    console.log('🔍 DATATABLE: Detectando nombre del plugin...');
    
    // Estrategia 1: Buscar data-plugin en el contenedor o ancestros
    const viewContainer = container.closest('[data-plugin]');
    if (viewContainer?.dataset.plugin) {
      console.log('✅ DATATABLE: Plugin detectado desde data-plugin:', viewContainer.dataset.plugin);
      return viewContainer.dataset.plugin;
    }
    
    // Estrategia 2: Buscar en el DOM la vista activa
    const activeView = document.querySelector('.view-container[data-view]');
    if (activeView?.dataset.view) {
      const viewPath = activeView.dataset.view;
      // Si la vista es de un plugin, el path será: plugin/sections/vista
      const parts = viewPath.split('/');
      if (parts.length > 1 && window.hook?.isPluginEnabled(parts[0])) {
        console.log('✅ DATATABLE: Plugin detectado desde data-view:', parts[0]);
        return parts[0];
      }
    }
    
    // Estrategia 3: Buscar en view.currentPlugin
    if (window.view?.currentPlugin) {
      console.log('✅ DATATABLE: Plugin detectado desde view.currentPlugin:', window.view.currentPlugin);
      return window.view.currentPlugin;
    }
    
    // Estrategia 4: Buscar clases CSS con patrón plugin-*
    const pluginClass = Array.from(container.classList || [])
      .find(cls => cls.startsWith('plugin-'));
    if (pluginClass) {
      const pluginName = pluginClass.replace('plugin-', '');
      console.log('✅ DATATABLE: Plugin detectado desde clase CSS:', pluginName);
      return pluginName;
    }
    
    console.warn('⚠️ DATATABLE: No se pudo detectar el plugin, retornando null');
    return null;
  }

  static async loadData(config, pluginName) {
    try {
      // Si tiene dataSource, usar dataLoader
      if (config.dataSource) {
        console.log('✅ DATATABLE: Usando dataLoader');
        return await dataLoader.loadList(config.dataSource, pluginName);
      }
      
      // Fallback al método antiguo (source directo)
      if (config.source) {
        console.log('⚠️ DATATABLE: Usando método legacy (source)');
        const response = await fetch(config.source);
        if (!response.ok) throw new Error('Error loading data');
        return await response.json();
      }
      
      console.error('❌ DATATABLE: No se especificó dataSource ni source');
      return [];
      
    } catch (error) {
      console.error('❌ DATATABLE: Error loading data', error);
      return [];
    }
  }

  static generateHtml(tableId, config, data) {
    const columns = config.columns || Object.keys(data[0] || {});
    const hasActions = config.actions && Object.keys(config.actions).length > 0;

    return `
      <div class="datatable-container" id="${tableId}">
        <table class="table">
          <thead>
            <tr>
              ${columns.map(col => `<th>${this.formatHeader(col)}</th>`).join('')}
              ${hasActions ? '<th>Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => this.renderRow(row, columns, config.actions)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static renderRow(row, columns, actions) {
    const hasActions = actions && Object.keys(actions).length > 0;
    
    return `
      <tr>
        ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
        ${hasActions ? `<td>${this.renderActions(row, actions)}</td>` : ''}
      </tr>
    `;
  }

  static renderActions(row, actions) {
    console.log('🎬 DATATABLE renderActions - Row:', row);
    
    const buttons = Object.entries(actions).map(([key, action]) => {
      console.log(`🔧 DATATABLE: Procesando acción "${key}"`);
      console.log(`📝 DATATABLE: Template onclick: ${action.onclick}`);
      
      const onclick = this.replaceVars(action.onclick, row);
      
      console.log(`🔗 DATATABLE: onclick después de replaceVars:`, onclick);
      
      // Agregar data-loader-config si existe
      let dataAttrs = '';
      if (action.dataLoader) {
        const loaderConfig = JSON.stringify(action.dataLoader).replace(/"/g, '&quot;');
        dataAttrs = ` data-loader-config="${loaderConfig}" data-row-id="${row.id || row.ID || ''}"`;
        console.log(`📦 DATATABLE: DataLoader config agregado al botón`);
      }
      
      const button = `<button class="btn btn-sm btn-secondary" onclick="${onclick}"${dataAttrs}>${action.name}</button>`;
      
      console.log(`🏷️ DATATABLE: HTML del botón generado:`, button);
      
      return button;
    }).join(' ');
    
    console.log('✅ DATATABLE renderActions - Todos los botones:', buttons);
    console.log('═════════════════════════════════════════');
    
    return buttons;
  }

  static replaceVars(str, row) {
    console.log('🔍 DATATABLE replaceVars - String original:', str);
    console.log('📋 DATATABLE replaceVars - Row data:', row);
    
    const result = str.replace(/\{(\w+)\}/g, (match, key) => {
      if (row[key] === undefined) {
        console.log(`⚠️ DATATABLE: Key "${key}" no encontrada en row`);
        return match;
      }
      
      const originalValue = row[key];
      console.log(`🔑 DATATABLE: Procesando {${key}} = "${originalValue}"`);
      
      // Escapar comillas simples, dobles y otros caracteres especiales
      const value = String(originalValue)
        .replace(/\\/g, '\\\\')   // Escapar backslashes primero
        .replace(/'/g, "\\'")      // Escapar comillas simples
        .replace(/"/g, '\\"')      // Escapar comillas dobles
        .replace(/\n/g, '\\n')     // Escapar saltos de línea
        .replace(/\r/g, '\\r');    // Escapar retornos de carro
      
      console.log(`✅ DATATABLE: Valor escapado: "${value}"`);
      console.log(`📤 DATATABLE: Retornando SIN comillas adicionales: ${value}`);
      
      // ⚠️ NO agregar comillas aquí, ya están en el template del JSON
      return value;
    });
    
    console.log('🎯 DATATABLE replaceVars - Resultado final:', result);
    console.log('─────────────────────────────────────────');
    
    return result;
  }

  static formatHeader(col) {
    return col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ');
  }

  static bindEvents(tableId) {
    // Eventos futuros si son necesarios
  }

  static refresh(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return;
    
    const container = document.getElementById(tableId).parentElement;
    this.render(table.config, container);
  }
}

window.datatable = datatable;