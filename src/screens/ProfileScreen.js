import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import likeService from '../services/likeService';
import commentService from '../services/commentService';
import Logo from '../components/logo';
import { useFocusEffect } from '@react-navigation/native';
import { createProfileStyles } from '../styles/profileStyles'; // Import des styles séparés

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState({
    comments: 0,
    likes: 0
  });
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
      loadUserData();
    }
  }, [user]);

  // Rafraîchir les données quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadUserData();
      }
    }, [user])
  );

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getMyFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      console.log('🔍 Début chargement stats user...');
      console.log('📋 Favoris disponibles:', favorites.length);
      console.log('📋 Contenu des favoris:', JSON.stringify(favorites.slice(0, 2), null, 2));
      
      let totalLikes = 0;
      let totalComments = 0;

      // Charger les vraies statistiques pour chaque favori
      for (const fav of favorites) {
        try {
          console.log(`🔍 Traitement favori:`, fav);
          
          const contentId = fav.content_id || fav.id || fav._id;
          const contentType = fav.content_type || 'replay'; // Default à replay si non spécifié
          
          console.log(`📍 ID: ${contentId}, Type: ${contentType}`);
          
          // Récupérer le nombre de likes via API
          console.log(`❤️ Chargement likes pour ${contentType} ${contentId}...`);
          const likesCount = await likeService.countLikes(contentId, contentType);
          console.log(`❤️ Likes récupérés: ${likesCount}`);
          totalLikes += likesCount;

          // Récupérer le nombre de commentaires via API
          console.log(`💬 Chargement commentaires pour ${contentType} ${contentId}...`);
          const commentsCount = await commentService.countComments(contentId, contentType);
          console.log(`💬 Commentaires récupérés: ${commentsCount}`);
          totalComments += commentsCount;

          console.log(`📊 Stats pour ${contentType} ${contentId}: ${likesCount} likes, ${commentsCount} comments`);
        } catch (error) {
          console.error(`❌ Erreur stats pour favori ${fav.id}:`, error);
        }
      }
      
      console.log(`📈 Total stats finaux: ${totalLikes} likes, ${totalComments} comments`);
      
      setStats({
        comments: totalComments,
        likes: totalLikes
      });
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFavorites(),
      ]);
      // Charger les stats après les favoris
      setTimeout(loadUserStats, 100);
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const styles = createProfileStyles(colors);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradient?.end || colors.surface, colors.surface, colors.gradient?.end || colors.surface]}
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
        colors={[colors.gradient?.end || colors.surface, colors.surface, colors.gradient?.end || colors.surface]}
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
          <Text style={styles.statValue}>{stats.comments}</Text>
          <Text style={styles.statLabel}>Commentaires</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.likes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {/* Favorites */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes 5 Derniers Favoris</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
            <Text style={styles.seeAllText}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        {favorites.length > 0 ? (
          <View style={styles.favoritesList}>
            {favorites.slice(-5).reverse().map((fav) => (
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
        <Text style={styles.footerText}>BF1 TV © 2026</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}