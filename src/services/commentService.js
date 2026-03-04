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
    console.log('🔍 CommentService.createComment appelé:', { contentId, contentType, text });
    
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    console.log('🔐 Authentification:', isAuth);
    
    if (!isAuth) {
      console.log('❌ Utilisateur non authentifié');
      throw { requiresAuth: true, message: 'Vous devez être connecté pour commenter' };
    }

    try {
      const payload = {
        content_id: contentId,
        content_type: contentType,
        text: text,
      };
      console.log('📤 Envoi de la requête POST /comments/ avec:', payload);
      
      const response = await api.post('/comments/', payload);
      console.log('✅ Réponse du serveur:', response.data);
      
      // Mapper _id vers id
      const comment = response.data;
      return {
        ...comment,
        id: comment._id || comment.id
      };
    } catch (error) {
      console.error('❌ Erreur API lors de la création du commentaire:', error);
      console.error('Réponse d\'erreur:', error.response?.data);
      console.error('Status:', error.response?.status);
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

  /**
   * Modifier un commentaire
   * @param {string} commentId - ID du commentaire
   * @param {string} text - Nouveau texte du commentaire
   * @returns {Promise<Object>} Commentaire modifié
   */
  async updateComment(commentId, text) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour modifier un commentaire' };
    }

    try {
      const response = await api.put(`/comments/${commentId}`, {
        text: text,
      });
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
   * Supprimer un commentaire
   * @param {string} commentId - ID du commentaire
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteComment(commentId) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour supprimer un commentaire' };
    }

    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new CommentService();
