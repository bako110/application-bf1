import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  SafeAreaView,
  useWindowDimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { createSportStyles } from '../styles/sportStyles';
import sportService from '../services/sportService';
import authService from '../services/authService';
import NotificationHeader from '../components/NotificationHeader';
import LoadingScreen from '../components/LoadingScreen';
import { SportsStyles } from '../styles/sportsStyles';
import { useAuth } from '../contexts/AuthContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import likeService from '../services/likeService';
import { formatViews } from '../utils/dateUtils';

// Mapping des types de sport avec icônes seulement (les couleurs suivent le thème)
const SPORT_ICONS = {
  football: 'football',
  basket: 'basketball',
  basketball: 'basketball',
  tennis: 'tennisball',
  handball: 'handball',
  rugby: 'american-football',
  volleyball: 'volleyball',
  default: 'fitness'
};

export default function SportScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [likesData, setLikesData] = useState({});
  const [likedSports, setLikedSports] = useState(new Set()); // Set des IDs likés
  const [viewMode, setViewMode] = useState('grid');
  const [selectedSportType, setSelectedSportType] = useState('all');
  const [sportTypes, setSportTypes] = useState([]);
  const [authError, setAuthError] = useState(false);

  // Styles comme les autres écrans
  const styles = SportsStyles(colors, viewMode);

  const { width } = useWindowDimensions();
  const numColumns = width > 1200 ? 5 : width > 900 ? 4 : width > 600 ? 3 : 2;

  // Animations d'entrée professionnelles
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const [hasAnimated, setHasAnimated] = useState(false);

  // Hook d'auto-refresh
  useAutoRefresh(() => loadSportsSilent(), 30000, true);

  useEffect(() => {
    loadSports();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSports();
    }, [])
  );

  const extractSportTypes = (data) => {
    const types = ['all', ...new Set(data.map(item => item.sport_type).filter(Boolean))];
    setSportTypes(types);
  };

  const loadSports = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);
      
      const data = await sportService.getAllSports();

      // Trier par date (plus récent en premier)
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return dateB - dateA;
      });

      setSports(sortedData);
      extractSportTypes(sortedData);

      // Charger les données de likes
      await loadLikesData(sortedData);

      // Animation d'entrée professionnelle
      if (!hasAnimated) {
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
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(headerFadeAnim, {
            toValue: 1,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setHasAnimated(true));
      }

    } catch (error) {
      console.error('Erreur chargement sports:', error);
      
      // Vérifier si c'est une erreur d'authentification
      if (error.message?.includes('token') || error.response?.status === 401) {
        setAuthError(true);
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des sports');
      }
      
      setSports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSportsSilent = async () => {
    try {
      const data = await sportService.getAllSports();
      const sortedData = (data || []).sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return dateB - dateA;
      });

      setSports(sortedData);
      extractSportTypes(sortedData);
      await loadLikesData(sortedData);
    } catch (error) {
      console.error('Erreur chargement silencieux sports:', error);
    }
  };

  const loadLikesData = async (sportsList) => {
    if (!isAuthenticated) {
      console.log('⚠️ Utilisateur non connecté, likes non chargés');
      return;
    }
    
    try {
      // Charger tous les likes de l'utilisateur en une seule requête
      const likedSportsData = await sportService.getMyLikedSports();
      console.log('📥 Likes sports reçus du serveur:', likedSportsData);
      
      // Créer un Set des IDs likés
      const likedIds = new Set(likedSportsData.map(like => like.content_id));
      setLikedSports(likedIds);
      
      // Créer le mapping pour likesData (compatibilité avec le code existant)
      const likesMap = {};
      sportsList.forEach(sport => {
        const sportId = sport.id || sport._id;
        likesMap[sportId] = {
          liked: likedIds.has(sportId),
          count: sport.likes || 0
        };
      });
      
      setLikesData(likesMap);
      console.log('✅ Sports likés chargés:', likedIds.size, 'IDs:', Array.from(likedIds));
    } catch (error) {
      console.error('Erreur chargement likes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSportsSilent();
    setRefreshing(false);
  };

  const toggleLike = async (sportId) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter pour aimer ce contenu',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      const wasLikedBefore = likedSports.has(sportId);
      const currentLikeData = likesData[sportId] || { liked: false, count: 0 };

      // Optimistic update - Mettre à jour le Set et likesData
      if (wasLikedBefore) {
        // Unlike
        setLikedSports(prev => {
          const newSet = new Set(prev);
          newSet.delete(sportId);
          return newSet;
        });
        setLikesData(prev => ({
          ...prev,
          [sportId]: {
            liked: false,
            count: Math.max(0, currentLikeData.count - 1)
          }
        }));
      } else {
        // Like
        setLikedSports(prev => new Set([...prev, sportId]));
        setLikesData(prev => ({
          ...prev,
          [sportId]: {
            liked: true,
            count: currentLikeData.count + 1
          }
        }));
      }

      await likeService.toggleLike(sportId, 'sport');
      console.log(`✅ Like toggled pour sport ${sportId}`);
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
      // Rollback en rechargeant les likes
      await loadLikesData(sports);
    }
  };

  const filteredSports = selectedSportType === 'all' 
    ? sports 
    : sports.filter(sport => sport.sport_type === selectedSportType);

  const getSportIcon = (sportType) => {
    const type = sportType?.toLowerCase() || 'default';
    return SPORT_ICONS[type] || SPORT_ICONS.default;
  };

  const renderItem = ({ item, index }) => {
    const sportId = item.id || item._id;
    const likeData = likesData[sportId] || { liked: false, count: 0 };
    const isLiked = likedSports.has(sportId); // Utiliser le Set pour vérifier le like
    const sportIcon = getSportIcon(item.sport_type);

    return (
      <View style={{ width: `${100 / numColumns - 2}%` }}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.card, { marginBottom: 12 }]}
          onPress={() =>
            navigation.navigate('ShowDetail', {
              showId: sportId,
              isSport: true
            })
          }
        >
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Sport' }} 
            style={styles.image} 
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)', '#000']}
            locations={[0, 0.6, 1]}
            style={styles.gradient}
          />

          {/* Badge Sport Type avec icône - utilise la couleur primaire du thème */}
          <View style={[styles.sportTypeBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name={sportIcon} size={12} color="#fff" />
            <Text style={styles.sportTypeText}>
              {item.sport_type?.toUpperCase() || 'SPORT'}
            </Text>
          </View>

          {/* Bouton like */}
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => toggleLike(sportId)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#E23E3E' : '#fff'}
            />
            {likeData.count > 0 && (
              <Text style={styles.likeCount}>{likeData.count}</Text>
            )}
          </TouchableOpacity>

          {item.isNew && (
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.newBadgeText}>NOUVEAU</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={styles.metaContainer}>
              {item.match_date && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {new Date(item.match_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </Text>
                </View>
              )}
              
              {item.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  {formatViews(item.views || item.view_count || item.views_count || 0)}
                </Text>
              </View>
              
              {item.teams && item.teams.length > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.teams.length} équipes</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSportTypeFilter = () => {
    if (sportTypes.length <= 1) return null;

    return (
      <Animated.View style={[styles.filterContainer, { opacity: headerFadeAnim }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {sportTypes.map((type) => {
            const isSelected = selectedSportType === type;
            const sportIcon = getSportIcon(type);
            
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  isSelected && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary 
                  }
                ]}
                onPress={() => setSelectedSportType(type)}
              >
                {type !== 'all' && (
                  <Ionicons 
                    name={sportIcon} 
                    size={14} 
                    color={isSelected ? '#fff' : colors.textSecondary} 
                  />
                )}
                <Text style={[
                  styles.filterChipText,
                  { color: isSelected ? '#fff' : colors.textSecondary }
                ]}>
                  {type === 'all' ? 'Tous' : type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };

  const handleRetry = () => {
    if (authError) {
      navigation.navigate('Login');
    } else {
      loadSports();
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons 
          name={authError ? "log-in-outline" : "alert-circle-outline"} 
          size={60} 
          color={authError ? colors.warning || '#F59E0B' : colors.error || '#EF4444'} 
        />
        <Text style={[styles.loading, { color: authError ? colors.warning || '#F59E0B' : colors.error || '#EF4444', marginTop: 16 }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: authError ? colors.warning || '#F59E0B' : colors.primary }]}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>
            {authError ? 'Se connecter' : 'Réessayer'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ],
        flex: 1
      }}>

        {/* Filtres par type de sport */}
        {renderSportTypeFilter()}

        <FlatList
          data={filteredSports}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id || item._id)?.toString()}
          numColumns={viewMode === 'grid' ? numColumns : 1}
          key={viewMode === 'grid' ? numColumns : 'list'}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: 12, paddingBottom: 20 }
          ]}
          columnWrapperStyle={
            viewMode === 'grid' 
              ? { justifyContent: 'space-between' } 
              : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="football-outline" size={80} color={colors.textSecondary} />
              <Text style={[styles.empty, { color: colors.text }]}>Aucun sport disponible</Text>
              <Text style={[styles.empty, { fontSize: 14, marginTop: 8, color: colors.textSecondary }]}>
                Les sports apparaîtront ici une fois ajoutés
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
}