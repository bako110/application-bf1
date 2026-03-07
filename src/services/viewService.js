import api from '../config/api';

class ViewService {
  /**
   * Incrémenter le nombre de vues d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu ('show', 'replay', 'interview', 'archive', 'trending_show', 'movie', 'reel')
   */
  async incrementView(contentId, contentType) {
    try {
      // Pour les reels, utiliser l'endpoint optimisé avec algorithme de recommandation
      if (contentType === 'reel') {
        const response = await api.post(`/reels/${contentId}/view`);
        return response.data;
      }
      
      // Pour les autres types de contenu, utiliser l'endpoint général
      const response = await api.post('/views/increment', {
        content_id: contentId,
        content_type: contentType
      });
      
      return response.data;
    } catch (error) {
      // Échouer silencieusement pour ne pas perturber l'UX
      // L'utilisateur n'a pas besoin de savoir que le tracking a échoué
      return null;
    }
  }

  /**
   * Récupérer le nombre de vues d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu
   */
  async getViews(contentId, contentType) {
    try {
      const response = await api.get(`/views/${contentType}/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération vues:', error);
      return { views: 0 };
    }
  }
}

export default new ViewService();
