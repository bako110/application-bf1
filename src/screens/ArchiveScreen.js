import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import archiveService from '../services/archiveService';
import { useAuth } from '../contexts/AuthContext';
import viewService from '../services/viewService';
import useAutoRefresh from '../hooks/useAutoRefresh';
import usePagination from '../hooks/usePagination';
import LoadingFooter from '../components/LoadingFooter';
import { useFocusEffect } from '@react-navigation/native';
import { createArchiveStyles } from '../styles/archiveStyles';
import LoadingScreen from '../components/LoadingScreen';
import PremiumModal from '../components/premiumModal';
import { formatViews } from '../utils/dateUtils';
import { canUserAccessContent } from '../utils/subscriptionUtils';

export default function ArchiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const { user, isPremium, isAuthenticated, subscriptionCategory } = useAuth();
  
  // État pour le modal premium
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [requiredCategory, setRequiredCategory] = useState(null);
  
  // Pagination
  const fetchArchives = async (skip, limit) => {
    return await archiveService.getAllArchives({ skip, limit });
  };

  const {
    data: archives,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData: setArchives,
  } = usePagination(fetchArchives, 20);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    React.useCallback(() => {
      if (archives.length === 0) {
        loadInitial();
      }
    }, [])
  );

  // Exposer la fonction de changement de mode via les params de navigation
  useEffect(() => {
    navigation.setParams({
      toggleViewMode: () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid'),
      viewMode: viewMode
    });
  }, [navigation, viewMode]);

  useEffect(() => {
    if (archives.length > 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [archives, viewMode]);

  // Fonction helper pour obtenir le badge de catégorie
  const getSubscriptionBadge = (category) => {
    if (!category) return { label: 'Gratuit', color: '#4CAF50', icon: 'checkmark-circle' };
    if (category === 'basic') return { label: 'Basic', color: '#2196F3', icon: 'shield' };
    if (category === 'standard') return { label: 'Standard', color: '#9C27B0', icon: 'shield-checkmark' };
    if (category === 'premium') return { label: 'Premium', color: '#FF6F00', icon: 'star' };
    return { label: 'Gratuit', color: '#4CAF50', icon: 'checkmark-circle' };
  };

  const handleArchivePress = async (archive) => {
    const archiveId = archive.id || archive._id;
    
    // Vérifier d'abord côté client si l'utilisateur a accès
    const userCategory = subscriptionCategory || user?.subscription_category;
    const hasClientAccess = canUserAccessContent(userCategory, archive.required_subscription_category);
    
    // Si l'utilisateur a accès selon la hiérarchie client, naviguer directement
    if (hasClientAccess) {
      navigation.navigate('ShowDetail', { 
        showId: archiveId, 
        isArchive: true 
      });
      return;
    }
    
    // Si l'utilisateur n'est pas connecté et le contenu nécessite un abonnement
    if (archive.required_subscription_category && !isAuthenticated) {
      const badge = getSubscriptionBadge(archive.required_subscription_category);
      Alert.alert(
        '🔒 Connexion Requise',
        `Cette archive nécessite un abonnement ${badge.label}.\n\nConnectez-vous pour découvrir nos offres d'abonnement.`,
        [
          { text: 'Plus tard', style: 'cancel' },
          { 
            text: 'Se connecter', 
            onPress: () => {
              navigation.getParent()?.navigate('Mon compte', {
                screen: 'Login',
                params: { returnToSubscription: true }
              });
            }
          }
        ]
      );
      return;
    }
    
    // Si connecté mais n'a pas accès, vérifier via l'API (double vérification)
    if (isAuthenticated && archive.required_subscription_category) {
      try {
        const accessInfo = await archiveService.checkArchiveAccess(archiveId);
        
        if (!accessInfo.has_access) {
          const badge = getSubscriptionBadge(archive.required_subscription_category);
          
          // Message adapté selon la situation
          let message = `Cette archive nécessite un abonnement ${badge.label}.`;
          
          if (accessInfo.user_category) {
            const userBadge = getSubscriptionBadge(accessInfo.user_category);
            message += `\n\nVotre abonnement actuel : ${userBadge.label}\nAbonnement requis : ${badge.label}`;
          }
          
          message += `\n\nAméliorez votre abonnement pour accéder à ce contenu.`;
          
          Alert.alert(
            '🔒 Abonnement Insuffisant',
            message,
            [
              { text: 'Plus tard', style: 'cancel' },
              { 
                text: 'Voir les offres', 
                onPress: () => {
                  setRequiredCategory(archive.required_subscription_category);
                  setShowPremiumModal(true);
                }
              }
            ]
          );
          return;
        }
      } catch (error) {
        console.error('Erreur vérification accès:', error);
        // En cas d'erreur, continuer vers le lecteur (comportement permissif)
      }
    }

    // Naviguer vers le lecteur vidéo
    navigation.navigate('ShowDetail', { 
      showId: archiveId, 
      isArchive: true 
    });
  };

  const renderArchive = (item, index) => {
    const styles = createArchiveStyles(colors);
    
    if (viewMode === 'grid') {
      // Mode Grille - Carte verticale
      return (
        <TouchableOpacity
          key={item.id || item._id || index}
          style={styles.archiveCard}
          onPress={() => handleArchivePress(item)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.thumbnail || item.image || 'https://via.placeholder.com/400x250/1a1a1a/666666?text=Archive' }}
            style={styles.archiveImage}
            resizeMode="cover"
            onError={(e) => {
              console.log('Erreur chargement image archive:', item.id);
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.95)']}
            style={styles.archiveOverlay}
          >
            {item.required_subscription_category && (
              <View style={[styles.archivePremiumBadge, { backgroundColor: getSubscriptionBadge(item.required_subscription_category).color }]}>
                <Ionicons name={getSubscriptionBadge(item.required_subscription_category).icon} size={10} color="#FFF" />
                <Text style={styles.archivePremiumText}>{getSubscriptionBadge(item.required_subscription_category).label}</Text>
              </View>
            )}
            <Text style={styles.archiveTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="eye-outline" size={12} color="#B0B0B0" />
              <Text style={{ color: '#B0B0B0', fontSize: 12 }}>
                {formatViews(item.views || item.view_count || item.views_count || 0)}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    } else {
      // Mode Liste - Carte horizontale
      return (
        <TouchableOpacity
          key={item.id || item._id || index}
          style={styles.archiveCardList}
          onPress={() => handleArchivePress(item)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.thumbnail || item.image || 'https://via.placeholder.com/400x250/1a1a1a/666666?text=Archive' }}
            style={styles.archiveImageList}
            resizeMode="cover"
            onError={(e) => {
              console.log('Erreur chargement image archive:', item.id);
            }}
          />
          <View style={styles.archiveContentList}>
            <View style={styles.archiveBadgesRow}>
              {item.required_subscription_category && (
                <View style={[styles.archivePremiumBadgeList, { backgroundColor: getSubscriptionBadge(item.required_subscription_category).color }]}>
                  <Ionicons name={getSubscriptionBadge(item.required_subscription_category).icon} size={12} color="#FFF" />
                  <Text style={styles.archivePremiumTextList}>{getSubscriptionBadge(item.required_subscription_category).label}</Text>
                </View>
              )}
            </View>
            <Text style={styles.archiveTitleList} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="eye-outline" size={12} color="#B0B0B0" />
              <Text style={{ color: '#B0B0B0', fontSize: 12 }}>
                {formatViews(item.views || item.view_count || item.views_count || 0)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const styles = createArchiveStyles(colors);

  // Afficher le loader pendant le chargement initial
  if (loading && archives.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {!isPremium && !user?.subscription_category && (
        <View style={styles.premiumBanner}>
          <Ionicons name="videocam" size={20} color="#FFD700" />
          <Text style={styles.premiumBannerText}>
            Abonnez-vous pour regarder toutes les vidéos d'archives
          </Text>
          <TouchableOpacity 
            style={styles.subscribeButton} 
            onPress={() => navigation.navigate('Mon compte')}
          >
            <Text style={styles.subscribeButtonText}>S'abonner</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom &&
            hasMore &&
            !loadingMore
          ) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {archives.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="archive-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune archive disponible</Text>
            <Text style={styles.emptySubtitle}>Les archives apparaîtront ici</Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {archives.map((archive, index) => renderArchive(archive, index))}
            </View>
            <LoadingFooter loading={loadingMore} hasMore={hasMore} />
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Modal Premium */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          setRequiredCategory(null);
        }}
        requiredCategory={requiredCategory}
        navigation={navigation}
      />
    </View>
  );
}