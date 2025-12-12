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
      const config = typeof data.config === 'string' ? JSON.parse(data.config) : (data.config || {});

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

      if (window.adminPermissions) adminPermissions.load(formId, data);
    }
  }

  // Guardar (create o update)
  static async save(formId) {
    const validation = form.validate(formId);
    if (!validation.success) return toast.error(`❌ ${validation.message}`);

    logger.debug('ext:admin', 'Datos del formulario:', validation.data);

    const baseConfig = window.adminPermissions ? adminPermissions.getData() : { permissions: { extensions: {} }};

    const preferences = {
      theme: validation.data.preferences_theme || 'light',
      language: validation.data.preferences_language || 'es',
      notifications: validation.data.preferences_notifications === 'on' || validation.data.preferences_notifications === true
    };

    const config = { ...baseConfig, preferences };

    logger.debug('ext:admin', 'Config final:', config);

    const data = {
      user: validation.data.username,
      email: validation.data.email,
      role: validation.data.role,
      pass: validation.data.password || undefined,
      config
    };

    const result = this.currentId ? await this.update(this.currentId, data) : await this.create(data);

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
    if (window.datatable) datatable.refreshFirst();
  }

  // CRUD usando api.js directamente
  static async create(data) {
    try {
      const response = await api.post(this.API, data);
      return response.success === false ? null : (response.data || response);
    } catch (error) {
      logger.error('ext:admin', error);
      return null;
    }
  }

  static async update(id, data) {
    try {
      const response = await api.put(`${this.API}/${id}`, {...data, id});
      return response.success === false ? null : (response.data || response);
    } catch (error) {
      logger.error('ext:admin', error);
      return null;
    }
  }

  static async delete(id) {
    try {
      const response = await api.delete(`${this.API}/${id}`);
      return response.success === false ? null : (response.data || response);
    } catch (error) {
      logger.error('ext:admin', error);
      return null;
    }
  }

  static async get(id) {
    try {
      const response = await api.get(`${this.API}/${id}`);
      return response.success === false ? null : (response.data || response);
    } catch (error) {
      logger.error('ext:admin', error);
      return null;
    }
  }

  static async list() {
    try {
      const response = await api.get(this.API);
      return response.success === false ? null : (response.data || response);
    } catch (error) {
      logger.error('ext:admin', error);
      return null;
    }
  }
}

window.admin = admin;