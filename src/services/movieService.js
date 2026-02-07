import api from '../config/api';

class MovieService {
  // Récupérer tous les films
  async getAllMovies(params = {}) {
    try {
      const response = await api.get('/movies', { params });
      // Mapper _id vers id pour chaque film
      return response.data.map(movie => ({
        ...movie,
        id: movie._id || movie.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer un film par ID
  async getMovieById(id, withStats = true) {
    try {
      const response = await api.get(`/movies/${id}`, {
        params: { with_stats: withStats },
      });
      // Mapper _id vers id
      const movie = response.data;
      return {
        ...movie,
        id: movie._id || movie.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les films premium
  async getPremiumMovies(skip = 0, limit = 20) {
    try {
      const response = await api.get('/movies', {
        params: { skip, limit, is_premium: true },
      });
      // Mapper _id vers id pour chaque film
      return response.data.map(movie => ({
        ...movie,
        id: movie._id || movie.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les films gratuits
  async getFreeMovies(skip = 0, limit = 20) {
    try {
      const response = await api.get('/movies', {
        params: { skip, limit, is_premium: false },
      });
      // Mapper _id vers id pour chaque film
      return response.data.map(movie => ({
        ...movie,
        id: movie._id || movie.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new MovieService();
