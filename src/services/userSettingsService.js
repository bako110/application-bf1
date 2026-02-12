import api from '../config/api';

const userSettingsService = {
  /**
   * Récupérer les paramètres de l'utilisateur connecté
   */
  getMySettings: async () => {
    try {
      const response = await api.get('/settings/my-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour les paramètres de l'utilisateur
   * @param {Object} settings - Paramètres à mettre à jour
   */
  updateMySettings: async (settings) => {
    try {
      const response = await api.put('/settings/my-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  /**
   * Réinitialiser les paramètres aux valeurs par défaut
   */
  resetMySettings: async () => {
    try {
      const response = await api.post('/settings/my-settings/reset');
      return response.data;
    } catch (error) {
      console.error('Error resetting user settings:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un paramètre spécifique
   * @param {string} key - Clé du paramètre
   * @param {any} value - Valeur du paramètre
   */
  updateSetting: async (key, value) => {
    try {
      const settings = { [key]: value };
      const response = await api.put('/settings/my-settings', settings);
      return response.data;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  },

  /**
   * Mettre à jour les paramètres de notification
   */
  updateNotificationSettings: async (notificationSettings) => {
    try {
      const response = await api.put('/settings/my-settings', {
        push_notifications: notificationSettings.push_notifications,
        email_notifications: notificationSettings.email_notifications,
        live_notifications: notificationSettings.live_notifications,
        news_notifications: notificationSettings.news_notifications,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour les préférences de lecture
   */
  updatePlaybackSettings: async (playbackSettings) => {
    try {
      const response = await api.put('/settings/my-settings', {
        auto_play: playbackSettings.auto_play,
        video_quality: playbackSettings.video_quality,
        subtitles_enabled: playbackSettings.subtitles_enabled,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating playback settings:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour les paramètres de confidentialité
   */
  updatePrivacySettings: async (privacySettings) => {
    try {
      const response = await api.put('/settings/my-settings', {
        profile_visibility: privacySettings.profile_visibility,
        show_watch_history: privacySettings.show_watch_history,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  /**
   * Changer la langue de l'application
   */
  changeLanguage: async (language) => {
    try {
      const response = await api.put('/settings/my-settings', { language });
      return response.data;
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  },

  /**
   * Changer le thème de l'application
   */
  changeTheme: async (theme) => {
    try {
      const response = await api.put('/settings/my-settings', { theme });
      return response.data;
    } catch (error) {
      console.error('Error changing theme:', error);
      throw error;
    }
  },
};

export default userSettingsService;
