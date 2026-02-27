import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// CONFIGURATION SIMPLE - 2 OPTIONS
// ==========================================

// Changez cette valeur pour basculer entre local et production
const IS_PRODUCTION = false; // true = production, false = local

// Option 1: Production (serveur en ligne)
const PRODUCTION_API_URL = 'https://backend-bf1.onrender.com';

// Option 2: Local (votre PC sur le réseau local)
const LOCAL_API_URL = 'http://192.168.137.1:8000'; // Changez l'IP selon votre réseau

// Configuration automatique
const API_ROOT_URL = IS_PRODUCTION ? PRODUCTION_API_URL : LOCAL_API_URL;
const API_BASE_URL = `${API_ROOT_URL}/api/v1`;

console.log(IS_PRODUCTION ? '🌍 Mode PRODUCTION' : '🔧 Mode LOCAL');
console.log('📡 API:', API_BASE_URL);

export { API_ROOT_URL, API_BASE_URL };

// Cache du token en mémoire pour éviter les lectures AsyncStorage répétées
let tokenCache = null;
let tokenLoadPromise = null;

// Fonction pour charger le token avec cache
const getToken = async () => {
  if (tokenCache) {
    return tokenCache;
  }
  
  if (tokenLoadPromise) {
    return tokenLoadPromise;
  }
  
  tokenLoadPromise = AsyncStorage.getItem('authToken').then(token => {
    tokenCache = token;
    tokenLoadPromise = null;
    return token;
  });
  
  return tokenLoadPromise;
};

// Fonction pour invalider le cache
const clearTokenCache = () => {
  tokenCache = null;
  tokenLoadPromise = null;
};

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Augmenté à 15s pour éviter les timeouts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log('✅ Token ajouté à la requête:', config.url);
      } else {
        console.log('⚠️ Pas de token pour la requête:', config.url);
      }
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
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
    // Ne supprimer le token QUE sur erreur 401 (non autorisé)
    if (error.response?.status === 401) {
      console.log('🔐 Token expiré ou invalide (401), déconnexion...');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      clearTokenCache();
    } else if (error.response?.status === 500) {
      console.error('❌ Erreur serveur 500 pour:', error.config?.url);
      // Ne PAS supprimer le token sur erreur 500
    }
    return Promise.reject(error);
  }
);

export default api;
export { clearTokenCache };
// API_BASE_URL is already available via api.defaults.baseURL
