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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import divertissementService from '../services/divertissementService';
import { useFocusEffect } from '@react-navigation/native';
import viewService from '../services/viewService';
import useAutoRefresh from '../hooks/useAutoRefresh';
import usePagination from '../hooks/usePagination';
import LoadingFooter from '../components/LoadingFooter';
import { createDivertissementStyles } from '../styles/divertissementStyles';

export default function DivertissementScreen({ navigation }) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
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
    }, [])
  );

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
    return (
      <View style={baseStyles.container}>
        <View style={baseStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={baseStyles.loadingText}>Chargement du divertissement...</Text>
        </View>
      </View>
    );
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
              {interviews.map((interview, index) => (
                <TouchableOpacity 
                  key={interview.id || interview._id || index} 
                  style={viewMode === 'grid' ? baseStyles.interviewCard : baseStyles.interviewCardList}
                  activeOpacity={0.9}
                  onPress={async () => {
                    const interviewId = interview.id || interview._id;
                    if (interviewId) {
                      await viewService.incrementView(interviewId, 'interview');
                      navigation.navigate('ShowDetail', {
                        showId: interviewId,
                        isInterview: true
                      });
                    }
                  }}
                >
                  <Image 
                    source={{ uri: interview.image_url || interview.image || 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
                    style={viewMode === 'grid' ? baseStyles.interviewImage : baseStyles.interviewImageList}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.95)']}
                    style={baseStyles.interviewOverlay}
                  >
                    <View style={baseStyles.interviewBadge}>
                      <Ionicons name="mic" size={12} color="#fff" />
                      <Text style={baseStyles.interviewBadgeText}>Divertissement</Text>
                    </View>
                    <Text style={viewMode === 'grid' ? baseStyles.interviewTitle : baseStyles.interviewTitleList}>
                      {interview.title}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            
            <LoadingFooter loading={loadingMore} hasMore={hasMore} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}