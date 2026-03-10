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
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import seriesService from '../../services/seriesService';
import PremiumModal from '../../components/premiumModal';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function SeasonDetailScreen({ route, navigation }) {
  const { seriesId, seasonId, seriesTitle, seasonNumber, isPremium: seriesIsPremium } = route.params;
  const { colors } = useTheme();
  const { isPremium } = useAuth();
  
  const [season, setSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    loadSeasonData();
  }, [seasonId]);

  const loadSeasonData = async () => {
    try {
      setLoading(true);
      
      // Charger les épisodes (la saison info vient des params de navigation)
      const episodesData = await seriesService.getEpisodesBySeason(seasonId);
      setEpisodes(episodesData || []);
      
      // Créer un objet season minimal à partir des params
      setSeason({
        id: seasonId,
        seasonNumber: seasonNumber,
        isPremium: seriesIsPremium || false,
      });
    } catch (error) {
      console.error('Erreur chargement saison:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodePress = (episode) => {
    if (season?.isPremium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    navigation.navigate('EpisodePlayer', {
      episodeId: episode.id || episode._id,
      episodeTitle: `S${seasonNumber}E${episode.episodeNumber} - ${episode.title}`,
      videoUrl: episode.videoUrl,
      seriesTitle: seriesTitle,
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins : ''}`;
  };

  const renderEpisodeCard = ({ item: episode, index }) => {
    const episodeNumber = episode.episodeNumber || index + 1;
    
    return (
      <TouchableOpacity
        style={[styles.episodeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleEpisodePress(episode)}
        activeOpacity={0.8}
      >
        <View style={styles.episodeImageContainer}>
          <Image
            source={{ uri: episode.thumbnailUrl || season?.posterUrl || 'https://via.placeholder.com/300x170' }}
            style={styles.episodeImage}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
          </View>
          <View style={styles.episodeNumberBadge}>
            <Text style={styles.episodeNumberText}>{episodeNumber}</Text>
          </View>
          {episode.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(episode.duration)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.episodeContent}>
          <Text style={[styles.episodeTitle, { color: colors.text }]} numberOfLines={2}>
            {episode.title || `Épisode ${episodeNumber}`}
          </Text>
          
          {episode.description && (
            <Text style={[styles.episodeDescription, { color: colors.textSecondary }]} numberOfLines={3}>
              {episode.description}
            </Text>
          )}
          
          <View style={styles.episodeMeta}>
            {episode.releaseDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {new Date(episode.releaseDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
            {episode.viewCount && (
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {episode.viewCount} vues
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E23E3E" />
      </View>
    );
  }

  if (!season && episodes.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="film-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Saison introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.seriesTitle, { color: colors.textSecondary }]}>
                {seriesTitle}
              </Text>
              <Text style={[styles.seasonTitle, { color: colors.text }]}>
                Saison {seasonNumber}
              </Text>
              <Text style={[styles.episodeCount, { color: colors.textSecondary }]}>
                {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
              </Text>
            </View>
            
            {season?.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
          </View>
          
          {season?.description && (
            <Text style={[styles.seasonDescription, { color: colors.textSecondary }]} numberOfLines={3}>
              {season.description}
            </Text>
          )}
        </View>

        {/* Liste des épisodes */}
        <View style={styles.episodesSection}>
          {episodes.length > 0 ? (
            <FlatList
              data={episodes}
              keyExtractor={(item) => item.id}
              renderItem={renderEpisodeCard}
              scrollEnabled={false}
              contentContainerStyle={styles.episodesList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun épisode disponible
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Premium */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  seriesTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  seasonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  episodeCount: {
    fontSize: 14,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  premiumText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seasonDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  episodesSection: {
    padding: 16,
  },
  episodesList: {
    gap: 16,
  },
  episodeCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  episodeImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  episodeImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  episodeNumberBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  episodeContent: {
    padding: 16,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  episodeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  episodeMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
