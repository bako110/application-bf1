import api from '../config/api';
import authService from './authService';

class CommentService {
  // Créer un commentaire
  async createComment(contentId, contentType, text) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour commenter' };
    }

    try {
      const response = await api.post('/comments', {
        content_id: contentId,
        content_type: contentType,
        text: text,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les commentaires d'un contenu (pas besoin d'auth)
  async getCommentsByContent(contentId, contentType) {
    try {
      const response = await api.get(`/comments/content/${contentType}/${contentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mettre à jour un commentaire
  async updateComment(commentId, text) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour modifier' };
    }

    try {
      const response = await api.put(`/comments/${commentId}`, { text });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Supprimer un commentaire
  async deleteComment(commentId) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour supprimer' };
    }

    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Compter les commentaires d'un contenu
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
