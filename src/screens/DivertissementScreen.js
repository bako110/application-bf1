import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { createDivertissementStyles } from '../styles/divertissementStyles';
import divertissementService from '../services/divertissementService';
import useAutoRefresh from '../hooks/useAutoRefresh';
import NotificationHeader from '../components/NotificationHeader';
import LoadingScreen from '../components/LoadingScreen';
import LoadingFooter from '../components/LoadingFooter';
import viewService from '../services/viewService';
import usePagination from '../hooks/usePagination';
import likeService from '../services/likeService';
import authService from '../services/authService';
import { formatViews } from '../utils/dateUtils';

export default function DivertissementScreen({ navigation }) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [likedDivertissements, setLikedDivertissements] = useState(new Set());
  const [likesData, setLikesData] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Styles conditionnels selon le mode
  // CORRECTION: Passer viewMode comme paramètre à createDivertissementStyles
  const baseStyles = createDivertissementStyles(colors, viewMode);
  
  // Supprimer dynamicStyles car maintenant géré dans le fichier de styles
  // const getDynamicStyles = () => ({ ... });
  // const dynamicStyles = getDynamicStyles();

  // Pagination
  const fetchDivertissements = async (skip, limit) => {
    return await divertissementService.getAllDivertissements({ skip, limit });
  };

  const {
    data: interviews,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData: setInterviews,
  } = usePagination(fetchDivertissements, 20);

  useFocusEffect(
    React.useCallback(() => {
      if (interviews.length === 0) {
        loadInitial();
      }
      loadMyLikedDivertissements();
    }, [])
  );

  // Charger les divertissements likés par l'utilisateur
  const loadMyLikedDivertissements = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        console.log('⚠️ Utilisateur non connecté, likes non chargés');
        return;
      }

      const likedData = await divertissementService.getMyLikedDivertissements();
      console.log('📥 Likes divertissement reçus du serveur:', likedData);
      
      const likedIds = new Set(likedData.map(like => like.content_id));
      setLikedDivertissements(likedIds);
      
      // Créer le mapping pour likesData
      const likesMap = {};
      interviews.forEach(item => {
        const itemId = item.id || item._id;
        likesMap[itemId] = {
          liked: likedIds.has(itemId),
          count: item.likes || 0
        };
      });
      
      setLikesData(likesMap);
      console.log('✅ Divertissements likés chargés:', likedIds.size, 'IDs:', Array.from(likedIds));
    } catch (error) {
      console.error('❌ Erreur chargement likes:', error);
    }
  };

  // Toggle like/unlike
  const toggleLike = async (itemId) => {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour liker un divertissement. Voulez-vous vous connecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Mon compte') }
        ]
      );
      return;
    }

    try {
      const wasLikedBefore = likedDivertissements.has(itemId);
      const currentLikeData = likesData[itemId] || { liked: false, count: 0 };

      // Optimistic update
      if (wasLikedBefore) {
        // Unlike
        setLikedDivertissements(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        setLikesData(prev => ({
          ...prev,
          [itemId]: {
            liked: false,
            count: Math.max(0, currentLikeData.count - 1)
          }
        }));
      } else {
        // Like
        setLikedDivertissements(prev => new Set([...prev, itemId]));
        setLikesData(prev => ({
          ...prev,
          [itemId]: {
            liked: true,
            count: currentLikeData.count + 1
          }
        }));
      }

      await likeService.toggleLike(itemId, 'divertissement');
      console.log(`✅ Like toggled pour divertissement ${itemId}`);
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
      // Rollback en rechargeant les likes
      await loadMyLikedDivertissements();
    }
  };

  // Configuration du header avec bouton de changement de vue
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [viewMode, navigation]);

  // Rafraîchissement automatique en arrière-plan
  const loadDivertissementsSilently = async () => {
    try {
      const data = await divertissementService.getAllDivertissements({ limit: interviews.length || 20 });
      setInterviews(data);
    } catch (error) {
      console.error('Error loading divertissements silently:', error);
    }
  };
  
  useAutoRefresh(loadDivertissementsSilently, 10000, true);

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (interviews.length > 0 && !hasAnimated) {
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
      setHasAnimated(true);
    }
  }, [interviews.length, hasAnimated]);

  if (loading && interviews.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={baseStyles.container}>
      <ScrollView
        style={baseStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          // CORRECTION: Supprimer la parenthèse en trop à la ligne 134
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
        {interviews.length === 0 ? (
          <Animated.View style={[baseStyles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="mic-outline" size={80} color={colors.textSecondary} />
            <Text style={baseStyles.emptyTitle}>Aucun divertissement disponible</Text>
            <Text style={baseStyles.emptySubtitle}>Les divertissements apparaîtront ici</Text>
            <TouchableOpacity style={baseStyles.refreshButton} onPress={refresh}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={baseStyles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={viewMode === 'grid' ? baseStyles.gridContainer : baseStyles.listContainer}>
              {interviews.map((interview, index) => {
                const itemId = interview.id || interview._id;
                const isLiked = likedDivertissements.has(itemId);
                const likeData = likesData[itemId] || { liked: false, count: 0 };
                
                return (
                  <TouchableOpacity 
                    key={itemId || index} 
                    style={viewMode === 'grid' ? baseStyles.interviewCard : baseStyles.interviewCardList}
                    activeOpacity={0.9}
                    onPress={async () => {
                      if (itemId) {
                        await viewService.incrementView(itemId, 'interview');
                        navigation.navigate('ShowDetail', {
                          showId: itemId,
                          isDivertissement: true
                        });
                      }
                    }}
                  >
                    <Image 
                      source={{ uri: interview.image_url || interview.image || 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
                      style={viewMode === 'grid' ? baseStyles.interviewImage : baseStyles.interviewImageList}
                    />
                    
                    {/* Bouton like - Au-dessus du gradient pour être cliquable */}
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: 20,
                        padding: 8,
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        zIndex: 10,
                        elevation: 5,
                      }}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(itemId);
                      }}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={isLiked ? '#E23E3E' : '#fff'}
                      />
                      {likeData.count > 0 && (
                        <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13, fontWeight: '700' }}>
                          {likeData.count}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.95)']}
                      style={baseStyles.interviewOverlay}
                    >
                      {/* Badge "Divertissement" masqué
                      <View style={baseStyles.interviewBadge}>
                        <Ionicons name="mic" size={12} color="#fff" />
                        <Text style={baseStyles.interviewBadgeText}>Divertissement</Text>
                      </View>
                      */}
                      <Text style={viewMode === 'grid' ? baseStyles.interviewTitle : baseStyles.interviewTitleList}>
                        {interview.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="eye-outline" size={12} color="#B0B0B0" />
                        <Text style={{ color: '#B0B0B0', fontSize: 12 }}>
                          {formatViews(interview.views || interview.view_count || interview.views_count || 0)}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <LoadingFooter loading={loadingMore} hasMore={hasMore} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}