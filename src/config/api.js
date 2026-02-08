import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'API
// Pour tester sur appareil physique, utilisez votre IP locale
export const API_BASE_URL = 'http://10.205.158.178:8000/api/v1';
// export const API_BASE_URL = 'http://localhost:8000/api/v1';
// export const API_BASE_URL = 'https://backend-bf1.onrender.com/api/v1';
// export const API_ROOT_URL = 'https://backend-bf1.onrender.com';
export const API_ROOT_URL = 'http://10.205.158.178:8000';

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token ajouté à la requête:', config.url);
    } else {
      console.log('⚠️ Pas de token pour la requête:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnexion
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
// API_BASE_URL is already available via api.defaults.baseURL
