import api from '../config/api';
import notificationService from './notificationService';

class PopularProgramService {
  // Récupérer tous les programmes populaires
  async getAllPrograms(params = {}) {
    try {
      const response = await api.get('/popular-programs', { params });
      return response.data.map(program => ({
        ...program,
        id: program._id || program.id,
        image_url: program.image || program.image_url
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un programme populaire par ID
  async getProgramById(id) {
    try {
      const response = await api.get(`/popular-programs/${id}`);
      const program = response.data;
      return {
        ...program,
        id: program._id || program.id,
        image_url: program.image || program.image_url
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Liker un programme
  async likeProgram(programId) {
    try {
      const response = await api.post(`/popular-programs/${programId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer un like d'un programme
  async unlikeProgram(programId) {
    try {
      const response = await api.delete(`/popular-programs/${programId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Ajouter aux favoris
  async addToFavorites(programId) {
    try {
      const response = await api.post(`/favorites`, {
        content_id: programId,
        content_type: 'popular_program'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Retirer des favoris
  async removeFromFavorites(programId) {
    try {
      const response = await api.delete(`/favorites/${programId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Créer un commentaire
  async createComment(programId, content) {
    try {
      const response = await api.post(`/comments`, {
        content_id: programId,
        content_type: 'popular_program',
        text: content
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les commentaires
  async getProgramComments(programId, params = {}) {
    try {
      const response = await api.get(`/popular-programs/${programId}/comments`, { params });
      return response.data.map(comment => ({
        ...comment,
        id: comment._id || comment.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Créer un nouveau programme populaire (pour l'admin) avec notification
  async createProgram(programData) {
    try {
      const response = await api.post('/popular-programs', programData);
      const newProgram = response.data;
      
      // Envoyer la notification push pour le nouveau programme populaire
      try {
        await notificationService.sendPopularProgramNotification(newProgram);
      } catch (notifError) {
        console.error('❌ Erreur envoi notification programme populaire:', notifError);
        // Ne pas bloquer la création si la notification échoue
      }
      
      return newProgram;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new PopularProgramService();
