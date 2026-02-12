import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

/**
 * Menu déroulant (Drawer) pour la navigation
 * Accessible via l'icône hamburger qui remplace "Accueil"
 */
export default function DrawerMenu({ visible, onClose }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const styles = createStyles(colors);
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    {
      title: 'Flash Info',
      icon: 'flash',
      screen: 'BreakingNews',
      description: 'Actualités en direct',
    },
    {
      title: 'Émissions Tendances',
      icon: 'trending-up',
      screen: 'TrendingShows',
      description: 'Les plus populaires',
    },
    {
      title: 'Vidéos Récentes',
      icon: 'play-circle',
      screen: 'RecentVideos',
      description: 'Derniers replays',
    },
    // {
    //   title: 'Programmes Populaires',
    //   icon: 'star',
    //   screen: 'PopularPrograms',
    //   description: 'Les favoris du public',
    // },
    {
      title: 'Interviews',
      icon: 'mic',
      screen: 'Interviews',
      description: 'Entretiens exclusifs',
    },
    {
      title: 'Archives',
      icon: 'videocam',
      screen: 'Archive',
      description: 'Contenu premium',
    },
    {
      title: 'Films',
      icon: 'film',
      screen: 'Movies',
      description: 'Catalogue de films',
    },
    // {
    //   title: 'Replay',
    //   icon: 'play-back',
    //   screen: 'Replay',
    //   description: 'Vidéos en replay',
    // },
    {
      title: 'Programme EPG',
      icon: 'calendar',
      screen: 'ProgramList',
      description: 'Guide des programmes',
    },
  ];

  const handleNavigate = (screen) => {
    onClose();
    setTimeout(() => {
      // Navigation vers les différents stacks et écrans
      switch (screen) {
        case 'BreakingNews':
        case 'TrendingShows':
        case 'RecentVideos':
        case 'PopularPrograms':
        case 'Interviews':
        case 'Archive':
          // Ces écrans sont dans le HomeStack
          navigation.navigate('Accueil', { screen: screen });
          break;
        case 'Replay':
          // Replay est un onglet dans la tab bar
          navigation.navigate('Replay');
          break;
        case 'Movies':
          // Films - Naviguer vers MoviesStack dans HomeStack
          navigation.navigate('Accueil', { screen: 'Movies' });
          break;
        case 'ProgramList':
          // Programme EPG - Naviguer vers l'écran de grille des programmes
          navigation.navigate('Accueil', { screen: 'ProgramScreen' });
          break;
        default:
          navigation.navigate(screen);
      }
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawerContainer,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Ionicons name="menu" size={28} color={colors.primary} />
                  <Text style={styles.headerTitle}>Menu</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <ScrollView
                style={styles.menuList}
                showsVerticalScrollIndicator={false}
              >
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => handleNavigate(item.screen)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>BF1 TV © 2026</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    drawerContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 12,
    },
    closeButton: {
      padding: 4,
    },
    menuList: {
      flex: 1,
      paddingVertical: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    menuItemDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
