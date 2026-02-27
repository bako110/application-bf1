import api from '../config/api';
import authService from './authService';

class FavoriteService {
  // Ajouter aux favoris
  async addFavorite(contentId, contentType) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour ajouter aux favoris' };
    }

    try {
      const response = await api.post('/favorites/', {
        content_id: contentId,
        content_type: contentType,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer mes favoris
  async getMyFavorites(contentType = null) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      return [];
    }

    try {
      const params = contentType ? { content_type: contentType } : {};
      const response = await api.get('/favorites/me', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Supprimer un favori par contenu
  async removeFavoriteByContent(contentId, contentType) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour retirer des favoris' };
    }

    try {
      const response = await api.delete(`/favorites/content/${contentType}/${contentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Supprimer un favori par ID
  async removeFavorite(favoriteId) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour retirer des favoris' };
    }

    try {
      const response = await api.delete(`/favorites/${favoriteId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new FavoriteService();
