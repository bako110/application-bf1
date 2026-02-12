import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour afficher le label dynamique de l'onglet Profil
 * Affiche "Connexion" si non connecté, "Profil" si connecté
 */
export default function ProfileTabLabel({ focused, color }) {
  const { user } = useAuth();
  
  return (
    <Text style={{ color, fontSize: 12, marginTop: -5 }}>
      {user ? 'Profil' : 'Connexion'}
    </Text>
  );
}
