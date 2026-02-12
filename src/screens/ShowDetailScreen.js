import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../contexts/ThemeContext';
import showService from '../services/showService';
import api from '../config/api';
import liveStreamService from '../services/liveStreamService';
import viewService from '../services/viewService';
import ContentActions from '../components/contentActions';
import ExpandableText from '../components/ExpandableText';
import PremiumModal from '../components/premiumModal';
import UniversalVideoPlayer from '../components/UniversalVideoPlayer';
import { useAuth } from '../contexts/AuthContext';
import { formatLongDate, formatRelativeTime } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function ShowDetailScreen({ route, navigation }) {
  const { showId, isTrending, isPopularProgram, isReplay = false, isInterview = false, isArchive = false, isProgram = false, programData = null } = route.params || {};
  const { isPremium } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);
  const [liveStreamUrl, setLiveStreamUrl] = useState(null);
  
  // Déterminer le contentType selon le type de contenu
  const contentType = isArchive ? 'archive' : (isReplay ? 'replay' : (isInterview ? 'interview' : (isTrending ? 'trending_show' : (isPopularProgram ? 'popular_program' : 'show'))));

  useEffect(() => {
    loadShow();
  }, [showId]);

  // Pause vidéo quand l'utilisateur quitte l'écran
  useFocusEffect(
    React.useCallback(() => {
      // L'écran est actif
      return () => {
        // L'écran n'est plus actif - arrêter la vidéo
        console.log('⏸️ Pause vidéo - utilisateur a quitté ShowDetailScreen');
      };
    }, [])
  );

  const loadShow = async () => {
    try {
      console.log('📺 ShowDetailScreen - Params:', { showId, isReplay, isTrending, isPopularProgram, isInterview, isArchive, isProgram });
      console.log('📺 Types:', { 
        isReplay: typeof isReplay, 
        isReplayValue: isReplay,
        isInterview: typeof isInterview,
        isInterviewValue: isInterview,
        isArchive: typeof isArchive,
        isArchiveValue: isArchive,
        isTrending: typeof isTrending,
        isTrendingValue: isTrending,
        isProgram: typeof isProgram,
        isProgramValue: isProgram
      });
      
      let data;
      if (isProgram && programData) {
        console.log('✅ Utilisation des données du programme EPG passées en paramètre');
        data = programData;
      } else if (isArchive === true) {
        console.log('✅ Chargement depuis /archives/', showId);
        const response = await api.get(`/archives/${showId}`);
        data = response.data;
      } else if (isReplay === true) {
        console.log('✅ Chargement depuis /replays/', showId);
        const response = await api.get(`/replays/${showId}`);
        data = response.data;
      } else if (isInterview === true) {
        console.log('✅ Chargement depuis /interviews/', showId);
        const response = await api.get(`/interviews/${showId}`);
        data = response.data;
      } else if (isTrending) {
        console.log('✅ Chargement depuis trending shows');
        const trendingShowService = require('../services/trendingShowService').default;
        data = await trendingShowService.getTrendingShowById(showId);
      } else if (isPopularProgram) {
        console.log('✅ Chargement depuis popular programs');
        const popularProgramService = require('../services/popularProgramService').default;
        data = await popularProgramService.getProgramById(showId);
      } else {
        console.log('✅ Chargement depuis /shows/', showId);
        data = await showService.getShowById(showId);
      }
      setShow(data);
      
      // Incrémenter les vues (fonctionne pour tous les utilisateurs, même sans compte)
      await viewService.incrementView(showId, contentType);
      
      // Charger les contenus similaires
      await loadRelatedContent();
    } catch (error) {
      console.error('❌ Erreur chargement émission:', error);
    }
    setLoading(false);
  };

  const loadRelatedContent = async () => {
    try {
      let allContent = [];
      
      // Pour les programmes EPG, ne pas charger de contenus similaires
      if (isProgram) {
        console.log('ℹ️ Programme EPG - Pas de contenus similaires');
        setRelatedContent([]);
        return;
      }
      
      if (isArchive) {
        const response = await api.get('/archives');
        allContent = response.data;
      } else if (isReplay) {
        const response = await api.get('/replays');
        allContent = response.data;
      } else if (isInterview) {
        const interviewService = require('../services/interviewService').default;
        allContent = await interviewService.getAllInterviews();
      } else if (isTrending) {
        const trendingShowService = require('../services/trendingShowService').default;
        allContent = await trendingShowService.getTrendingShows();
      } else if (isPopularProgram) {
        const popularProgramService = require('../services/popularProgramService').default;
        allContent = await popularProgramService.getAllPrograms();
      } else {
        allContent = await showService.getAllShows({ limit: 20 });
      }
      
      const filtered = allContent
        .filter(item => (item.id || item._id) !== showId)
        .slice(0, 6);
      setRelatedContent(filtered);
    } catch (error) {
      console.error('❌ Erreur chargement contenus similaires:', error);
    }
  };

  const handlePlay = async () => {
    console.log('🎬 handlePlay appelé');
    console.log('📊 show:', show);
    console.log('🔍 Conditions:', {
      'show?.start_time': show?.start_time,
      'isProgram': isProgram,
      'isReplay': isReplay,
      'isArchive': isArchive,
      'isInterview': isInterview
    });
    
    if (show?.is_premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // Vérifier si c'est un programme EPG (show avec start_time ou startTime)
    if ((show?.start_time || show?.startTime || isProgram) && !isReplay && !isArchive && !isInterview) {
      console.log('✅ C\'est un programme EPG');
      const now = new Date();
      const programStartTime = new Date(show.startTime || show.start_time);
      
      console.log('⏰ Comparaison des heures:');
      console.log('  - Maintenant:', now);
      console.log('  - Programme:', programStartTime);
      console.log('  - programStartTime > now:', programStartTime > now);
      
      // Si l'heure du programme n'est pas encore arrivée
      if (programStartTime > now) {
        console.log('⚠️ Programme à venir - Affichage du message');
        const hours = String(programStartTime.getHours()).padStart(2, '0');
        const minutes = String(programStartTime.getMinutes()).padStart(2, '0');
        Alert.alert(
          'Programme à venir',
          `Ce programme commence à ${hours}:${minutes}. Revenez à l'heure du programme pour le regarder en direct.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Si l'heure est arrivée, charger le flux live directement
      console.log('✅ Heure arrivée - Chargement du flux live');
      try {
        const bf1Stream = await liveStreamService.getBF1Stream();
        setLiveStreamUrl(bf1Stream.url);
        console.log('📺 Flux live chargé:', bf1Stream.url);
      } catch (error) {
        console.error('❌ Erreur chargement flux live:', error);
        // En cas d'erreur, rediriger vers LiveScreen
        navigation.navigate('Live');
      }
      return;
    }
    
    console.log('ℹ️ Pas un programme EPG - Lecture normale');
    // Pour les autres types de contenu (replay, archive, interview), la vidéo se lit directement
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#DC143C'} />
      </View>
    );
  }

  if (!show) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Émission introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Lecteur vidéo en haut */}
      <View style={styles.videoHeader}>
        {/* Pour les programmes EPG, afficher le flux live si l'heure est arrivée, sinon une image */}
        {(show?.start_time || show?.startTime || isProgram) && !isReplay && !isArchive && !isInterview ? (
          liveStreamUrl ? (
            <UniversalVideoPlayer
              videoUrl={liveStreamUrl}
              posterUrl={show?.image_url || show?.thumbnail}
              onPlayPress={handlePlay}
              isPremium={false}
              userHasPremium={true}
              style={styles.headerVideo}
            />
          ) : (
            <>
              <Image
                source={{ uri: show?.image_url || show?.thumbnail }}
                style={styles.coverImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
              />
              <TouchableOpacity
                style={styles.playButtonOverlay}
                onPress={handlePlay}
              >
                <View style={styles.playIconContainer}>
                  <Ionicons name="play" size={40} color="#fff" />
                </View>
                <Text style={styles.watchLiveText}>Regarder en direct</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          <UniversalVideoPlayer
            videoUrl={show?.video_url || show?.replay_url || show?.live_url}
            posterUrl={show?.image_url || show?.thumbnail}
            onPlayPress={handlePlay}
            isPremium={show?.is_premium || false}
            userHasPremium={isPremium}
            onPremiumRequired={() => setShowPremiumModal(true)}
            style={styles.headerVideo}
          />
        )}
        
        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Badge Live - seulement pour les contenus en direct */}
        {show.is_live && !isReplay && !isArchive && !isInterview && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre et catégorie */}
        <Text style={styles.title}>{show.title}</Text>
        
        {show.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.category}>{show.category}</Text>
          </View>
        )}

        {/* Informations */}
        <View style={styles.infoRow}>
          {show.host && (
            <View style={styles.infoItem}>
              <Ionicons name="person" size={16} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{show.host}</Text>
            </View>
          )}
          {(show.start_time || show.startTime) && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={'#B0B0B0'} />
              <Text style={styles.infoText}>
                {(() => {
                  const date = new Date(show.startTime || show.start_time);
                  const hours = String(date.getHours()).padStart(2, '0');
                  const minutes = String(date.getMinutes()).padStart(2, '0');
                  return `${hours}:${minutes}`;
                })()}
              </Text>
            </View>
          )}
        </View>


        {/* Actions (Like, Comment, Favorite) */}
        <ContentActions
          contentId={showId}
          contentType={contentType}
          navigation={navigation}
        />

        {/* Description */}
        {show.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <ExpandableText
              text={show.description}
              numberOfLines={4}
              style={styles.description}
              expandedStyle={styles.description}
            />
          </View>
        )}

        {/* Détails supplémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailsGrid}>
            {show.edition && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Édition</Text>
                <Text style={styles.detailValue}>{show.edition}</Text>
              </View>
            )}
            {show.created_at && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ajouté le</Text>
                <Text style={styles.detailValue}>
                  {new Date(show.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contenus similaires */}
        {relatedContent.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="play-circle" size={20} color={'#DC143C'} />
              <Text style={styles.relatedTitle}>
                {isInterview ? 'Autres interviews' : 
                 isReplay ? 'Autres replays' : 
                 isArchive ? 'Autres archives' : 
                 isTrending ? 'Autres émissions tendance' : 
                 isPopularProgram ? 'Autres programmes populaires' : 
                 'Autres contenus'}
              </Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedContent.map((item) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={styles.relatedCard}
                  onPress={() => navigation.push('ShowDetail', { 
                    showId: item.id || item._id,
                    isTrending,
                    isPopularProgram,
                    isReplay,
                    isInterview,
                    isArchive
                  })}
                >
                  <Image
                    source={{ uri: item.image_url || item.thumbnail }}
                    style={styles.relatedImage}
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.host && (
                      <Text style={styles.relatedTime}>{item.host}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Modal Premium */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={(plan) => {
          console.log('Plan sélectionné:', plan);
          setShowPremiumModal(false);
        }}
        navigation={navigation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoHeader: {
    width: width,
    height: width * 0.5625, // Ratio 16:9 (9/16 = 0.5625)
    position: 'relative',
    backgroundColor: '#000',
  },
  headerVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    marginVertical: 0,
  },
  imageContainer: {
    width: width,
    height: width * 0.5625, // Ratio 16:9 pour cohérence
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backIconButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  category: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#B0B0B0',
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A0000',
  },
  detailLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  relatedSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A0000',
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  relatedGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  relatedCard: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
    height: 100,
  },
  relatedImage: {
    width: 120,
    height: '100%',
  },
  relatedContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  relatedCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  relatedTime: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 20, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchLiveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
