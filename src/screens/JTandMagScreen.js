import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { createJTandMagStyles } from '../styles/jtandMagStyles';
import jtandMagService from '../services/jtandMagService';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { formatViews } from '../utils/dateUtils';
import NotificationHeader from '../components/NotificationHeader';
import SnakeLoader from '../components/LoadingScreen';

export default function JTandMagScreen({ navigation }) {
  const { colors } = useTheme();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Note: styles est maintenant une fonction qui prend viewMode en paramètre
  const stylesFactory = createJTandMagStyles(colors);
  const styles = stylesFactory(viewMode);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    loadShows();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadShows();
    }, [])
  );

  const loadShowsSilent = async () => {
    try {
      const data = await jtandMagService.getJTandMag();
      // Trier par date de création (plus récents en premier)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.published_at || 0);
        const dateB = new Date(b.created_at || b.published_at || 0);
        return dateB - dateA; // Plus récents en premier
      });
      setShows(sortedData);
    } catch (error) {
      console.error('Error loading shows silently:', error);
    }
  };
  
  useAutoRefresh(loadShowsSilent, 10000, true);

  const loadShows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jtandMagService.getJTandMag({ limit: 50 });
      console.log('📺 Émissions chargées:', data?.length || 0);
      // Trier par date de création (plus récents en premier)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.published_at || 0);
        const dateB = new Date(b.created_at || b.published_at || 0);
        return dateB - dateA; // Plus récents en premier
      });
      setShows(sortedData);
    } catch (err) {
      console.error('Error loading trending shows:', err);
      setError(err.message || 'Erreur lors du chargement des JT et Mag');
      Alert.alert('Erreur', 'Impossible de charger les JT et Mag');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shows.length > 0 && !hasAnimated) {
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
  }, [shows.length > 0]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShows();
    setRefreshing(false);
  };

  const filteredShows = shows;

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
              color="#E23E3E" 
            />
          </TouchableOpacity>
          <NotificationHeader />
        </View>
      ),
    });
  }, [navigation, viewMode]);

  if (loading && shows.length === 0) {
    return (
      <View style={styles.container}>
        <SnakeLoader />
      </View>
    );
  }

  if (error && shows.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={'#E23E3E'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadShows}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#E23E3E'} />
        }
      >
        {filteredShows.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="trending-up-outline" size={80} color={'#B0B0B0'} />
            <Text style={styles.emptyTitle}>Aucun JT ou Mag trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Les JT et Magazines apparaîtront ici
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadShows}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={viewMode === 'grid' ? styles.grid : styles.listContainer}>
              {filteredShows.map((show, index) => (
                <TouchableOpacity 
                  key={show.id || index} 
                  style={viewMode === 'grid' ? styles.showCard : styles.showCardList}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ShowDetail', { 
                    showId: show.id || show._id, 
                    isJTandMag: true 
                  })}
                >
                  <Image 
                    source={{ uri: show.image_url || show.image }} 
                    style={viewMode === 'grid' ? styles.showImage : styles.showImageList}
                  />
                  
                  {/* Gradient pour améliorer la lisibilité en mode grille */}
                  {viewMode === 'grid' && (
                    <LinearGradient
                      colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.95)']}
                      locations={[0, 0.3, 1]}
                      style={styles.imageGradient}
                    />
                  )}
                  
                  {viewMode === 'list' ? (
                    <View style={styles.listContentContainer}>
                      <View style={styles.listHeader}>
                        <Text style={styles.showTitle} numberOfLines={1}>{show.title}</Text>
                      </View>
                      
                      <Text 
                        style={styles.showDescription} 
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {show.description || 'Aucune description disponible'}
                      </Text>
                      
                      <View style={styles.showMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="eye" size={14} color={'#E23E3E'} />
                          <Text style={styles.metaText}>{formatViews(show.views || show.view_count || show.views_count || 0)}</Text>
                        </View>
                        <View style={styles.hostItem}>
                          <Ionicons name="person" size={12} color={'#B0B0B0'} />
                          <Text style={styles.hostTextInline} numberOfLines={1}>
                            {show.host || 'Inconnu'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* <View style={styles.hostContainer}>
                        <Ionicons name="person" size={12} color={'#B0B0B0'} />
                        <Text style={styles.hostText} numberOfLines={1}>
                          Animé par {show.host || 'Inconnu'}
                        </Text>
                      </View> */}
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      style={styles.showOverlay}
                    >
                      <Text style={styles.showTitle} numberOfLines={1}>{show.title}</Text>
                      
                      <Text 
                        style={styles.showDescription} 
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {show.description || 'Aucune description disponible'}
                      </Text>
                      
                      <View style={styles.showMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="eye" size={14} color={'#E23E3E'} />
                          <Text style={styles.metaText}>{formatViews(show.views || show.view_count || show.views_count || 0)}</Text>
                        </View>
                        <View style={styles.hostItem}>
                          <Ionicons name="person" size={12} color={'#B0B0B0'} />
                          <Text style={styles.hostTextInline} numberOfLines={1}>
                            {show.host || 'Inconnu'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* <View style={styles.hostContainer}>
                        <Ionicons name="person" size={12} color={'#B0B0B0'} />
                        <Text style={styles.hostText} numberOfLines={1}>
                          Animé par {show.host || 'Inconnu'}
                        </Text>
                      </View> */}
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}