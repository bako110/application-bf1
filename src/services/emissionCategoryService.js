import api from '../config/api';

class EmissionCategoryService {
  async getAllCategories() {
    try {
      const response = await api.get('/emission-categories');
      return response.data || [];
    } catch (error) {
      console.error('❌ Erreur chargement catégories émissions:', error);
      throw error;
    }
  }

  async getActiveCategories() {
    try {
      const response = await api.get('/emission-categories');
      const categories = response.data || [];
      // Filtrer uniquement les catégories actives et les trier par ordre
      return categories
        .filter(cat => cat.is_active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('❌ Erreur chargement catégories actives:', error);
      throw error;
    }
  }

  async getCategoryBySlug(slug) {
    try {
      const response = await api.get(`/emission-categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur chargement catégorie:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les likes de l'utilisateur pour les catégories d'émissions
   * @returns {Promise<Array>} Liste des catégories likées
   */
  async getMyLikedCategories() {
    try {
      const response = await api.get('/likes/my-likes', { 
        params: { content_type: 'emission_category' } 
      });
      console.log('✅ getMyLikedCategories - Réponse API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getMyLikedCategories - Erreur:', error.response?.data || error.message);
      return [];
    }
  }
}

export default new EmissionCategoryService();
