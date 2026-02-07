import api from '../config/api';

class TrendingShowService {
  // Récupérer les shows tendance
  async getTrendingShows(params = {}) {
    try {
      const response = await api.get('/trending-shows', { params });
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id,
        image_url: show.image || show.image_url
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un show tendance par ID
  async getTrendingShowById(id) {
    try {
      const response = await api.get(`/trending-shows/${id}`);
      const show = response.data;
      return {
        ...show,
        id: show._id || show.id,
        image_url: show.image || show.image_url
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Liker un trending show
  async likeTrendingShow(showId) {
    try {
      const response = await api.post(`/trending-shows/${showId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un like d'un trending show
  async unlikeTrendingShow(showId) {
    try {
      const response = await api.delete(`/trending-shows/${showId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Ajouter aux favoris
  async addToFavorites(showId) {
    try {
      const response = await api.post(`/favorites`, {
        content_id: showId,
        content_type: 'trending_show'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer des favoris
  async removeFromFavorites(showId) {
    try {
      const response = await api.delete(`/favorites/${showId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new TrendingShowService();
