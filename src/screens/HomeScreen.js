import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  SafeAreaView,
  Platform,
  Easing,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { createHomeStyles } from '../styles/homeStyles';
import NotificationHeader from '../components/NotificationHeader';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import showService from '../services/showService';
import movieService from '../services/movieService';
import newsService from '../services/newsService';
import jtandMagService from '../services/jtandMagService';
import popularProgramService from '../services/popularProgramService';
import divertissementService from '../services/divertissementService';
import archiveService from '../services/archiveService';
import api from '../config/api';
import liveStreamService from '../services/liveStreamService';
import { formatRelativeTime } from '../utils/dateUtils';
import useAutoRefresh from '../hooks/useAutoRefresh';

// Optionnel: pour le retour haptique (installer: npm install react-native-haptic-feedback)
// import Haptic from 'react-native-haptic-feedback';

// Fonction pour formater la durée de manière professionnelle
const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  
  const minutes = parseInt(duration);
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 120) {
    return '1h ' + (minutes - 60) + ' min';
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes} min`;
  }
};

// Fonction pour trier les éléments par date (du plus récent au plus ancien)
const sortByDate = (items) => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at || a.published_at || a.aired_at || 0);
    const dateB = new Date(b.created_at || b.published_at || b.aired_at || 0);
    return dateB - dateA;
  });
};

// Fonction pour formater le temps (HH:MM:SS)
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const { width, height } = Dimensions.get('window');

// Constante pour le nombre d'éléments à afficher
const INITIAL_DISPLAY_COUNT = 10; // Afficher 10 éléments par défaut

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [liveShows, setLiveShows] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [trendingShows, setTrendingShows] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [popularPrograms, setPopularPrograms] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  // État pour le flux BF1
  const [bf1Stream, setBf1Stream] = useState(null);
  const [bf1Program, setBf1Program] = useState(null);
  const [bf1Viewers, setBf1Viewers] = useState(0);

  // État pour le mode plein écran
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoStatus, setVideoStatus] = useState({
    isPlaying: true,
    duration: 0,
    currentTime: 0,
  });

  // État pour détecter quand l'utilisateur atteint le dernier élément
  const [lastItemVisible, setLastItemVisible] = useState({
    breakingNews: false,
    trendingShows: false,
    interviews: false,
    recentVideos: false,
    archives: false,
  });

  // État pour éviter les redirections multiples
  const [redirectLock, setRedirectLock] = useState({
    breakingNews: false,
    trendingShows: false,
    interviews: false,
    recentVideos: false,
    archives: false,
  });

  // ÉTATS POUR LES ANIMATIONS SÉQUENTIELLES PROFESSIONNELLES
  const sectionAnimations = useRef({
    live: new Animated.Value(0),
    breakingNews: new Animated.Value(0),
    jtMag: new Animated.Value(0),
    divertissement: new Animated.Value(0),
    reportages: new Animated.Value(0),
    archives: new Animated.Value(0),
  }).current;

  const [itemAnimations, setItemAnimations] = useState({});
  const [contentReady, setContentReady] = useState(false);
  
  // Référence pour suivre les éléments animés
  const animatedItemsRef = useRef(new Set());

  // Référence pour la vidéo
  const videoRef = useRef(null);

  // Références pour les ScrollView horizontaux
  const scrollViewRefs = {
    breakingNews: useRef(null),
    trendingShows: useRef(null),
    interviews: useRef(null),
    recentVideos: useRef(null),
    archives: useRef(null),
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const styles = createHomeStyles(colors);

  // Rafraîchissement automatique en arrière-plan à l'arrivée sur l'écran
  useFocusEffect(
    useCallback(() => {
      loadContentSilently();
      // Réinitialiser les locks quand l'écran est focus
      setRedirectLock({
        breakingNews: false,
        trendingShows: false,
        interviews: false,
        recentVideos: false,
        archives: false,
      });
      setLastItemVisible({
        breakingNews: false,
        trendingShows: false,
        interviews: false,
        recentVideos: false,
        archives: false,
      });
    }, [])
  );

  useEffect(() => {
    if (bf1Stream?.isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(liveDotOpacity, {
            toValue: 0.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(liveDotOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [bf1Stream]);

  useEffect(() => {
    loadContent();
    startAnimations();
  }, []);

  // Animation séquentielle des sections avec effets professionnels
  const startSequentialAnimation = useCallback(() => {
    const sections = [
      { key: 'live', delay: 0 },
      { key: 'breakingNews', delay: 150 },
      { key: 'jtMag', delay: 250 },
      { key: 'divertissement', delay: 350 },
      { key: 'reportages', delay: 450 },
      { key: 'archives', delay: 550 },
    ];

    sections.forEach(section => {
      Animated.timing(sectionAnimations[section.key], {
        toValue: 1,
        duration: 600,
        delay: section.delay,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    });

    // Animation des items individuels après les sections
    setTimeout(() => {
      animateItemsSequentially();
    }, 800);
  }, [animateItemsSequentially]);

  // Animation séquentielle des items dans chaque section
  const animateItemsSequentially = useCallback(() => {
    const allItems = [];
    
    // Récupérer tous les items de chaque section (10 éléments maximum)
    if (breakingNews.length > 0) {
      breakingNews.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
        allItems.push({ section: 'breakingNews', item, index, id: item.id || item._id });
      });
    }
    
    if (trendingShows.length > 0) {
      trendingShows.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
        allItems.push({ section: 'trendingShows', item, index, id: item.id || item._id });
      });
    }
    
    if (interviews.length > 0) {
      interviews.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
        allItems.push({ section: 'interviews', item, index, id: item.id || item._id });
      });
    }
    
    if (recentVideos.length > 0) {
      recentVideos.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
        allItems.push({ section: 'recentVideos', item, index, id: item.id || item._id });
      });
    }
    
    if (archives.length > 0) {
      archives.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
        allItems.push({ section: 'archives', item, index, id: item.id || item._id });
      });
    }

    // Créer les animations pour chaque item
    const newAnimations = {};
    allItems.forEach(({ section, item, index, id }) => {
      const key = `${section}-${id || index}`;
      if (!animatedItemsRef.current.has(key)) {
        newAnimations[key] = new Animated.Value(0);
        animatedItemsRef.current.add(key);
      }
    });

    setItemAnimations(prev => ({ ...prev, ...newAnimations }));

    // Animer chaque item avec un délai progressif
    allItems.forEach(({ section, index, id }, itemIndex) => {
      const key = `${section}-${id || index}`;
      const animation = newAnimations[key] || itemAnimations[key];
      
      if (animation) {
        setTimeout(() => {
          Animated.timing(animation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }).start();
        }, 50 + (itemIndex * 30));
      }
    });
  }, [breakingNews, trendingShows, interviews, recentVideos, archives, itemAnimations]);

  // Déclencher les animations séquentielles après le chargement des données
  useEffect(() => {
    if (!loading && breakingNews.length > 0) {
      startSequentialAnimation();
    }
  }, [loading, breakingNews, startSequentialAnimation]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  };

  // Fonction de rafraîchissement silencieux (sans loader)
  const loadContentSilently = async () => {
    try {
      console.log('📺 Chargement silencieux des données...');

      const [news, trending, popular, reportages, divertissements, archivesData] = await Promise.all([
        newsService.getAllNews({ limit: 20 }).catch(err => {
          console.error('Error loading news:', err);
          return [];
        }),
        jtandMagService.getJTandMag({ limit: 20 }).catch(err => {
          console.error('Error loading JT et Mag:', err);
          return [];
        }),
        popularProgramService.getAllPrograms({ limit: 20 }).catch(err => {
          console.error('Error loading popular programs:', err);
          return [];
        }),
        api.get('/reportage', { params: { limit: 20 } }).then(response =>
          response.data.map(reportage => ({
            ...reportage,
            id: reportage._id || reportage.id,
            image_url: reportage.thumbnail || reportage.image_url,
          }))
        ).catch(err => {
          console.error('Error loading reportages:', err);
          return [];
        }),
        divertissementService.getAllDivertissements({ limit: 20 }).catch(err => {
          console.error('Error loading divertissements:', err);
          return [];
        }),
        archiveService.getAllArchives({ limit: 20 }).catch(err => {
          console.error('Error loading archives:', err);
          return [];
        }),
      ]);

      const stream = await liveStreamService.getBF1Stream();
      const program = await liveStreamService.getCurrentProgram();
      const viewers = await liveStreamService.getViewers();

      setLiveShows([]);
      
      // Trier chaque section par date avant de les stocker
      setBreakingNews(sortByDate(news));
      setTrendingShows(sortByDate(trending));
      setPopularPrograms(sortByDate(popular));
      setRecentVideos(sortByDate(reportages));
      setInterviews(sortByDate(divertissements));
      setArchives(sortByDate(archivesData));

      setBf1Stream(stream);
      setBf1Program(program);
      setBf1Viewers(viewers);

      console.log('✅ Données chargées');
    } catch (error) {
      console.error('Error loading content silently:', error);
    }
  };

  // Fonction de rafraîchissement manuel (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Réinitialiser les animations
      animatedItemsRef.current.clear();
      setItemAnimations({});
      Object.keys(sectionAnimations).forEach(key => {
        sectionAnimations[key].setValue(0);
      });
      
      // Charger les nouvelles données
      await loadContentSilently();
      
      // Redémarrer les animations
      setTimeout(() => {
        startSequentialAnimation();
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [startSequentialAnimation]);

  const loadContent = async () => {
    try {
      setLoading(true);

      const [news, trending, popular, reportages, divertissements, archivesData] = await Promise.all([
        newsService.getAllNews({ limit: 20 }).catch(err => {
          console.error('Error loading news:', err);
          return [];
        }),
        jtandMagService.getJTandMag({ limit: 20 }).catch(err => {
          console.error('Error loading JT et Mag:', err);
          return [];
        }),
        popularProgramService.getAllPrograms({ limit: 20 }).catch(err => {
          console.error('Error loading popular programs:', err);
          return [];
        }),
        api.get('/reportage', { params: { limit: 20 } }).then(response =>
          response.data.map(reportage => ({
            ...reportage,
            id: reportage._id || reportage.id,
            image_url: reportage.thumbnail || reportage.image_url,
          }))
        ).catch(err => {
          console.error('Error loading reportages:', err);
          return [];
        }),
        divertissementService.getAllDivertissements({ limit: 20 }).catch(err => {
          console.error('Error loading divertissements:', err);
          return [];
        }),
        archiveService.getAllArchives({ limit: 20 }).catch(err => {
          console.error('Error loading archives:', err);
          return [];
        }),
      ]);

      const stream = await liveStreamService.getBF1Stream();
      const program = await liveStreamService.getCurrentProgram();
      const viewers = await liveStreamService.getViewers();

      setLiveShows([]);
      
      // Trier chaque section par date
      setBreakingNews(sortByDate(news));
      setTrendingShows(sortByDate(trending));
      setPopularPrograms(sortByDate(popular));
      setRecentVideos(sortByDate(reportages));
      setInterviews(sortByDate(divertissements));
      setArchives(sortByDate(archivesData));

      setBf1Stream(stream);
      setBf1Program(program);
      setBf1Viewers(viewers);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour détecter quand l'utilisateur atteint le dernier élément (le 10ème)
  const handleScroll = (sectionName, navigationTarget, event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Calculer si on est à la fin du scroll horizontal
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 50;
    
    if (isAtEnd && !redirectLock[sectionName]) {
      console.log(`👉 Fin du scroll - Redirection vers ${navigationTarget}`);
      
      setLastItemVisible(prev => ({ ...prev, [sectionName]: true }));
      setRedirectLock(prev => ({ ...prev, [sectionName]: true }));
      
      // Optionnel: retour haptique
      // if (Platform.OS === 'ios') {
      //   Haptic.trigger('impactLight');
      // }
      
      // Rediriger après un petit délai pour une meilleure UX
      setTimeout(() => {
        navigation.navigate(navigationTarget);
      }, 100);
      
      // Déverrouiller après 2 secondes
      setTimeout(() => {
        setRedirectLock(prev => ({ ...prev, [sectionName]: false }));
        setLastItemVisible(prev => ({ ...prev, [sectionName]: false }));
      }, 2000);
    }
  };

  // Fonction pour obtenir les éléments d'une section (10 éléments maximum)
  const getSectionItems = (sectionName) => {
    switch(sectionName) {
      case 'breakingNews': return breakingNews.slice(0, INITIAL_DISPLAY_COUNT);
      case 'trendingShows': return trendingShows.slice(0, INITIAL_DISPLAY_COUNT);
      case 'interviews': return interviews.slice(0, INITIAL_DISPLAY_COUNT);
      case 'recentVideos': return recentVideos.slice(0, INITIAL_DISPLAY_COUNT);
      case 'archives': return archives.slice(0, INITIAL_DISPLAY_COUNT);
      default: return [];
    }
  };

  // Fonction pour gérer le clic sur la vidéo
  const handleVideoPress = () => {
    navigation.navigate('Direct');
  };

  // Fonction pour quitter le plein écran
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Fonctions pour le contrôle vidéo
  const handleVideoLoad = (payload) => {
    setVideoStatus(prev => ({
      ...prev,
      duration: payload.duration,
    }));
  };

  const handleVideoProgress = (payload) => {
    setVideoStatus(prev => ({
      ...prev,
      currentTime: payload.currentTime,
    }));
  };

  const handlePlayPause = () => {
    setVideoStatus(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleStop = () => {
    setVideoStatus(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Bouton moderne avec seulement une flèche
  const ModernSeeMoreButton = ({ onPress }) => {
    return (
      <TouchableOpacity 
        style={[styles.modernSeeMoreButton, { backgroundColor: `${colors.primary}10` }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.seeMoreContent}>
          <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  // Fonction pour obtenir l'animation d'un item
  const getItemAnimation = (section, item, index) => {
    const key = `${section}-${item.id || item._id || index}`;
    return itemAnimations[key] || new Animated.Value(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Rafraîchissement..."
            titleColor={colors.textSecondary}
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* Section BF1 avec animation professionnelle */}
          <Animated.View style={{
            opacity: sectionAnimations.live,
            transform: [
              { translateY: sectionAnimations.live.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })},
              { scale: sectionAnimations.live.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
              })}
            ]
          }}>
            <View style={styles.liveSection}>
              {bf1Stream ? (
                <TouchableOpacity
                  style={styles.liveCardFull}
                  onPress={handleVideoPress}
                >
                  <Video
                    source={{ uri: bf1Stream.url }}
                    style={styles.liveImageFull}
                    resizeMode="cover"
                    paused={false}
                    repeat={true}
                    controls={false}
                    muted={true}
                    playInBackground={false}
                    playWhenInactive={false}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.liveOverlayFull}
                  >
                    <View style={styles.liveTitleContainer}>
                      {bf1Stream.isLive && (
                        <Animated.View
                          style={[
                            styles.liveDot,
                            { opacity: liveDotOpacity }
                          ]}
                        />
                      )}
                      <Text style={styles.liveTitleFull}>
                        {bf1Stream.name}
                      </Text>
                    </View>
                    {bf1Viewers > 0 && (
                      <View style={styles.liveViewers}>
                        <Ionicons name="eye" size={16} color="#fff" />
                        <Text style={styles.liveViewersText}>{bf1Viewers} spectateurs</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={[styles.noLiveContainer, { backgroundColor: colors.card }]}>
                  <Ionicons name="radio-outline" size={60} color={colors.textSecondary} />
                  <Text style={[styles.noLiveText, { color: colors.text }]}>Chargement de BF1 TV...</Text>
                  <Text style={[styles.noLiveSubtext, { color: colors.textSecondary }]}>Veuillez patienter</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Modal Plein Écran */}
          <Modal
            visible={isFullscreen}
            animationType="fade"
            onRequestClose={handleExitFullscreen}
          >
            <View style={styles.fullscreenContainer}>
              <Video
                ref={videoRef}
                source={{ uri: bf1Stream?.url }}
                style={styles.fullscreenVideo}
                resizeMode="cover"
                paused={!videoStatus.isPlaying}
                repeat={true}
                controls={false}
                muted={false}
                playInBackground={false}
                playWhenInactive={false}
                onLoad={handleVideoLoad}
                onProgress={handleVideoProgress}
              />
              
              {/* Contrôles vidéo */}
              <View style={styles.videoControls}>
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(videoStatus.currentTime)}</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(videoStatus.currentTime / videoStatus.duration) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.timeText}>{formatTime(videoStatus.duration)}</Text>
                </View>
                
                <View style={styles.controlButtons}>
                  <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
                    <Ionicons name={videoStatus.isPlaying ? "pause" : "play"} size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
                    <Ionicons name="stop" size={20} color="#fff" />
                    <Text style={styles.stopButtonText}>Arrêter</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.controlButton} onPress={handleExitFullscreen}>
                    <Ionicons name="contract" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Flash Info - 10 éléments */}
          <Animated.View style={{
            opacity: sectionAnimations.breakingNews,
            transform: [
              { translateY: sectionAnimations.breakingNews.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}
            ]
          }}>
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Flash Info</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('BreakingNews')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.breakingNews}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('breakingNews', 'BreakingNews', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {breakingNews.length > 0 ? breakingNews.slice(0, INITIAL_DISPLAY_COUNT).map((news, index) => {
                    const itemAnim = getItemAnimation('breakingNews', news, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={news.id || news._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { scale: itemAnim },
                            { translateY: itemAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })}
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.newsCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('NewsDetail', { newsId: news.id || news._id })}
                        >
                          <Image source={{ uri: news.image_url || news.image || 'https://via.placeholder.com/400x250' }} style={styles.newsImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.newsOverlay}>
                            <View style={styles.newsBadge}>
                              <Ionicons name="flash" size={12} color="#fff" />
                              <Text style={styles.newsBadgeText}>{news.category || news.edition || 'Actualités'}</Text>
                            </View>
                            <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                            <Text style={styles.newsTime}>{formatRelativeTime(news.created_at || news.published_at)}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucune actualité disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
                {lastItemVisible.breakingNews && (
                  <View style={styles.endOfSectionIndicator}>
                    <Text style={styles.endOfSectionText}>Chargement de plus d'actualités...</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* JT et Mag - 10 éléments */}
          <Animated.View style={{
            opacity: sectionAnimations.jtMag,
            transform: [
              { translateY: sectionAnimations.jtMag.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}
            ]
          }}>
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>JT et Mag</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('JTandMag')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.trendingShows}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('trendingShows', 'JTandMag', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {trendingShows.length > 0 ? trendingShows.slice(0, INITIAL_DISPLAY_COUNT).map((show, index) => {
                    const itemAnim = getItemAnimation('trendingShows', show, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={show.id || show._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { scale: itemAnim },
                            { translateY: itemAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })}
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.trendingCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ShowDetail', { showId: show.id || show._id, isJTandMag: true })}
                        >
                          <Image source={{ uri: show.image_url || show.image || 'https://via.placeholder.com/300x200' }} style={styles.trendingImage} />
                          <View style={styles.trendingInfo}>
                            <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={1}>{show.title}</Text>
                            <View style={styles.trendingMeta}>
                              <Ionicons name="eye" size={14} color={colors.textSecondary} />
                              <Text style={[styles.trendingViews, { color: colors.textSecondary }]}>
                                {formatRelativeTime(show.created_at || show.published_at || show.aired_at)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucune émission tendance</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
                {lastItemVisible.trendingShows && (
                  <View style={styles.endOfSectionIndicator}>
                    <Text style={styles.endOfSectionText}>Chargement de plus d'émissions...</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* Divertissement - 10 éléments */}
          <Animated.View style={{
            opacity: sectionAnimations.divertissement,
            transform: [
              { translateY: sectionAnimations.divertissement.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}
            ]
          }}>
            <View style={[styles.section, { marginBottom: 30 }]}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Divertissement</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('Divertissement')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.interviews}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('interviews', 'Divertissement', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {interviews.length > 0 ? interviews.slice(0, INITIAL_DISPLAY_COUNT).map((interview, index) => {
                    const itemAnim = getItemAnimation('interviews', interview, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={interview.id || interview._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { scale: itemAnim },
                            { translateY: itemAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })}
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.interviewCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ShowDetail', { showId: interview.id || interview._id, isDivertissement: true })}
                        >
                          <Image source={{ uri: interview.image_url || interview.image || 'https://via.placeholder.com/300x200' }} style={styles.interviewImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.interviewOverlay}>
                            <Text style={styles.interviewTitle} numberOfLines={2}>{interview.title}</Text>
                            <Text style={styles.interviewGuest} numberOfLines={1}>
                              {formatRelativeTime(interview.created_at || interview.published_at)}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="mic-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucun divertissement disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
                {lastItemVisible.interviews && (
                  <View style={styles.endOfSectionIndicator}>
                    <Text style={styles.endOfSectionText}>Chargement de plus de divertissements...</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* Reportages - 10 éléments */}
          <Animated.View style={{
            opacity: sectionAnimations.reportages,
            transform: [
              { translateY: sectionAnimations.reportages.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}
            ]
          }}>
            <View style={styles.section}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Reportages</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('Reportages')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.recentVideos}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('recentVideos', 'Reportages', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {recentVideos.length > 0 ? recentVideos.slice(0, INITIAL_DISPLAY_COUNT).map((video, index) => {
                    const itemAnim = getItemAnimation('recentVideos', video, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={video.id || video._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { scale: itemAnim },
                            { translateY: itemAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })}
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.videoCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ShowDetail', { showId: video.id || video._id, isReportage: true })}
                        >
                          <Image source={{ uri: video.image_url || video.image || 'https://via.placeholder.com/300x200' }} style={styles.videoImage} />
                          <View style={styles.videoDuration}>
                            <Text style={styles.videoDurationText}>{formatDuration(video.duration || video.duration_minutes)}</Text>
                          </View>
                          <View style={styles.videoInfo}>
                            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{video.title}</Text>
                            <Text style={[styles.videoDate, { color: colors.textSecondary }]}>
                              {formatRelativeTime(video.aired_at || video.created_at)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="videocam-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucun reportage disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
                {lastItemVisible.recentVideos && (
                  <View style={styles.endOfSectionIndicator}>
                    <Text style={styles.endOfSectionText}>Chargement de plus de reportages...</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* Archives Vidéo Premium - 10 éléments */}
          <Animated.View style={{
            opacity: sectionAnimations.archives,
            transform: [
              { translateY: sectionAnimations.archives.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })}
            ]
          }}>
            <View style={[styles.section, { marginBottom: 30 }]}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Archives Vidéo</Text>
                  <View style={styles.premiumBadgeSmall}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={styles.premiumBadgeTextSmall}>Premium</Text>
                  </View>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('Archive')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.archives}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('archives', 'Archive', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {archives.length > 0 ? archives.slice(0, INITIAL_DISPLAY_COUNT).map((archive, index) => {
                    const itemAnim = getItemAnimation('archives', archive, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={archive.id || archive._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { scale: itemAnim },
                            { translateY: itemAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })}
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.archiveCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ArchiveDetail', { archiveId: archive.id || archive._id })}
                        >
                          <Image source={{ uri: archive.image || archive.thumbnail || 'https://via.placeholder.com/300x200' }} style={styles.archiveImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.archiveOverlay}>
                            <View style={styles.archivePremiumBadge}>
                              <Ionicons name="lock-closed" size={12} color={colors.primary} />
                              <Text style={styles.archivePremiumText}>Premium</Text>
                              {archive.price > 0 && <Text style={styles.archivePriceText}> • {Math.round(archive.price)} XOF</Text>}
                            </View>
                            <Text style={styles.archiveTitle} numberOfLines={2}>{archive.title}</Text>
                            <View style={styles.archiveMeta}>
                              <Ionicons name="videocam" size={12} color={colors.primary} />
                              <Text style={styles.archiveMetaText}>Vidéo</Text>
                              {archive.duration_minutes && (
                                <>
                                  <Text style={styles.archiveMetaSeparator}>•</Text>
                                  <Ionicons name="time" size={12} color={colors.textSecondary} />
                                  <Text style={styles.archiveMetaText}>{archive.duration_minutes} min</Text>
                                </>
                              )}
                              <Text style={styles.archiveMetaSeparator}>•</Text>
                              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                              <Text style={styles.archiveMetaText}>
                                {formatRelativeTime(archive.created_at || archive.published_at)}
                              </Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="videocam-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucune archive disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
                {lastItemVisible.archives && (
                  <View style={styles.endOfSectionIndicator}>
                    <Text style={styles.endOfSectionText}>Chargement de plus d'archives...</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}