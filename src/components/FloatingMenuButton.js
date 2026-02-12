import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import DrawerMenu from './DrawerMenu';

/**
 * Bouton hamburger flottant fixe visible sur tous les écrans
 * Positionné en haut à gauche avec un z-index qui ne bloque pas les boutons de retour
 */
export default function FloatingMenuButton() {
  const { colors } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const styles = createStyles(colors);

  return (
    <>
      <View style={styles.floatingContainer}>
        <TouchableOpacity 
          onPress={() => setDrawerVisible(true)}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </>
  );
}

const createStyles = (colors) => StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 20, // Position en haut - 30px plus haut que l'original (50 - 30 = 20)
    left: 10, // Déplacé vers la gauche (16 -> 10)
    zIndex: 9999, // Z-index élevé pour être au-dessus de tout
    elevation: 10, // Pour Android
    pointerEvents: 'box-none', // Permet aux touches de passer à travers sauf sur le bouton
  },
  menuButton: {
    width: 26, // Taille ajustée pour afficher l'icône correctement
    height: 26, // Taille ajustée pour afficher l'icône correctement
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto', // Le bouton reste cliquable
  },
});
