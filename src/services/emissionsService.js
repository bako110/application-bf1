/**
 * Service pour la gestion des émissions
 * Gère les appels API et les données des émissions
 */

class EmissionsService {
  constructor() {
    this.baseUrl = 'http://192.168.137.1:8000/api/v1/emissions'; // URL de l'API locale
  }

  /**
   * Récupère toutes les émissions
   * @param {string} category - Catégorie filtrée (optionnel)
   * @param {Object} options - Options supplémentaires (featured, is_new, page, per_page)
   * @returns {Promise<Array>} Liste des émissions
   */
  async getEmissions(category = null, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (category && category !== 'toutes') {
        params.append('category', category);
      }
      
      if (options.featured !== undefined) {
        params.append('featured', options.featured);
      }
      
      if (options.is_new !== undefined) {
        params.append('is_new', options.is_new);
      }
      
      if (options.page) {
        params.append('page', options.page);
      }
      
      if (options.per_page) {
        params.append('per_page', options.per_page);
      }
      
      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des émissions');
      }
      
      const data = await response.json();
      return data.emissions || [];
      
    } catch (error) {
      console.error('Erreur lors de la récupération des émissions:', error);
      return [];
    }
  }

  /**
   * Récupère toutes les émissions sans filtre
   * @returns {Promise<Array>} Liste de toutes les émissions
   */
  async getAllEmissions() {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des émissions');
      }
      
      const data = await response.json();
      return data.emissions || [];
      
    } catch (error) {
      console.error('Erreur lors de la récupération des émissions:', error);
      return [];
    }
  }

  /**
   * Récupère une émission spécifique
   * @param {string} id - ID de l'émission
   * @returns {Promise<Object>} Détails de l'émission
   */
  async getEmissionById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error('Émission non trouvée');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'émission:', error);
      throw error;
    }
  }

  /**
   * Récupère les émissions featured/en vedette
   * @param {number} limit - Limite de résultats
   * @returns {Promise<Array>} Liste des émissions featured
   */
  async getFeaturedEmissions(limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/featured?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des émissions featured');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des émissions featured:', error);
      return [];
    }
  }

  /**
   * Récupère les nouvelles émissions
   * @param {number} limit - Limite de résultats
   * @returns {Promise<Array>} Liste des nouvelles émissions
   */
  async getNewEmissions(limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/new?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des nouvelles émissions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des nouvelles émissions:', error);
      return [];
    }
  }

  /**
   * Recherche des émissions
   * @param {string} query - Terme de recherche
   * @param {string} category - Catégorie filtrée (optionnel)
   * @param {number} limit - Limite de résultats
   * @param {number} offset - Offset pour pagination
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchEmissions(query, category = null, limit = 20, offset = 0) {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      
      if (category) {
        params.append('category', category);
      }
      
      params.append('limit', limit);
      params.append('offset', offset);
      
      const response = await fetch(`${this.baseUrl}/search?${params}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche d\'émissions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la recherche d\'émissions:', error);
      return [];
    }
  }

  /**
   * Incrémente le nombre de vues d'une émission
   * @param {string} id - ID de l'émission
   * @param {Object} options - Options (user_id, session_id)
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async incrementViews(id, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'incrémentation des vues');
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation des vues:', error);
      return false;
    }
  }

  /**
   * Ajoute/retire un like d'une émission
   * @param {string} id - ID de l'émission
   * @param {string} action - Action ('add' ou 'remove')
   * @param {string} userId - ID utilisateur (optionnel)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async toggleLike(id, action = 'add', userId = null) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          user_id: userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la gestion du like');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Récupère les statistiques d'une émission
   * @param {string} id - ID de l'émission
   * @returns {Promise<Object>} Statistiques de l'émission
   */
  async getEmissionStats(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/stats`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { views: 0, likes: 0 };
    }
  }

  /**
   * Récupère les catégories disponibles
   * @returns {Promise<Array>} Liste des catégories
   */
  async getCategories() {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }
      
      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      
      // En cas d'erreur, retourner les données mockées
      return [
        { id: 'toutes', name: 'Toutes', icon: 'grid', count: 25 },
        { id: 'jt', name: 'JT', icon: 'newspaper', count: 5 },
        { id: 'magazines', name: 'Magazines', icon: 'book', count: 8 },
        { id: 'documentaires', name: 'Docs', icon: 'videocam', count: 6 },
        { id: 'divertissement', name: 'Show', icon: 'happy', count: 4 },
        { id: 'sport', name: 'Sport', icon: 'football', count: 2 },
      ];
    }
  }

  /**
   * Crée une nouvelle émission (admin)
   * @param {Object} emissionData - Données de l'émission
   * @returns {Promise<Object>} Émission créée
   */
  async createEmission(emissionData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emissionData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'émission');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de l\'émission:', error);
      throw error;
    }
  }

  /**
   * Met à jour une émission (admin)
   * @param {string} id - ID de l'émission
   * @param {Object} emissionData - Données de mise à jour
   * @returns {Promise<Object>} Émission mise à jour
   */
  async updateEmission(id, emissionData) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emissionData)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'émission');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'émission:', error);
      throw error;
    }
  }

  /**
   * Supprime une émission (admin)
   * @param {string} id - ID de l'émission
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async deleteEmission(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'émission');
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'émission:', error);
      return false;
    }
  }
}

export default new EmissionsService();
