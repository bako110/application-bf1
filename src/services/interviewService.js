import api from '../config/api';

class InterviewService {
  // Récupérer toutes les interviews
  async getAllInterviews(params = {}) {
    try {
      const response = await api.get('/interviews', { params });
      return response.data.map(interview => ({
        ...interview,
        id: interview._id || interview.id,
        image_url: interview.image || interview.image_url,
        guest: interview.guest_name || interview.guest,
        duration: interview.duration_minutes
      }));
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer une interview par ID
  async getInterviewById(id) {
    try {
      const response = await api.get(`/interviews/${id}`);
      const interview = response.data;
      return {
        ...interview,
        id: interview._id || interview.id,
        image_url: interview.image || interview.image_url,
        guest: interview.guest_name || interview.guest,
        duration: interview.duration_minutes
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new InterviewService();
