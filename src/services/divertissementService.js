import api from '../config/api';

class DivertissementService {
  // Récupérer tous les divertissements
  async getAllDivertissements(params = {}) {
    try {
      const response = await api.get('/divertissement/', { params });
      return response.data.map(divertissement => ({
        ...divertissement,
        id: divertissement._id || divertissement.id,
        image_url: divertissement.image || divertissement.image_url,
        host: divertissement.host || divertissement.presenter,
        duration: divertissement.duration_minutes
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un divertissement par ID
  async getDivertissementById(id) {
    try {
      const response = await api.get(`/divertissement/${id}/`);
      const divertissement = response.data;
      return {
        ...divertissement,
        id: divertissement._id || divertissement.id,
        image_url: divertissement.image || divertissement.image_url,
        host: divertissement.host || divertissement.presenter,
        duration: divertissement.duration_minutes
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new DivertissementService();
