import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import dynamique pour éviter le cycle
const getNotificationService = () => require('./notificationService').default;

// Importer la fonction pour invalider le cache
let clearTokenCache = null;
try {
  // Accéder au cache via le module api
  const apiModule = require('../config/api');
  if (apiModule.clearTokenCache) {
    clearTokenCache = apiModule.clearTokenCache;
  }
} catch (e) {
  console.log('Cache token non disponible');
}

class AuthService {
  // Inscription
  async register(userData) {
    try {
      const response = await api.post('/users/register', userData);
      const { access_token, user } = response.data;
      
      console.log('📝 Inscription réussie, utilisateur:', user);
      console.log('🔐 Token reçu:', access_token ? 'OUI' : 'NON');
      
      // Sauvegarder le token et les infos utilisateur (connexion automatique)
      if (access_token) {
        await AsyncStorage.setItem('authToken', access_token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        console.log('💾 Connexion automatique après inscription');
      }
      
      // Envoyer la notification de bienvenue après inscription réussie
      if (user) {
        try {
          console.log('📱 Envoi notification bienvenue pour:', user.username || user.email);
          const notificationService = getNotificationService();
          await notificationService.sendWelcomeNotification(user);
        } catch (notifError) {
          console.error('❌ Erreur envoi notification bienvenue:', notifError);
          // Ne pas bloquer l'inscription si la notification échoue
        }
      }
      
      return { token: access_token, user };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      throw error.response?.data || error.message;
    }
  }

  // Connexion
  async login(identifier, password) {
    try {
      const response = await api.post('/users/login', {
        identifier,
        password,
      });
      
      const { access_token, user } = response.data;
      
      console.log('🔐 Login réussi, token reçu:', access_token ? 'OUI' : 'NON');
      
      // Sauvegarder le token et les infos utilisateur
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('💾 Token stocké dans AsyncStorage');
      
      return { token: access_token, user };
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error.response?.data || error.message;
    }
  }

  // Déconnexion
  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    // Invalider le cache du token
    if (clearTokenCache) {
      clearTokenCache();
    }
    console.log('🔐 Déconnexion complète - token et cache supprimés');
  }

  // Récupérer l'utilisateur connecté depuis le cache
  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  // Récupérer le profil depuis le backend et mettre à jour le cache
  async refreshUserProfile() {
    try {
      const response = await api.get('/users/me');
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔐 [AuthService] isAuthenticated - Token présent:', !!token);
    if (token) {
      console.log('🔐 [AuthService] Token (premiers caractères):', token.substring(0, 20) + '...');
    }
    return !!token;
  }

  // Récupérer le token
  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }
}

export default new AuthService();
