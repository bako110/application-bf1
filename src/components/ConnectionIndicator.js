import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import connectionService from '../services/connectionService';

const ConnectionIndicator = () => {
  const { colors } = useTheme();
  const [connectionStatus, setConnectionStatus] = useState(connectionService.getConnectionStatus());

  useEffect(() => {
    // Écouter les changements de statut de connexion
    const unsubscribe = connectionService.addListener((status, isConnected) => {
      const currentStatus = connectionService.getConnectionStatus();
      setConnectionStatus({
        isConnected,
        isChecking: currentStatus.isChecking,
        retryCount: currentStatus.retryCount,
        totalAttempts: currentStatus.totalAttempts // Nouveau
      });
    });

    // Mettre à jour le statut initial
    setConnectionStatus(connectionService.getConnectionStatus());

    return unsubscribe;
  }, []);

  // Ne pas afficher l'indicateur - connexion transparente en arrière-plan
  // Masquer complètement les tentatives de connexion
  return null;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1000,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ConnectionIndicator;