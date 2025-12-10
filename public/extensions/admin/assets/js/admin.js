class admin {
  static API = '/api/user';
  static currentId = null;

  // Inicializar formulario (crear nuevo)
  static async initForm(formId) {
    this.currentId = null;
    if (window.adminPermissions) adminPermissions.init(formId);
  }

  // Inicializar formulario con datos (editar)
  static async initFormWithData(formId, id) {
    this.currentId = id;
    const data = await this.get(id);
    if (data) {
      // Parsear config si viene como string
      const config = typeof data.config === 'string' ? JSON.parse(data.config) : (data.config || {});

      // Llenar campos básicos y preferencias
      const formData = {
        username: data.user,
        email: data.email,
        role: data.role,
        preferences_theme: config.preferences?.theme || 'light',
        preferences_language: config.preferences?.language || 'es',
        preferences_notifications: config.preferences?.notifications ? 'on' : ''
      };

      logger.debug('ext:admin', 'Llenando formulario con datos:', formData);

      form.fill(formId, formData);

      // Cargar permisos
      if (window.adminPermissions) adminPermissions.load(formId, data);
    }
  }

  // Guardar (create o update)
  static async save(formId) {
    const validation = form.validate(formId);
    if (!validation.success) return toast.error(`❌ ${validation.message}`);

    logger.debug('ext:admin', 'Datos del formulario:', validation.data);

    // Construir config combinando permisos y preferencias
    const baseConfig = window.adminPermissions ? adminPermissions.getData() : { permissions: { extensions: {} }};

    const preferences = {
      theme: validation.data.preferences_theme || 'light',
      language: validation.data.preferences_language || 'es',
      notifications: validation.data.preferences_notifications === 'on' || validation.data.preferences_notifications === true
    };

    const config = {
      ...baseConfig,
      preferences
    };

    logger.debug('ext:admin', 'Config final:', config);

    const data = {
      user: validation.data.username,
      email: validation.data.email,
      role: validation.data.role,
      pass: validation.data.password || undefined,
      config
    };

    const result = this.currentId
      ? await this.update(this.currentId, data)
      : await this.create(data);

    if (result) {
      toast.success(this.currentId ? '✅ Usuario actualizado' : '✅ Usuario creado');
      setTimeout(() => {
        modal.closeAll();
        this.refreshTable();
      }, 800);
    }
  }

  // Refrescar tabla sin reload
  static refreshTable() {
    if (window.datatable) {
      datatable.refreshFirst();
    }
  }

  // CRUD básico
  static async create(data) { return this.request('POST', this.API, data); }
  static async update(id, data) { return this.request('PUT', `${this.API}/${id}`, {...data, id}); }
  static async delete(id) { return this.request('DELETE', `${this.API}/${id}`); }
  static async get(id) { return this.request('GET', `${this.API}/${id}`); }
  static async list() { return this.request('GET', this.API); }

  // Request genérico
  static async request(method, url, data = null) {
    try {
      const response = await api[method.toLowerCase()](url, data);
      if (response.success === false) {
        toast.error(`❌ ${response.error || 'Error'}`);
        return null;
      }
      return response.data || response;
    } catch (error) {
      logger.error('ext:admin', error);
      toast.error(`❌ ${error.message}`);
      return null;
    }
  }
}

window.admin = admin;