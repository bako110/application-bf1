import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Inscription
  async register(userData) {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
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
