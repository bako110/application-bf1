import React, { createContext, useState, useEffect, useContext } from 'react';
import { DeviceEventEmitter } from 'react-native';
import authService from '../services/authService';
import locationService from '../services/locationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    const { user: loggedUser, token } = await authService.login(identifier, password);
    
    // Mettre à jour immédiatement l'état
    setUser(loggedUser);
    setIsAuthenticated(true);
    
    // Forcer un rechargement complet pour s'assurer que tout est synchronisé
    await loadUser();
    
    // Déterminer la localisation pour adapter les prix d'abonnement
    console.log('📍 [AuthContext] Détection de la localisation...');
    locationService.determineLocation().then((location) => {
      console.log('📍 [AuthContext] Localisation détectée:', location);
    }).catch((error) => {
      console.error('❌ [AuthContext] Erreur localisation:', error);
    });
    
    // Émettre un événement pour notifier tous les composants
    DeviceEventEmitter.emit('userLoggedIn', loggedUser);
    
    console.log('✅ [AuthContext] Connexion réussie, utilisateur:', loggedUser?.username);
    console.log('📢 [AuthContext] Événement userLoggedIn émis');
    
    return { user: loggedUser, token };
  };

  const register = async (userData) => {
    await authService.register(userData);
    // Après inscription, on peut auto-connecter l'utilisateur
    // ou le rediriger vers la page de connexion
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    // Émettre un événement pour notifier tous les composants
    DeviceEventEmitter.emit('userLoggedOut');
    
    console.log('✅ [AuthContext] Déconnexion réussie');
    console.log('📢 [AuthContext] Événement userLoggedOut émis');
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authService.refreshUserProfile();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isPremium: user?.is_premium || false,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { AuthContext };
