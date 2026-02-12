import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import favoriteService from '../services/favoriteService';
import Logo from '../components/logo';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Changer le titre du header selon l'état de connexion
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: user ? 'Profil' : '',
      headerShown: user ? true : false,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
    });
  }, [navigation, user, colors]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  // Rafraîchir les favoris quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user])
  );

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getMyFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
            navigation.navigate('Accueil');
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradient.end, colors.surface, colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loginPrompt}
        >
          <Animated.View style={[styles.loginContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Logo size="large" showText={true} />
            <Text style={styles.loginTitle}>Bienvenue sur BF1 TV</Text>
            <Text style={styles.loginSubtitle}>
              Connectez-vous pour accéder à vos favoris, commentaires et profiter d'une expérience personnalisée
            </Text>
            
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="heart" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Gérez vos favoris</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Commentez les contenus</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="notifications" size={24} color={colors.primary} />
                <Text style={styles.benefitText}>Recevez des notifications</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={() => navigation.navigate('Accueil')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonText}>Continuer en tant qu'invité</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient
        colors={[colors.gradient.end, colors.surface, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={colors.text} />
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        {/* Bouton pour rafraîchir le profil si les données sont incorrectes */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={async () => {
            try {
              await refreshUser();
              Alert.alert('Succès', 'Profil mis à jour avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rafraîchir le profil');
            }
          }}
        >
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={styles.refreshButtonText}>Rafraîchir le profil</Text>
        </TouchableOpacity>
        {user.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Commentaires</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {/* Favorites */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Favoris</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
            <Text style={styles.seeAllText}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        {favorites.length > 0 ? (
          <View style={styles.favoritesList}>
            {favorites.slice(0, 5).map((fav) => (
              <TouchableOpacity 
                key={fav.id} 
                style={styles.favoriteItem}
                onPress={() => navigation.navigate('Favorites')}
              >
                <Ionicons 
                  name={fav.content_type === 'movie' ? 'film' : 'tv'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.favoriteItemTitle} numberOfLines={1}>
                  {fav.content_title}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyFavorites}>
            <Ionicons name="heart-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyFavoritesText}>
              Aucun favori pour le moment
            </Text>
            <Text style={styles.emptyFavoritesSubtext}>
              Ajoutez des films et émissions en cliquant sur ⭐
            </Text>
          </View>
        )}
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
          <Text style={styles.menuText}>Paramètres</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Support')}
        >
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          <Text style={styles.menuText}>Aide & Support</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('About')}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          <Text style={styles.menuText}>À propos</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]} 
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          )}
          <Text style={[styles.menuText, styles.logoutText]}>
            {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BF1 TV © 2024</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginContent: {
    width: '100%',
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    lineHeight: 22,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitText: {
    color: colors.text,
    fontSize: 15,
    marginLeft: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  guestButton: {
    marginTop: 8,
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
    registerLink: {
      marginTop: 12,
      alignItems: 'center',
    },
    registerText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    forgotLink: {
      marginTop: 8,
      alignItems: 'center',
    },
    forgotText: {
      color: colors.text,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  premiumText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyFavorites: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyFavoritesText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '600',
  },
  emptyFavoritesSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  favoritesList: {
    gap: 8,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  favoriteItemTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 16,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    backgroundColor: '#DC143C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  refreshButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
