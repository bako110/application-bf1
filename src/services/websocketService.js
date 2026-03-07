import pushNotificationService from './pushNotificationService';
import { API_ROOT_URL } from '../config/api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {};
    // Ajout pour le tracking du livestream
    this.watchingLive = false;
    this.userId = null;
  }

  connect(url = API_ROOT_URL) {
    try {
      console.log('🔌 Connexion WebSocket...');
      console.log('🔌 URL:', `${url}/ws`);
      
      // Utiliser WebSocket natif avec l'URL correcte
      this.socket = new WebSocket(`${url.replace('http', 'ws')}/ws`);
      
      this.socket.onopen = () => {
        // WebSocket connecté silencieusement
        this.isConnected = true;
        
        // Envoyer un message de souscription
        this.sendMessage({
          type: 'subscribe',
          notification_types: ['popular_program', 'flash_info', 'daily_news']
        });
        
        // Notifier les écouteurs
        this.emit('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Log silencieux pour messages WebSocket
          
          // Traiter les notifications push
          if (data.type === 'push_notification') {
            this.handlePushNotification(data);
          }
          
          // Traiter les messages du livestream
          if (data.type === 'joined_livestream') {
            // Join silencieux
            this.watchingLive = true;
          } else if (data.type === 'left_livestream') {
            // Leave silencieux
            this.watchingLive = false;
          } else if (data.type === 'viewer_joined' || data.type === 'viewer_left') {
            // Viewer changes silencieux
          }
          
          // Notifier les écouteurs
          this.emit(data.type, data);
          this.emit('message', data);
        } catch (error) {
          // Erreur parsing silencieuse  
        }
      };

      this.socket.onclose = (event) => {
        // Fermeture silencieuse
        this.isConnected = false;
        this.emit('disconnected');
        
        // Tentative de reconnexion après 5 secondes
        setTimeout(() => {
          if (!this.isConnected) {
            // Reconnexion silencieuse
            this.connect();
          }
        }, 5000);
      };

      this.socket.onerror = (error) => {
        // Erreur silencieuse - pas de spam logs
        this.emit('error', error);
      };

    } catch (error) {
      console.error('❌ Erreur connexion WebSocket:', error);
      console.log('❌ Détails erreur:', JSON.stringify(error));
      
      // Tenter une reconnexion après 10 secondes
      setTimeout(() => {
        if (!this.isConnected) {
          console.log('🔄 Tentative de reconnexion après erreur...');
          this.connect();
        }
      }, 10000);
    }
  }

  disconnect() {
    // Quitter le livestream avant de se déconnecter
    if (this.watchingLive) {
      this.leaveLivestream();
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendMessage(message) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Erreur envoi message WebSocket:', error);
      }
    } else {
      console.warn('⚠️ WebSocket non connecté');
    }
  }

  handlePushNotification(data) {
    const { notification_type, data: notificationData } = data;
    
    console.log('📱 Notification push reçue:', notification_type);
    
    switch (notification_type) {
      case 'popular_program':
        pushNotificationService.sendPopularProgramNotification(notificationData.data);
        break;
      case 'flash_info':
        pushNotificationService.sendFlashInfoNotification(notificationData.data);
        break;
      case 'daily_news':
        // Les notifications quotidiennes sont gérées localement
        break;
      default:
        console.log('📱 Type de notification non géré:', notification_type);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      watchingLive: this.watchingLive,
      userId: this.userId
    };
  }

  // ========================================
  // NOUVELLES MÉTHODES POUR LE LIVESTREAM
  // ========================================

  // Rejoindre le livestream (tracking réel)
  joinLivestream(userId = null) {
    this.userId = userId;
    console.log('🎥 Rejoindre le livestream...', userId || 'visiteur anonyme');
    
    this.sendMessage({
      type: 'join_livestream',
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Quitter le livestream
  leaveLivestream() {
    if (!this.watchingLive) return;
    
    console.log('🚃 Quitter le livestream...', this.userId || 'visiteur anonyme');
    
    this.sendMessage({
      type: 'leave_livestream',
      user_id: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  // Vérifier si on regarde le live
  isWatchingLive() {
    return this.watchingLive;
  }
}

export default new WebSocketService();
