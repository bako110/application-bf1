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
import { colors } from '../../contexts/ThemeContext';
import showService from '../../services/showService';
import api from '../../config/api';
import liveStreamService from '../../services/liveStreamService';
import viewService from '../../services/viewService';
import ContentActions from '../../components/contentActions';
import ExpandableText from '../../components/ExpandableText';
import PremiumModal from '../../components/premiumModal';
import UniversalVideoPlayer from '../../components/UniversalVideoPlayer';
import { useAuth } from '../../contexts/AuthContext';
import { formatLongDate, formatRelativeTime } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function ShowDetailScreen({ route, navigation }) {
  const { showId, isJTandMag = false, isEmission = false, isDivertissement = false, isReportage = false, isTrending, isPopularProgram, isReplay = false, isInterview = false, isArchive = false, isProgram = false, programData = null, isBreakingNews = false } = route.params || {};
  const { isPremium } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);
  const [liveStreamUrl, setLiveStreamUrl] = useState(null);
  
  // Déterminer le contentType selon le type de contenu
  const contentType = isBreakingNews ? 'breaking_news' : 
                     isArchive ? 'archive' : 
                     isReportage ? 'reportage' :
                     isReplay ? 'reportage' : 
                     isDivertissement ? 'divertissement' : 
                     isJTandMag ? 'jtandmag' : 
                     isTrending ? 'jtandmag' : 
                     isEmission ? 'emission' : 
                     isPopularProgram ? 'popular_program' : 'show';

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
      console.log('📺 ShowDetailScreen - Params:', { showId, isReplay, isTrending, isPopularProgram, isInterview, isArchive, isProgram, isBreakingNews });
      
      let data;
      if (isProgram && programData) {
        console.log('✅ Utilisation des données du programme EPG passées en paramètre');
        data = programData;
      } else if (isBreakingNews === true) {
        console.log('✅ Chargement depuis breaking news:', showId);
        const response = await api.get(`/breaking-news/${showId}`);
        data = response.data;
      } else if (isArchive === true) {
        console.log('✅ Chargement depuis /archives/', showId);
        const response = await api.get(`/archives/${showId}`);
        data = response.data;
      } else if (isReportage) {
        console.log('✅ Chargement depuis reportage:', showId);
        const response = await api.get(`/reportage/${showId}`);
        data = response.data;
      } else if (isReplay === true) {
        console.log('✅ Chargement depuis /reportage/', showId);
        const response = await api.get(`/reportage/${showId}`);
        data = response.data;
      } else if (isDivertissement) {
        console.log('✅ Chargement depuis divertissement:', showId);
        const divertissementService = require('../../services/divertissementService').default;
        data = await divertissementService.getDivertissementById(showId);
      } else if (isJTandMag) {
        console.log('✅ Chargement depuis JTandMag:', showId);
        const jtandMagService = require('../../services/jtandMagService').default;
        data = await jtandMagService.getJTandMagById(showId);
      } else if (isTrending) {
        console.log('✅ Chargement depuis trending shows');
        const jtandMagService = require('../../services/jtandMagService').default;
        data = await jtandMagService.getJTandMagById(showId);
      } else if (isPopularProgram) {
        console.log('✅ Chargement depuis popular programs');
        const popularProgramService = require('../../services/popularProgramService').default;
        data = await popularProgramService.getProgramById(showId);
      } else if (isEmission) {
        console.log('✅ Chargement depuis emission:', showId);
        const emissionService = require('../../services/emissionsService').default;
        data = await emissionService.getEmissionById(showId);
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

  // Fonction pour trier du plus récent au plus ancien
  const sortByDate = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at || a.date || a.aired_at || 0);
      const dateB = new Date(b.created_at || b.published_at || b.date || b.aired_at || 0);
      return dateB - dateA; // Plus récent d'abord
    });
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
      } else if (isReportage) {
        console.log('✅ Chargement des reportages similaires');
        const response = await api.get('/reportage');
        allContent = response.data;
      } else if (isReplay) {
        const response = await api.get('/reportage');
        allContent = response.data;
      } else if (isDivertissement) {
        console.log('✅ Chargement des divertissements similaires');
        const divertissementService = require('../../services/divertissementService').default;
        allContent = await divertissementService.getAllDivertissements();
      } else if (isJTandMag) {
        console.log('✅ Chargement des JT et Mag similaires');
        const jtandMagService = require('../../services/jtandMagService').default;
        allContent = await jtandMagService.getJTandMag();
      } else if (isTrending) {
        console.log('✅ Chargement des JT et Mag similaires (trending)');
        const jtandMagService = require('../../services/jtandMagService').default;
        allContent = await jtandMagService.getJTandMag();
      } else if (isPopularProgram) {
        const popularProgramService = require('../../services/popularProgramService').default;
        allContent = await popularProgramService.getAllPrograms();
      } else if (isEmission) {
        const emissionService = require('../../services/emissionsService').default;
        allContent = await emissionService.getAllEmissions({ limit: 50 }); // Augmenté la limite pour avoir plus de contenu
      } else {
        allContent = await showService.getAllShows({ limit: 50 }); // Augmenté la limite pour avoir plus de contenu
      }
      
      // Filtrer pour exclure l'élément courant ET trier du plus récent au plus ancien
      const filtered = allContent
        .filter(item => (item.id || item._id) !== showId);
      
      // Appliquer le tri par date
      const sortedFiltered = sortByDate(filtered);
      
      console.log(`📦 ${sortedFiltered.length} contenus similaires chargés et triés`);
      setRelatedContent(sortedFiltered);
    } catch (error) {
      console.error('❌ Erreur chargement contenus similaires:', error);
    }
  };

  const handlePlay = async () => {
    console.log('🎬 handlePlay appelé');
    
    if (show?.is_premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // Vérifier si c'est un programme EPG (show avec start_time ou startTime)
    if ((show?.start_time || show?.startTime || isProgram) && !isReplay && !isArchive && !isInterview) {
      console.log('✅ C\'est un programme EPG');
      const now = new Date();
      const programStartTime = new Date(show.startTime || show.start_time);
      
      // Si l'heure du programme n'est pas encore arrivée
      if (programStartTime > now) {
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
      try {
        const bf1Stream = await liveStreamService.getBF1Stream();
        setLiveStreamUrl(bf1Stream.url);
      } catch (error) {
        console.error('❌ Erreur chargement flux live:', error);
        navigation.navigate('Live');
      }
      return;
    }
    
    console.log('ℹ️ Pas un programme EPG - Lecture normale');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#E23E3E'} />
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
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Lecteur vidéo en haut */}
      <View style={styles.videoHeader}>
        {(() => {
          const videoUrl = liveStreamUrl || show?.video_url || show?.replay_url || show?.live_url;
          
          return (
            <UniversalVideoPlayer
              videoUrl={videoUrl}
              posterUrl={show?.image_url || show?.thumbnail}
              onPlayPress={handlePlay}
              isPremium={show?.is_premium || false}
              userHasPremium={isPremium}
              onPremiumRequired={() => setShowPremiumModal(true)}
              style={styles.headerVideo}
              showLiveBadge={show.is_live && !isReplay && !isArchive && !isInterview}
            />
          );
        })()}
        
        {/* Badge Live */}
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
              <Ionicons name="person" size={14} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{show.host}</Text>
            </View>
          )}
          {(show.start_time || show.startTime) && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={14} color={'#B0B0B0'} />
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
              numberOfLines={3}
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
                  {new Date(show.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            {show.duration && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Durée</Text>
                <Text style={styles.detailValue}>
                  {show.duration} minutes
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contenus similaires - TOUS les éléments sans limite */}
        {relatedContent.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="play-circle" size={18} color={'#E23E3E'} />
              <Text style={styles.relatedTitle}>
                {isInterview ? 'Autres divertissements' : 
                 isReplay ? 'Autres reportages' : 
                 isArchive ? 'Autres archives' : 
                 isTrending ? 'Autres JT et Magazines' : 
                 isPopularProgram ? 'Autres programmes populaires' : 
                 'Autres contenus'} ({relatedContent.length})
              </Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedContent.map((item) => {
                // Formater la date pour l'afficher
                const itemDate = item.created_at || item.published_at || item.date || item.aired_at;
                const formattedDate = itemDate ? 
                  new Date(itemDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  }) : null;
                
                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    style={styles.relatedCard}
                    onPress={() => navigation.push('ShowDetail', { 
                      showId: item.id || item._id,
                      isReportage,
                      isJTandMag,
                      isDivertissement,
                      isTrending,
                      isPopularProgram,
                      isReplay,
                      isInterview,
                      isArchive
                    })}
                  >
                    <Image
                      source={{ uri: item.image_url || item.image || item.thumbnail || 'https://via.placeholder.com/100x85' }}
                      style={styles.relatedImage}
                    />
                    <View style={styles.relatedContent}>
                      <Text style={styles.relatedCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.relatedMeta}>
                        {item.host && (
                          <>
                            <Ionicons name="person" size={10} color="#B0B0B0" />
                            <Text style={styles.relatedTime}>{item.host}</Text>
                          </>
                        )}
                        {formattedDate && (
                          <>
                            <Ionicons name="time" size={10} color="#B0B0B0" />
                            <Text style={styles.relatedTime}>{formattedDate}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
  scrollContent: {
    paddingBottom: 100,
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
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  videoHeader: {
    width: width,
    height: width * 0.5625,
    position: 'relative',
    backgroundColor: '#000',
  },
  headerVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    marginVertical: 0,
  },
  liveBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    zIndex: 10,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  category: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A0000',
  },
  detailLabel: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  relatedSection: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A0000',
    marginBottom: 20,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  relatedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  relatedGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  relatedCard: {
    width: '100%',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
    height: 85,
  },
  relatedImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  relatedContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  relatedCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  relatedTime: {
    fontSize: 11,
    color: '#B0B0B0',
  },
});