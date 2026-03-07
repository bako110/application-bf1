import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
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
import sportService from '../services/sportService';
import jtandMagService from '../services/jtandMagService';
import divertissementService from '../services/divertissementService';
import reportageService from '../services/reportageService';
import api from '../config/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';
import LoadingScreen from '../components/LoadingScreen';
import SnakeLoader from '../components/LoadingScreen';
import ContentActions from '../components/contentActions';
import websocketService from '../services/websocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.75; // Augmenté à 75% de la largeur pour plus d'espace 

function LiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [sports, setSports] = useState([]);
  const [jtandMag, setJtandMag] = useState([]);
  const [divertissement, setDivertissement] = useState([]);
  const [reportages, setReportages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSections, setLoadingSections] = useState({
    sports: true,
    jtandMag: true,
    divertissement: true,
    reportages: true,
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [liveStreamRefreshKey, setLiveStreamRefreshKey] = useState(0);
  const [dynamicViewers, setDynamicViewers] = useState(0);
  const [isConnectedToLive, setIsConnectedToLive] = useState(false);
  
  // États pour suivre la fin des sections horizontales et la redirection
  const [horizontalScrollEnd, setHorizontalScrollEnd] = useState({
    sports: false,
    jtandMag: false,
    divertissement: false,
    reportages: false,
  });
  
  const [redirectLock, setRedirectLock] = useState({
    sports: false,
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
      loadSports(),
      loadJTandMag(),
      loadDivertissement(),
      loadReportages(),
    ]);
  };

  // Rafraîchir le flux quand l'écran devient actif + WebSocket tracking
  useFocusEffect(
    React.useCallback(() => {
      // Connexion WebSocket et tracking du livestream
      const connectAndJoinLive = async () => {
        try {
          // Obtenir l'ID utilisateur si disponible
          const userData = await AsyncStorage.getItem('user');
          const userId = userData ? JSON.parse(userData).id : null;
          
          // Tracking silencieux
          
          // Se connecter au WebSocket si pas déjà connecté
          if (!websocketService.getConnectionStatus().isConnected) {
            await websocketService.connect();
          }
          
          // Rejoindre le livestream (tracker l'utilisateur)
          websocketService.joinLivestream(userId);
          setIsConnectedToLive(true);
          
        } catch (error) {
          console.error('❌ Erreur connexion WebSocket:', error);
          // Ce n'est pas critique, continuer sans WebSocket
        }
      };
      
      // Charger seulement au premier focus
      if (isFirstLoad) {
        loadStream();
        loadAllContent();
        setIsFirstLoad(false);
      }
      
      // Démarrer le tracking WebSocket
      connectAndJoinLive();
      
      // Jouer la vidéo quand l'écran est actif
      setIsPlaying(true);
      
      return () => {
        // Quitter le livestream tracking quand on sort de l'écran
        if (isConnectedToLive) {
          // Déconnexion silencieuse
          websocketService.leaveLivestream();
          setIsConnectedToLive(false);
        }
        
        // Pause la vidéo quand on quitte l'écran
        setIsPlaying(false);
        // Réinitialiser les locks quand l'écran est focus
        setRedirectLock({
          sports: false,
          jtandMag: false,
          divertissement: false,
          reportages: false,
        });
      };
    }, [isFirstLoad, isConnectedToLive])
  );

  // L'orientation reste verrouillée en portrait
  // La rotation sera permise uniquement dans LiveShowFullScreen

  // Mise à jour en temps réel des likes/commentaires du livestream
  useEffect(() => {
    if (!stream || !stream.id) return;
    
    // Fonction de polling pour mettre à jour les compteurs
    const pollLiveStreamData = () => {
      // Incrémenter la clé pour forcer le rechargement des données
      setLiveStreamRefreshKey(prev => prev + 1);
    };
    
    // Démarrer le polling toutes les 5 secondes
    const pollInterval = setInterval(pollLiveStreamData, 5000);
    
    // Cleanup: arrêter le polling quand le composant se démonte
    return () => {
      clearInterval(pollInterval);
    };
  }, [stream?.id]);

  // Mise à jour dynamique du nombre de spectateurs RÉELS
  useEffect(() => {
    if (!stream) return;
    
    // Fonction pour récupérer le nombre de spectateurs RÉELS
    const updateViewers = async () => {
      try {
        const viewersData = await liveStreamService.getViewersFromAPI();
        const realViewers = viewersData.viewers || viewersData;
        setDynamicViewers(realViewers);
        // Mise à jour silencieuse
      } catch (error) {
        // Erreur silencieuse - connexion en arrière-plan
      }
    };
    
    // Première mise à jour immédiate
    updateViewers();
    
    // Puis mise à jour toutes les 10 secondes
    const viewersInterval = setInterval(updateViewers, 10000);
    
    // ========================================
    // NOUVEAU: Écouter les mises à jour WebSocket en temps réel
    // ========================================
    const handleViewerUpdate = (data) => {
      if (data.type === 'viewer_joined' || data.type === 'viewer_left') {
        // Mise à jour silencieuse en temps réel
        setDynamicViewers(data.total_viewers);
      }
    };
    
    // S'inscrire aux messages WebSocket
    const unsubscribe = websocketService.on('message', handleViewerUpdate);
    
    // Cleanup
    return () => {
      clearInterval(viewersInterval);
      unsubscribe(); // Se désinscrire des messages WebSocket
    };
  }, [stream?.id]);

  const loadStream = async () => {
    try {
      console.log('📺 [LiveScreen] Chargement du flux BF1...');
      const bf1Stream = await liveStreamService.getStreamStatusFromAPI();
      console.log('📺 [LiveScreen] Flux BF1 chargé:', bf1Stream);
      console.log('📺 [LiveScreen] URL du flux:', bf1Stream?.url);
      setStream(bf1Stream);
      setDynamicViewers(bf1Stream?.viewers || 0);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSports = async () => {
    try {
      setLoadingSections(prev => ({ ...prev, sports: true }));
      const data = await sportService.getAllSports();
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setSports(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading sports:', error);
    } finally {
      setLoadingSections(prev => ({ ...prev, sports: false }));
    }
  };

  const loadJTandMag = async () => {
    try {
      setLoadingSections(prev => ({ ...prev, jtandMag: true }));
      const data = await jtandMagService.getJTandMag({ limit: 10 });
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setJtandMag(sortedData);
    } catch (error) {
      console.error(' [LiveScreen] Error loading JT et Mag:', error);
    } finally {
      setLoadingSections(prev => ({ ...prev, jtandMag: false }));
    }
  };

  const loadDivertissement = async () => {
    try {
      setLoadingSections(prev => ({ ...prev, divertissement: true }));
      const data = await divertissementService.getAllDivertissements({ limit: 10 });
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setDivertissement(sortedData);
    } catch (error) {
      console.error(' [LiveScreen] Error loading divertissement:', error);
    } finally {
      setLoadingSections(prev => ({ ...prev, divertissement: false }));
    }
  };

  const loadReportages = async () => {
    try {
      setLoadingSections(prev => ({ ...prev, reportages: true }));
      const data = await reportageService.getAllReportages();
      // Trier par date du plus récent au plus ancien
      const sortedData = sortByDate(data || []);
      setReportages(sortedData);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading reportages:', error);
    } finally {
      setLoadingSections(prev => ({ ...prev, reportages: false }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStream(), 
      loadAllContent()
    ]);
    
    // Aussi mettre à jour les spectateurs
    try {
      const viewers = await liveStreamService.getViewersFromAPI();
      setDynamicViewers(viewers);
    } catch (error) {
      console.error('❌ Erreur refresh spectateurs:', error);
    }
    
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
      if (sectionName === 'sports') {
        navigation.getParent()?.navigate('Accueil', { screen: 'Sport' });
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
    return <LoadingScreen />;
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
                  <Ionicons name="expand" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions: Like, Commentaire, Favori */}
      <View style={styles.actionsContainer}>
        <View style={styles.liveInfo}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
          <View style={styles.viewerContainer}>
            <Ionicons name="eye" size={12} color={colors.textSecondary} />
            <Text style={styles.viewerText}>{dynamicViewers || stream.viewers || 0} spectateurs</Text>
          </View>
        </View>
        
        <ContentActions
          key={`livestream-${liveStreamRefreshKey}`}
          contentId={stream.id || 'bf1'}
          contentType="livestream"
          navigation={navigation}
          allowComments={true}
        />
        
        <View style={styles.separator} />
      </View>

      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.contentScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Section Sports */}
      <View style={styles.contentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sports</Text>
          <TouchableOpacity 
            onPress={() => {
              // Naviguer vers l'écran Sport dans HomeStack
              navigation.getParent()?.navigate('Accueil', { screen: 'Sport' });
            }}
            style={styles.seeAllButton}
          >
            <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingSections.sports ? (
          <View style={styles.sectionLoading}>
            <SnakeLoader />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : sports.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emissionsScroll}
            onScroll={(event) => handleHorizontalScroll('sports', event)}
            onScrollBeginDrag={(event) => handleScrollBeginDrag('sports', event)}
            onScrollEndDrag={(event) => handleScrollEndDrag('sports', 'Sport', event)}
            onMomentumScrollEnd={(event) => handleMomentumScrollEnd('sports', 'Sport', event)}
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={styles.emissionCard}
                onPress={() => navigation.navigate('ShowDetail', { 
                  showId: sport.id,
                  isSport: true
                })}
              >
                <Image
                  source={{ uri: sport.thumbnail || sport.image || 'https://via.placeholder.com/300x400' }}
                  style={styles.emissionImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.emissionOverlay}
                >
                  <Text style={styles.emissionTitle} numberOfLines={2}>
                    {sport.title}
                  </Text>
                  {sport.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color="#FFF" />
                      <Text style={styles.durationText}>{sport.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
                {sport.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noEmissionsText}>Aucun sport disponible</Text>
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
            <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingSections.jtandMag ? (
          <View style={styles.sectionLoading}>
            <SnakeLoader />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : jtandMag.length > 0 ? (
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
            <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingSections.divertissement ? (
          <View style={styles.sectionLoading}>
            <SnakeLoader />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : divertissement.length > 0 ? (
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
            <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingSections.reportages ? (
          <View style={styles.sectionLoading}>
            <SnakeLoader />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : reportages.length > 0 ? (
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
  sectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  videoContainer: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 20, // Padding top ajouté
  },
  videoWrapper: {
    width: '100%', // Toute la largeur
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%', // Toute la largeur disponible
    height: '100%',
  },
  customControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  controlsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  fullscreenButton: {
    padding: 4,
  },
  actionsContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    gap: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border || 'rgba(255,255,255,0.1)',
    marginTop: 4,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 3,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
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
    gap: 4,
  },
  viewerText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  contentSection: {
    padding: 12,
    paddingBottom: 6,
  },
  lastSection: {
    padding: 12,
    paddingBottom: 80,
  },
  emissionsSection: {
    padding: 12,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllButton: {
    padding: 2,
  },
  emissionsScroll: {
    paddingRight: 12,
  },
  emissionCard: {
    width: 80,
    marginRight: 6,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emissionImage: {
    width: '100%',
    height: 100,
  },
  emissionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
  },
  emissionTitle: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  durationText: {
    color: '#FFF',
    fontSize: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 2,
  },
  noEmissionsText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
  },
});


export default LiveScreen;