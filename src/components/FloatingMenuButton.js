import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import DrawerMenu from './DrawerMenu';

/**
 * Bouton hamburger flottant universel
 * - Détection automatique des zones sûres (notch / status bar)
 * - Compatible iOS / Android
 * - Stable en portrait et paysage
 * - Toujours au-dessus des autres composants
 */

export default function FloatingMenuButton({ hideInProfile = false }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const buttonRef = useRef(null);

  // Styles doivent être définis avant tout retour conditionnel
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // 🔥 Vérification et logging
  useEffect(() => {
    console.log('🔥 FloatingMenuButton monté, hideInProfile:', hideInProfile);
  }, []);

  // 🔥 Si caché, ne pas rendre le composant (après tous les hooks)
  if (hideInProfile) {
    console.log('🔥 FloatingMenuButton caché (hideInProfile = true)');
    return null;
  }

  const handlePress = () => {
    console.log('🔥 FloatingMenuButton cliqué!');
    console.log('📍 hideInProfile actuel:', hideInProfile);
    console.log('📍 drawerVisible avant:', drawerVisible);
    setDrawerVisible(true);
    console.log('📍 drawerVisible après:', true);
  };

  return (
    <>
      <View 
        pointerEvents="box-none" 
        style={styles.container}
        collapsable={false}
      >
        <TouchableOpacity
          ref={buttonRef}
          onPress={handlePress}
          style={styles.button}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <DrawerMenu
        visible={drawerVisible}
        onClose={() => {
          console.log('🔥 DrawerMenu fermé');
          setDrawerVisible(false);
        }}
      />
    </>
  );
}

const createStyles = (colors, insets) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: insets.top + 8,
      left: insets.left + 16,
      zIndex: 9999,
      elevation: 50,
      pointerEvents: 'box-none',
    },

    button: {
      width: 38, // Taille encore plus réduite
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary || '#DC143C',
      zIndex: 10000,
      
      // Ombre iOS améliorée
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      
      // Ombre Android
      elevation: 8,
      
      // Bordures pour meilleur visuel
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
  });