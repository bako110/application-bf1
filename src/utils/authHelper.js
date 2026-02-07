import authService from '../services/authService';
import { Alert } from 'react-native';

/**
 * Vérifie si l'utilisateur est connecté avant d'exécuter une action
 * @param {Function} action - L'action à exécuter si l'utilisateur est connecté
 * @param {Function} onNotAuthenticated - Callback si l'utilisateur n'est pas connecté (optionnel)
 * @returns {Promise<any>} - Le résultat de l'action ou null si non authentifié
 */
export const requireAuth = async (action, onNotAuthenticated = null) => {
  const isAuthenticated = await authService.isAuthenticated();
  
  if (!isAuthenticated) {
    if (onNotAuthenticated) {
      onNotAuthenticated();
    } else {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour effectuer cette action.',
        [{ text: 'OK' }]
      );
    }
    return null;
  }
  
  try {
    return await action();
  } catch (error) {
    // Si erreur 401, le token est peut-être expiré
    if (error.response?.status === 401) {
      Alert.alert(
        'Session expirée',
        'Votre session a expiré. Veuillez vous reconnecter.',
        [{ text: 'OK' }]
      );
      await authService.logout();
    }
    throw error;
  }
};

/**
 * Wrapper pour les actions qui nécessitent une authentification
 * Affiche un message personnalisé si non connecté
 */
export const withAuth = (action, message = 'Vous devez être connecté pour effectuer cette action.') => {
  return requireAuth(action, () => {
    Alert.alert('Connexion requise', message, [{ text: 'OK' }]);
  });
};

/**
 * Vérifie si l'utilisateur est premium
 */
export const isPremiumUser = async () => {
  const user = await authService.getCurrentUser();
  return user?.is_premium || false;
};

/**
 * Vérifie si l'utilisateur peut accéder au contenu premium
 */
export const canAccessPremiumContent = async (onNotPremium = null) => {
  const isAuth = await authService.isAuthenticated();
  
  if (!isAuth) {
    Alert.alert(
      'Connexion requise',
      'Vous devez être connecté pour accéder au contenu premium.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  const isPremium = await isPremiumUser();
  
  if (!isPremium) {
    if (onNotPremium) {
      onNotPremium();
    } else {
      Alert.alert(
        'Abonnement Premium requis',
        'Ce contenu est réservé aux abonnés Premium. Souscrivez maintenant pour y accéder !',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Voir les offres' },
        ]
      );
    }
    return false;
  }
  
  return true;
};

export default {
  requireAuth,
  withAuth,
  isPremiumUser,
  canAccessPremiumContent,
};
