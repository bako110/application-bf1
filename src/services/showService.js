import api from '../config/api';

class ShowService {
  // Récupérer toutes les émissions
  async getAllShows(params = {}) {
    try {
      const response = await api.get('/shows', { params });
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer une émission par ID
  async getShowById(id, withStats = true) {
    try {
      const response = await api.get(`/shows/${id}`, {
        params: { with_stats: withStats },
      });
      // Mapper _id vers id
      const show = response.data;
      return {
        ...show,
        id: show._id || show.id
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les émissions en direct
  async getLiveShows() {
    try {
      const response = await api.get('/shows/live');
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les replays
  async getReplayShows() {
    try {
      const response = await api.get('/shows/replay');
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer par catégorie
  async getShowsByCategory(category) {
    try {
      const response = await api.get(`/shows/category/${category}`);
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer par édition
  async getShowsByEdition(edition) {
    try {
      const response = await api.get(`/shows/edition/${edition}`);
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les émissions par date
  async getShowsByDate(date) {
    try {
      const response = await api.get('/shows', {
        params: { date: date },
      });
      // Mapper _id vers id pour chaque émission
      return response.data.map(show => ({
        ...show,
        id: show._id || show.id
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les émissions d'aujourd'hui
  async getTodayShows() {
    const today = new Date().toISOString().split('T')[0];
    return this.getShowsByDate(today);
  }

  // Récupérer les émissions de la semaine
  async getWeekShows() {
    try {
      const shows = await this.getAllShows({ page_size: 100 });
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return shows.filter(show => {
        if (!show.start_time) return false;
        const showDate = new Date(show.start_time);
        return showDate >= now && showDate <= weekFromNow;
      });
    } catch (error) {
      throw error;
    }
  }

  // Récupérer les émissions programmées (futures)
  async getScheduledShows() {
    try {
      const shows = await this.getAllShows({ page_size: 100 });
      const now = new Date();
      
      return shows
        .filter(show => {
          if (!show.start_time) return false;
          return new Date(show.start_time) > now;
        })
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    } catch (error) {
      throw error;
    }
  }

  // Grouper les émissions par jour
  groupShowsByDay(shows) {
    const grouped = {};
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    shows.forEach(show => {
      if (!show.start_time) return;
      
      const date = new Date(show.start_time);
      const dayName = days[date.getDay()];
      const dateKey = date.toISOString().split('T')[0];
      const key = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date: dateKey,
          dayName: dayName,
          shows: [],
        };
      }
      
      grouped[key].shows.push(show);
    });
    
    // Trier les émissions de chaque jour par heure
    Object.keys(grouped).forEach(key => {
      grouped[key].shows.sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );
    });
    
    return grouped;
  }

  // Récupérer les catégories disponibles
  async getCategories() {
    try {
      const shows = await this.getAllShows({ page_size: 100 });
      const categories = [...new Set(shows.map(show => show.category).filter(Boolean))];
      return categories;
    } catch (error) {
      return ['Actualités', 'Sport', 'Culture', 'Divertissement', 'Documentaire'];
    }
  }

  // ==================== PROGRAMS / EPG API ====================
  
  // Récupérer la grille des programmes de la semaine (groupés par jour)
  async getProgramWeek(weeksAhead = 0, type = null) {
    try {
      const params = { weeks_ahead: weeksAhead };
      if (type) params.type = type;
      
      const response = await api.get('/programs/grid/weekly', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching program week:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer la grille des programmes par plage de dates
  async getProgramGrid(startDate = null, endDate = null, type = null) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (type) params.type = type;
      
      const response = await api.get('/programs/grid/daily', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching program grid:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les programmes actuellement en direct
  async getCurrentlyLive() {
    try {
      const response = await api.get('/programs/live/current');
      return response.data.map(program => ({
        ...program,
        id: program._id || program.id
      }));
    } catch (error) {
      console.error('Error fetching currently live:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les programmes à venir
  async getUpcomingPrograms(minutesAhead = 60, limit = 10) {
    try {
      const response = await api.get('/programs/upcoming/list', {
        params: { minutes_ahead: minutesAhead, limit: limit }
      });
      return response.data.map(program => ({
        ...program,
        id: program._id || program.id
      }));
    } catch (error) {
      console.error('Error fetching upcoming programs:', error);
      throw error.response?.data || error.message;
    }
  }

  // ==================== PROGRAM REMINDERS API ====================
  
  // Créer un rappel pour un programme
  async createReminder(programId, minutesBefore = 15, reminderType = 'push') {
    try {
      const response = await api.post(`/programs/${programId}/reminders`, {
        program_id: programId,
        minutes_before: minutesBefore,
        reminder_type: reminderType
      });
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error.response?.data || error.message;
    }
  }

  // Récupérer mes rappels
  async getMyReminders(status = null, upcomingOnly = false) {
    try {
      const params = {};
      if (status) params.status = status;
      if (upcomingOnly) params.upcoming_only = true;
      
      const response = await api.get('/programs/reminders/my', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error.response?.data || error.message;
    }
  }

  // Annuler un rappel
  async cancelReminder(reminderId) {
    try {
      const response = await api.post(`/programs/reminders/${reminderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      throw error.response?.data || error.message;
    }
  }

  // Supprimer un rappel
  async deleteReminder(reminderId) {
    try {
      const response = await api.delete(`/programs/reminders/${reminderId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error.response?.data || error.message;
    }
  }

  // ==================== LIVE CHANNELS API ====================
  
  // Récupérer les chaînes TV
  async getChannels(isActive = true) {
    try {
      const response = await api.get('/programs/channels', {
        params: { is_active: isActive }
      });
      return response.data.map(channel => ({
        ...channel,
        id: channel._id || channel.id
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error.response?.data || error.message;
    }
  }
}

export default new ShowService();
