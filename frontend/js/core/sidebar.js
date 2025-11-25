class sidebar {
  static menuData = {
    menu: []
  };

  static async init() {
    await this.loadMenu();
    
    const firstView = this.getFirstView();
    if (firstView) {
      if (window.view && typeof view.loadView === 'function') {
        await view.loadView(firstView);
      }
    }
  }

  static async loadMenu() {
    try {
      if (window.hook && typeof hook.getMenuItems === 'function') {
        const pluginMenus = hook.getMenuItems();
        
        const baseMenu = [
          {
            id: "dashboard",
            title: "Dashboard",
            icon: "📊",
            view: "dashboard",
            order: 1
          }
        ];
        
        const allMenuItems = [...baseMenu, ...pluginMenus];
        const uniqueMenuItems = this.removeDuplicateMenus(allMenuItems);
        
        this.menuData.menu = uniqueMenuItems;
      } else {
        this.menuData.menu = [
          {
            id: "dashboard",
            title: "Dashboard",
            icon: "📊",
            view: "dashboard"
          }
        ];
      }
      
      this.renderMenu();
      
    } catch (error) {
      console.error('SIDEBAR: Error cargando menú:', error);
      this.menuData.menu = [
        {
          id: "dashboard",
          title: "Dashboard",
          icon: "📊",
          view: "dashboard"
        }
      ];
      this.renderMenu();
    }
  }

  static removeDuplicateMenus(menuItems) {
    const seen = new Set();
    return menuItems.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  static renderMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const menuHTML = this.generateMenuHtml(this.menuData.menu);
    const logoutButton = this.generateLogoutButton();
    
    sidebar.innerHTML = menuHTML + logoutButton;
    
    this.bindMenuEvents();
    this.bindLogoutEvent();
  }

  static generateMenuHtml(menuItems, level = 0) {
    return menuItems.map(item => {
      const hasSubmenu = item.items && item.items.length > 0;
      const isSubmenu = level > 0;
      const itemClass = `menu-item ${hasSubmenu ? 'has-submenu' : ''} ${isSubmenu ? 'submenu-item' : ''} level-${level}`;
      
      const showIcon = !isSubmenu && item.icon;
      const iconHtml = showIcon ? `<span class="menu-icon">${item.icon}</span>` : '';
      
      return `
        <div class="${itemClass}" data-id="${item.id}" data-level="${level}">
          ${iconHtml}
          <span class="menu-title">${item.title}</span>
          ${hasSubmenu ? '<span class="menu-arrow"></span>' : ''}
        </div>
        ${hasSubmenu ? `
          <div class="submenu level-${level + 1}">
            ${this.generateMenuHtml(item.items, level + 1)}
          </div>
        ` : ''}
      `;
    }).join('');
  }

  static generateLogoutButton() {
    const user = window.auth?.getUser();
    const userName = user?.name || user?.email || 'Usuario';
    
    return `
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <span class="user-icon">👤</span>
          <span class="user-name">${userName}</span>
        </div>
        <button class="btn-logout" id="btn-logout">
          <span class="logout-icon">🚪</span>
          <span class="logout-text">Cerrar Sesión</span>
        </button>
      </div>
    `;
  }

  static bindLogoutEvent() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const confirmed = confirm('¿Estás seguro que deseas cerrar sesión?');
        if (confirmed) {
          await auth.logout();
        }
      });
    }
  }

  static bindMenuEvents() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        const menuId = item.dataset.id;
        const level = parseInt(item.dataset.level) || 0;
        const menuData = this.findMenuData(menuId, level);
        
        if (menuData.items && menuData.items.length > 0) {
          this.toggleSubmenu(item);
          e.stopPropagation();
        } else if (menuData.view) {
          this.setActiveMenu(item);
          
          const pluginName = this.detectPluginFromMenuId(menuId);
          
          const menuResources = {
            scripts: menuData.scripts || [],
            styles: menuData.styles || []
          };
          
          // ✅ Precargar vistas hermanas con preloadViews: true
          console.log(`🔍 SIDEBAR: Click en menú "${menuId}" (level: ${level}, plugin: ${pluginName || 'core'})`);
          this.preloadSiblingViews(menuId, level, pluginName);
          
          if (pluginName) {
            view.loadView(menuData.view, null, pluginName, menuResources);
          } else {
            view.loadView(menuData.view, null, null, menuResources);
          }
        }
      });
    });
  }

  static preloadSiblingViews(currentMenuId, currentLevel, pluginName) {
    console.log(`🔎 PRELOAD: Buscando hermanos de "${currentMenuId}" (level: ${currentLevel})`);
    
    const parentMenu = this.findParentMenu(currentMenuId, currentLevel);
    const siblings = parentMenu ? parentMenu.items : this.menuData.menu;
    
    console.log(`📋 PRELOAD: Hermanos encontrados:`, siblings?.map(s => `${s.id} (preload: ${s.preloadViews})`));
    
    if (!siblings) {
      console.log(`⚠️ PRELOAD: No se encontraron hermanos`);
      return;
    }
    
    let preloadCount = 0;
    siblings.forEach(sibling => {
      if (sibling.id !== currentMenuId && sibling.preloadViews === true && sibling.view) {
        console.log(`🎯 PRELOAD: Iniciando precarga de "${sibling.id}" -> ${sibling.view}`);
        this.preloadView(sibling.view, pluginName);
        preloadCount++;
      }
    });
    
    if (preloadCount === 0) {
      console.log(`ℹ️ PRELOAD: Ningún hermano tiene preloadViews: true`);
    } else {
      console.log(`✅ PRELOAD: Se iniciaron ${preloadCount} precargas`);
    }
  }

  static async preloadView(viewPath, pluginName) {
    try {
      let basePath, fullPath, cacheKey;
      
      console.log(`🚀 PRELOAD VIEW: Iniciando "${viewPath}" (plugin: ${pluginName || 'core'})`);
      
      if (pluginName) {
        basePath = window.appConfig?.routes?.pluginViews?.replace('{pluginName}', pluginName) || `plugins/${pluginName}/views`;
        fullPath = `${window.BASE_URL}${basePath}/${viewPath}.json`;
        cacheKey = `view_${pluginName}_${viewPath.replace(/\//g, '_')}`;
      } else {
        basePath = window.appConfig?.routes?.coreSections || 'js/views';
        fullPath = `${window.BASE_URL}${basePath}/${viewPath}.json`;
        cacheKey = `view_${viewPath.replace(/\//g, '_')}`;
      }
      
      console.log(`📂 PRELOAD VIEW: Ruta construida: ${fullPath}`);
      console.log(`🔑 PRELOAD VIEW: Cache key: ${cacheKey}`);
      
      // Verificar si ya está en caché
      if (window.cache?.get(cacheKey)) {
        console.log(`✅ Ya en caché: ${pluginName ? pluginName + '/' : ''}${viewPath}`);
        return;
      }
      
      console.log(`⏳ PRELOAD VIEW: Haciendo fetch...`);
      const cacheBuster = window.appConfig?.isDevelopment ? `?v=${Date.now()}` : `?v=${window.appConfig.version}`;
      const response = await fetch(fullPath + cacheBuster);
      
      console.log(`📡 PRELOAD VIEW: Response status: ${response.status}`);
      
      if (response.ok) {
        const viewData = await response.json();
        window.cache?.set(cacheKey, viewData);
        console.log(`📦 PreCargada: ${pluginName ? pluginName + '/' : ''}${viewPath}`);
      } else {
        console.warn(`❌ PRELOAD VIEW: Response no OK (${response.status})`);
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo precargar: ${pluginName ? pluginName + '/' : ''}${viewPath}`, error);
    }
  }

  static findParentMenu(menuId, level) {
    console.log(`🔍 FIND PARENT: Buscando padre de "${menuId}" (level: ${level})`);
    
    if (level === 0) {
      console.log(`ℹ️ FIND PARENT: Level 0, no hay padre (items de raíz)`);
      return null;
    }
    
    const findRecursive = (items, targetId, currentLevel = 0) => {
      for (const item of items) {
        if (item.items && item.items.length > 0) {
          const hasChild = item.items.some(child => child.id === targetId);
          if (hasChild && currentLevel === level - 1) {
            console.log(`✅ FIND PARENT: Padre encontrado: "${item.id}"`);
            return item;
          }
          const found = findRecursive(item.items, targetId, currentLevel + 1);
          if (found) return found;
        }
      }
      return null;
    };
    
    const parent = findRecursive(this.menuData.menu, menuId);
    if (!parent) {
      console.log(`⚠️ FIND PARENT: No se encontró padre`);
    }
    return parent;
  }

  static setActiveMenu(activeItem) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
  }

  static detectPluginFromMenuId(menuId) {
    for (const [pluginName, pluginConfig] of Object.entries(view.loadedPlugins)) {
      if (menuId.startsWith(`${pluginName}-`)) {
        return pluginName;
      }
    }
    
    return null;
  }

  static findMenuData(menuId, level = 0) {
    const findRecursive = (items, targetId, currentLevel = 0) => {
      for (const item of items) {
        if (item.id === targetId && currentLevel === level) {
          return item;
        }
        if (item.items && item.items.length > 0) {
          const found = findRecursive(item.items, targetId, currentLevel + 1);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findRecursive(this.menuData.menu, menuId) || {};
  }

  static toggleSubmenu(element) {
    const isOpening = !element.classList.contains('open');
    element.classList.toggle('open');
    
    if (isOpening) {
      const level = parseInt(element.dataset.level) || 0;
      const siblings = document.querySelectorAll(`.menu-item.level-${level}`);
      siblings.forEach(sibling => {
        if (sibling !== element) {
          sibling.classList.remove('open');
        }
      });
    }
  }

  static getFirstView() {
    if (!this.menuData || !this.menuData.menu || this.menuData.menu.length === 0) {
      return 'dashboard';
    }
    
    const findFirstView = (items) => {
      for (const item of items) {
        if (item.view) {
          return item.view;
        }
        if (item.items && item.items.length > 0) {
          const view = findFirstView(item.items);
          if (view) return view;
        }
      }
      return null;
    };
    
    return findFirstView(this.menuData.menu) || 'dashboard';
  }
}

window.sidebar = sidebar;