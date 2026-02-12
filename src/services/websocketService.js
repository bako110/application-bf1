import pushNotificationService from './pushNotificationService';
import { API_ROOT_URL } from '../config/api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {};
  }

  connect(url = API_ROOT_URL) {
    try {
      console.log('🔌 Connexion WebSocket...');
      console.log('🔌 URL:', `${url}/ws`);
      
      // Utiliser WebSocket natif avec l'URL correcte
      this.socket = new WebSocket(`${url.replace('http', 'ws')}/ws`);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connecté');
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
          console.log('📱 Message WebSocket reçu:', data);
          
          // Traiter les notifications push
          if (data.type === 'push_notification') {
            this.handlePushNotification(data);
          }
          
          // Notifier les écouteurs
          this.emit(data.type, data);
          this.emit('message', data);
        } catch (error) {
          console.error('❌ Erreur parsing message WebSocket:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('❌ WebSocket déconnecté');
        console.log('❌ Code:', event.code);
        console.log('❌ Raison:', event.reason);
        this.isConnected = false;
        this.emit('disconnected');
        
        // Tentative de reconnexion après 5 secondes
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('🔄 Tentative de reconnexion...');
            this.connect();
          }
        }, 5000);
      };

      this.socket.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        console.log('❌ Détails erreur:', JSON.stringify(error));
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
    return this.isConnected;
  }
}

export default new WebSocketService();
