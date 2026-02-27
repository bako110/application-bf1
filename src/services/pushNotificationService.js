import notifee, { AndroidImportance, TriggerType, TimestampTrigger } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class PushNotificationService {
  constructor() {
    this.channels = {
      news: 'news-alerts',
      programs: 'program-updates',
      system: 'system-notifications'
    };
    this.initialized = false;
  }

  // Initialiser Notifee et créer les canaux de notification
  async initialize() {
    if (this.initialized) return;

    try {
      // Créer les canaux de notification pour Android
      await notifee.createChannel({
        id: this.channels.news,
        name: 'Alertes Infos',
        description: 'Notifications pour les journaux et flashs infos',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: this.channels.programs,
        name: 'Mises à jour Programmes',
        description: 'Notifications pour les nouveaux programmes populaires',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: this.channels.system,
        name: 'Notifications Système',
        description: 'Notifications d\'inscription et système',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Demander les permissions
      await notifee.requestPermission();

      this.initialized = true;
      console.log('✅ PushNotificationService initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation PushNotificationService:', error);
    }
  }

  // Planifier les notifications quotidiennes pour les journaux
  async scheduleDailyNewsNotifications() {
    try {
      await this.initialize();

      const notifications = [
        {
          id: 'journal-13h30',
          title: '📰 Journal 13H30',
          body: 'Ne manquez pas le journal de 13H30 avec toute l\'actualité de la journée !',
          hour: 13,
          minute: 30,
          channel: this.channels.news
        },
        {
          id: 'journal-19h30',
          title: '📺 Journal 19H30',
          body: 'Le journal de 19H30 est en direct ! Toute l\'actualité à ne pas manquer.',
          hour: 19,
          minute: 30,
          channel: this.channels.news
        }
      ];

      for (const notif of notifications) {
        await this.scheduleDailyNotification(notif);
      }

      console.log('✅ Notifications quotidiennes des journaux planifiées');
    } catch (error) {
      console.error('❌ Erreur planification notifications journaux:', error);
    }
  }

  // Planifier une notification quotidienne récurrente
  async scheduleDailyNotification(notification) {
    try {
      // Annuler d'abord l'ancienne notification si elle existe
      await notifee.cancelNotification(notification.id);

      // Calculer la prochaine date à l'heure spécifiée
      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(notification.hour, notification.minute, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, planifier pour demain
      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      // Créer le trigger pour l'heure spécifiée
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: scheduledDate.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          android: {
            channelId: notification.channel,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            sound: 'default',
            vibrationPattern: [300, 500, 300, 500],
            smallIcon: 'ic_launcher',
            color: '#E23E3E',
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
            type: 'daily_news',
            notificationId: String(notification.id || ''),
            hour: String(notification.hour || ''),
            minute: String(notification.minute || ''),
          },
        },
        trigger
      );

      console.log(`✅ Notification quotidienne planifiée: ${notification.title} à ${notification.hour}:${notification.minute}`);
    } catch (error) {
      console.error(`❌ Erreur planification notification ${notification.id}:`, error);
    }
  }

  // Envoyer une notification immédiate pour un nouveau programme populaire
  async sendPopularProgramNotification(program) {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title: '🌟 Nouveau Programme Populaire',
        body: `${program.title} est maintenant disponible ! Ne le manquez pas.`,
        android: {
          channelId: this.channels.programs,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [200, 200, 200, 200],
          smallIcon: 'ic_launcher',
          color: '#FFD700',
        },
        ios: {
          sound: 'default',
        },
        data: {
          type: 'popular_program',
          programId: String(program.id || program._id || ''),
          title: program.title || '',
          description: program.description || ''
        },
      });

      console.log(`✅ Notification programme populaire envoyée: ${program.title}`);
    } catch (error) {
      console.error('❌ Erreur notification programme populaire:', error);
    }
  }

  // Envoyer une notification immédiate pour un flash info
  async sendFlashInfoNotification(flashInfo) {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title: '⚡ FLASH INFO',
        body: flashInfo.title || flashInfo.description || 'Dernière minute : une information importante vient d\'arriver',
        android: {
          channelId: this.channels.news,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [100, 100, 100, 100],
          smallIcon: 'ic_launcher',
          color: '#FF4444',
        },
        ios: {
          sound: 'default',
          critical: true,
        },
        data: {
          type: 'flash_info',
          flash_info_id: String(flashInfo.id || flashInfo._id),
          title: flashInfo.title || '',
          description: flashInfo.description || ''
        },
      });

      console.log('✅ Notification flash info envoyée');
    } catch (error) {
      console.error('❌ Erreur notification flash info:', error);
    }
  }

  // Envoyer une notification de bienvenue après inscription
  async sendWelcomeNotification(user) {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title: '🎉 Bienvenue sur BF1 !',
        body: `Merci de vous être inscrit ${user.name || ''}. Découvrez tous nos programmes et actualités !`,
        android: {
          channelId: this.channels.system,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 200, 300, 200],
          smallIcon: 'ic_launcher',
          color: '#4CAF50',
        },
        ios: {
          sound: 'default',
        },
        data: {
          type: 'welcome',
          userId: String(user.id || user._id || ''),
        },
      });

      console.log('✅ Notification de bienvenue push envoyée avec succès pour:', user.username || user.email);
    } catch (error) {
      console.error('❌ Erreur notification bienvenue:', error);
    }
  }

  // Activer/Désactiver les notifications quotidiennes
  async toggleDailyNotifications(enabled) {
    try {
      await AsyncStorage.setItem('daily_notifications_enabled', JSON.stringify(enabled));
      
      if (enabled) {
        await this.scheduleDailyNewsNotifications();
      } else {
        // Annuler les notifications quotidiennes
        await notifee.cancelNotification('journal-13h30');
        await notifee.cancelNotification('journal-19h30');
        console.log('❌ Notifications quotidiennes désactivées');
      }
    } catch (error) {
      console.error('❌ Erreur modification notifications quotidiennes:', error);
    }
  }

  // Vérifier si les notifications quotidiennes sont activées
  async areDailyNotificationsEnabled() {
    try {
      const enabled = await AsyncStorage.getItem('daily_notifications_enabled');
      return enabled !== null ? JSON.parse(enabled) : true; // Activées par défaut
    } catch (error) {
      console.error('❌ Erreur vérification notifications quotidiennes:', error);
      return true;
    }
  }

  // Synchroniser les notifications au démarrage de l'app
  async syncNotifications() {
    try {
      const dailyEnabled = await this.areDailyNotificationsEnabled();
      if (dailyEnabled) {
        await this.scheduleDailyNewsNotifications();
      }
      console.log('✅ Notifications synchronisées');
    } catch (error) {
      console.error('❌ Erreur synchronisation notifications:', error);
    }
  }

  // Replanifier les notifications quotidiennes (appelé chaque jour)
  async rescheduleDailyNotifications() {
    try {
      const dailyEnabled = await this.areDailyNotificationsEnabled();
      if (dailyEnabled) {
        // Annuler les anciennes notifications
        await notifee.cancelNotification('journal-13h30');
        await notifee.cancelNotification('journal-19h30');
        
        // Replanifier pour aujourd'hui ou demain
        await this.scheduleDailyNewsNotifications();
      }
    } catch (error) {
      console.error('❌ Erreur replanification notifications quotidiennes:', error);
    }
  }

  // Annuler toutes les notifications
  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
      console.log('❌ Toutes les notifications annulées');
    } catch (error) {
      console.error('❌ Erreur annulation notifications:', error);
    }
  }

  // Obtenir les notifications planifiées
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

  // Afficher une notification de test
  async displayTestNotification() {
    try {
      await this.initialize();

      await notifee.displayNotification({
        title: '🔔 Test de Notification Push',
        body: 'Le système de notifications push fonctionne correctement !',
        android: {
          channelId: this.channels.system,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          smallIcon: 'ic_launcher',
          color: '#2196F3',
        },
        ios: {
          sound: 'default',
        },
      });

      console.log('✅ Notification de test push affichée');
    } catch (error) {
      console.error('❌ Erreur notification test push:', error);
    }
  }

  // Test de notification de bienvenue
  async displayWelcomeTest() {
    try {
      await this.initialize();

      const testUser = {
        username: 'TestUser',
        email: 'test@example.com',
        name: 'Test User'
      };

      await this.sendWelcomeNotification(testUser);
      console.log('✅ Notification de bienvenue test affichée');
    } catch (error) {
      console.error('❌ Erreur notification bienvenue test:', error);
    }
  }
}

export default new PushNotificationService();
