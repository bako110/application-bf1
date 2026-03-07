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

    console.log('Toggle like:', { content_id: contentId, content_type: contentType });

    try {
      const response = await api.post('/likes/toggle', {
        content_id: contentId,
        content_type: contentType,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur toggle like:', error.response?.data || error);
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

  // Récupérer tous les likes de l'utilisateur connecté
  async getMyLikes(contentType = null) {
    try {
      const params = contentType ? { content_type: contentType } : {};
      const response = await api.get('/likes/my-likes', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération my-likes:', error);
      return [];
    }
  }

  // Compter le nombre total de likes de l'utilisateur
  async countMyLikes() {
    try {
      const likes = await this.getMyLikes();
      return likes.length;
    } catch (error) {
      return 0;
    }
  }
}

export default new LikeService();
