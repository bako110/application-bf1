import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Hook personnalisé pour rafraîchir automatiquement les données en arrière-plan
 * @param {Function} refreshFunction - Fonction à appeler pour rafraîchir les données
 * @param {number} interval - Intervalle en millisecondes (défaut: 10000ms = 10s)
 * @param {boolean} enabled - Activer/désactiver le rafraîchissement auto (défaut: true)
 */
const useAutoRefresh = (refreshFunction, interval = 10000, enabled = true) => {
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled || !refreshFunction) {
      return;
    }

    // Fonction pour démarrer le rafraîchissement automatique
    const startAutoRefresh = () => {
      // Nettoyer l'intervalle existant si présent
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Créer un nouveau intervalle
      intervalRef.current = setInterval(() => {
        // Vérifier que l'app est au premier plan avant de rafraîchir
        if (AppState.currentState === 'active') {
          console.log('🔄 Auto-refresh en arrière-plan...');
          refreshFunction();
        }
      }, interval);
    };

    // Fonction pour arrêter le rafraîchissement
    const stopAutoRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Gérer les changements d'état de l'application
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // L'app revient au premier plan, rafraîchir immédiatement et redémarrer l'intervalle
        console.log('📱 App au premier plan, rafraîchissement...');
        refreshFunction();
        startAutoRefresh();
      } else if (nextAppState.match(/inactive|background/)) {
        // L'app passe en arrière-plan, arrêter le rafraîchissement
        console.log('📱 App en arrière-plan, pause du rafraîchissement');
        stopAutoRefresh();
      }

      appState.current = nextAppState;
    };

    // Démarrer le rafraîchissement automatique
    startAutoRefresh();

    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      stopAutoRefresh();
      if (subscription) {
        subscription.remove();
      }
    };
  }, [refreshFunction, interval, enabled]);

  return null;
};

export default useAutoRefresh;
