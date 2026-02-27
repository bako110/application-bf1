import api from '../config/api';

class ViewService {
  /**
   * Incrémenter le nombre de vues d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu ('show', 'replay', 'interview', 'archive', 'trending_show', 'movie', 'reel')
   */
  async incrementView(contentId, contentType) {
    try {
      console.log(`📊 Incrémentation des vues pour ${contentType} ID: ${contentId}`);
      
      const response = await api.post('/views/increment', {
        content_id: contentId,
        content_type: contentType
      });
      
      console.log(`✅ Vues incrémentées: ${response.data.views}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur incrémentation vues:', error);
      // Ne pas bloquer l'application si l'incrémentation échoue
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
