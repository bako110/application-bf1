import { API_BASE_URL, API_ROOT_URL } from '../config/api';
import websocketService from './websocketService';

class ConnectionService {
  constructor() {
    this.isConnected = false;
    this.isChecking = false;
    this.listeners = [];
    this.checkInterval = null;
    this.retryCount = 0;
    this.totalAttempts = 0; // Compteur total depuis le démarrage
    this.maxRetryDelay = 5000; // Réduit à 5 secondes max
    this.minRetryDelay = 200; // 200ms min - plus rapide
  }

  // Démarrer la vérification automatique de connexion
  startAutoConnection() {
    // Logs réduits - connexion silencieuse en arrière-plan
    
    // Première vérification immédiate
    this.checkConnection();
    
    // Puis vérification continue
    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        if (!this.isConnected) {
          this.checkConnection();
        }
      }, this.getRetryDelay());
    }
  }

  // Arrêter la vérification automatique
  stopAutoConnection() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    // Log silencieux
  }

  // Vérifier la connexion serveur
  async checkConnection() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    this.totalAttempts++;
    this.retryCount++;
    
    // Log seulement toutes les 10 tentatives pour réduire le spam
    if (this.totalAttempts % 10 === 1) {
      console.log(`🔍 Connexion en arrière-plan... (tentative ${this.totalAttempts})`);
    }

    try {
      // Test rapide de l'API avec l'endpoint /health (pas besoin d'auth)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Réduit à 2s

      const response = await fetch(`${API_ROOT_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Serveur disponible
        this.handleConnectionSuccess();
      } else {
        throw new Error(`Status: ${response.status}`);
      }

    } catch (error) {
      // Log silencieux sauf pour erreurs importantes
      if (this.totalAttempts % 20 === 0) {
        console.log(`⚠️ ${this.totalAttempts} tentatives de connexion en arrière-plan...`);
      }
      this.handleConnectionFailure();
    } finally {
      this.isChecking = false;
    }
  }

  // Connexion réussie
  handleConnectionSuccess() {
    const wasDisconnected = !this.isConnected;
    this.isConnected = true;
    this.retryCount = 0; // Réinitialiser pour la prochaine session de retry

    if (wasDisconnected) {
      console.log(`✅ CONNEXION ÉTABLIE après ${this.totalAttempts} tentatives !`);
      
      // Démarrer WebSocket si pas connecté
      if (!websocketService.getConnectionStatus().isConnected) {
        websocketService.connect().catch(err => {
          // Log silencieux pour websocket
        });
      }
      
      // Notifier les listeners
      this.notifyListeners('connected');
      
      // Réduire la fréquence de vérification quand connecté
      this.updateCheckInterval(30000); // Vérifier toutes les 30s quand connecté
    }
  }

  // Échec de connexion - CONTINUE SANS LIMITE
  handleConnectionFailure() {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    // NE PAS incrémenter retryCount ici - déjà fait dans checkConnection

    if (wasConnected) {
      console.log('💥 Connexion perdue - Retry silencieux en arrière-plan...');
      this.notifyListeners('disconnected');
    }

    // Continuer avec délai progressif mais SANS LIMITE de tentatives
    const delay = this.getRetryDelay();
    this.updateCheckInterval(delay);
    
    // Log silencieux sauf toutes les 15 tentatives
    if (this.totalAttempts % 15 === 0) {
      console.log(`🔄 ${this.totalAttempts} tentatives - Connexion en arrière-plan...`);
    }
  }

  // Calculer le délai de retry (exponentiel avec limite)
  getRetryDelay() {
    const baseDelay = this.minRetryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, Math.min(this.retryCount, 5));
    return Math.min(exponentialDelay, this.maxRetryDelay);
  }

  // Mettre à jour l'intervalle de vérification
  updateCheckInterval(delay) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = setInterval(() => {
        if (!this.isConnected) {
          this.checkConnection();
        }
      }, delay);
    }
  }

  // Test de ping rapide
  async quickPing() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

      const response = await fetch(`${API_ROOT_URL}/health`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Ajouter un listener pour les changements de statut
  addListener(callback) {
    this.listeners.push(callback);
    
    // Retourner fonction de nettoyage
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notifier tous les listeners
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isConnected);
      } catch (error) {
        console.error('❌ Erreur listener connexion:', error);
      }
    });
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isChecking: this.isChecking,
      retryCount: this.retryCount,
      totalAttempts: this.totalAttempts // Nouveau: total depuis le démarrage
    };
  }

  // Forcer une vérification immédiate
  forceCheck() {
    if (!this.isChecking) {
      this.checkConnection();
    }
  }

  // Test de connexion avec différentes URLs
  async testMultipleEndpoints() {
    const endpoints = [
      `${API_ROOT_URL}/health`,
      `${API_BASE_URL}/shows/`,
      `${API_BASE_URL}/news/`,
      `${API_ROOT_URL}/docs`
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 401) {
          console.log(`✅ Endpoint disponible: ${endpoint}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Endpoint indisponible: ${endpoint}`);
      }
    }

    return false;
  }

  // Obtenir les statistiques complètes de connexion
  getFullStats() {
    return {
      connectionService: {
        isConnected: this.isConnected,
        isChecking: this.isChecking,
        sessionRetries: this.retryCount,
        totalAttempts: this.totalAttempts,
        lastDelay: this.getRetryDelay()
      },
      intervals: {
        checkInterval: !!this.checkInterval,
        currentDelay: this.getRetryDelay()
      },
      timestamp: new Date().toISOString()
    };
  }

  // Log des statistiques pour debug
  logStats() {
    const stats = this.getFullStats();
    console.table({
      'Status': this.isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ',
      'En cours': this.isChecking ? 'OUI' : 'NON', 
      'Total tentatives': this.totalAttempts,
      'Session retry': this.retryCount,
      'Prochain délai': `${this.getRetryDelay()}ms`
    });
  }
}

// Instance singleton
const connectionService = new ConnectionService();

export default connectionService;