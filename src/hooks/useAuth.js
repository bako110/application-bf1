import { useState, useEffect } from 'react';
import authService from '../services/authService';

/**
 * Hook personnalisé pour gérer l'état d'authentification
 */
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.refreshUserProfile();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erreur refresh user:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    checkAuth,
    refreshUser,
    logout,
    isPremium: user?.is_premium || false,
  };
};

export default useAuth;
