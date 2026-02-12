import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import popularProgramService from '../services/popularProgramService';
import ExpandableText from '../components/ExpandableText';
import useAutoRefresh from '../hooks/useAutoRefresh';
import trendingShowService from '../services/trendingShowService';

const { width } = Dimensions.get('window');

export default function TrendingShowsScreen({ navigation }) {
  const { colors } = useTheme();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'grid' ou 'list'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadShows();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadShows();
    }, [])
  );

  // Rafraîchissement automatique en arrière-plan toutes les 10 secondes
  const loadShowsSilently = async () => {
    try {
      const data = await trendingShowService.getTrendingShows();
      setShows(data);
    } catch (error) {
      console.error('Error loading shows silently:', error);
    }
  };
  
  useAutoRefresh(loadShowsSilently, 10000, true);

  const [hasAnimated, setHasAnimated] = useState(false);

  const loadShows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trendingShowService.getTrendingShows({ limit: 50 });
      setShows(data);
    } catch (err) {
      console.error('Error loading trending shows:', err);
      setError(err.message || 'Erreur lors du chargement des émissions tendance');
      Alert.alert('Erreur', 'Impossible de charger les émissions tendance');
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

  // Exposer toggleViewMode et viewMode via les params de navigation
  useEffect(() => {
    navigation.setParams({
      toggleViewMode: () => setViewMode(viewMode === 'grid' ? 'list' : 'grid'),
      viewMode: viewMode
    });
  }, [navigation, viewMode]);

  const styles = createStyles(colors);

  if (loading && shows.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={'#DC143C'} />
          <Text style={styles.loadingText}>Chargement des émissions tendance...</Text>
        </View>
      </View>
    );
  }

  if (error && shows.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={'#DC143C'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadShows}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayShows = shows;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#DC143C'} />
        }
      >
        {displayShows.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="trending-up-outline" size={80} color={'#B0B0B0'} />
            <Text style={styles.emptyTitle}>Aucune émission tendance</Text>
            <Text style={styles.emptySubtitle}>Les émissions populaires apparaîtront ici</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadShows}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={viewMode === 'grid' ? styles.grid : styles.listContainer}>
              {displayShows.map((show, index) => (
              <TouchableOpacity 
                key={show.id || index} 
                style={viewMode === 'grid' ? styles.showCard : styles.showCardList}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ShowDetail', { showId: show.id || show._id, isTrending: true })}
              >
                <Image 
                  source={{ uri: show.image_url || show.image }} 
                  style={viewMode === 'grid' ? styles.showImage : styles.showImageList}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.showOverlay}
                >
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{show.category || 'Général'}</Text>
                  </View>
                  <Text style={styles.showTitle} numberOfLines={1}>{show.title}</Text>
                  <ExpandableText
                    text={show.description}
                    numberOfLines={2}
                    style={styles.showDescription}
                    expandedStyle={styles.showDescription}
                  />
                  <View style={styles.showMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="eye" size={14} color={'#DC143C'} />
                      <Text style={styles.metaText}>{show.views}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.metaText}>{show.rating}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="list" size={14} color={'#B0B0B0'} />
                      <Text style={styles.metaText}>{show.episodes}</Text>
                    </View>
                  </View>
                  <View style={styles.hostContainer}>
                    <Ionicons name="person" size={12} color={'#B0B0B0'} />
                    <Text style={styles.hostText}>Animé par {show.host}</Text>
                  </View>
                </LinearGradient>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  listContainer: {
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  showCard: {
    width: (width - 40) / 2,
    height: 260,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
  },
  showCardList: {
    width: '100%',
    height: 140,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
  },
  showImage: {
    width: '100%',
    height: '100%',
  },
  showImageList: {
    width: 120,
    height: '100%',
  },
  showOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  categoryBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  showTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  showDescription: {
    color: '#B0B0B0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  showMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#B0B0B0',
    fontSize: 11,
    fontWeight: '600',
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostText: {
    color: '#B0B0B0',
    fontSize: 10,
  },
  bottomPadding: {
    height: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
