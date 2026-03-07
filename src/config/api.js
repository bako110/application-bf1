import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import connectionService from '../services/connectionService';

// ==========================================
// CONFIGURATION SIMPLE - 2 OPTIONS
// ==========================================

// Changez cette valeur pour basculer entre local et production
const IS_PRODUCTION = true; // true = production, false = local

// Option 1: Production (serveur en ligne)
// const PRODUCTION_API_URL = 'https://backend-bf1.onrender.com';
const PRODUCTION_API_URL = 'https://bf1.fly.dev'; // Remplacez par votre URL de production
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

// Instance Axios configurée avec retry automatique
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // Réduit à 8s pour des tentatives plus rapides
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuration du retry automatique - ILLIMITÉ
let TOTAL_API_ATTEMPTS = 0; // Compteur global des tentatives API
const RETRY_DELAY = 800; // 800ms - plus rapide

// Fonction de retry ILLIMITÉ avec back-off exponentiel
const retryRequest = async (error, retryCount = 0) => {
  const { config } = error;
  
  TOTAL_API_ATTEMPTS++;
  
  // Ne pas retry seulement si erreur d'authentification
  if (error.code === 'AUTH_ERROR') {
    return Promise.reject(error);
  }
  
  // Calculer le délai avec back-off exponentiel (limité à 5s max)
  const delay = Math.min(RETRY_DELAY * Math.pow(1.5, retryCount), 5000);
  
  // Log seulement toutes les 5 tentatives pour réduire le spam
  if (TOTAL_API_ATTEMPTS % 5 === 1) {
    console.log(`🔄 API Retry en arrière-plan pour: ${config.url} (Total: ${TOTAL_API_ATTEMPTS})`);
  }
  
  // Attendre avant de retenter
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Forcer une vérification de connexion
  connectionService.forceCheck();
  
  // Nouvelle configuration pour le retry
  const retryConfig = {
    ...config,
    timeout: Math.min(config.timeout * 1.1, 8000), // Augmenter légèrement le timeout
    __retryCount: retryCount + 1
  };
  
  return api(retryConfig);
};

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

// Intercepteur de réponse avec retry automatique
api.interceptors.response.use(
  (response) => {
    // Succès - notifier le service de connexion
    const wasDisconnected = !connectionService.getConnectionStatus().isConnected;
    if (wasDisconnected) {
      connectionService.forceCheck();
    }
    return response;
  },
  async (error) => {
    const { config, response, code } = error;
    
    // Gestion des erreurs de connexion/réseau - RETRY ILLIMITÉ
    if (!response || code === 'NETWORK_ERROR' || code === 'ECONNABORTED') {
      // Log silencieux pour les erreurs réseau
      
      // Notifier le service de connexion
      connectionService.forceCheck();
      
      // TOUJOURS essayer le retry (pas de limite)
      return retryRequest(error, config.__retryCount || 0);
    }
    
    // Gestion des erreurs d'authentification (401 et 403)
    if (response?.status === 401 || response?.status === 403) {
      console.log(`🔒 Token expiré ou invalide (${response.status}), déconnexion...`);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      clearTokenCache();
      
      // Pas de retry pour les erreurs d'authentification
      const authError = new Error('Token expiré ou invalide');
      authError.code = 'AUTH_ERROR';
      return Promise.reject(authError);
    }
    
    // Autres erreurs serveur (5xx) - RETRY ILLIMITÉ
    if (response?.status >= 500) {
      // Log silencieux pour erreurs serveur
      return retryRequest(error, config.__retryCount || 0);
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { clearTokenCache };

// ======================================
// FONCTIONS DE DEBUG POUR VOIR LES STATS
// ======================================

// Fonction globale pour voir toutes les statistiques de connexion
global.debugConnectionStats = () => {
  console.log('\n🔍 === STATISTIQUES DE CONNEXION ===');
  
  // Stats du service de connexion
  console.log('\n📊 Service de connexion:');
  connectionService.logStats();
  
  // Stats des API  
  console.log(`\n📡 Tentatives API totales: ${TOTAL_API_ATTEMPTS}`);
  
  console.log('\n=================================\n');
};

// Fonction pour forcer une vérification
global.forceConnectionCheck = () => {
  console.log('🚀 Forcer vérification de connexion...');
  connectionService.forceCheck();
};

console.log('🛠️ Debug disponible: debugConnectionStats() et forceConnectionCheck()');