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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../contexts/ThemeContext';
import showService from '../services/showService';
import api from '../config/api';
import ContentActions from '../components/contentActions';
import PremiumModal from '../components/premiumModal';
import { useAuth } from '../contexts/AuthContext';
import { formatLongDate, formatRelativeTime } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function ShowDetailScreen({ route, navigation }) {
  const { showId, isTrending, isPopularProgram, isReplay = false, isInterview = false } = route.params || {};
  const { isPremium } = useAuth();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Déterminer le contentType selon le type de contenu
  const contentType = isReplay ? 'replay' : (isInterview ? 'interview' : (isTrending ? 'trending_show' : (isPopularProgram ? 'popular_program' : 'show')));

  useEffect(() => {
    loadShow();
  }, [showId]);

  const loadShow = async () => {
    try {
      console.log('📺 ShowDetailScreen - Params:', { showId, isReplay, isTrending, isPopularProgram, isInterview });
      console.log('📺 Types:', { 
        isReplay: typeof isReplay, 
        isReplayValue: isReplay,
        isInterview: typeof isInterview,
        isInterviewValue: isInterview,
        isTrending: typeof isTrending,
        isTrendingValue: isTrending 
      });
      
      let data;
      if (isReplay === true) {
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
    } catch (error) {
      console.error('❌ Erreur chargement émission:', error);
    }
    setLoading(false);
  };

  const handlePlay = () => {
    if (show?.is_premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // Déterminer l'URL selon le type de contenu
    let url;
    if (isReplay) {
      // Pour les replays, utiliser video_url
      url = show?.video_url || show?.replay_url || show?.url;
    } else {
      // Pour les shows, utiliser live_url ou replay_url
      url = show?.is_live ? show?.live_url : show?.replay_url;
    }
    
    navigation.navigate('LiveShowFullScreen', {
      stream: {
        url,
        title: show?.title,
        host: show?.host || 'BF1',
        is_live: !!show?.is_live,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      {/* Image de couverture */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: show.image_url || 'https://via.placeholder.com/400x600' }}
          style={styles.coverImage}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.gradient}
        />
        
        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Badge Live ou Replay */}
        {show.is_live && (
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
              <Ionicons name="person" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{show.host}</Text>
            </View>
          )}
          {show.start_time && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {new Date(show.start_time).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Bouton de lecture */}
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons name="play" size={28} color="#fff" />
          <Text style={styles.playButtonText}>
            {show.is_live ? 'Regarder en direct' : 'Voir le replay'}
          </Text>
        </TouchableOpacity>

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
            <Text style={styles.description}>{show.description}</Text>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: width,
    height: width * 1.2,
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
    color: colors.text,
    marginBottom: 12,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
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
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
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
    borderBottomColor: colors.surface,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});
