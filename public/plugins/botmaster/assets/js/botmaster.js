// BotMaster Plugin - Main Logic
class botmaster {
  
  // ==================== TASK BUILDER ====================
  
  static previewTask(formId) {
    const data = form.getData(formId);
    if (!data.steps || data.steps.length === 0) {
      toast.warning('⚠️ Agrega al menos un paso');
      return;
    }

    const json = this.convertToTaskJSON(data.steps);
    
    modal.open('', {
      title: '👁️ Preview JSON',
      html: `
        <div style="margin-bottom:1rem;">
          <strong>Nombre:</strong> ${data.task_name}<br>
          <strong>Categoría:</strong> ${data.category}<br>
          <strong>Total de pasos:</strong> ${data.steps.length}
        </div>
        <pre style="background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;overflow:auto;max-height:500px;font-size:0.875rem;line-height:1.5;">${JSON.stringify(json, null, 2)}</pre>
        <div style="margin-top:1rem;display:flex;gap:0.5rem;">
          <button onclick="navigator.clipboard.writeText('${JSON.stringify(json).replace(/'/g, "\\'")}');toast.success('✅ JSON copiado')" style="background:#3b82f6;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">📋 Copiar JSON</button>
          <button onclick="botmaster.downloadTaskJSON('${data.task_name}', '${JSON.stringify(json).replace(/'/g, "\\'")}');toast.success('✅ Descargado')" style="background:#10b981;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">💾 Descargar JSON</button>
        </div>
      `,
      showFooter: false,
      width: '800px'
    });
  }

  static async saveTask(formId) {
    const validation = form.validate(formId);
    if (!validation.success) {
      toast.error('❌ Completa todos los campos requeridos');
      return;
    }

    const data = validation.data;
    
    if (!data.steps || data.steps.length === 0) {
      toast.error('❌ Agrega al menos un paso a la tarea');
      return;
    }

    const taskJSON = this.convertToTaskJSON(data.steps);

    const payload = {
      name: data.task_name,
      description: data.description,
      category: data.category,
      steps: taskJSON,
      created_at: new Date().toISOString()
    };

    try {
      // await api.post('/api/botmaster/tasks', payload);
      console.log('📋 Guardando plantilla:', payload);
      toast.success('✅ Plantilla guardada exitosamente');
      setTimeout(() => {
        modal.closeAll();
        view.load('botmaster|sections/tasks');
      }, 800);
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al guardar la plantilla');
    }
  }

  static convertToTaskJSON(steps) {
    return steps.map(step => {
      const output = { step: step.step_type };

      if (step.step_type === 'wait' && step.time) {
        output.time = isNaN(step.time) ? step.time : parseInt(step.time);
      }

      if (step.step_type === 'go' && step.url) {
        output.url = step.url;
      }

      if (step.step_type === 'click') {
        if (step.xpath_click) output.xpath = step.xpath_click;
      }

      if (step.step_type === 'type') {
        output.xpath = step.xpath_type;
        output.words = step.words;
      }

      if (step.step_type === 'scroll') {
        if (step.xpath_scroll) output.xpath = step.xpath_scroll;
      }

      if (step.step_type === 'goToXpath') {
        output.xpath = step.xpath_goto;
        output.speed = step.speed || 'medium';
      }

      if (step.step_type === 'mouse') {
        output.type = step.mouse_type || 'random';
        output.time = isNaN(step.mouse_time) ? step.mouse_time : parseInt(step.mouse_time);
      }

      if (step.step_type === 'close') {
        output.type = step.close_type || 'browser';
      }

      if (step.step_type === 'do') {
        output.file = step.file;
        output.name = step.function_name;
      }

      if (step.step_type === 'task' && step.task_file) {
        output.task = step.task_file;
      }

      if (step.step_type === 'taskrand' && step.taskrand_steps) {
        output.taskrand = step.taskrand_steps.map(rand => {
          const randStep = { step: rand.rand_step_type };
          if (rand.rand_url) randStep.url = rand.rand_url;
          if (rand.rand_xpath) randStep.xpath = rand.rand_xpath;
          if (rand.rand_time) randStep.time = isNaN(rand.rand_time) ? rand.rand_time : parseInt(rand.rand_time);
          return randStep;
        });
      }

      if (step.step_type === 'substeps' && step.substeps) {
        output.substeps = this.convertToTaskJSON(step.substeps);
      }

      return output;
    });
  }

  static downloadTaskJSON(taskName, jsonString) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==================== TASK MANAGEMENT ====================

  static viewTask(id) {
    console.log('👁️ Ver tarea:', id);
    toast.info('Abriendo vista de tarea...');
  }

  static duplicateTask(id) {
    console.log('📋 Duplicar tarea:', id);
    toast.success('✅ Tarea duplicada');
  }

  static async deleteTask(id) {
    try {
      // await api.delete(`/api/botmaster/tasks/${id}`);
      console.log('🗑️ Eliminando tarea:', id);
      toast.success('✅ Tarea eliminada');
      view.load('botmaster|sections/tasks');
    } catch (error) {
      toast.error('❌ Error al eliminar');
    }
  }

  // ==================== FAMILY MANAGEMENT ====================

  static async saveFamily(formId) {
    const validation = form.validate(formId);
    if (!validation.success) {
      toast.error('❌ Completa todos los campos requeridos');
      return;
    }

    const data = validation.data;
    
    // Validar suma de dispositivos
    const deviceSum = (data.device_iphone || 0) + (data.device_android || 0) + 
                     (data.device_windows || 0) + (data.device_mac || 0);
    
    if (deviceSum !== 100) {
      toast.error('❌ La suma de dispositivos debe ser 100%');
      return;
    }

    const payload = {
      name: data.family_name,
      bot_count: data.bot_count,
      proxy_location: data.proxy_location,
      description: data.description,
      devices: {
        iphone: data.device_iphone,
        android: data.device_android,
        windows: data.device_windows,
        mac: data.device_mac
      },
      assigned_tasks: data.assigned_tasks || [],
      rotation_mode: data.rotation_mode,
      execution_delay: data.execution_delay,
      preserve_state: data.preserve_state || false,
      stealth_mode: data.stealth_mode || false,
      auto_restart: data.auto_restart || false,
      error_threshold: data.error_threshold || 3,
      created_at: new Date().toISOString()
    };

    try {
      // await api.post('/api/botmaster/families', payload);
      console.log('👨‍👩‍👧‍👦 Guardando familia:', payload);
      toast.success('✅ Familia creada exitosamente');
      setTimeout(() => {
        modal.closeAll();
        view.load('botmaster|sections/families');
      }, 800);
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al crear la familia');
    }
  }

  static viewFamilyBots(id) {
    console.log('👁️ Ver bots de familia:', id);
    toast.info('Mostrando bots de la familia...');
  }

  static startFamily(id) {
    console.log('▶️ Iniciar familia:', id);
    toast.success('✅ Familia iniciada');
  }

  static stopFamily(id) {
    console.log('⏸️ Detener familia:', id);
    toast.success('✅ Familia detenida');
  }

  static async deleteFamily(id) {
    try {
      // await api.delete(`/api/botmaster/families/${id}`);
      console.log('🗑️ Eliminando familia:', id);
      toast.success('✅ Familia eliminada');
      view.load('botmaster|sections/families');
    } catch (error) {
      toast.error('❌ Error al eliminar');
    }
  }

  // ==================== BOT MANAGEMENT ====================

  static async saveBot(formId) {
    const validation = form.validate(formId);
    if (!validation.success) {
      toast.error('❌ Completa todos los campos requeridos');
      return;
    }

    const data = validation.data;

    const payload = {
      name: data.bot_name,
      family: data.family || null,
      device: {
        type: data.device_type,
        model: data.device_model,
        resolution: data.screen_resolution
      },
      proxy: {
        location: data.proxy_location,
        server: data.proxy_server,
        username: data.proxy_username,
        password: data.proxy_password
      },
      timezone: data.timezone,
      status: 'inactive',
      created_at: new Date().toISOString()
    };

    try {
      // await api.post('/api/botmaster/bots', payload);
      console.log('🤖 Guardando bot:', payload);
      toast.success('✅ Bot creado exitosamente');
      setTimeout(() => {
        modal.closeAll();
        view.load('botmaster|sections/bots');
      }, 800);
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error al crear el bot');
    }
  }

  static viewBot(id) {
    console.log('👁️ Ver bot:', id);
    toast.info('Mostrando detalles del bot...');
  }

  static startBot(id) {
    console.log('▶️ Iniciar bot:', id);
    toast.success('✅ Bot iniciado');
  }

  static stopBot(id) {
    console.log('⏸️ Detener bot:', id);
    toast.success('✅ Bot detenido');
  }

  static resetBotState(id) {
    console.log('🔄 Reseteando estado del bot:', id);
    toast.success('✅ Estado reseteado');
  }

  static async deleteBot(id) {
    try {
      // await api.delete(`/api/botmaster/bots/${id}`);
      console.log('🗑️ Eliminando bot:', id);
      toast.success('✅ Bot eliminado');
      view.load('botmaster|sections/bots');
    } catch (error) {
      toast.error('❌ Error al eliminar');
    }
  }

  static startSelectedBots() {
    console.log('▶️ Iniciar bots seleccionados');
    toast.success('✅ Bots iniciados');
  }

  static stopSelectedBots() {
    console.log('⏸️ Detener bots seleccionados');
    toast.success('✅ Bots detenidos');
  }

  static exportBots() {
    console.log('📥 Exportar bots');
    toast.success('✅ Bots exportados');
  }

  // ==================== MONITOR ====================

  static refreshMonitor() {
    console.log('🔄 Actualizando monitor');
    toast.success('✅ Monitor actualizado');
    view.load('botmaster|sections/monitor');
  }

  static pauseBot(id) {
    console.log('⏸️ Pausar bot:', id);
    toast.success('✅ Bot pausado');
  }

  static pauseAllBots() {
    console.log('⏸️ Pausar todos los bots');
    toast.success('✅ Todos los bots pausados');
  }

  static stopAllBots() {
    console.log('⏹️ Detener todos los bots');
    toast.success('✅ Todos los bots detenidos');
  }

  static exportMonitorLog() {
    console.log('📥 Exportar log del monitor');
    toast.success('✅ Log exportado');
  }
}

// Registrar en el objeto global window
window.botmaster = botmaster;

console.log('🤖 BotMaster Plugin cargado exitosamente');
