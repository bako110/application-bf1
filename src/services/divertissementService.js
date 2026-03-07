import api from '../config/api';

class DivertissementService {
  // Récupérer tous les divertissements
  async getAllDivertissements(params = {}) {
    try {
      const response = await api.get('/divertissement', { params });
      return response.data.map(divertissement => ({
        ...divertissement,
        id: divertissement._id || divertissement.id,
        image_url: divertissement.image || divertissement.image_url,
        host: divertissement.host || divertissement.presenter,
        duration: divertissement.duration_minutes,
        allow_comments: divertissement.allow_comments !== undefined ? divertissement.allow_comments : true
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un divertissement par ID
  async getDivertissementById(id) {
    try {
      const response = await api.get(`/divertissement/${id}`);
      const divertissement = response.data;
      return {
        ...divertissement,
        id: divertissement._id || divertissement.id,
        image_url: divertissement.image || divertissement.image_url,
        host: divertissement.host || divertissement.presenter,
        duration: divertissement.duration_minutes,
        allow_comments: divertissement.allow_comments !== undefined ? divertissement.allow_comments : true
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupère tous les likes de l'utilisateur pour les divertissements
   * @returns {Promise<Array>} Liste des divertissements likés
   */
  async getMyLikedDivertissements() {
    try {
      const response = await api.get('/likes/my-likes', { 
        params: { content_type: 'divertissement' } 
      });
      console.log('✅ getMyLikedDivertissements - Réponse API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getMyLikedDivertissements - Erreur:', error.response?.data || error.message);
      return [];
    }
  }
}

export default new DivertissementService();
