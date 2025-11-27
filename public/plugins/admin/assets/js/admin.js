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
      form.fill(formId, { username: data.user, email: data.email, role: data.role });
      if (window.adminPermissions) adminPermissions.load(formId, data);
    }
  }

  // Guardar (create o update)
  static async save(formId) {
    const validation = form.validate(formId);
    if (!validation.success) return toast.error(`❌ ${validation.message}`);

    const data = {
      user: validation.data.username,
      email: validation.data.email,
      role: validation.data.role,
      pass: validation.data.password || undefined,
      config: window.adminPermissions ? adminPermissions.getData() : {}
    };

    const result = this.currentId 
      ? await this.update(this.currentId, data)
      : await this.create(data);

    if (result) {
      toast.success(this.currentId ? '✅ Usuario actualizado' : '✅ Usuario creado');
      setTimeout(() => { modal.closeAll(); location.reload(); }, 800);
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
      logger.error('p:admin', error);
      toast.error(`❌ ${error.message}`);
      return null;
    }
  }
}

window.admin = admin;