/**
 * Utilitaires pour la gestion des abonnements côté client
 */

// Hiérarchie des abonnements
export const SUBSCRIPTION_HIERARCHY = {
  'basic': 1,
  'standard': 2,
  'premium': 3
};

// Couleurs des badges d'abonnement
export const SUBSCRIPTION_BADGES = {
  basic: {
    label: 'Basic',
    color: '#2196F3',
    icon: 'star-outline'
  },
  standard: {
    label: 'Standard',
    color: '#9C27B0',
    icon: 'star-half-outline'
  },
  premium: {
    label: 'Premium',
    color: '#FF6F00',
    icon: 'star'
  }
};

/**
 * Vérifie si l'utilisateur peut accéder au contenu selon la hiérarchie
 * @param {string|null} userCategory - Catégorie de l'utilisateur (basic, standard, premium)
 * @param {string|null} requiredCategory - Catégorie requise pour le contenu
 * @returns {boolean} true si l'utilisateur a accès, false sinon
 */
export const canUserAccessContent = (userCategory, requiredCategory) => {
  // Si pas de catégorie requise, accès libre
  if (!requiredCategory) {
    return true;
  }

  // Si l'utilisateur n'a pas d'abonnement, pas d'accès au contenu premium
  if (!userCategory) {
    return false;
  }

  const userLevel = SUBSCRIPTION_HIERARCHY[userCategory] || 0;
  const requiredLevel = SUBSCRIPTION_HIERARCHY[requiredCategory] || 0;

  // L'utilisateur doit avoir un niveau égal ou supérieur
  return userLevel >= requiredLevel;
};

/**
 * Obtient les informations du badge d'abonnement
 * @param {string} category - Catégorie d'abonnement
 * @returns {object} Informations du badge (label, color, icon)
 */
export const getSubscriptionBadge = (category) => {
  if (!category) {
    return {
      label: 'Gratuit',
      color: '#4CAF50',
      icon: 'gift-outline'
    };
  }

  return SUBSCRIPTION_BADGES[category] || SUBSCRIPTION_BADGES.basic;
};

/**
 * Récupère la catégorie d'abonnement de l'utilisateur depuis son profil
 * @param {object} user - Objet utilisateur
 * @returns {string|null} Catégorie d'abonnement ou null
 */
export const getUserSubscriptionCategory = (user) => {
  return user?.subscription_category || null;
};