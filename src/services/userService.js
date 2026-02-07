import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class UserService {
  // Récupérer le profil de l'utilisateur connecté
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      // Mettre à jour le cache local
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mettre à jour le profil utilisateur
  async updateProfile(userData) {
    try {
      const response = await api.put('/users/me', userData);
      // Mettre à jour le cache local
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer l'utilisateur depuis le cache local
  async getCachedUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  // Vérifier si l'utilisateur est premium
  async isPremium() {
    try {
      const user = await this.getCurrentUser();
      return user?.is_premium || false;
    } catch (error) {
      return false;
    }
  }

  // Supprimer le compte
  async deleteAccount() {
    try {
      const response = await api.delete('/users/me');
      // Nettoyer le cache local
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new UserService();
