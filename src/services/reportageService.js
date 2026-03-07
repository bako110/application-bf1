import api from '../config/api';

class ReportageService {
  // Récupérer tous les reportages
  async getAllReportages(params = {}) {
    try {
      const response = await api.get('/reportage', { params });
      return response.data.map(reportage => ({
        ...reportage,
        id: reportage._id || reportage.id,
        image_url: reportage.thumbnail || reportage.image_url || reportage.image,
        allow_comments: reportage.allow_comments !== undefined ? reportage.allow_comments : true
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un reportage par ID
  async getReportageById(id) {
    try {
      const response = await api.get(`/reportage/${id}`);
      const replay = response.data;
      return {
        ...replay,
        id: replay._id || replay.id,
        allow_comments: replay.allow_comments !== undefined ? replay.allow_comments : true
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les reportages par émission
  async getReportagesByShow(showId, params = {}) {
    try {
      const response = await api.get(`/shows/${showId}/reportage`, { params });
      return response.data.map(reportage => ({
        ...reportage,
        id: reportage._id || reportage.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Liker un reportage
  async likeReportage(reportageId) {
    try {
      const response = await api.post(`/reportage/${reportageId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un like d'un reportage
  async unlikeReportage(reportageId) {
    try {
      const response = await api.delete(`/reportage/${reportageId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Ajouter un reportage aux favoris
  async addReportageToFavorites(reportageId) {
    try {
      const response = await api.post(`/favorites`, {
        content_id: reportageId,
        content_type: 'reportage'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un reportage des favoris
  async removeReportageFromFavorites(reportageId) {
    try {
      const response = await api.delete(`/favorites/${reportageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Marquer un reportage comme regardé
  async markAsWatched(reportageId) {
    try {
      const response = await api.post(`/reportage/${reportageId}/watched`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ReportageService();
