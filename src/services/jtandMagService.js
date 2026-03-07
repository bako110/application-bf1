import api from '../config/api';

class JTandMagService {
  // Récupérer les JT et Magazines
  async getJTandMag(params = {}) {
    try {
      const response = await api.get('/jtandmag', { params });
      return response.data.map(item => ({
        ...item,
        id: item._id || item.id,
        image_url: item.image || item.image_url,
        allow_comments: item.allow_comments !== undefined ? item.allow_comments : true
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un JT ou Mag par ID
  async getJTandMagById(id) {
    try {
      const response = await api.get(`/jtandmag/${id}`);
      const show = response.data;
      return {
        ...show,
        id: show._id || show.id,
        image_url: show.image || show.image_url,
        allow_comments: show.allow_comments !== undefined ? show.allow_comments : true
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

export default new JTandMagService();
