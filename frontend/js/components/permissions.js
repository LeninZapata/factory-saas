/**
 * Selector de Permisos de Usuario
 * Componente minimalista para asignar permisos por plugin/menu/tabs
 */

class permissions {
  static instances = new Map();
  static viewsCache = new Map();

  /**
   * Renderiza el selector de permisos
   * @param {string} containerId - ID del contenedor
   * @param {object} config - Configuración inicial de permisos
   * @param {array} pluginsData - Datos de plugins desde hooks
   */
  static async render(containerId, config = {}, pluginsData = []) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Permissions: Container no encontrado:', containerId);
      return;
    }

    const permissions = config.permissions || {};
    const selectorId = `permissions-${Date.now()}`;

    // Cargar tabs de todas las vistas
    console.log('📋 Permissions: Cargando tabs de vistas...');
    await this.loadAllViewsTabs(pluginsData);

    const html = `
      <div class="permissions-selector" id="${selectorId}">
        <div class="permissions-header">
          <h4>🔐 Permisos por Plugin</h4>
          <div class="permissions-actions">
            <button type="button" class="btn-link" onclick="permissions.toggleAll('${selectorId}', true)">
              ✅ Seleccionar Todo
            </button>
            <button type="button" class="btn-link" onclick="permissions.toggleAll('${selectorId}', false)">
              ❌ Desmarcar Todo
            </button>
          </div>
        </div>
        
        <div class="permissions-list">
          ${pluginsData.map(plugin => this.renderPlugin(plugin, permissions, selectorId)).join('')}
        </div>

        <input type="hidden" name="config" id="${selectorId}-data" value='${JSON.stringify(config)}'>
      </div>
    `;

    container.innerHTML = html;
    this.instances.set(selectorId, { config, pluginsData });
    this.bindEvents(selectorId);
    
    console.log('✅ Permissions: Renderizado exitosamente');
  }

  /**
   * Cargar tabs de todas las vistas de todos los plugins
   */
  static async loadAllViewsTabs(pluginsData) {
    for (const plugin of pluginsData) {
      if (!plugin.hasMenu || !plugin.menu?.items) continue;

      for (const menuItem of plugin.menu.items) {
        if (!menuItem.view) continue;

        const viewPath = menuItem.view;
        const cacheKey = `${plugin.name}:${viewPath}`;

        // Si ya está en caché, skip
        if (this.viewsCache.has(cacheKey)) continue;

        try {
          // Cargar el JSON de la vista
          const viewData = await this.loadViewJson(plugin.name, viewPath);
          
          // Extraer tabs si existen
          if (viewData?.tabs && Array.isArray(viewData.tabs)) {
            this.viewsCache.set(cacheKey, viewData.tabs);
            console.log(`✅ Permissions: Cargadas ${viewData.tabs.length} tabs de ${plugin.name}/${viewPath}`);
          } else {
            // Sin tabs, guardar null
            this.viewsCache.set(cacheKey, null);
            console.log(`ℹ️ Permissions: ${plugin.name}/${viewPath} no tiene tabs`);
          }
        } catch (error) {
          console.warn(`⚠️ Permissions: Error cargando ${plugin.name}/${viewPath}:`, error.message);
          this.viewsCache.set(cacheKey, null);
        }
      }
    }
  }

  /**
   * Cargar JSON de una vista
   */
  static async loadViewJson(pluginName, viewPath) {
    // Construir URL: /plugins/{plugin}/views/{viewPath}.json
    const url = `${window.BASE_URL}plugins/${pluginName}/views/${viewPath}.json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Renderiza un plugin con sus menus y tabs
   */
  static renderPlugin(plugin, permissions, selectorId) {
    const pluginPerms = permissions.plugins?.[plugin.name] || {};
    const isEnabled = pluginPerms.enabled !== false;
    const pluginId = `${selectorId}-plugin-${plugin.name}`;

    return `
      <div class="permission-plugin" data-plugin="${plugin.name}">
        <div class="permission-plugin-header">
          <label class="permission-checkbox">
            <input type="checkbox" 
                   class="plugin-toggle" 
                   data-plugin="${plugin.name}"
                   ${isEnabled ? 'checked' : ''}>
            <span class="plugin-name">📦 ${plugin.name}</span>
          </label>
          <button type="button" 
                  class="btn-collapse" 
                  data-target="${pluginId}"
                  onclick="permissions.toggleCollapse('${pluginId}')">
            ${isEnabled ? '▼' : '▶'}
          </button>
        </div>

        <div class="permission-plugin-content ${isEnabled ? 'open' : ''}" id="${pluginId}">
          ${plugin.hasMenu ? this.renderMenusWithTabs(plugin, pluginPerms, selectorId) : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza los menus de un plugin CON sus tabs
   */
  static renderMenusWithTabs(plugin, pluginPerms, selectorId) {
    if (!plugin.menu?.items) return '';

    const menusPerms = pluginPerms.menus || {};
    const allMenus = menusPerms === '*';

    return `
      <div class="permission-section">
        <div class="permission-section-header">
          <span>📋 Menús</span>
          <label class="permission-checkbox-sm">
            <input type="checkbox" 
                   class="section-toggle-all"
                   data-plugin="${plugin.name}"
                   data-section="menus"
                   ${allMenus ? 'checked' : ''}>
            <span>Todos</span>
          </label>
        </div>
        <div class="permission-items">
          ${plugin.menu.items.map(item => this.renderMenuItem(item, plugin, menusPerms, allMenus, selectorId)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza un item de menú CON sus tabs (si tiene)
   */
  static renderMenuItem(menuItem, plugin, menusPerms, allMenus, selectorId) {
    const menuPerms = menusPerms[menuItem.id] || {};
    const isMenuChecked = allMenus || menuPerms === true || (typeof menuPerms === 'object' && menuPerms.enabled !== false);
    
    // Obtener tabs de la vista
    const cacheKey = `${plugin.name}:${menuItem.view}`;
    const tabs = this.viewsCache.get(cacheKey);

    const hasExpandableTabs = tabs && tabs.length > 0;
    const tabsId = `${selectorId}-tabs-${plugin.name}-${menuItem.id}`;
    const isExpanded = isMenuChecked && hasExpandableTabs;

    return `
      <div class="permission-item-wrapper">
        <div class="permission-item-header">
          <label class="permission-item">
            <input type="checkbox" 
                   class="menu-checkbox"
                   data-plugin="${plugin.name}"
                   data-menu="${menuItem.id}"
                   ${isMenuChecked ? 'checked' : ''}
                   ${allMenus ? 'disabled' : ''}>
            <span>${menuItem.title}</span>
          </label>
          ${hasExpandableTabs ? `
            <button type="button" 
                    class="btn-collapse-sm" 
                    data-target="${tabsId}"
                    onclick="permissions.toggleCollapse('${tabsId}')">
              ${isExpanded ? '▼' : '▶'}
            </button>
          ` : ''}
        </div>
        
        ${hasExpandableTabs ? `
          <div class="permission-tabs ${isExpanded ? 'open' : ''}" id="${tabsId}">
            ${this.renderTabs(tabs, plugin, menuItem, menuPerms, selectorId)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Renderiza las tabs de un menú/vista
   */
  static renderTabs(tabs, plugin, menuItem, menuPerms, selectorId) {
    const tabsPerms = typeof menuPerms === 'object' ? menuPerms.tabs || {} : {};
    const allTabs = tabsPerms === '*';

    return `
      <div class="permission-tabs-header">
        <span>📑 Tabs</span>
        <label class="permission-checkbox-xs">
          <input type="checkbox" 
                 class="tabs-toggle-all"
                 data-plugin="${plugin.name}"
                 data-menu="${menuItem.id}"
                 ${allTabs ? 'checked' : ''}>
          <span>Todas</span>
        </label>
      </div>
      <div class="permission-tabs-list">
        ${tabs.map(tab => {
          const isChecked = allTabs || tabsPerms[tab.id] === true;
          return `
            <label class="permission-tab-item">
              <input type="checkbox" 
                     class="tab-checkbox"
                     data-plugin="${plugin.name}"
                     data-menu="${menuItem.id}"
                     data-tab="${tab.id}"
                     ${isChecked ? 'checked' : ''}
                     ${allTabs ? 'disabled' : ''}>
              <span>${tab.title}</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Bind eventos
   */
  static bindEvents(selectorId) {
    const container = document.getElementById(selectorId);
    if (!container) return;

    // Toggle plugin
    container.querySelectorAll('.plugin-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const plugin = e.target.dataset.plugin;
        const content = container.querySelector(`#${selectorId}-plugin-${plugin}`);
        const collapseBtn = e.target.closest('.permission-plugin-header').querySelector('.btn-collapse');
        
        if (e.target.checked) {
          content?.classList.add('open');
          if (collapseBtn) collapseBtn.textContent = '▼';
        } else {
          content?.classList.remove('open');
          if (collapseBtn) collapseBtn.textContent = '▶';
        }

        this.updateConfig(selectorId);
      });
    });

    // Toggle section all (menus)
    container.querySelectorAll('.section-toggle-all').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const plugin = e.target.dataset.plugin;
        const menuCheckboxes = container.querySelectorAll(`.menu-checkbox[data-plugin="${plugin}"]`);

        menuCheckboxes.forEach(cb => {
          cb.disabled = e.target.checked;
          cb.checked = e.target.checked;
        });

        // También deshabilitar todos los tab checkboxes
        const tabCheckboxes = container.querySelectorAll(`.tab-checkbox[data-plugin="${plugin}"]`);
        tabCheckboxes.forEach(cb => {
          cb.disabled = e.target.checked;
          cb.checked = e.target.checked;
        });

        this.updateConfig(selectorId);
      });
    });

    // Toggle menu checkbox
    container.querySelectorAll('.menu-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const plugin = e.target.dataset.plugin;
        const menu = e.target.dataset.menu;
        const tabsContainer = e.target.closest('.permission-item-wrapper')?.querySelector('.permission-tabs');
        
        if (tabsContainer) {
          const collapseBtn = e.target.closest('.permission-item-wrapper')?.querySelector('.btn-collapse-sm');
          if (e.target.checked) {
            tabsContainer.classList.add('open');
            if (collapseBtn) collapseBtn.textContent = '▼';
          } else {
            tabsContainer.classList.remove('open');
            if (collapseBtn) collapseBtn.textContent = '▶';
          }
        }

        this.updateConfig(selectorId);
      });
    });

    // Toggle all tabs
    container.querySelectorAll('.tabs-toggle-all').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const plugin = e.target.dataset.plugin;
        const menu = e.target.dataset.menu;
        const tabCheckboxes = container.querySelectorAll(
          `.tab-checkbox[data-plugin="${plugin}"][data-menu="${menu}"]`
        );

        tabCheckboxes.forEach(cb => {
          cb.disabled = e.target.checked;
          cb.checked = e.target.checked;
        });

        this.updateConfig(selectorId);
      });
    });

    // Toggle individual tab
    container.querySelectorAll('.tab-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateConfig(selectorId);
      });
    });
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(selectorId) {
    const container = document.getElementById(selectorId);
    if (!container) return;

    const instance = this.instances.get(selectorId);
    if (!instance) return;

    const newConfig = { ...instance.config };
    newConfig.permissions = { plugins: {} };

    // Procesar cada plugin
    instance.pluginsData.forEach(plugin => {
      const pluginCheckbox = container.querySelector(`.plugin-toggle[data-plugin="${plugin.name}"]`);
      if (!pluginCheckbox) return;

      const pluginData = {
        enabled: pluginCheckbox.checked
      };

      if (pluginCheckbox.checked && plugin.hasMenu) {
        // Verificar si "Todos los menús" está marcado
        const allMenusCheckbox = container.querySelector(
          `.section-toggle-all[data-plugin="${plugin.name}"][data-section="menus"]`
        );

        if (allMenusCheckbox?.checked) {
          pluginData.menus = '*';
        } else {
          // Procesar cada menú individualmente
          pluginData.menus = {};
          
          plugin.menu?.items.forEach(menuItem => {
            const menuCheckbox = container.querySelector(
              `.menu-checkbox[data-plugin="${plugin.name}"][data-menu="${menuItem.id}"]`
            );

            if (menuCheckbox?.checked) {
              // Verificar si tiene tabs
              const tabsToggleAll = container.querySelector(
                `.tabs-toggle-all[data-plugin="${plugin.name}"][data-menu="${menuItem.id}"]`
              );

              if (tabsToggleAll) {
                // Tiene tabs
                if (tabsToggleAll.checked) {
                  // Todas las tabs
                  pluginData.menus[menuItem.id] = { enabled: true, tabs: '*' };
                } else {
                  // Tabs individuales
                  const tabsData = {};
                  container.querySelectorAll(
                    `.tab-checkbox[data-plugin="${plugin.name}"][data-menu="${menuItem.id}"]`
                  ).forEach(tabCheckbox => {
                    if (tabCheckbox.checked) {
                      tabsData[tabCheckbox.dataset.tab] = true;
                    }
                  });

                  pluginData.menus[menuItem.id] = {
                    enabled: true,
                    tabs: Object.keys(tabsData).length > 0 ? tabsData : {}
                  };
                }
              } else {
                // No tiene tabs, solo el menú
                pluginData.menus[menuItem.id] = true;
              }
            }
          });
        }
      }

      newConfig.permissions.plugins[plugin.name] = pluginData;
    });

    // Actualizar hidden input
    const hiddenInput = document.getElementById(`${selectorId}-data`);
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(newConfig);
    }

    // Actualizar preview en la tab "📊 JSON Preview"
    const preview = document.getElementById('config-preview');
    if (preview) {
      preview.textContent = JSON.stringify(newConfig, null, 2);
    }

    instance.config = newConfig;
  }

  /**
   * Toggle collapse
   */
  static toggleCollapse(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const button = document.querySelector(`[data-target="${targetId}"]`);
    target.classList.toggle('open');
    
    if (button) {
      button.textContent = target.classList.contains('open') ? '▼' : '▶';
    }
  }

  /**
   * Toggle all
   */
  static toggleAll(selectorId, checked) {
    const container = document.getElementById(selectorId);
    if (!container) return;

    // Plugin toggles
    container.querySelectorAll('.plugin-toggle').forEach(cb => {
      cb.checked = checked;
      cb.dispatchEvent(new Event('change'));
    });

    // Section toggles
    container.querySelectorAll('.section-toggle-all').forEach(cb => {
      cb.checked = checked;
      cb.dispatchEvent(new Event('change'));
    });
  }
}

window.permissions = permissions;