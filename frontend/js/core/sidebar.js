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
          const pluginName = this.detectPluginFromMenuId(menuId);
          
          const menuResources = {
            scripts: menuData.scripts || [],
            styles: menuData.styles || []
          };
          
          if (pluginName) {
            view.loadView(menuData.view, null, pluginName, menuResources);
          } else {
            view.loadView(menuData.view, null, null, menuResources);
          }
        }
      });
    });
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