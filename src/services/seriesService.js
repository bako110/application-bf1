import api from '../config/api';

class SeriesService {
  // Helper pour mapper les champs du backend vers le frontend
  mapSeriesFields(series) {
    return {
      ...series,
      id: series._id || series.id,
      posterUrl: series.image_url || series.posterUrl,
      imageUrl: series.image_url || series.imageUrl,
      bannerUrl: series.banner_url || series.bannerUrl,
      trailerUrl: series.trailer_url || series.trailerUrl,
      releaseYear: series.release_year || series.releaseYear,
      isPremium: series.is_premium !== undefined ? series.is_premium : series.isPremium,
      totalSeasons: series.total_seasons || series.totalSeasons,
      totalEpisodes: series.total_episodes || series.totalEpisodes,
      viewCount: series.views_count || series.viewCount,
      allowComments: series.allow_comments !== undefined ? series.allow_comments : true,
      // Garder le genre tel quel (array ou string)
      genre: series.genre || [],
    };
  }

  mapSeasonFields(season) {
    return {
      ...season,
      id: season._id || season.id,
      seriesId: season.series_id || season.seriesId,
      seasonNumber: season.season_number || season.seasonNumber,
      posterUrl: season.image_url || season.posterUrl,
      releaseYear: season.release_year || season.releaseYear,
      totalEpisodes: season.total_episodes || season.totalEpisodes,
      isPremium: season.is_premium !== undefined ? season.is_premium : season.isPremium,
    };
  }

  mapEpisodeFields(episode) {
    return {
      ...episode,
      id: episode._id || episode.id,
      seriesId: episode.series_id || episode.seriesId,
      seasonId: episode.season_id || episode.seasonId,
      episodeNumber: episode.episode_number || episode.episodeNumber,
      videoUrl: episode.video_url || episode.videoUrl,
      thumbnailUrl: episode.thumbnail_url || episode.thumbnailUrl,
      releaseDate: episode.release_date || episode.releaseDate,
      viewCount: episode.views_count || episode.viewCount,
      isPremium: episode.is_premium !== undefined ? episode.is_premium : episode.isPremium,
    };
  }

  // Récupérer toutes les séries
  async getAllSeries(params = {}) {
    try {
      const response = await api.get('/tv/series', { params });
      console.log('✅ getAllSeries response:', response.data);
      
      // Gérer plusieurs formats de réponse
      let seriesData = [];
      if (Array.isArray(response.data)) {
        seriesData = response.data;
      } else if (response.data.series) {
        seriesData = response.data.series;
      } else if (response.data.data) {
        seriesData = response.data.data;
      } else if (response.data.items) {
        seriesData = response.data.items;
      }
      
      return seriesData.map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('❌ Error fetching all series:', error);
      console.error('Error details:', error.response?.data);
      return []; // Retourner un tableau vide au lieu de throw
    }
  }

  // Récupérer une série par ID
  async getSeriesById(id, withStats = true) {
    try {
      const response = await api.get(`/tv/series/${id}`, {
        params: { with_stats: withStats },
      });
      return this.mapSeriesFields(response.data);
    } catch (error) {
      console.error(`Error fetching series ${id}:`, error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les séries premium
  async getPremiumSeries(params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, is_premium: true },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('Error fetching premium series:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les séries gratuites
  async getFreeSeries(params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, is_premium: false },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('Error fetching free series:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les séries par statut
  async getSeriesByStatus(status, params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, status },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error(`Error fetching series by status ${status}:`, error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les séries par genre
  async getSeriesByGenre(genre, params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, genre },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error(`Error fetching series by genre ${genre}:`, error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les saisons d'une série
  async getSeasonsBySeries(seriesId, params = {}) {
    try {
      const response = await api.get(`/tv/series/${seriesId}/seasons`, { params });
      return (response.data.seasons || []).map(season => this.mapSeasonFields(season));
    } catch (error) {
      console.error(`Error fetching seasons for series ${seriesId}:`, error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les épisodes d'une saison
  async getEpisodesBySeason(seasonId, params = {}) {
    try {
      const response = await api.get(`/tv/seasons/${seasonId}/episodes`, { params });
      // Le backend retourne directement une liste d'épisodes
      const episodes = Array.isArray(response.data) ? response.data : (response.data.episodes || []);
      return episodes.map(episode => this.mapEpisodeFields(episode));
    } catch (error) {
      console.error(`Error fetching episodes for season ${seasonId}:`, error);
      throw error.response?.data || error.message;
    }
  }

  // Rechercher des séries
  async searchSeries(query, params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, search: query },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('Error searching series:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les séries tendance
  async getTrendingSeries(params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, sort: '-views_count', limit: 20 },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('Error fetching trending series:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les nouvelles séries
  async getNewSeries(params = {}) {
    try {
      const response = await api.get('/tv/series', {
        params: { ...params, sort: '-created_at', limit: 20 },
      });
      return (response.data.series || []).map(series => this.mapSeriesFields(series));
    } catch (error) {
      console.error('Error fetching new series:', error);
      throw error.response?.data || error.message;
    }
  }
}

export default new SeriesService();
