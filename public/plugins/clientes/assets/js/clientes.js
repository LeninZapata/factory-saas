// Funcionalidades específicas del plugin clientes
class clientesPlugin {
  static init() {
    logger.info('p:clientes', 'Plugin de clientes inicializado');
  }

  static formatPhoneNumber(phone) {
    return phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }

  static validateWhatsAppNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  static openWhatsApp(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}`;
    window.open(url, '_blank');
  }

  static getEstadoColor(estado) {
    const colors = {
      'activo': '#28a745',
      'lead': '#ffc107',
      'inactivo': '#6c757d'
    };
    return colors[estado] || '#6c757d';
  }
}

window.clientesPlugin = clientesPlugin;

if (window.hook) {
  clientesPlugin.init();
}