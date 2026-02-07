import api from '../config/api';
import authService from './authService';

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

  // Marquer une notification comme lue
  async markAsRead(notificationId) {
    console.log('🔔 [NotificationService] markAsRead appelé avec ID:', notificationId);
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté' };
    }

    try {
      console.log('🔔 [NotificationService] Appel PATCH /notifications/' + notificationId + '/read');
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('❌ [NotificationService] Erreur markAsRead:', error);
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
}

export default new NotificationService();
