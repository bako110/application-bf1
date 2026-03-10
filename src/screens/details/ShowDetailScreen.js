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
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { formatLongDate, formatRelativeTime } from '../../utils/dateUtils';
import { canUserAccessContent, getSubscriptionBadge, getUserSubscriptionCategory } from '../../utils/subscriptionUtils';

const { width } = Dimensions.get('window');

export default function ShowDetailScreen({ route, navigation }) {
  const { 
    showId, 
    isJTandMag = false, 
    isSport = false, 
    isDivertissement = false, 
    isReportage = false, 
    isFlashInfo = false,
    isArchive = false, 
    isProgram = false, 
    programData = null 
  } = route.params || {};
  
  const { user, isPremium, isAuthenticated } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [requiredCategory, setRequiredCategory] = useState(null);
  const [relatedContent, setRelatedContent] = useState([]);
  const [liveStreamUrl, setLiveStreamUrl] = useState(null);
  
  // Déterminer le contentType selon le type de contenu
  const contentType = isFlashInfo ? 'flash_info' : 
                     isArchive ? 'archive' : 
                     isReportage ? 'reportage' :
                     isDivertissement ? 'divertissement' : 
                     isJTandMag ? 'jtandmag' : 
                     isSport ? 'sport' : 'show';

  useEffect(() => {
    loadShow();
  }, [showId]);

  // Pause vidéo quand l'utilisateur quitte l'écran
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log('⏸️ Pause vidéo - utilisateur a quitté ShowDetailScreen');
      };
    }, [])
  );

  const loadShow = async () => {
    try {
      console.log('📺 ShowDetailScreen - Params:', { showId, isFlashInfo, isJTandMag, isDivertissement, isSport, isReportage, isArchive, isProgram });
      
      let data;
      if (isProgram && programData) {
        console.log('✅ Utilisation des données du programme EPG passées en paramètre');
        data = programData;
      } else if (isFlashInfo) {
        console.log('✅ Chargement depuis flash info:', showId);
        const response = await api.get(`/breaking-news/${showId}`);
        data = response.data;
      } else if (isArchive) {
        console.log('✅ Chargement depuis archives:', showId);
        const response = await api.get(`/archives/${showId}`);
        data = response.data;
      } else if (isReportage) {
        console.log('✅ Chargement depuis reportage:', showId);
        const response = await api.get(`/reportage/${showId}`);
        data = response.data;
      } else if (isDivertissement) {
        console.log('✅ Chargement depuis divertissement:', showId);
        const divertissementService = require('../../services/divertissementService').default;
        data = await divertissementService.getDivertissementById(showId);
      } else if (isJTandMag) {
        console.log('✅ Chargement depuis JT et Mag:', showId);
        const jtandMagService = require('../../services/jtandMagService').default;
        data = await jtandMagService.getJTandMagById(showId);
      } else if (isSport) {
        console.log('✅ Chargement depuis sport:', showId);
        const sportService = require('../../services/sportService').default;
        data = await sportService.getSportById(showId);
      } else {
        console.log('✅ Chargement depuis /shows/', showId);
        data = await showService.getShowById(showId);
      }
      
      setShow(data);
      
      // Incrémenter les vues
      await viewService.incrementView(showId, contentType);
      
      // Charger les contenus similaires
      await loadRelatedContent();
    } catch (error) {
      console.error('❌ Erreur chargement contenu:', error);
      
      // Afficher un message clair à l'utilisateur
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      
      if (errorMessage.includes('Token') || errorMessage.includes('token') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        Alert.alert(
          '🔒 Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter pour accéder à ce contenu.',
          [
            { text: 'Retour', style: 'cancel', onPress: () => navigation.goBack() },
            { 
              text: 'Se connecter', 
              onPress: () => {
                navigation.goBack();
                navigation.getParent()?.navigate('Mon compte', { screen: 'Login' });
              }
            }
          ]
        );
      } else if (errorMessage.includes('premium') || errorMessage.includes('Premium')) {
        Alert.alert(
          '🔒 Contenu Premium',
          'Ce contenu est réservé aux abonnés premium.',
          [
            { text: 'Retour', style: 'cancel', onPress: () => navigation.goBack() },
            { 
              text: 'Voir les offres', 
              onPress: () => {
                // Afficher le modal Premium
                setShowPremiumModal(true);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '❌ Erreur',
          `Impossible de charger ce contenu.\n\n${errorMessage}`,
          [
            { text: 'Retour', onPress: () => navigation.goBack() }
          ]
        );
      }
    }
    setLoading(false);
  };

  // Fonction pour trier du plus récent au plus ancien
  const sortByDate = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at || a.date || a.aired_at || 0);
      const dateB = new Date(b.created_at || b.published_at || b.date || b.aired_at || 0);
      return dateB - dateA;
    });
  };

  const loadRelatedContent = async () => {
    try {
      let allContent = [];
      
      // Pour les programmes EPG, pas de contenus similaires
      if (isProgram) {
        console.log('ℹ️ Programme EPG - Pas de contenus similaires');
        setRelatedContent([]);
        return;
      }
      
      if (isFlashInfo) {
        console.log('✅ Chargement des flash info similaires');
        const response = await api.get('/breaking-news');
        allContent = response.data;
      } else if (isArchive) {
        console.log('✅ Chargement des archives similaires');
        const response = await api.get('/archives');
        allContent = response.data;
      } else if (isReportage) {
        console.log('✅ Chargement des reportages similaires');
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
      } else if (isSport) {
        console.log('✅ Chargement des contenus sportifs similaires');
        const sportService = require('../../services/sportService').default;
        allContent = await sportService.getAllSports({ limit: 50 });
      } else {
        allContent = await showService.getAllShows({ limit: 50 });
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
    console.log('👤 User:', user);
    console.log('🔑 isAuthenticated:', isAuthenticated);
    console.log('💎 isPremium:', isPremium);
    console.log('📦 show.required_subscription_category:', show?.required_subscription_category);
    
    // Vérifier si le contenu nécessite un abonnement
    if (show?.required_subscription_category) {
      if (!isAuthenticated) {
        const badge = getSubscriptionBadge(show.required_subscription_category);
        Alert.alert(
          '🔒 Connexion Requise',
          `Ce contenu nécessite un abonnement ${badge.label} pour être visionné.`,
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => navigation.navigate('Mon compte', { screen: 'Login' })
            }
          ]
        );
        return;
      }
      
      // Vérifier l'accès selon la hiérarchie
      const userCategory = getUserSubscriptionCategory(user);
      console.log('🏷️ userCategory:', userCategory);
      
      const hasAccess = canUserAccessContent(userCategory, show.required_subscription_category);
      console.log('✅ hasAccess:', hasAccess);
      
      if (!hasAccess) {
        const badge = getSubscriptionBadge(show.required_subscription_category);
        let message = `Ce contenu nécessite un abonnement ${badge.label}.`;
        
        if (userCategory) {
          const userBadge = getSubscriptionBadge(userCategory);
          message += `\n\nVotre abonnement actuel : ${userBadge.label}\nAbonnement requis : ${badge.label}`;
        }
        
        message += `\n\nDécouvrez nos offres d'abonnement pour accéder à tous les contenus.`;
        
        Alert.alert(
          '🔒 Abonnement Requis',
          message,
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Voir les offres', 
              onPress: () => {
                setRequiredCategory(show.required_subscription_category);
                setShowPremiumModal(true);
              }
            }
          ]
        );
        return;
      }
    }
    
    // Vérifier si c'est un programme EPG
    if ((show?.start_time || show?.startTime || isProgram) && !isReportage && !isArchive && !isFlashInfo) {
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
    return <LoadingScreen />;
  }

  if (!show) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Contenu introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Déterminer le titre de la section similaire
  const getRelatedTitle = () => {
    if (isFlashInfo) return 'Autres flash info';
    if (isArchive) return 'Autres archives';
    if (isReportage) return 'Autres reportages';
    if (isDivertissement) return 'Autres divertissements';
    if (isJTandMag) return 'Autres JT et Magazines';
    if (isSport) return 'Autres contenus sportifs';
    return 'Contenus similaires';
  };

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
              posterUrl={show?.thumbnail || show?.image_url || show?.image}
              onPlayPress={handlePlay}
              isPremium={show?.is_premium || false}
              userHasPremium={isPremium}
              onPremiumRequired={() => setShowPremiumModal(true)}
              style={styles.headerVideo}
              showLiveBadge={show.is_live && !isReportage && !isArchive && !isFlashInfo}
            />
          );
        })()}
        
        {/* Badge Live */}
        {show.is_live && !isReportage && !isArchive && !isFlashInfo && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
        )}
        
        {/* Badge Flash Info */}
        {isFlashInfo && (
          <View style={[styles.liveBadge, { backgroundColor: '#FFA500' }]}>
            <Ionicons name="flash" size={10} color="#fff" />
            <Text style={styles.liveText}>FLASH INFO</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre */}
        <Text style={styles.title}>{show.title}</Text>
        
        {/* Catégorie et Actions sur la même ligne */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {show.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>{show.category}</Text>
            </View>
          )}
          
          {/* Actions (Like, Comment, Favorite) à droite */}
          <ContentActions
            contentId={showId}
            contentType={contentType}
            navigation={navigation}
            allowComments={show?.allow_comments !== false}
          />
        </View>

        {/* Informations */}
        <View style={styles.infoRow}>
          {show.host && (
            <View style={styles.infoItem}>
              <Ionicons name="person" size={14} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{show.host}</Text>
            </View>
          )}
          
          {isSport && show.sport_type && (
            <View style={styles.infoItem}>
              <Ionicons name="basketball" size={14} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{show.sport_type}</Text>
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
          
          {show.edition && (
            <View style={styles.infoItem}>
              <Ionicons name="newspaper" size={14} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{show.edition}</Text>
            </View>
          )}
        </View>

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

        {/* Contenus similaires */}
        {relatedContent.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="play-circle" size={18} color={'#E23E3E'} />
              <Text style={styles.relatedTitle}>
                {getRelatedTitle()} ({relatedContent.length})
              </Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedContent.map((item) => {
                // Formater la date pour l'afficher
                const itemDate = item.created_at || item.published_at || item.date || item.aired_at || item.match_date;
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
                      isFlashInfo: isFlashInfo,
                      isJTandMag: isJTandMag,
                      isDivertissement: isDivertissement,
                      isSport: isSport,
                      isReportage: isReportage,
                      isArchive: isArchive
                    })}
                  >
                    <Image
                      source={{ uri: item.thumbnail || item.image_url || item.image || 'https://via.placeholder.com/100x85' }}
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
                            <Text style={styles.relatedTime} numberOfLines={1}>{item.host}</Text>
                          </>
                        )}
                        {formattedDate && (
                          <>
                            <Ionicons name="time" size={10} color="#B0B0B0" />
                            <Text style={styles.relatedTime}>{formattedDate}</Text>
                          </>
                        )}
                        {isSport && item.sport_type && (
                          <>
                            <Ionicons name="basketball" size={10} color="#B0B0B0" />
                            <Text style={styles.relatedTime} numberOfLines={1}>{item.sport_type}</Text>
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
        onClose={() => {
          setShowPremiumModal(false);
          setRequiredCategory(null);
        }}
        requiredCategory={requiredCategory}
        onSubscribe={(plan) => {
          console.log('Plan sélectionné:', plan);
          setShowPremiumModal(false);
          setRequiredCategory(null);
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
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
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