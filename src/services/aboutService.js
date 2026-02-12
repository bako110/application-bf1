import api from '../config/api';

const aboutService = {
  // ==================== App Info ====================

  /**
   * Récupérer les informations de l'application
   */
  getAppInfo: async () => {
    try {
      const response = await api.get('/about/info');
      return response.data;
    } catch (error) {
      console.error('Error fetching app info:', error);
      throw error;
    }
  },

  /**
   * Récupérer les informations d'une version spécifique
   * @param {string} version - Version de l'application
   */
  getAppInfoByVersion: async (version) => {
    try {
      const response = await api.get(`/about/info/version/${version}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching app info by version:', error);
      throw error;
    }
  },

  // ==================== Team Members ====================

  /**
   * Récupérer tous les membres de l'équipe
   * @param {number} limit - Nombre maximum de membres
   */
  getTeamMembers: async (limit = 50) => {
    try {
      const response = await api.get('/about/team', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  /**
   * Récupérer un membre de l'équipe spécifique
   * @param {string} memberId - ID du membre
   */
  getTeamMember: async (memberId) => {
    try {
      const response = await api.get(`/about/team/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team member:', error);
      throw error;
    }
  },

  // ==================== Helpers ====================

  /**
   * Récupérer toutes les informations "À propos"
   */
  getAllAboutInfo: async () => {
    try {
      const [appInfo, teamMembers] = await Promise.all([
        aboutService.getAppInfo(),
        aboutService.getTeamMembers(),
      ]);

      return {
        appInfo,
        teamMembers,
      };
    } catch (error) {
      console.error('Error fetching all about info:', error);
      throw error;
    }
  },

  /**
   * Récupérer les liens sociaux
   */
  getSocialLinks: async () => {
    try {
      const appInfo = await aboutService.getAppInfo();
      return {
        facebook: appInfo.facebook_url,
        twitter: appInfo.twitter_url,
        instagram: appInfo.instagram_url,
        youtube: appInfo.youtube_url,
      };
    } catch (error) {
      console.error('Error fetching social links:', error);
      throw error;
    }
  },

  /**
   * Récupérer les informations de contact
   */
  getContactInfo: async () => {
    try {
      const appInfo = await aboutService.getAppInfo();
      return {
        email: appInfo.support_email,
        phone: appInfo.contact_phone,
        website: appInfo.website,
      };
    } catch (error) {
      console.error('Error fetching contact info:', error);
      throw error;
    }
  },

  /**
   * Récupérer le changelog
   */
  getChangelog: async () => {
    try {
      const appInfo = await aboutService.getAppInfo();
      return appInfo.changelog || [];
    } catch (error) {
      console.error('Error fetching changelog:', error);
      throw error;
    }
  },

  /**
   * Récupérer les fonctionnalités de l'application
   */
  getFeatures: async () => {
    try {
      const appInfo = await aboutService.getAppInfo();
      return appInfo.features || [];
    } catch (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
  },

  /**
   * Récupérer les liens légaux
   */
  getLegalLinks: async () => {
    try {
      const appInfo = await aboutService.getAppInfo();
      return {
        privacyPolicy: appInfo.privacy_policy_url,
        termsOfService: appInfo.terms_url,
      };
    } catch (error) {
      console.error('Error fetching legal links:', error);
      throw error;
    }
  },
};

export default aboutService;
