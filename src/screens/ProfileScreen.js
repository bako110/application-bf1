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
import likeService from '../services/likeService';
import commentService from '../services/commentService';
import subscriptionService from '../services/subscriptionService';
import Logo from '../components/logo';
import { useFocusEffect } from '@react-navigation/native';
import { createProfileStyles } from '../styles/profileStyles'; // Import des styles séparés
import PremiumModal from '../components/premiumModal';

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [stats, setStats] = useState({
    comments: 0,
    likes: 0
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const isRefreshing = useRef(false);
  
  const { colors } = useTheme();

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

  // Fonction de chargement des données memoized pour éviter les re-créations
  const loadUserData = React.useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadSubscription(),
      ]);
      // Charger les stats après
      setTimeout(loadUserStats, 100);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loadSubscription, loadUserStats]);

  // Rafraîchir les données quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      // Éviter les appels multiples avec un ref
      if (!user || isRefreshing.current) return;

      const refreshProfileSilently = async () => {
        isRefreshing.current = true;
        try {
          console.log('🔄 Rafraîchissement automatique du profil...');
          // Rafraîchir les données utilisateur en arrière-plan
          await refreshUser();
          // Charger les données de profil
          await loadUserData();
        } catch (error) {
          console.error('⚠️ Erreur rafraîchissement auto:', error);
          // En cas d'erreur, charger quand même les données locales
          await loadUserData();
        } finally {
          // Reset après un délai pour éviter les appels trop fréquents
          setTimeout(() => {
            isRefreshing.current = false;
          }, 2000);
        }
      };
      
      refreshProfileSilently();
    }, [user])
  );

  const loadUserStats = React.useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ Pas d\'utilisateur connecté');
      return;
    }

    try {
      console.log('🔍 Début chargement stats utilisateur...');
      
      // Charger le nombre total de likes donnés par l'utilisateur
      console.log('❤️ Chargement du nombre de likes de l\'utilisateur...');
      const totalLikes = await likeService.countMyLikes();
      console.log(`✅ Likes de l'utilisateur: ${totalLikes}`);

      // Charger le nombre total de commentaires postés par l'utilisateur
      console.log('💬 Chargement du nombre de commentaires de l\'utilisateur...');
      const totalComments = await commentService.countUserComments(user.id);
      console.log(`✅ Commentaires de l'utilisateur: ${totalComments}`);
      
      console.log(`📈 Stats finales: ${totalLikes} likes, ${totalComments} commentaires`);
      
      setStats({
        comments: totalComments,
        likes: totalLikes
      });
    } catch (error) {
      console.error('❌ Erreur chargement stats utilisateur:', error);
    }
  }, [user?.id]);

  // Fonction pour obtenir le badge de catégorie
  const getCategoryBadge = (category) => {
    if (!category) {
      return {
        label: 'Gratuit',
        color: '#4CAF50',
        icon: 'gift-outline'
      };
    }

    const categories = {
      basic: {
        label: 'Basic',
        color: '#2196F3',
        icon: 'star-outline'
      },
      standard: {
        label: 'Standard',
        color: '#9C27B0',
        icon: 'star-half-outline'
      },
      premium: {
        label: 'Premium',
        color: '#FF6F00',
        icon: 'star'
      }
    };

    return categories[category] || categories.basic;
  };

  const loadSubscription = React.useCallback(async () => {
    setLoadingSubscription(true);
    try {
      console.log('📋 Chargement de l\'abonnement...');
      const subData = await subscriptionService.getMySubscription();
      console.log('✅ Abonnements chargés:', subData);
      
      // L'API retourne une liste d'abonnements
      if (Array.isArray(subData) && subData.length > 0) {
        const activeSub = subData.find(sub => sub.is_active);
        setSubscription(activeSub || subData[0]);
      } else if (subData && !Array.isArray(subData)) {
        setSubscription(subData);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement abonnement:', error);
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  // Cette fonction est maintenant définie plus haut avec useCallback

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
              Connectez-vous pour commenter, recevoir des notifications et profiter d'une expérience personnalisée
            </Text>
            
            <View style={styles.benefitsContainer}>
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
    <View style={{ flex: 1 }}>
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
      </LinearGradient>

      {/* Subscription Info */}
      {user.is_premium && (
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="card" size={20} color={colors.primary} />
            <Text style={styles.subscriptionTitle}>Mon Abonnement</Text>
          </View>
          
          {loadingSubscription ? (
            <View style={styles.subscriptionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.subscriptionLoadingText}>Chargement...</Text>
            </View>
          ) : subscription ? (
            <View style={styles.subscriptionCard}>
              {/* Badge de catégorie */}
              {subscription.category && (
                <View style={[styles.categoryBadgeContainer, { backgroundColor: getCategoryBadge(subscription.category).color + '15' }]}>
                  <Ionicons 
                    name={getCategoryBadge(subscription.category).icon} 
                    size={20} 
                    color={getCategoryBadge(subscription.category).color} 
                  />
                  <Text style={[styles.categoryBadgeText, { color: getCategoryBadge(subscription.category).color }]}>
                    {getCategoryBadge(subscription.category).label}
                  </Text>
                </View>
              )}
              
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Plan</Text>
                <Text style={styles.subscriptionValue}>
                  {subscription.offer === 'monthly' ? 'Mensuel (1 mois)' : 
                   subscription.offer === 'quarterly' ? 'Trimestriel (3 mois)' : 
                   subscription.offer === 'yearly' ? 'Annuel (1 an)' : 
                   subscription.offer || 'Premium'}
                </Text>
              </View>
              
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Date de début</Text>
                <Text style={styles.subscriptionValue}>
                  {new Date(subscription.start_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Date de fin</Text>
                <Text style={styles.subscriptionValue}>
                  {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Illimité'}
                </Text>
              </View>
              
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Prix payé</Text>
                <Text style={styles.subscriptionValue}>
                  {subscription.final_price ? `${subscription.final_price.toLocaleString()} XOF` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.subscriptionRow}>
                <Text style={styles.subscriptionLabel}>Statut</Text>
                <View style={styles.subscriptionStatus}>
                  <Ionicons 
                    name={subscription.is_active ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={subscription.is_active ? "#4CAF50" : colors.error} 
                  />
                  <Text style={[
                    styles.subscriptionStatusText,
                    { color: subscription.is_active ? "#4CAF50" : colors.error }
                  ]}>
                    {subscription.is_active ? 'Actif' : 'Expiré'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noSubscription}>
              <Text style={styles.noSubscriptionText}>
                Aucun abonnement trouvé
              </Text>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => setShowPremiumModal(true)}
              >
                <Text style={styles.subscribeButtonText}>S'abonner</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {/* Plan Upgrade Section for Non-Premium Users */}
      {!user.is_premium && (
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={styles.subscriptionTitle}>Découvrez nos Plans</Text>
          </View>
          
          <View style={styles.freePlanCard}>
            <View style={[styles.categoryBadgeContainer, { backgroundColor: '#4CAF50' + '15' }]}>
              <Ionicons name="gift-outline" size={20} color="#4CAF50" />
              <Text style={[styles.categoryBadgeText, { color: '#4CAF50' }]}>Gratuit</Text>
            </View>
            
            <Text style={styles.freePlanText}>
              Vous utilisez actuellement notre offre gratuite.
            </Text>
            
            <View style={styles.planBenefitsList}>
              <View style={styles.planBenefit}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
                <Text style={styles.planBenefitText}>Contenu gratuit illimité</Text>
              </View>
              <View style={styles.planBenefit}>
                <Ionicons name="close" size={16} color={colors.error} />
                <Text style={[styles.planBenefitText, { opacity: 0.6 }]}>Accès au contenu premium</Text>
              </View>
              <View style={styles.planBenefit}>
                <Ionicons name="close" size={16} color={colors.error} />
                <Text style={[styles.planBenefitText, { opacity: 0.6 }]}>Qualité HD/4K</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setShowPremiumModal(true)}
            >
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

    <PremiumModal
      visible={showPremiumModal}
      onClose={() => setShowPremiumModal(false)}
      navigation={navigation}
    />
    </View>
  );
}