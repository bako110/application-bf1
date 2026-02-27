import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Text,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import liveStreamService from '../services/liveStreamService';
import emissionsService from '../services/emissionsService';
import jtandMagService from '../services/jtandMagService';
import divertissementService from '../services/divertissementService';
import api from '../config/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 9 / 16; // Format 16:9

function LiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [emissions, setEmissions] = useState([]);
  const [jtandMag, setJtandMag] = useState([]);
  const [divertissement, setDivertissement] = useState([]);
  const [reportages, setReportages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // États pour suivre la fin des sections horizontales et la redirection
  const [horizontalScrollEnd, setHorizontalScrollEnd] = useState({
    emissions: false,
    jtandMag: false,
    divertissement: false,
    reportages: false,
  });
  
  const [redirectLock, setRedirectLock] = useState({
    emissions: false,
    jtandMag: false,
    divertissement: false,
    reportages: false,
  });
  
  const videoRef = useRef(null);

  useEffect(() => {
    loadStream();
    loadAllContent();
  }, []);

  // Fonction pour trier du plus récent au plus ancien
  const sortByDate = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at || a.date || a.updated_at || 0);
      const dateB = new Date(b.created_at || b.published_at || b.date || b.updated_at || 0);
      return dateB - dateA; // Plus récent d'abord
    });
  };

  const loadAllContent = async () => {
    await Promise.all([
      loadEmissions(),
      loadJTandMag(),
      loadDivertissement(),
      loadReportages(),
    ]);
  };

  // Rafraîchir le flux quand l'écran devient actif (seulement au premier chargement)
  useFocusEffect(
    React.useCallback(() => {
      // Charger seulement au premier focus
      if (isFirstLoad) {
        loadStream();
        loadAllContent();
        setIsFirstLoad(false);
      }
      
      // Jouer la vidéo quand l'écran est actif
      setIsPlaying(true);
      
      return () => {
        // Pause la vidéo quand on quitte l'écran
        setIsPlaying(false);
        // Réinitialiser les locks quand l'écran est focus
        setRedirectLock({
          emissions: false,
          jtandMag: false,
          divertissement: false,
          reportages: false,
        });
      };
    }, [isFirstLoad])
  );

  const loadStream = async () => {
    try {
      console.log('📺 [LiveScreen] Chargement du flux BF1...');
      const bf1Stream = await liveStreamService.getBF1Stream();
      console.log('📺 [LiveScreen] Flux BF1 chargé:', bf1Stream);
      console.log('📺 [LiveScreen] URL du flux:', bf1Stream?.url);
      setStream(bf1Stream);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmissions = async () => {
    try {
      const data = await emissionsService.getAllEmissions({ page: 1, per_page: 20 });
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setEmissions(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading emissions:', error);
    }
  };

  const loadJTandMag = async () => {
    try {
      const data = await jtandMagService.getJTandMag({ limit: 10 });
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setJtandMag(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading JT et Mag:', error);
    }
  };

  const loadDivertissement = async () => {
    try {
      const data = await divertissementService.getAllDivertissements({ limit: 10 });
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setDivertissement(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading divertissement:', error);
    }
  };

  const loadReportages = async () => {
    try {
      const response = await api.get('/reportage', { params: { limit: 10 } });
      const data = response.data.map(reportage => ({
        ...reportage,
        id: reportage._id || reportage.id,
        image_url: reportage.thumbnail || reportage.image_url,
      }));
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setReportages(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading reportages:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStream(), 
      loadAllContent()
    ]);
    setRefreshing(false);
  };

  // Fonction pour gérer la fin du scroll avec momentum
  const handleMomentumScrollEnd = (sectionName, navigationTarget, event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 30;
    
    if (isAtEnd && !redirectLock[sectionName]) {
      console.log(`👉 Fin du défilement - Redirection vers ${navigationTarget}`);
      
      // Verrouiller pour éviter les redirections multiples
      setRedirectLock(prev => ({ ...prev, [sectionName]: true }));
      
      // Rediriger selon la section
      if (sectionName === 'emissions') {
        navigation.getParent()?.navigate('Émissions');
      } else {
        navigation.getParent()?.navigate('Accueil', { screen: navigationTarget });
      }
      
      // Déverrouiller après 2 secondes
      setTimeout(() => {
        setRedirectLock(prev => ({ ...prev, [sectionName]: false }));
      }, 2000);
    }
  };

  // Fonction pour gérer la fin de glissement
  const handleScrollEndDrag = (sectionName, navigationTarget, event) => {
    const { contentOffset, layoutMeasurement, contentSize, velocity } = event.nativeEvent;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 30;
    
    // Si on est à la fin et qu'on a un mouvement significatif vers la gauche
    if (isAtEnd && velocity && velocity.x < -0.3 && !redirectLock[sectionName]) {
      console.log(`👉 Glissement terminé - Redirection vers ${navigationTarget}`);
      
      setRedirectLock(prev => ({ ...prev, [sectionName]: true }));
      
      // Rediriger selon la section
      if (sectionName === 'emissions') {
        navigation.getParent()?.navigate('Émissions');
      } else {
        navigation.getParent()?.navigate('Accueil', { screen: navigationTarget });
      }
      
      setTimeout(() => {
        setRedirectLock(prev => ({ ...prev, [sectionName]: false }));
      }, 2000);
    }
  };

  // Fonction pour gérer le défilement horizontal et détecter la fin
  const handleHorizontalScroll = (sectionName, event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 20;
    
    setHorizontalScrollEnd(prev => ({
      ...prev,
      [sectionName]: isAtEnd
    }));
  };

  // Fonction pour réinitialiser le lock quand on quitte la fin
  const handleScrollBeginDrag = (sectionName, event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 30;
    
    if (!isAtEnd && redirectLock[sectionName]) {
      setRedirectLock(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const handleVideoLoad = (data) => {
    setVideoDuration(data.duration);
  };

  const handleVideoProgress = (data) => {
    setVideoProgress(data.currentTime);
  };

  const handleFullscreen = () => {
    navigation.navigate('LiveShowFullScreen', {
      stream: stream,
      url: stream?.url
    });
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    // Auto-hide après 3 secondes
    if (!showControls) {
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de BF1 TV...</Text>
      </View>
    );
  }

  if (!stream || !stream.url) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Aucun flux disponible</Text>
        <Text style={styles.errorText}>URL: {stream?.url || 'Non définie'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vidéo Live fixe en haut */}
      <View style={styles.videoContainer}>
        <TouchableOpacity 
          style={styles.videoWrapper} 
          activeOpacity={1}
          onPress={toggleControls}
        >
          <Video
            ref={videoRef}
            source={{ uri: stream.url }}
            style={styles.video}
            resizeMode="contain"
            paused={!isPlaying}
            repeat={true}
            controls={false}
            muted={false}
            playInBackground={false}
            playWhenInactive={false}
            onLoad={handleVideoLoad}
            onProgress={handleVideoProgress}
            onError={(error) => {
              console.error(' [LiveScreen] Erreur vidéo:', error);
              console.error(' [LiveScreen] URL problématique:', stream.url);
            }}
          />
          
          {/* Contrôles personnalisés */}
          {showControls && (
            <View style={styles.customControls}>
              <View style={styles.controlsBottom}>
                {/* Barre de progression (lecture seule pour live) */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${videoDuration > 0 ? (videoProgress / videoDuration) * 100 : 0}%`,
                          backgroundColor: colors.primary 
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                {/* Bouton plein écran */}
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={handleFullscreen}
                >
                  <Ionicons name="expand" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.contentScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Section Émissions */}
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Émissions disponibles</Text>
          <TouchableOpacity 
            onPress={() => {
              // Naviguer vers le tab Émissions
              navigation.getParent()?.navigate('Émissions');
            }}
            style={styles.seeAllButton}
          >
            <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {emissions.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emissionsScroll}
            onScroll={(event) => handleHorizontalScroll('emissions', event)}
            onScrollBeginDrag={(event) => handleScrollBeginDrag('emissions', event)}
            onScrollEndDrag={(event) => handleScrollEndDrag('emissions', 'Émissions', event)}
            onMomentumScrollEnd={(event) => handleMomentumScrollEnd('emissions', 'Émissions', event)}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {emissions.map((emission) => (
              <TouchableOpacity
                key={emission.id}
                style={styles.emissionCard}
                onPress={() => navigation.navigate('EmissionDetail', { emissionId: emission.id })}
              >
                <Image
                  source={{ uri: emission.thumbnail || emission.image || 'https://via.placeholder.com/300x400' }}
                  style={styles.emissionImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.emissionOverlay}
                >
                  <Text style={styles.emissionTitle} numberOfLines={2}>
                    {emission.title}
                  </Text>
                  {emission.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#FFF" />
                      <Text style={styles.durationText}>{emission.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
                {emission.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEmissionsText}>Aucune émission disponible</Text>
        )}
      </View>

      {/* Section JT et Mag */}
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>JT et Mag</Text>
          <TouchableOpacity 
            onPress={() => {
              // Naviguer vers le tab Accueil puis vers JTandMag
              navigation.getParent()?.navigate('Accueil', { screen: 'JTandMag' });
            }}
            style={styles.seeAllButton}
          >
            <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {jtandMag.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emissionsScroll}
            onScroll={(event) => handleHorizontalScroll('jtandMag', event)}
            onScrollBeginDrag={(event) => handleScrollBeginDrag('jtandMag', event)}
            onScrollEndDrag={(event) => handleScrollEndDrag('jtandMag', 'JTandMag', event)}
            onMomentumScrollEnd={(event) => handleMomentumScrollEnd('jtandMag', 'JTandMag', event)}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {jtandMag.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.emissionCard}
                onPress={() => navigation.navigate('ShowDetail', { 
                  showId: item.id,
                  isJTandMag: true 
                })}
              >
                <Image
                  source={{ uri: item.thumbnail || item.image || 'https://via.placeholder.com/300x400' }}
                  style={styles.emissionImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.emissionOverlay}
                >
                  <Text style={styles.emissionTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#FFF" />
                      <Text style={styles.durationText}>{item.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEmissionsText}>Aucun contenu disponible</Text>
        )}
      </View>

      {/* Section Divertissement */}
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Divertissement</Text>
          <TouchableOpacity 
            onPress={() => {
              // Naviguer vers le tab Accueil puis vers Divertissement
              navigation.getParent()?.navigate('Accueil', { screen: 'Divertissement' });
            }}
            style={styles.seeAllButton}
          >
            <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {divertissement.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emissionsScroll}
            onScroll={(event) => handleHorizontalScroll('divertissement', event)}
            onScrollBeginDrag={(event) => handleScrollBeginDrag('divertissement', event)}
            onScrollEndDrag={(event) => handleScrollEndDrag('divertissement', 'Divertissement', event)}
            onMomentumScrollEnd={(event) => handleMomentumScrollEnd('divertissement', 'Divertissement', event)}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {divertissement.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.emissionCard}
                onPress={() => navigation.navigate('ShowDetail', { 
                  showId: item.id,
                  isDivertissement: true 
                })}
              >
                <Image
                  source={{ uri: item.thumbnail || item.image || 'https://via.placeholder.com/300x400' }}
                  style={styles.emissionImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.emissionOverlay}
                >
                  <Text style={styles.emissionTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#FFF" />
                      <Text style={styles.durationText}>{item.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEmissionsText}>Aucun contenu disponible</Text>
        )}
      </View>

      {/* Section Reportages */}
      <View style={styles.lastSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reportages</Text>
          <TouchableOpacity 
            onPress={() => {
              // Naviguer vers le tab Accueil puis vers Reportages
              navigation.getParent()?.navigate('Accueil', { screen: 'Reportages' });
            }}
            style={styles.seeAllButton}
          >
            <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {reportages.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emissionsScroll}
            onScroll={(event) => handleHorizontalScroll('reportages', event)}
            onScrollBeginDrag={(event) => handleScrollBeginDrag('reportages', event)}
            onScrollEndDrag={(event) => handleScrollEndDrag('reportages', 'Reportages', event)}
            onMomentumScrollEnd={(event) => handleMomentumScrollEnd('reportages', 'Reportages', event)}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {reportages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.emissionCard}
                onPress={() => navigation.navigate('ShowDetail', { 
                  showId: item.id,
                  isReportage: true 
                })}
              >
                <Image
                  source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300x400' }}
                  style={styles.emissionImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.emissionOverlay}
                >
                  <Text style={styles.emissionTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#FFF" />
                      <Text style={styles.durationText}>{item.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEmissionsText}>Aucun contenu disponible</Text>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  videoContainer: {
    width: width,
    height: VIDEO_HEIGHT, // Format 16:9
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  customControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  fullscreenButton: {
    padding: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streamName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  fullscreenText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
  },
  infoTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  infoSubtitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  contentSection: {
    padding: 16,
    paddingBottom: 8,
  },
  lastSection: {
    padding: 16,
    paddingBottom: 100,
  },
  emissionsSection: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllButton: {
    padding: 4,
  },
  emissionsScroll: {
    paddingRight: 16,
  },
  emissionCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emissionImage: {
    width: '100%',
    height: 220,
  },
  emissionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  emissionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 11,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  noEmissionsText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});


export default LiveScreen;