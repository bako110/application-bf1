/**
 * Système de résilience pour les appels API
 * Si un appel échoue, retry automatique et fallback
 */

/**
 * Exécute un appel API avec retry automatique
 * @param {Function} apiCall - Fonction d'appel API
 * @param {Object} options - Options de retry
 * @returns {Promise} - Résultat de l'appel ou erreur
 */
export async function resilientApiCall(
  apiCall,
  options = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackValue = null,
    onError = null,
    silent = false
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;
      
      if (!silent) {
        console.warn(`⚠️ Tentative ${attempt + 1}/${maxRetries + 1} échouée:`, error.message);
      }

      // Si c'est la dernière tentative, ne pas attendre
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // Toutes les tentatives ont échoué
  if (!silent) {
    console.error('❌ Toutes les tentatives ont échoué:', lastError);
  }

  if (onError) {
    onError(lastError);
  }

  // Retourner la valeur de fallback au lieu de planter
  return fallbackValue;
}

/**
 * Wrapper pour les appels API avec gestion d'erreurs automatique
 * @param {Function} apiCall - Fonction d'appel API
 * @param {*} fallbackValue - Valeur par défaut en cas d'erreur
 * @returns {Promise} - Résultat ou fallback
 */
export async function safeApiCall(apiCall, fallbackValue = null) {
  try {
    return await apiCall();
  } catch (error) {
    console.error('❌ Erreur API (mode safe):', error);
    return fallbackValue;
  }
}

/**
 * Exécute plusieurs appels API en parallèle
 * Si certains échouent, retourne quand même les résultats des autres
 * @param {Array} apiCalls - Tableau de fonctions d'appel API
 * @returns {Promise<Array>} - Résultats (null pour les échecs)
 */
export async function parallelSafeApiCalls(apiCalls) {
  const results = await Promise.allSettled(
    apiCalls.map(call => call())
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`❌ Appel API ${index + 1} échoué:`, result.reason);
      return null;
    }
  });
}

/**
 * Cache simple pour éviter les appels répétés
 */
class ApiCache {
  constructor(ttl = 60000) { // 1 minute par défaut
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();

/**
 * Appel API avec cache
 * @param {string} cacheKey - Clé de cache
 * @param {Function} apiCall - Fonction d'appel API
 * @param {Object} options - Options
 * @returns {Promise} - Résultat (depuis cache ou API)
 */
export async function cachedApiCall(cacheKey, apiCall, options = {}) {
  const { useCache = true, fallbackValue = null } = options;

  // Vérifier le cache
  if (useCache) {
    const cached = apiCache.get(cacheKey);
    if (cached !== null) {
      console.log('📦 Résultat depuis cache:', cacheKey);
      return cached;
    }
  }

  // Appel API avec résilience
  try {
    const result = await resilientApiCall(apiCall, {
      fallbackValue,
      silent: false
    });

    // Mettre en cache si succès
    if (result !== fallbackValue && useCache) {
      apiCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('❌ Erreur cachedApiCall:', error);
    return fallbackValue;
  }
}

/**
 * Vérifie la connectivité du serveur
 * @param {string} baseUrl - URL de base du serveur
 * @returns {Promise<boolean>} - true si connecté
 */
export async function checkServerConnectivity(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Serveur non accessible:', error.message);
    return false;
  }
}

export default {
  resilientApiCall,
  safeApiCall,
  parallelSafeApiCalls,
  cachedApiCall,
  checkServerConnectivity,
  apiCache
};
