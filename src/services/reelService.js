import api from '../config/api';

class ReelService {
  // Récupérer tous les reels
  async getAllReels(params = {}) {
    try {
      const response = await api.get('/reels', { params });
      // Mapper les champs pour correspondre au frontend
      return response.data.map(reel => ({
        ...reel,
        id: reel._id || reel.id,
        videoUrl: reel.video_url || reel.videoUrl, // Mapper video_url vers videoUrl
        title: reel.title || 'Titre du reel',
        description: reel.description || 'Description du reel',
        likes: reel.likes || 0,
        comments: reel.comments || 0,
        shares: reel.shares || 0,
        allow_comments: reel.allow_comments !== undefined ? reel.allow_comments : true
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
        id: reel._id || reel.id,
        videoUrl: reel.video_url || reel.videoUrl,
        title: reel.title || 'Titre du reel',
        description: reel.description || 'Description du reel',
        likes: reel.likes || 0,
        comments: reel.comments || 0,
        shares: reel.shares || 0,
        allow_comments: reel.allow_comments !== undefined ? reel.allow_comments : true
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
      console.log('✅ getMyLikedReels - Réponse API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getMyLikedReels - Erreur:', error.response?.data || error.message);
      return [];
    }
  }

  // Récupérer les statistiques d'un reel (likes, comments, shares)
  async getReelStats(reelId) {
    try {
      const response = await api.get(`/reels/${reelId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération stats reel:', error);
      // Retourner des valeurs par défaut si l'endpoint n'existe pas
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      };
    }
  }

  // Tracker la vue d'un reel (pour l'algorithme de recommandation)
  async trackView(reelId) {
    try {
      const response = await api.post(`/reels/${reelId}/view`);
      return response.data;
    } catch (error) {
      console.error('Erreur tracking vue:', error);
      // Échouer silencieusement pour ne pas perturber l'UX
      return { success: false };
    }
  }
}

export default new ReelService();
