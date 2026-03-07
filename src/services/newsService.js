import api from '../config/api';
import notificationService from './notificationService';

class NewsService {
  // Récupérer toutes les actualités
  async getAllNews(params = {}) {
    try {
      const response = await api.get('/news', { params });
      // Mapper _id vers id et image vers image_url pour chaque actualité
      return response.data.map(news => ({
        ...news,
        id: news._id || news.id,
        image_url: news.image || news.image_url,
        allow_comments: news.allow_comments !== undefined ? news.allow_comments : true
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer une actualité par ID
  async getNewsById(id) {
    try {
      const response = await api.get(`/news/${id}`);
      // Mapper _id vers id et image vers image_url
      const news = response.data;
      return {
        ...news,
        id: news._id || news.id,
        image_url: news.image || news.image_url,
        allow_comments: news.allow_comments !== undefined ? news.allow_comments : true
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les news en direct
  async getLiveNews() {
    try {
      const response = await api.get('/news/live');
      // Mapper _id vers id pour chaque actualité
      return response.data.map(news => ({
        ...news,
        id: news._id || news.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer par édition
  async getNewsByEdition(edition, skip = 0, limit = 50) {
    try {
      const response = await api.get(`/news/edition/${edition}`, {
        params: { skip, limit },
      });
      // Mapper _id vers id pour chaque actualité
      return response.data.map(news => ({
        ...news,
        id: news._id || news.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Créer un flash info (breaking news) avec notification
  async createFlashInfo(flashInfoData) {
    try {
      const response = await api.post('/news', flashInfoData);
      const newFlashInfo = response.data;
      
      // Envoyer la notification push pour le flash info
      try {
        await notificationService.sendFlashInfoNotification(newFlashInfo);
      } catch (notifError) {
        console.error('❌ Erreur envoi notification flash info:', notifError);
        // Ne pas bloquer la création si la notification échoue
      }
      
      return newFlashInfo;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new NewsService();
