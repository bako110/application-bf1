import api from '../config/api';
import authService from './authService';

class LikeService {
  // Toggle like (ajouter ou retirer)
  async toggleLike(contentId, contentType) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour liker' };
    }

    // Valider les paramètres
    if (!contentId || !contentType) {
      throw { message: 'contentId et contentType sont requis' };
    }

    // Normaliser le contentType
    const normalizedType = contentType.toLowerCase();
    if (normalizedType !== 'movie' && normalizedType !== 'show') {
      throw { message: `contentType invalide: ${contentType}. Doit être "movie" ou "show"` };
    }

    console.log('Toggle like:', { content_id: contentId, content_type: normalizedType });

    try {
      const response = await api.post('/likes/toggle', {
        content_id: contentId,
        content_type: normalizedType,
      });
      return response.data;
    } catch (error) {
      console.error('Erreur toggle like:', error.response?.data || error);
      throw error.response?.data || error.message;
    }
  }

  // Vérifier si l'utilisateur a liké
  async checkLiked(contentId, contentType) {
    try {
      const response = await api.get(`/likes/check/${contentType}/${contentId}`);
      return response.data.liked;
    } catch (error) {
      return false;
    }
  }

  // Compter les likes
  async countLikes(contentId, contentType) {
    try {
      const response = await api.get(`/likes/content/${contentType}/${contentId}/count`);
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }
}

export default new LikeService();
