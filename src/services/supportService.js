import api from '../config/api';

const supportService = {
  // ==================== Support Tickets ====================

  /**
   * Créer un nouveau ticket de support
   * @param {Object} ticketData - Données du ticket
   */
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/support/tickets', ticketData);
      return response.data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  },

  /**
   * Récupérer mes tickets de support
   * @param {string} statusFilter - Filtrer par statut (optional)
   */
  getMyTickets: async (statusFilter = null) => {
    try {
      const params = statusFilter ? { status_filter: statusFilter } : {};
      const response = await api.get('/support/tickets/my', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      throw error;
    }
  },

  /**
   * Récupérer un ticket spécifique
   * @param {string} ticketId - ID du ticket
   */
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  /**
   * Ajouter une réponse à un ticket
   * @param {string} ticketId - ID du ticket
   * @param {string} message - Message de la réponse
   */
  addTicketResponse: async (ticketId, message) => {
    try {
      const response = await api.post(`/support/tickets/${ticketId}/responses`, {
        message,
        author: 'user',
        created_at: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding ticket response:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un ticket
   * @param {string} ticketId - ID du ticket
   * @param {Object} updateData - Données à mettre à jour
   */
  updateTicket: async (ticketId, updateData) => {
    try {
      const response = await api.put(`/support/tickets/${ticketId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  /**
   * Supprimer un ticket
   * @param {string} ticketId - ID du ticket
   */
  deleteTicket: async (ticketId) => {
    try {
      await api.delete(`/support/tickets/${ticketId}`);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  // ==================== FAQs ====================

  /**
   * Récupérer toutes les FAQs
   * @param {string} category - Filtrer par catégorie (optional)
   * @param {number} limit - Nombre maximum de FAQs
   */
  getFAQs: async (category = null, limit = 50) => {
    try {
      const params = { limit };
      if (category) params.category = category;
      const response = await api.get('/support/faqs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },

  /**
   * Récupérer une FAQ spécifique
   * @param {string} faqId - ID de la FAQ
   */
  getFAQ: async (faqId) => {
    try {
      const response = await api.get(`/support/faqs/${faqId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      throw error;
    }
  },

  /**
   * Marquer une FAQ comme utile
   * @param {string} faqId - ID de la FAQ
   */
  markFAQHelpful: async (faqId) => {
    try {
      const response = await api.post(`/support/faqs/${faqId}/helpful`);
      return response.data;
    } catch (error) {
      console.error('Error marking FAQ as helpful:', error);
      throw error;
    }
  },

  /**
   * Rechercher dans les FAQs
   * @param {string} query - Terme de recherche
   */
  searchFAQs: async (query) => {
    try {
      const faqs = await supportService.getFAQs();
      return faqs.filter(faq => 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching FAQs:', error);
      throw error;
    }
  },

  /**
   * Récupérer les FAQs par catégorie
   */
  getFAQsByCategory: async () => {
    try {
      const faqs = await supportService.getFAQs();
      const categories = {};
      
      faqs.forEach(faq => {
        if (!categories[faq.category]) {
          categories[faq.category] = [];
        }
        categories[faq.category].push(faq);
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
      throw error;
    }
  },

  // ==================== Helpers ====================

  /**
   * Créer un ticket de bug
   */
  reportBug: async (title, description, deviceInfo, appVersion) => {
    return supportService.createTicket({
      subject: title,
      message: description,
      category: 'bug',
      priority: 'normal',
      device_info: deviceInfo,
      app_version: appVersion,
    });
  },

  /**
   * Créer un ticket de demande de fonctionnalité
   */
  requestFeature: async (title, description) => {
    return supportService.createTicket({
      subject: title,
      message: description,
      category: 'feature',
      priority: 'normal',
    });
  },

  /**
   * Créer un ticket de question
   */
  askQuestion: async (title, description) => {
    return supportService.createTicket({
      subject: title,
      message: description,
      category: 'question',
      priority: 'normal',
    });
  },
};

export default supportService;
