import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal // Ajout de Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../contexts/ThemeContext';
import showService from '../services/showService';
import movieService from '../services/movieService';
import newsService from '../services/newsService';
import trendingShowService from '../services/trendingShowService';
import popularProgramService from '../services/popularProgramService';
import interviewService from '../services/interviewService';
import api from '../config/api';
import { formatRelativeTime } from '../utils/dateUtils';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [liveShows, setLiveShows] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [trendingShows, setTrendingShows] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [popularPrograms, setPopularPrograms] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Animation de clignotement pour le badge "Live en cours"
  useEffect(() => {
    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => blink());
    };
    blink();
  }, [blinkAnim]);

  useEffect(() => {
    loadContent();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les données en parallèle
      const [live, news, trending, popular, replays, interviewsData] = await Promise.all([
        showService.getLiveShows().catch(err => {
          console.error('Error loading live shows:', err);
          return [];
        }),
        newsService.getAllNews({ limit: 10 }).catch(err => {
          console.error('Error loading news:', err);
          return [];
        }),
        trendingShowService.getTrendingShows({ limit: 4 }).catch(err => {
          console.error('Error loading trending shows:', err);
          return [];
        }),
        popularProgramService.getAllPrograms({ limit: 4 }).catch(err => {
          console.error('Error loading popular programs:', err);
          return [];
        }),
        api.get('/replays', { params: { limit: 4 } }).then(response => 
          response.data.map(replay => ({
            ...replay,
            id: replay._id || replay.id,
            image_url: replay.thumbnail || replay.image_url
          }))
        ).catch(err => {
          console.error('Error loading replays:', err);
          return [];
        }),
        interviewService.getAllInterviews({ limit: 4 }).catch(err => {
          console.error('Error loading interviews:', err);
          return [];
        }),
      ]);
      
      setLiveShows(live);
      setBreakingNews(news);
      setTrendingShows(trending);
      setPopularPrograms(popular);
      setRecentVideos(replays);
      setInterviews(interviewsData);
      
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En Direct - Section étendue */}
      <View style={styles.liveSection}>
        <View style={styles.liveSectionHeader}>
          <View style={styles.liveTitleContainer}>
            <Ionicons name="radio" size={24} color={colors.primary} />
            <Text style={styles.liveSectionTitle}>En Direct</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (liveShows.length > 0) {
                const currentLive = liveShows[0];
                // Si c'est un live en cours, lancer la lecture
                if (currentLive.is_live) {
                  navigation.navigate('LiveShowFullScreen', {
                    stream: {
                      url: currentLive.stream_url || currentLive.video_url,
                      title: currentLive.title,
                      description: currentLive.description,
                      image_url: currentLive.image_url
                    }
                  });
                } else {
                  // Si c'est un live programmé, afficher les détails
                  navigation.navigate('ShowDetail', { 
                    showId: currentLive.id || currentLive._id,
                    isLive: true 
                  });
                }
              }
            }}
            disabled={liveShows.length === 0}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.programmedLiveContainer, { opacity: blinkAnim }]}>
              <View style={styles.programmedLiveDot} />
              <Text style={styles.programmedLiveText}>
                {liveShows.length > 0 
                  ? (liveShows[0].is_live ? 'Live en cours' : 'Live programmé')
                  : 'Aucun live'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {liveShows.length > 0 ? (
          <TouchableOpacity
            style={styles.liveCardFull}
            onPress={() => {
              const currentLive = liveShows[0];
              if (currentLive.is_live) {
                navigation.navigate('LiveShowFullScreen', {
                  stream: {
                    url: currentLive.stream_url || currentLive.video_url,
                    title: currentLive.title,
                    description: currentLive.description,
                    image_url: currentLive.image_url
                  }
                });
              } else {
                navigation.navigate('ShowDetail', { 
                  showId: currentLive.id || currentLive._id,
                  isLive: true 
                });
              }
            }}
          >
            <Image
              source={{ uri: liveShows[0].image_url || 'https://via.placeholder.com/400x250' }}
              style={styles.liveImageFull}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.liveOverlayFull}
            >
              <View style={styles.liveBadgeFull}>
                <View style={styles.liveIndicatorFull} />
                <Text style={styles.liveTextFull}>
                  {liveShows[0].is_live ? 'EN DIRECT' : 'PROGRAMMÉ'}
                </Text>
              </View>
              <Text style={styles.liveTitleFull}>{liveShows[0].title}</Text>
              
              {/* Afficher le motif/objectif du live */}
              {liveShows[0].description && (
                <View style={styles.liveObjectiveContainer}>
                  <Text style={styles.liveObjectiveLabel}>
                    {liveShows[0].is_live ? '' : 'Objectif: '}
                  </Text>
                  <Text style={styles.liveDescriptionFull} numberOfLines={2}>
                    {liveShows[0].description}
                  </Text>
                </View>
              )}
              
              {!liveShows[0].is_live && liveShows[0].start_time && (
                <View style={styles.scheduledTimeContainer}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.scheduledTimeText}>
                    {new Date(liveShows[0].start_time).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.noLiveContainer}>
            <Ionicons name="radio-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.noLiveText}>Aucun live en cours</Text>
            <Text style={styles.noLiveSubtext}>Les lives apparaîtront ici</Text>
          </View>
        )}
      </View>

      {/* Flash Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderWithButton}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Flash Info</Text>
          </View>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('BreakingNews')}>
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {breakingNews.length > 0 ? breakingNews.map((news) => (
              <TouchableOpacity 
                key={news.id || news._id} 
                style={styles.newsCard}
                onPress={() => navigation.navigate('NewsDetail', { newsId: news.id || news._id })}
              >
                <Image source={{ uri: news.image_url || news.image || 'https://via.placeholder.com/400x250' }} style={styles.newsImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.newsOverlay}
                >
                  <View style={styles.newsBadge}>
                    <Ionicons name="flash" size={12} color="#fff" />
                    <Text style={styles.newsBadgeText}>{news.category || news.edition || 'Actualités'}</Text>
                  </View>
                  <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                  <Text style={styles.newsTime}>{formatRelativeTime(news.created_at || news.published_at)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyStateHorizontal}>
                <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucune actualité disponible</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Émissions Tendances */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderWithButton}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Émissions Tendances</Text>
          </View>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('TrendingShows')}>
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trendingShows.length > 0 ? trendingShows.map((show) => (
              <TouchableOpacity 
                key={show.id || show._id} 
                style={styles.trendingCard}
                onPress={() => navigation.navigate('ShowDetail', { showId: show.id || show._id, isTrending: true })}
              >
                <Image source={{ uri: show.image_url || show.image || 'https://via.placeholder.com/300x200' }} style={styles.trendingImage} />
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingTitle} numberOfLines={1}>{show.title}</Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="eye" size={14} color={colors.textSecondary} />
                    <Text style={styles.trendingViews}>{show.views_count || show.views || '0'} vues</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyStateHorizontal}>
                <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucune émission tendance</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Vidéos Récentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderWithButton}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Vidéos Récentes</Text>
          </View>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('RecentVideos')}>
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentVideos.length > 0 ? recentVideos.map((video) => (
              <TouchableOpacity 
                key={video.id || video._id} 
                style={styles.videoCard}
                onPress={() => navigation.navigate('ShowDetail', { showId: video.id || video._id, isReplay: true })}
              >
                <Image source={{ uri: video.image_url || video.image || 'https://via.placeholder.com/300x200' }} style={styles.videoImage} />
                <View style={styles.videoDurationBadge}>
                  <Text style={styles.videoDuration}>{video.duration || 'N/A'}</Text>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  <Text style={styles.videoDate}>{formatRelativeTime(video.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyStateHorizontal}>
                <Ionicons name="videocam-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucune vidéo récente</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Programmes Populaires */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <View style={styles.sectionHeaderWithButton}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Programmes Populaires</Text>
          </View>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('PopularPrograms')}>
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularPrograms.length > 0 ? popularPrograms.map((program) => (
              <TouchableOpacity 
                key={program.id || program._id} 
                style={styles.programCard}
                onPress={() => navigation.navigate('ShowDetail', { showId: program.id || program._id, isPopularProgram: true })}
              >
                <Image source={{ uri: program.image || program.image_url || 'https://via.placeholder.com/300x200' }} style={styles.programImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.programOverlay}
                >
                  <Text style={styles.programTitle} numberOfLines={1}>{program.title}</Text>
                  <View style={styles.programSchedule}>
                    <Ionicons name="time" size={14} color={colors.primary} />
                    <Text style={styles.programScheduleText}>{program.schedule || `${program.episodes || 0} épisodes`}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyStateHorizontal}>
                <Ionicons name="star-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucun programme populaire</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Interviews */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <View style={styles.sectionHeaderWithButton}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mic" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Interviews</Text>
          </View>
          <TouchableOpacity style={styles.seeMoreButton} onPress={() => navigation.navigate('Interviews')}>
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {interviews.length > 0 ? interviews.map((interview) => (
              <TouchableOpacity 
                key={interview.id || interview._id} 
                style={styles.interviewCard}
                onPress={() => navigation.navigate('ShowDetail', { showId: interview.id || interview._id, isInterview: true })}
              >
                <Image source={{ uri: interview.image_url || interview.image || 'https://via.placeholder.com/300x200' }} style={styles.interviewImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.interviewOverlay}
                >
                  <View style={styles.interviewBadge}>
                    <Ionicons name="mic" size={12} color="#fff" />
                    <Text style={styles.interviewBadgeText}>Interview</Text>
                  </View>
                  <Text style={styles.interviewTitle} numberOfLines={2}>{interview.title}</Text>
                  <Text style={styles.interviewGuest} numberOfLines={1}>{interview.guest || 'Invité'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyStateHorizontal}>
                <Ionicons name="mic-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Aucune interview disponible</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  liveSection: {
    marginTop: 0,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  liveTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  programmedLiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  programmedLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  programmedLiveText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  liveCardFull: {
    width: width - 32,
    height: height * 0.45,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  liveImageFull: {
    width: '100%',
    height: '100%',
  },
  liveOverlayFull: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  liveBadgeFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  liveIndicatorFull: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text,
    marginRight: 8,
  },
  liveTextFull: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveTitleFull: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  liveDescriptionFull: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
  scheduledTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  scheduledTimeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  liveObjectiveContainer: {
    marginTop: 8,
  },
  liveObjectiveLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  section: {
    marginTop: 28,
    paddingBottom: 8,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeMoreText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  newsCard: {
    width: width * 0.75,
    height: 180,
    marginLeft: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  newsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  newsBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  newsTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsTime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  trendingCard: {
    width: 160,
    marginLeft: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingInfo: {
    padding: 10,
  },
  trendingTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingViews: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  videoCard: {
    width: 200,
    marginLeft: 16,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  videoImage: {
    width: '100%',
    height: 120,
  },
  videoDurationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  videoInfo: {
    padding: 10,
  },
  videoTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  videoDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  programCard: {
    width: 180,
    height: 140,
    marginLeft: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  programImage: {
    width: '100%',
    height: '100%',
  },
  programOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  programTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  programSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programScheduleText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
  },
  interviewCard: {
    width: 200,
    height: 160,
    marginLeft: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  interviewImage: {
    width: '100%',
    height: '100%',
  },
  interviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  interviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  interviewBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  interviewTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  interviewGuest: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  noLiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  noLiveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noLiveSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateHorizontal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginLeft: 16,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },
});