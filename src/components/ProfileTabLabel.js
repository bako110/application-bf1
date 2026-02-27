import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour afficher le label de l'onglet Mon compte
 * Affiche toujours "Mon compte" que l'utilisateur soit connecté ou non
 */
export default function ProfileTabLabel({ focused, color }) {
  return (
    <Text style={{ color, fontSize: 12, marginTop: -5 }}>
      Mon compte
    </Text>
  );
}
