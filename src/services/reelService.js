import api from '../config/api';

class ReelService {
  // Récupérer tous les reels
  async getAllReels(params = {}) {
    try {
      const response = await api.get('/reels', { params });
      // Mapper _id vers id pour chaque reel
      return response.data.map(reel => ({
        ...reel,
        id: reel._id || reel.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un reel par ID
  async getReelById(id) {
    try {
      const response = await api.get(`/reels/${id}`);
      const reel = response.data;
      return {
        ...reel,
        id: reel._id || reel.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Liker un reel
  async likeReel(reelId) {
    try {
      const response = await api.post(`/reels/${reelId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un like d'un reel
  async unlikeReel(reelId) {
    try {
      const response = await api.delete(`/reels/${reelId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Partager un reel
  async shareReel(reelId) {
    try {
      const response = await api.post(`/reels/${reelId}/share`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Ajouter un reel aux favoris
  async addReelToFavorites(reelId) {
    try {
      const response = await api.post(`/favorites`, {
        content_id: reelId,
        content_type: 'reel'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un reel des favoris
  async removeReelFromFavorites(reelId) {
    try {
      const response = await api.delete(`/favorites/${reelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Créer un commentaire sur un reel
  async createComment(reelId, content) {
    try {
      const response = await api.post(`/reels/${reelId}/comments`, {
        text: content
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les commentaires d'un reel
  async getReelComments(reelId, params = {}) {
    try {
      const response = await api.get(`/reels/${reelId}/comments`, { params });
      return response.data.map(comment => ({
        ...comment,
        id: comment._id || comment.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les reels tendance
  async getTrendingReels(params = {}) {
    try {
      const response = await api.get('/reels/trending', { params });
      return response.data.map(reel => ({
        ...reel,
        id: reel._id || reel.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Vérifier si l'utilisateur a liké un reel
  async checkLiked(reelId) {
    try {
      const response = await api.get(`/likes/check/reel/${reelId}`);
      return response.data.liked;
    } catch (error) {
      return false;
    }
  }

  // Récupérer tous les likes de l'utilisateur pour les reels
  async getMyLikedReels() {
    try {
      const response = await api.get('/likes/my-likes', { 
        params: { content_type: 'reel' } 
      });
      return response.data.map(like => like.content_id);
    } catch (error) {
      console.error('Error loading liked reels:', error);
      return [];
    }
  }
}

export default new ReelService();
