import api from '../config/api';
import authService from './authService';

class CommentService {
  /**
   * Créer un commentaire
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu
   * @param {string} text - Texte du commentaire
   * @returns {Promise<Object>} Commentaire créé
   */
  async createComment(contentId, contentType, text) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour commenter' };
    }

    try {
      const response = await api.post('/comments/', {
        content_id: contentId,
        content_type: contentType,
        text: text,
      });
      // Mapper _id vers id
      const comment = response.data;
      return {
        ...comment,
        id: comment._id || comment.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Récupérer les commentaires d'un contenu (pas besoin d'auth)
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu
   * @returns {Promise<Array>} Liste des commentaires
   */
  async getCommentsByContent(contentId, contentType) {
    try {
      const response = await api.get(`/comments/content/${contentType}/${contentId}`);
      // Mapper _id vers id pour chaque commentaire
      return response.data.map(comment => ({
        ...comment,
        id: comment._id || comment.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Compter les commentaires d'un contenu
   * @param {string} contentId - ID du contenu
   * @param {string} contentType - Type de contenu
   * @returns {Promise<number>} Nombre de commentaires
   */
  async countComments(contentId, contentType) {
    try {
      const response = await api.get(`/comments/content/${contentType}/${contentId}/count`);
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }
}

export default new CommentService();
