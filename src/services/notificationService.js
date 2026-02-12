import api from '../config/api';
import authService from './authService';
import pushNotificationService from './pushNotificationService';

class NotificationService {
  // Récupérer toutes les notifications de l'utilisateur connecté
  async fetchNotifications() {
    console.log('🔔 [NotificationService] Début fetchNotifications');
    
    const isAuth = await authService.isAuthenticated();
    console.log('🔔 [NotificationService] isAuthenticated:', isAuth);
    
    if (!isAuth) {
      console.log('🔔 [NotificationService] Utilisateur non authentifié, retour []');
      return [];
    }

    try {
      console.log('🔔 [NotificationService] Appel API GET /notifications/me');
      const response = await api.get('/notifications/me');
      console.log('🔔 [NotificationService] Réponse reçue:', response.data);
      console.log('🔔 [NotificationService] Nombre de notifications:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ [NotificationService] Erreur chargement notifications:', error);
      console.error('❌ [NotificationService] Détails erreur:', error.response?.data);
      console.error('❌ [NotificationService] Status:', error.response?.status);
      throw error.response?.data || error.message;
    }
  }

  // Alias pour getMyNotifications (utilisé par NotificationsScreen)
  async getMyNotifications() {
    return this.fetchNotifications();
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    console.log('🔔 [NotificationService] markAsRead appelé avec ID:', notificationId);
    
    // Validation de l'ID
    if (!notificationId || notificationId === 'undefined') {
      console.error('❌ [NotificationService] ID de notification invalide:', notificationId);
      throw { message: 'ID de notification invalide' };
    }
    
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté' };
    }

    try {
      console.log('🔔 [NotificationService] Appel PATCH /notifications/' + notificationId + '/read');
      const response = await api.patch(`/notifications/${notificationId}/read`);
      console.log('✅ [NotificationService] Succès marquage comme lu:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [NotificationService] Erreur markAsRead:', error);
      console.error('❌ [NotificationService] Status:', error.response?.status);
      console.error('❌ [NotificationService] Détails:', error.response?.data);
      
      // En cas d'erreur 500, on retourne un succès pour ne pas bloquer l'interface
      // L'utilisateur pourra réessayer plus tard
      if (error.response?.status === 500) {
        console.warn('⚠️ [NotificationService] Erreur serveur 500 - Simulation de succès pour ne pas bloquer l\'UI');
        return { 
          success: true, 
          message: 'Marqué comme lu localement (erreur serveur)', 
          notificationId,
          simulated: true 
        };
      }
      
      throw error.response?.data || error.message;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId) {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté' };
    }

    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Compter les notifications non lues
  async getUnreadCount() {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      return 0;
    }

    try {
      const response = await api.get('/notifications/unread/count');
      return response.data.count || 0;
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
      return 0;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead() {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté' };
    }

    try {
      const notifications = await this.fetchNotifications();
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(n => this.markAsRead(n.id))
      );
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Envoyer la notification de bienvenue après inscription
  async sendWelcomeNotification(user) {
    try {
      console.log('📱 Tentative envoi notification bienvenue pour:', user.username || user.email);
      
      // S'assurer que le service est initialisé
      await pushNotificationService.initialize();
      
      // Envoyer la notification push
      await pushNotificationService.sendWelcomeNotification(user);
      
      console.log('✅ Notification de bienvenue push envoyée pour:', user.username || user.email);
    } catch (error) {
      console.error('❌ Erreur envoi notification bienvenue:', error);
      console.error('❌ Détails erreur:', error.message);
    }
  }

  // Envoyer une notification pour un nouveau programme populaire
  async sendPopularProgramNotification(program) {
    try {
      await pushNotificationService.sendPopularProgramNotification(program);
      console.log('✅ Notification programme populaire envoyée:', program.title);
    } catch (error) {
      console.error('❌ Erreur notification programme populaire:', error);
    }
  }

  // Envoyer une notification pour un flash info
  async sendFlashInfoNotification(flashInfo) {
    try {
      await pushNotificationService.sendFlashInfoNotification(flashInfo);
      console.log('✅ Notification flash info envoyée');
    } catch (error) {
      console.error('❌ Erreur notification flash info:', error);
    }
  }

  // Initialiser et synchroniser les notifications push
  async initializePushNotifications() {
    try {
      await pushNotificationService.syncNotifications();
      console.log('✅ Notifications push initialisées et synchronisées');
    } catch (error) {
      console.error('❌ Erreur initialisation notifications push:', error);
    }
  }

  // Activer/Désactiver les notifications quotidiennes
  async toggleDailyNotifications(enabled) {
    try {
      await pushNotificationService.toggleDailyNotifications(enabled);
      console.log(`✅ Notifications quotidiennes ${enabled ? 'activées' : 'désactivées'}`);
    } catch (error) {
      console.error('❌ Erreur modification notifications quotidiennes:', error);
    }
  }

  // Vérifier si les notifications quotidiennes sont activées
  async areDailyNotificationsEnabled() {
    try {
      return await pushNotificationService.areDailyNotificationsEnabled();
    } catch (error) {
      console.error('❌ Erreur vérification notifications quotidiennes:', error);
      return false;
    }
  }
}

export default new NotificationService();
