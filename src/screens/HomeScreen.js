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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { createHomeStyles } from '../styles/homeStyles';
import LoadingScreen from '../components/LoadingScreen';
import newsService from '../services/newsService';
import jtandMagService from '../services/jtandMagService';
import divertissementService from '../services/divertissementService';
import sportService from '../services/sportService';
import reportageService from '../services/reportageService'
import archiveService from '../services/archiveService';
import liveStreamService from '../services/liveStreamService';
import { formatRelativeTime } from '../utils/dateUtils';

// Fonction pour formater la durée
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

// Fonction pour trier les éléments par date
const sortByDate = (items) => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at || a.published_at || a.aired_at || 0);
    const dateB = new Date(b.created_at || b.published_at || b.aired_at || 0);
    return dateB - dateA;
  });
};

// Fonction pour formater le temps
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
const INITIAL_DISPLAY_COUNT = 10;

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  // États pour les différentes sections
  const [flashInfo, setFlashInfo] = useState([]);
  const [jtMag, setJtMag] = useState([]);
  const [divertissements, setDivertissements] = useState([]);
  const [sports, setSports] = useState([]);
  const [reportages, setReportages] = useState([]);
  const [archives, setArchives] = useState([]);
  
  // États pour le live BF1
  const [bf1Stream, setBf1Stream] = useState(null);
  const [bf1Program, setBf1Program] = useState(null);
  const [bf1Viewers, setBf1Viewers] = useState(0);
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoStatus, setVideoStatus] = useState({
    isPlaying: true,
    duration: 0,
    currentTime: 0,
  });
  
  // État pour les redirections
  const [redirectLock, setRedirectLock] = useState({
    flashInfo: false,
    jtMag: false,
    divertissements: false,
    sports: false,
    reportages: false,
    archives: false,
  });

  // Animations
  const liveDotOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Animation de scroll vertical pour effets parallax
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animations des sections avec effets 3D
  const sectionAnimations = useRef({
    live: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
    },
    flashInfo: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(2),
    },
    jtMag: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(-2),
    },
    divertissements: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(2),
    },
    sports: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(-2),
    },
    reportages: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(2),
    },
    archives: {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
      scale: new Animated.Value(0.85),
      rotate: new Animated.Value(-2),
    },
  }).current;

  const [itemAnimations, setItemAnimations] = useState({});
  const animatedItemsRef = useRef(new Set());
  const videoRef = useRef(null);

  // Références pour les ScrollView
  const scrollViewRefs = {
    flashInfo: useRef(null),
    jtMag: useRef(null),
    divertissements: useRef(null),
    sports: useRef(null),
    reportages: useRef(null),
    archives: useRef(null),
  };

  const styles = createHomeStyles(colors);

  // Animation du point live
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

  // Animation séquentielle des sections avec effets modernes
  const startSequentialAnimation = useCallback(() => {
    const sections = [
      { key: 'live', delay: 0 },
      { key: 'flashInfo', delay: 100 },
      { key: 'jtMag', delay: 180 },
      { key: 'divertissements', delay: 260 },
      { key: 'sports', delay: 340 },
      { key: 'reportages', delay: 420 },
      { key: 'archives', delay: 500 },
    ];

    sections.forEach(section => {
      const anims = sectionAnimations[section.key];
      
      // Animation parallèle avec spring et timing pour un effet plus dynamique
      Animated.parallel([
        // Opacity fade in
        Animated.timing(anims.opacity, {
          toValue: 1,
          duration: 700,
          delay: section.delay,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design easing
        }),
        // TranslateY avec spring pour bounce naturel
        Animated.spring(anims.translateY, {
          toValue: 0,
          delay: section.delay,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
          velocity: 2,
        }),
        // Scale avec effet bounce
        Animated.spring(anims.scale, {
          toValue: 1,
          delay: section.delay + 50,
          useNativeDriver: true,
          tension: 40,
          friction: 6,
        }),
        // Rotation subtile pour effet 3D
        ...(anims.rotate ? [
          Animated.timing(anims.rotate, {
            toValue: 0,
            duration: 800,
            delay: section.delay + 100,
            useNativeDriver: true,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Easing avec overshoot
          })
        ] : []),
      ]).start();
    });

    // Animation des items après les sections avec délai optimisé
    setTimeout(() => {
      animateItemsSequentially();
    }, 600);
  }, []);

  // Animation des items individuels avec effets en cascade améliorés
  const animateItemsSequentially = useCallback(() => {
    const allItems = [];
    
    const sections = [
      { name: 'flashInfo', data: flashInfo },
      { name: 'jtMag', data: jtMag },
      { name: 'divertissements', data: divertissements },
      { name: 'sports', data: sports },
      { name: 'reportages', data: reportages },
      { name: 'archives', data: archives },
    ];

    sections.forEach(section => {
      if (section.data.length > 0) {
        section.data.slice(0, INITIAL_DISPLAY_COUNT).forEach((item, index) => {
          allItems.push({ 
            section: section.name, 
            item, 
            index, 
            id: item.id || item._id 
          });
        });
      }
    });

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

    // Animer chaque item avec effet cascade wave
    allItems.forEach(({ section, index, id }, itemIndex) => {
      const key = `${section}-${id || index}`;
      const animation = newAnimations[key] || itemAnimations[key];
      
      if (animation) {
        setTimeout(() => {
          Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
            velocity: 1.5,
          }).start();
        }, itemIndex * 40); // Délai plus court pour cascade plus fluide
      }
    });
  }, [flashInfo, jtMag, divertissements, sports, reportages, archives, itemAnimations]);

  // Chargement initial
  useEffect(() => {
    loadContent();
    startAnimations();
  }, []);

  // Déclencher les animations après chargement
  useEffect(() => {
    if (!loading && flashInfo.length > 0) {
      startSequentialAnimation();
    }
  }, [loading, flashInfo, startSequentialAnimation]);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      loadContentSilently();
      setRedirectLock({
        flashInfo: false,
        jtMag: false,
        divertissements: false,
        sports: false,
        reportages: false,
        archives: false,
      });
    }, [])
  );

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

  // Chargement silencieux
  const loadContentSilently = async () => {
    try {
      console.log('📺 Chargement silencieux des données...');

      const [news, jtMagData, divertissementsData, sportsData, reportagesData, archivesData] = await Promise.all([
        newsService.getAllNews({ limit: 20 }).catch(() => []),
        jtandMagService.getJTandMag({ limit: 20 }).catch(() => []),
        divertissementService.getAllDivertissements({ limit: 20 }).catch(() => []),
        sportService.getAllSports({ limit: 20 }).catch(() => []),
        reportageService.getAllReportages({ limit: 20 }).catch(() => []),
        archiveService.getAllArchives({ limit: 20 }).catch(() => []),
      ]);

      const stream = await liveStreamService.getBF1Stream().catch(() => null);
      const program = await liveStreamService.getCurrentProgram().catch(() => null);
      const viewers = await liveStreamService.getViewers().catch(() => 0);

      // Trier chaque section par date
      setFlashInfo(sortByDate(news));
      setJtMag(sortByDate(jtMagData));
      setDivertissements(sortByDate(divertissementsData));
      setSports(sortByDate(sportsData));
      setReportages(sortByDate(reportagesData));
      setArchives(sortByDate(archivesData));

      setBf1Stream(stream);
      setBf1Program(program);
      setBf1Viewers(viewers);

      console.log('✅ Données chargées');
    } catch (error) {
      console.error('Error loading content silently:', error);
    }
  };

  // Rafraîchissement manuel
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Réinitialiser les animations
      animatedItemsRef.current.clear();
      setItemAnimations({});
      Object.keys(sectionAnimations).forEach(key => {
        sectionAnimations[key].setValue(0);
      });
      
      await loadContentSilently();
      
      setTimeout(() => {
        startSequentialAnimation();
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [startSequentialAnimation]);

  // Chargement complet
  const loadContent = async () => {
    try {
      setLoading(true);

      const [news, jtMagData, divertissementsData, sportsData, reportagesData, archivesData] = await Promise.all([
        newsService.getAllNews({ limit: 20 }).catch(() => []),
        jtandMagService.getJTandMag({ limit: 20 }).catch(() => []),
        divertissementService.getAllDivertissements({ limit: 20 }).catch(() => []),
        sportService.getAllSports({ limit: 20 }).catch(() => []),
        reportageService.getAllReportages({ limit: 20 }).catch(() => []),
        archiveService.getAllArchives({ limit: 20 }).catch(() => []),
      ]);

      const stream = await liveStreamService.getBF1Stream().catch(() => null);
      const program = await liveStreamService.getCurrentProgram().catch(() => null);
      const viewers = await liveStreamService.getViewers().catch(() => 0);

      setFlashInfo(sortByDate(news));
      setJtMag(sortByDate(jtMagData));
      setDivertissements(sortByDate(divertissementsData));
      setSports(sortByDate(sportsData));
      setReportages(sortByDate(reportagesData));
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

  // Détection de fin de scroll avec animations dynamiques
  const handleScroll = (sectionName, navigationTarget, event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    
    // Animation dynamique basée sur la position de scroll
    const scrollPercentage = contentOffset.x / (contentSize.width - layoutMeasurement.width);
    
    // Créer un effet de momentum visuel
    const scrollVelocity = Math.abs(contentOffset.x - (contentOffset.lastX || 0));
    contentOffset.lastX = contentOffset.x;
    
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 50;
    
    if (isAtEnd && !redirectLock[sectionName]) {
      console.log(`👉 Fin du scroll - Redirection vers ${navigationTarget}`);
      
      setRedirectLock(prev => ({ ...prev, [sectionName]: true }));
      
      setTimeout(() => {
        navigation.navigate(navigationTarget);
      }, 100);
      
      setTimeout(() => {
        setRedirectLock(prev => ({ ...prev, [sectionName]: false }));
      }, 2000);
    }
  };

  // Gestionnaire d'animation des items
  const getItemAnimation = (section, item, index) => {
    const key = `${section}-${item.id || item._id || index}`;
    return itemAnimations[key] || new Animated.Value(1);
  };

  // Handlers vidéo
  const handleVideoPress = () => {
    navigation.navigate('Direct');
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

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
    return <LoadingScreen />;
  }

  // Composant bouton "Voir plus"
  const ModernSeeMoreButton = ({ onPress }) => (
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true,
            listener: (event) => {
              // Animation dynamique basée sur la vitesse de scroll
              const offsetY = event.nativeEvent.contentOffset.y;
              
              // Effets visuels selon la position du scroll
              if (offsetY > 0) {
                // L'utilisateur scrolle vers le bas
              }
            }
          }
        )}
        scrollEventThrottle={16}
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
          {/* SECTION LIVE BF1 */}
          <Animated.View style={{
            opacity: sectionAnimations.live.opacity,
            transform: [
              { translateY: sectionAnimations.live.translateY },
              { scale: sectionAnimations.live.scale }
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

          {/* MODAL PLEIN ÉCRAN */}
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

          {/* SECTION FLASH INFO */}
          <Animated.View style={{
            opacity: sectionAnimations.flashInfo.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.flashInfo.translateY,
                  scrollY.interpolate({
                    inputRange: [0, 300],
                    outputRange: [0, -15],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.flashInfo.scale,
                  scrollY.interpolate({
                    inputRange: [0, 300],
                    outputRange: [1, 0.98],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.flashInfo.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              {
                perspective: 1000
              }
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
                  ref={scrollViewRefs.flashInfo}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('flashInfo', 'BreakingNews', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {flashInfo.length > 0 ? flashInfo.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('flashInfo', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { 
                              scale: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1]
                              })
                            },
                            { 
                              translateY: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [40, 0]
                              })
                            },
                            {
                              rotateY: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['20deg', '0deg']
                              })
                            },
                            { perspective: 1000 }
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.newsCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('NewsDetail', { newsId: item.id || item._id })}
                        >
                          <Image source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/400x250' }} style={styles.newsImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.newsOverlay}>
                            <View style={styles.newsBadge}>
                              <Ionicons name="flash" size={12} color="#fff" />
                              <Text style={styles.newsBadgeText}>{item.category || item.edition || 'Actualités'}</Text>
                            </View>
                            <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.newsTime}>{formatRelativeTime(item.created_at || item.published_at)}</Text>
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
              </Animated.View>
            </View>
          </Animated.View>

          {/* SECTION JT ET MAG */}
          <Animated.View style={{
            opacity: sectionAnimations.jtMag.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.jtMag.translateY,
                  scrollY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, -20],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.jtMag.scale,
                  scrollY.interpolate({
                    inputRange: [200, 600],
                    outputRange: [1, 0.97],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.jtMag.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              { perspective: 1000 }
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
                  ref={scrollViewRefs.jtMag}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('jtMag', 'JTandMag', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {jtMag.length > 0 ? jtMag.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('jtMag', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
                        style={{
                          opacity: itemAnim,
                          transform: [
                            { 
                              scale: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.7, 1]
                              })
                            },
                            { 
                              translateY: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [40, 0]
                              })
                            },
                            {
                              rotateY: itemAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['-20deg', '0deg']
                              })
                            },
                            { perspective: 1000 }
                          ]
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.trendingCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ShowDetail', { showId: item.id || item._id, isJTandMag: true })}
                        >
                          <Image source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300x200' }} style={styles.trendingImage} />
                          <View style={styles.trendingInfo}>
                            <Text style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.trendingMeta}>
                              <Ionicons name="eye" size={14} color={colors.textSecondary} />
                              <Text style={[styles.trendingViews, { color: colors.textSecondary }]}>
                                {formatRelativeTime(item.created_at || item.published_at || item.aired_at)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucune émission disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
              </Animated.View>
            </View>
          </Animated.View>

          {/* SECTION DIVERTISSEMENT */}
          <Animated.View style={{
            opacity: sectionAnimations.divertissements.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.divertissements.translateY,
                  scrollY.interpolate({
                    inputRange: [300, 800],
                    outputRange: [0, -25],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.divertissements.scale,
                  scrollY.interpolate({
                    inputRange: [400, 900],
                    outputRange: [1, 0.96],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.divertissements.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              { perspective: 1000 }
            ]
          }}>
            <View style={[styles.section, { marginBottom: 10 }]}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Divertissement</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('Divertissement')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.divertissements}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('divertissements', 'Divertissement', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {divertissements.length > 0 ? divertissements.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('divertissements', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
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
                          onPress={() => navigation.navigate('ShowDetail', { showId: item.id || item._id, isDivertissement: true })}
                        >
                          <Image source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300x200' }} style={styles.interviewImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.interviewOverlay}>
                            <Text style={styles.interviewTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.interviewGuest} numberOfLines={1}>
                              {formatRelativeTime(item.created_at || item.published_at)}
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
              </Animated.View>
            </View>
          </Animated.View>

          {/* SECTION SPORT */}
          <Animated.View style={{
            opacity: sectionAnimations.sports.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.sports.translateY,
                  scrollY.interpolate({
                    inputRange: [500, 1000],
                    outputRange: [0, -30],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.sports.scale,
                  scrollY.interpolate({
                    inputRange: [600, 1100],
                    outputRange: [1, 0.95],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.sports.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              { perspective: 1000 }
            ]
          }}>
            <View style={[styles.section, { marginBottom: 10 }]}>
              <View style={styles.sectionHeaderWithButton}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Sport</Text>
                </View>
                <ModernSeeMoreButton onPress={() => navigation.navigate('Sport')} />
              </View>
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <ScrollView 
                  ref={scrollViewRefs.sports}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('sports', 'Sport', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {sports.length > 0 ? sports.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('sports', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
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
                            styles.sportCard, 
                            { backgroundColor: colors.card },
                            isLastItem && { borderRightWidth: 3, borderRightColor: colors.primary }
                          ]}
                          onPress={() => navigation.navigate('ShowDetail', { showId: item.id || item._id, isSport: true })}
                        >
                          <Image source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300x200' }} style={styles.sportImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.sportOverlay}>
                            {item.isLive && (
                              <View style={styles.sportLiveBadge}>
                                <Animated.View style={[styles.sportLiveDot, { opacity: liveDotOpacity }]} />
                                <Text style={styles.sportLiveText}>EN DIRECT</Text>
                              </View>
                            )}
                            <Text style={styles.sportTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.sportMeta}>
                              <Text style={styles.sportCategory}>{item.sport_type || item.category || 'Sport'}</Text>
                              <Text style={styles.sportMetaSeparator}>•</Text>
                              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                              <Text style={styles.sportTime}>
                                {formatRelativeTime(item.created_at || item.published_at || item.match_date)}
                              </Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }) : (
                    <View style={styles.emptyStateHorizontal}>
                      <Ionicons name="basketball-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Aucun contenu sportif disponible</Text>
                    </View>
                  )}
                  <View style={{ width: 40 }} />
                </ScrollView>
              </Animated.View>
            </View>
          </Animated.View>

          {/* SECTION REPORTAGES */}
          <Animated.View style={{
            opacity: sectionAnimations.reportages.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.reportages.translateY,
                  scrollY.interpolate({
                    inputRange: [700, 1200],
                    outputRange: [0, -35],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.reportages.scale,
                  scrollY.interpolate({
                    inputRange: [800, 1300],
                    outputRange: [1, 0.94],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.reportages.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              { perspective: 1000 }
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
                  ref={scrollViewRefs.reportages}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onScroll={(event) => handleScroll('reportages', 'Reportages', event)}
                  scrollEventThrottle={16}
                  decelerationRate="normal"
                >
                  {reportages.length > 0 ? reportages.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('reportages', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
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
                          onPress={() => navigation.navigate('ShowDetail', { showId: item.id || item._id, isReportage: true })}
                        >
                          <Image source={{ uri: item.thumbnail }} style={styles.videoImage} />
                          <View style={styles.videoDuration}>
                            <Text style={styles.videoDurationText}>{formatDuration(item.duration || item.duration_minutes)}</Text>
                          </View>
                          <View style={styles.videoInfo}>
                            <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                            <Text style={[styles.videoDate, { color: colors.textSecondary }]}>
                              {formatRelativeTime(item.aired_at || item.created_at)}
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
              </Animated.View>
            </View>
          </Animated.View>

          {/* SECTION ARCHIVES */}
          <Animated.View style={{
            opacity: sectionAnimations.archives.opacity,
            transform: [
              { 
                translateY: Animated.add(
                  sectionAnimations.archives.translateY,
                  scrollY.interpolate({
                    inputRange: [900, 1400],
                    outputRange: [0, -40],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                scale: Animated.multiply(
                  sectionAnimations.archives.scale,
                  scrollY.interpolate({
                    inputRange: [1000, 1500],
                    outputRange: [1, 0.93],
                    extrapolate: 'clamp'
                  })
                )
              },
              { 
                rotateZ: sectionAnimations.archives.rotate.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-2deg', '0deg', '2deg']
                })
              },
              { perspective: 1000 }
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
                  {archives.length > 0 ? archives.slice(0, INITIAL_DISPLAY_COUNT).map((item, index) => {
                    const itemAnim = getItemAnimation('archives', item, index);
                    const isLastItem = index === INITIAL_DISPLAY_COUNT - 1;
                    
                    return (
                      <Animated.View
                        key={item.id || item._id}
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
                          onPress={() => navigation.navigate('ArchiveDetail', { archiveId: item.id || item._id })}
                        >
                          <Image source={{ uri: item.image || item.thumbnail || 'https://via.placeholder.com/300x200' }} style={styles.archiveImage} />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.archiveOverlay}>
                            <View style={styles.archivePremiumBadge}>
                              <Ionicons name="lock-closed" size={12} color={colors.primary} />
                              <Text style={styles.archivePremiumText}>Premium</Text>
                              {item.price > 0 && <Text style={styles.archivePriceText}> • {Math.round(item.price)} XOF</Text>}
                            </View>
                            <Text style={styles.archiveTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.archiveMeta}>
                              <Ionicons name="videocam" size={12} color={colors.primary} />
                              <Text style={styles.archiveMetaText}>Vidéo</Text>
                              {item.duration_minutes && (
                                <>
                                  <Text style={styles.archiveMetaSeparator}>•</Text>
                                  <Ionicons name="time" size={12} color={colors.textSecondary} />
                                  <Text style={styles.archiveMetaText}>{item.duration_minutes} min</Text>
                                </>
                              )}
                              <Text style={styles.archiveMetaSeparator}>•</Text>
                              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                              <Text style={styles.archiveMetaText}>
                                {formatRelativeTime(item.created_at || item.published_at)}
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
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}