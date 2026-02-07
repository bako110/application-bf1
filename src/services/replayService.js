import api from '../config/api';

class ReplayService {
  // Récupérer tous les replays
  async getAllReplays(params = {}) {
    try {
      const response = await api.get('/replays', { params });
      return response.data.map(replay => ({
        ...replay,
        id: replay._id || replay.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un replay par ID
  async getReplayById(id) {
    try {
      const response = await api.get(`/replays/${id}`);
      const replay = response.data;
      return {
        ...replay,
        id: replay._id || replay.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les replays par émission
  async getReplaysByShow(showId, params = {}) {
    try {
      const response = await api.get(`/shows/${showId}/replays`, { params });
      return response.data.map(replay => ({
        ...replay,
        id: replay._id || replay.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Liker un replay
  async likeReplay(replayId) {
    try {
      const response = await api.post(`/replays/${replayId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un like d'un replay
  async unlikeReplay(replayId) {
    try {
      const response = await api.delete(`/replays/${replayId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Ajouter un replay aux favoris
  async addReplayToFavorites(replayId) {
    try {
      const response = await api.post(`/favorites`, {
        content_id: replayId,
        content_type: 'replay'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un replay des favoris
  async removeReplayFromFavorites(replayId) {
    try {
      const response = await api.delete(`/favorites/${replayId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Marquer un replay comme regardé
  async markAsWatched(replayId) {
    try {
      const response = await api.post(`/replays/${replayId}/watched`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ReplayService();
