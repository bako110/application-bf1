import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import showService from './showService';

class ReminderNotificationService {
  constructor() {
    this.channelId = 'program-reminders';
    this.initialized = false;
  }

  // Initialiser Notifee et créer le canal de notification
  async initialize() {
    if (this.initialized) return;

    try {
      // Créer un canal de notification pour Android
      await notifee.createChannel({
        id: this.channelId,
        name: 'Rappels de Programmes',
        description: 'Notifications pour vos programmes favoris',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Demander les permissions
      await notifee.requestPermission();

      this.initialized = true;
      console.log('✅ Notifee initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation Notifee:', error);
    }
  }

  // Planifier une notification pour un rappel
  async scheduleReminderNotification(reminder) {
    try {
      await this.initialize();

      const scheduledTime = new Date(reminder.scheduled_for);
      const now = new Date();

      // Ne planifier que si c'est dans le futur
      if (scheduledTime <= now) {
        console.log('⏭️ Rappel dans le passé, ignoré:', reminder.program_title);
        return null;
      }

      const programStartTime = new Date(reminder.program_start_time);
      const timeString = programStartTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Créer le trigger (déclencheur) pour la notification
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledTime.getTime(),
      };

      // Planifier la notification
      const notificationId = await notifee.createTriggerNotification(
        {
          id: `reminder-${reminder.id}`,
          title: '🔔 Rappel de Programme',
          body: `${reminder.program_title} commence à ${timeString}${
            reminder.channel_name ? ` sur ${reminder.channel_name}` : ''
          }`,
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            sound: 'default',
            vibrationPattern: [300, 500],
            smallIcon: 'ic_launcher',
            color: '#DC143C',
          },
          ios: {
            sound: 'default',
            critical: false,
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
            },
          },
          data: {
            programId: reminder.program_id,
            reminderId: reminder.id,
            type: 'program_reminder',
          },
        },
        trigger
      );

      console.log(`✅ Notification planifiée: ${reminder.program_title} à ${scheduledTime.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error('❌ Erreur planification notification:', error);
      return null;
    }
  }

  // Annuler une notification planifiée
  async cancelReminderNotification(reminderId) {
    try {
      const notificationId = `reminder-${reminderId}`;
      await notifee.cancelNotification(notificationId);
      console.log(`❌ Notification annulée: ${notificationId}`);
    } catch (error) {
      console.error('❌ Erreur annulation notification:', error);
    }
  }

  // Annuler toutes les notifications
  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('❌ Toutes les notifications annulées');
    } catch (error) {
      console.error('❌ Erreur annulation toutes notifications:', error);
    }
  }

  // Synchroniser tous les rappels avec les notifications planifiées
  async syncAllReminders() {
    try {
      // Annuler toutes les notifications existantes
      await this.cancelAllNotifications();

      // Récupérer tous les rappels à venir
      const reminders = await showService.getMyReminders(null, true);

      // Planifier une notification pour chaque rappel
      let scheduled = 0;
      for (const reminder of reminders) {
        const result = await this.scheduleReminderNotification(reminder);
        if (result) scheduled++;
      }

      console.log(`✅ ${scheduled}/${reminders.length} rappels synchronisés`);
      return scheduled;
    } catch (error) {
      console.error('❌ Erreur synchronisation rappels:', error);
      return 0;
    }
  }

  // Afficher une notification immédiate (pour test)
  async displayTestNotification() {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title: '🔔 Test de Notification',
        body: 'Le système de notifications fonctionne correctement !',
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          smallIcon: 'ic_launcher',
          color: '#DC143C',
        },
        ios: {
          sound: 'default',
        },
      });

      console.log('✅ Notification de test affichée');
    } catch (error) {
      console.error('❌ Erreur notification test:', error);
    }
  }

  // Obtenir toutes les notifications planifiées
  async getTriggerNotifications() {
    try {
      const notifications = await notifee.getTriggerNotifications();
      console.log(`📋 ${notifications.length} notifications planifiées`);
      return notifications;
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      return [];
    }
  }

  // Vérifier les permissions
  async checkPermissions() {
    try {
      const settings = await notifee.getNotificationSettings();
      console.log('🔐 Permissions notifications:', settings);
      return settings;
    } catch (error) {
      console.error('❌ Erreur vérification permissions:', error);
      return null;
    }
  }
}

export default new ReminderNotificationService();
