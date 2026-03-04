import api from '../config/api';

// CONFIRMATION: Ce fichier utilise les endpoints corrigés
console.log('🔧 SearchService: Endpoints corrigés actifs - news=/news/, programs=/programs/');

class SearchService {
  // RECHERCHE DYNAMIQUE PRINCIPALE - À UTILISER PENDANT LA SAISIE
  async dynamicSearch(query, params = {}) {
    try {
      const { 
        limit = 8,           // Limite par catégorie
        minQueryLength = 2   // Longueur minimale pour déclencher
      } = params;

      // 1️⃣ Vérifier la longueur minimale
      const cleanQuery = query?.trim() || '';
      if (cleanQuery.length < minQueryLength) {
        return {
          items: [],
          categoryResults: {},
          suggestions: [],
          totalFound: 0,
          hasMore: false,
          query: cleanQuery
        };
      }

      console.log(`🔍 Recherche dynamique: "${cleanQuery}"`);

      // 2️⃣ Utiliser le nouvel endpoint centralisé /search
      const response = await api.get('/search/', {
        params: {
          q: cleanQuery,
          limit: limit
        }
      });

      console.log(`✅ Résultats de recherche reçus:`, response.data);

      // 3️⃣ Retourner les résultats directement du backend
      return {
        items: response.data.items || [],
        categoryResults: response.data.categoryResults || {},
        suggestions: response.data.suggestions || [],
        totalFound: response.data.totalFound || 0,
        hasMore: response.data.hasMore || false,
        query: cleanQuery
      };

    } catch (error) {
      console.error('❌ Erreur recherche dynamique:', error);
      return {
        items: [],
        categoryResults: {},
        suggestions: [],
        totalFound: 0,
        hasMore: false,
        query: query?.trim() || ''
      };
    }
  }

  // Recherche globale (pour la page de résultats complets)
  async searchAll(query, params = {}) {
    try {
      const { limit = 10, globalLimit = 50 } = params;
      
      const results = await this.dynamicSearch(query, { limit });
      
      return {
        ...results,
        items: results.items.slice(0, globalLimit)
      };
      
    } catch (error) {
      console.error('❌ Erreur recherche globale:', error);
      throw error;
    }
  }

  // Créer une fonction de recherche avec debounce
  createDebouncedSearch(delay = 300) {
    let timeoutId = null;
    
    return (query, params = {}) => {
      return new Promise((resolve) => {
        // Annuler la recherche précédente
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(async () => {
          try {
            const results = await this.dynamicSearch(query, params);
            resolve(results);
          } catch (error) {
            resolve({ items: [], error: error.message });
          }
        }, delay);
      });
    };
  }

  // Endpoints pour chaque catégorie - CORRIGÉS
  getEndpointForCategory(category) {
    const endpoints = {
      emissions: '/emissions/search',
      shows: '/shows/',
      reportages: '/reportage/',
      divertissements: '/divertissement/',
      jtandmag: '/jtandmag/',
      news: '/news/', // CORRIGÉ: était '/breaking-news/'
      programs: '/programs/' // CORRIGÉ: était '/shows/program/search'
    };
    return endpoints[category] || `/${category}/`;
  }

  // Paramètres selon la catégorie
  getParamsForCategory(category, query, limit) {
    const baseParams = { limit };
    
    // Ne pas envoyer de paramètre search si la recherche est vide ou trop courte
    const cleanQuery = query?.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return baseParams;
    }
    
    const paramsMap = {
      emissions: { query: cleanQuery, ...baseParams },
      shows: { search: cleanQuery, ...baseParams },
      reportages: { search: cleanQuery, ...baseParams },
      divertissements: { search: cleanQuery, ...baseParams },
      jtandmag: { search: cleanQuery, ...baseParams },
      news: { search: cleanQuery, ...baseParams },
      programs: { query: cleanQuery, ...baseParams }
    };
    
    return paramsMap[category] || { search: cleanQuery, ...baseParams };
  }

  // Transformer les résultats selon la catégorie
  transformResults(data, category) {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      id: item._id || item.id,
      title: item.title || item.name || 'Sans titre',
      description: item.description || item.summary || '',
      image_url: item.image_url || item.image || item.thumbnail || 'https://via.placeholder.com/150',
      duration: item.duration,
      created_at: item.created_at || item.published_at || item.date,
      views: item.views || 0,
      category,
      ...item
    }));
  }

  // Mapper catégorie vers type pour la navigation
  mapCategoryToType(category) {
    const typeMap = {
      emissions: 'emission',
      shows: 'show',
      reportages: 'reportage',
      divertissements: 'divertissement',
      jtandmag: 'jtandmag',
      news: 'news',
      programs: 'program'
    };
    return typeMap[category] || category;
  }

  // Calculer un score de pertinence
  calculateRelevanceScore(item, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = item.title?.toLowerCase() || '';
    
    // Correspondance exacte = score max
    if (titleLower === queryLower) score += 100;
    
    // Titre commence par la recherche
    else if (titleLower.startsWith(queryLower)) score += 50;
    
    // Titre contient la recherche
    else if (titleLower.includes(queryLower)) score += 30;
    
    // Bonus si la description contient la recherche
    if (item.description?.toLowerCase().includes(queryLower)) score += 10;
    
    // Bonus pour les éléments récents
    if (item.created_at) {
      const age = Date.now() - new Date(item.created_at).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 20;
      else if (daysOld < 30) score += 10;
    }
    
    // Bonus pour la popularité
    if (item.views) {
      if (item.views > 10000) score += 15;
      else if (item.views > 1000) score += 10;
      else if (item.views > 100) score += 5;
    }
    
    return score;
  }

  // Générer des suggestions de recherche
  generateSuggestions(items, query) {
    const queryLower = query.toLowerCase();
    
    // Extraire les titres pertinents
    const suggestions = items
      .filter(item => item.title && item.title.toLowerCase().includes(queryLower))
      .map(item => item.title)
      .filter((title, index, self) => self.indexOf(title) === index) // Uniques
      .slice(0, 5);
    
    return suggestions;
  }
}

export default new SearchService();