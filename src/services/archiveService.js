import api from '../config/api';

class ArchiveService {
  // Récupérer toutes les archives
  async getAllArchives({ skip = 0, limit = 50, category = null } = {}) {
    try {
      const params = { skip, limit };
      if (category) {
        params.category = category;
      }
      const response = await api.get('/archives', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching archives:', error);
      throw error;
    }
  }

  // Récupérer une archive spécifique
  async getArchiveById(archiveId) {
    try {
      const response = await api.get(`/archives/${archiveId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching archive:', error);
      throw error;
    }
  }

  // Récupérer les catégories d'archives
  async getArchiveCategories() {
    try {
      const response = await api.get('/archives/categories/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching archive categories:', error);
      throw error;
    }
  }

  // Noter une archive
  async rateArchive(archiveId, rating) {
    try {
      const response = await api.post(`/archives/${archiveId}/rate`, null, {
        params: { rating }
      });
      return response.data;
    } catch (error) {
      console.error('Error rating archive:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur a accès à une archive
  async checkArchiveAccess(archiveId) {
    try {
      const response = await api.get(`/archives/${archiveId}/check-access`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        return { 
          has_access: false, 
          is_premium: true,
          user_is_premium: false,
          price: 0
        };
      }
      throw error;
    }
  }
}

export default new ArchiveService();
