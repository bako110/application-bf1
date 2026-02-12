import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

  // Rafraîchissement automatique en arrière-plan toutes les 10 secondes
  const loadArchivesSilently = async () => {
    try {
      const data = await archiveService.getAllArchives({ limit: archives.length || 20 });
      setArchives(data);
    } catch (error) {
      console.error('Error loading archives silently:', error);
    }
  };
  
  useAutoRefresh(loadArchivesSilently, 10000, true);

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
    // Incrémenter les vues
    const archiveId = archive.id || archive._id;
    await viewService.incrementView(archiveId, 'archive');
    
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
            <View style={styles.archiveMeta}>
              <Ionicons name="person" size={12} color={'#DC143C'} />
              <Text style={styles.metaText} numberOfLines={1}>{item.guest_name}</Text>
              {item.duration_minutes && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Ionicons name="time" size={12} color={'#B0B0B0'} />
                  <Text style={styles.metaText}>{item.duration_minutes} min</Text>
                </>
              )}
              {item.views !== undefined && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Ionicons name="eye" size={12} color={'#B0B0B0'} />
                  <Text style={styles.metaText}>{item.views}</Text>
                </>
              )}
            </View>
          </LinearGradient>
          {item.is_premium && !isPremium && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={40} color="#FFD700" />
            </View>
          )}
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
                <View style={styles.archivePremiumBadge}>
                  <Ionicons name="lock-closed" size={32} color="#FFD700" />
                  <Text style={styles.archivePremiumText}>Premium</Text>
                </View>
              )}
              {item.is_premium && item.price > 0 && (
                <View style={styles.archivePriceBadge}>
                  <Text style={styles.archivePriceText}>{Math.round(item.price)} XOF</Text>
                </View>
              )}
            </View>
            <Text style={styles.archiveTitleList} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.archiveMetaList}>
              <Ionicons name="person" size={12} color={'#DC143C'} />
              <Text style={styles.metaTextList} numberOfLines={1}>{item.guest_name}</Text>
            </View>
            <View style={styles.archiveStatsRow}>
              {item.duration_minutes && (
                <View style={styles.archiveStat}>
                  <Ionicons name="time" size={12} color={'#B0B0B0'} />
                  <Text style={styles.metaTextList}>{item.duration_minutes} min</Text>
                </View>
              )}
              {item.views !== undefined && (
                <View style={styles.archiveStat}>
                  <Ionicons name="eye" size={12} color={'#B0B0B0'} />
                  <Text style={styles.metaTextList}>{item.views} vues</Text>
                </View>
              )}
            </View>
          </View>
          {item.is_premium && !isPremium && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={32} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      );
    }
  };

  const styles = createStyles(colors);

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
            <Text style={styles.subscribeButtonText}>S'abonner Premium</Text>
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 35,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  viewToggle: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  listContainer: {
    paddingVertical: 16,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  premiumBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subscribeButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  archiveCard: {
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  archiveCardList: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    height: 140,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  archiveImage: {
    width: '100%',
    height: 200,
  },
  archiveImageList: {
    width: 120,
    height: '100%',
  },
  archiveContentList: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  archiveBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  archiveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  archivePremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  archivePremiumText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  archivePriceBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  archivePriceText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  archiveTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  archiveTitleList: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  archiveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archiveMetaList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  archiveDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archiveStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  archiveStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  metaTextList: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  metaSeparator: {
    color: colors.textSecondary,
    fontSize: 12,
    marginHorizontal: 4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
