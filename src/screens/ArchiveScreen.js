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
import { createArchiveStyles } from '../styles/archiveStyles'; // Import des styles séparés

export default function ArchiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState('list');
  const { user, isPremium, isAuthenticated } = useAuth();
  
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

  const handleArchivePress = async (archive) => {
    const archiveId = archive.id || archive._id;
    
    // Vérifier si c'est une vidéo premium
    if (archive.is_premium && !isPremium) {
      // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
      if (!isAuthenticated) {
        Alert.alert(
          ' Connexion Requise',
          'Vous devez être connecté pour accéder aux archives premium.\n\nConnectez-vous pour découvrir nos offres d\'abonnement.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => {
                // Naviguer vers l'écran de connexion dans le stack Profil
                navigation.getParent()?.navigate('Profil', {
                  screen: 'Login',
                  params: { returnToSubscription: true }
                });
              }
            }
          ]
        );
        return;
      }
      
      // Si connecté mais pas premium, afficher le modal de souscription
      const priceText = archive.price > 0 
        ? `Prix: ${Math.round(archive.price)} XOF` 
        : 'Abonnement premium requis';
      
      Alert.alert(
        ' Vidéo Premium',
        `Cette vidéo d'archive est réservée aux abonnés premium.\n\n${priceText}\n\nDécouvrez nos offres d'abonnement pour accéder à toutes les archives vidéo.`,
        [
          { text: 'Plus tard', style: 'cancel' },
          { 
            text: 'Voir les offres', 
            onPress: () => {
              // Naviguer vers l'onglet Profil pour voir les offres premium
              navigation.getParent()?.navigate('Profil');
            }
          }
        ]
      );
      return;
    }

    // Naviguer vers le lecteur vidéo
    navigation.navigate('ShowDetail', { 
      showId: archive.id, 
      isArchive: true 
    });
  };

  const renderArchive = (item, index) => {
    const styles = createArchiveStyles(colors);
    
    if (viewMode === 'grid') {
      // Mode Grille - Carte verticale
      return (
        <TouchableOpacity
          key={item.id || index}
          style={styles.archiveCard}
          onPress={() => handleArchivePress(item)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.image || item.thumbnail || 'https://via.placeholder.com/400x250' }}
            style={styles.archiveImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.95)']}
            style={styles.archiveOverlay}
          >
            {item.is_premium && (
              <View style={styles.archivePremiumBadge}>
                <Ionicons name="lock-closed" size={10} color="#FFD700" />
                <Text style={styles.archivePremiumText}>Premium</Text>
              </View>
            )}
            {item.is_premium && item.price > 0 && (
              <View style={styles.archivePriceBadge}>
                <Text style={styles.archivePriceText}>{Math.round(item.price)} XOF</Text>
              </View>
            )}
            <Text style={styles.archiveTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    } else {
      // Mode Liste - Carte horizontale
      return (
        <TouchableOpacity
          key={item.id || index}
          style={styles.archiveCardList}
          onPress={() => handleArchivePress(item)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.image || item.thumbnail || 'https://via.placeholder.com/400x250' }}
            style={styles.archiveImageList}
          />
          <View style={styles.archiveContentList}>
            <View style={styles.archiveBadgesRow}>
              {item.is_premium && (
                <View style={styles.archivePremiumBadgeList}>
                  <Ionicons name="lock-closed" size={12} color="#FFD700" />
                  <Text style={styles.archivePremiumTextList}>Premium</Text>
                </View>
              )}
              {item.is_premium && item.price > 0 && (
                <View style={styles.archivePriceBadgeList}>
                  <Text style={styles.archivePriceTextList}>{Math.round(item.price)} XOF</Text>
                </View>
              )}
            </View>
            <Text style={styles.archiveTitleList} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const styles = createArchiveStyles(colors);

  if (loading && archives.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des archives...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête avec titre et bouton de changement de vue */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="archive-outline" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Archives Vidéo</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          <Ionicons 
            name={viewMode === 'grid' ? 'list' : 'grid'} 
            size={22} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {!isPremium && (
        <View style={styles.premiumBanner}>
          <Ionicons name="videocam" size={20} color="#FFD700" />
          <Text style={styles.premiumBannerText}>
            Abonnez-vous pour regarder toutes les vidéos d'archives
          </Text>
          <TouchableOpacity 
            style={styles.subscribeButton} 
            onPress={() => navigation.navigate('Profile')}
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
    </View>
  );
}