import api from '../config/api';

/**
 * Service pour la gestion des émissions
 * Gère les appels API et les données des émissions
 */

class SportService {
  /**
   * Récupère toutes les émissions
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Array>} Liste des émissions
   */
  async getAllSports(params = {}) {
    try {
      const response = await api.get('/sports/', { params });
      // Le backend retourne un objet EmissionList avec pagination
      const sports = response.data.sports || [];
      // Mapper _id vers id pour chaque émission
      return sports.map(sport => ({
        ...sport,
        id: sport._id || sport.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupère les émissions avec filtres
   * @param {string} category - Catégorie filtrée (optionnel)
   * @param {Object} options - Options supplémentaires (featured, is_new, page, per_page)
   * @returns {Promise<Array>} Liste des émissions
   */
  async getAllSports(category = null, options = {}) {
    try {
      const params = { ...options };
      
      if (category && category !== 'toutes') {
        params.category = category;
      }
      
      const response = await api.get('/sports/', { params });
      // Le backend retourne un objet EmissionList avec pagination
      const sports = response.data.sports || [];
      // Mapper _id vers id pour chaque émission
      return sports.map(sport => ({
        ...sport,
        id: sport._id || sport.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupère une émission spécifique
   * @param {string} id - ID de l'émission
   * @returns {Promise<Object>} Détails de l'émission
   */
  async getSportById(id) {
    try {
      const response = await api.get(`/sports/${id}/`);
      // Mapper _id vers id
      const emission = response.data;
      return {
        ...emission,
        id: emission._id || emission.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupère les émissions featured/en vedette
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Array>} Liste des émissions featured
   */
  async getFeaturedSports(params = {}) {
    try {
      const response = await api.get('/sports/featured/', { params });
      // Mapper _id vers id pour chaque émission
      return response.data.map(emission => ({
        ...emission,
        id: emission._id || emission.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupère les nouvelles émissions
   * @param {Object} params - Paramètres de requête
   * @returns {Promise<Array>} Liste des nouvelles émissions
   */
  async getNewSports(params = {}) {
    try {
      const response = await api.get('/sports/new/', { params });
      // Mapper _id vers id pour chaque émission
      return response.data.map(sport => ({
        ...sport,
        id: sport._id || sport.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Incrémente le nombre de vues d'une émission
   * @param {string} id - ID de l'émission
   * @param {Object} options - Options (user_id, session_id)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async incrementViews(id, options = {}) {
    try {
      const response = await api.post(`/sports/${id}/views/`, options);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

}

export default new SportService();
