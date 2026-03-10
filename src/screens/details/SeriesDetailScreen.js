import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import seriesService from '../../services/seriesService';
import viewService from '../../services/viewService';
import ContentActions from '../../components/contentActions';
import ExpandableText from '../../components/ExpandableText';
import PremiumModal from '../../components/premiumModal';
import SnakeLoader from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function SeriesDetailScreen({ route, navigation }) {
  const { seriesId } = route.params;
  const { colors } = useTheme();
  const { user, isPremium, isAuthenticated } = useAuth();
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [requiredCategory, setRequiredCategory] = useState(null);
  const [relatedSeries, setRelatedSeries] = useState([]);

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log('⏸️ Utilisateur a quitté SeriesDetailScreen');
      };
    }, [])
  );

  const loadSeriesData = async () => {
    try {
      setLoading(true);
      
      // Charger les détails de la série
      const seriesData = await seriesService.getSeriesById(seriesId);
      setSeries(seriesData);
      
      // Incrémenter les vues
      await viewService.incrementView(seriesId, 'series');
      
      // Charger les saisons
      const seasonsData = await seriesService.getSeasonsBySeries(seriesId);
      setSeasons(seasonsData || []);
      
      // Charger les séries similaires
      if (seriesData.genre) {
        // Gérer genre comme array ou string
        let firstGenre;
        if (Array.isArray(seriesData.genre)) {
          firstGenre = seriesData.genre[0];
        } else if (typeof seriesData.genre === 'string') {
          firstGenre = seriesData.genre.split(',')[0].trim();
        }
        
        if (firstGenre) {
          const similarData = await seriesService.getSeriesByGenre(firstGenre);
          const filtered = similarData.filter(item => item.id !== seriesId).slice(0, 6);
          setRelatedSeries(filtered);
        }
      }
    } catch (error) {
      console.error('Erreur chargement série:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonPress = (season) => {
    // Vérifier si la série nécessite un abonnement
    if (series?.required_subscription_category) {
      if (!isAuthenticated) {
        const badge = getSubscriptionBadge(series.required_subscription_category);
        Alert.alert(
          '🔒 Connexion Requise',
          `Cette série nécessite un abonnement ${badge.label} pour être visionnée.`,
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
      const hasAccess = canUserAccessContent(userCategory, series.required_subscription_category);
      
      if (!hasAccess) {
        const badge = getSubscriptionBadge(series.required_subscription_category);
        let message = `Cette série nécessite un abonnement ${badge.label}.`;
        
        if (userCategory) {
          const userBadge = getSubscriptionBadge(userCategory);
          message += `\n\nVotre abonnement actuel : ${userBadge.label}\nAbonnement requis : ${badge.label}`;
        }
        
        message += `\n\nDécouvrez nos offres d'abonnement pour accéder à toutes les séries.`;
        
        Alert.alert(
          '🔒 Abonnement Requis',
          message,
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Voir les offres', 
              onPress: () => {
                setRequiredCategory(series.required_subscription_category);
                setShowPremiumModal(true);
              }
            }
          ]
        );
        return;
      }
    }
    
    navigation.navigate('SeasonDetail', {
      seriesId: series.id || series._id,
      seasonId: season.id || season._id,
      seriesTitle: series.title,
      seasonNumber: season.seasonNumber,
      required_subscription_category: series.required_subscription_category,
    });
  };

  const renderSeasonCard = ({ item: season }) => {
    return (
      <TouchableOpacity
        style={[styles.seasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleSeasonPress(season)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: season.posterUrl || series?.posterUrl || 'https://via.placeholder.com/300x450' }}
          style={styles.seasonImage}
          resizeMode="cover"
        />
        
        <View style={styles.seasonContent}>
          <View style={styles.seasonHeader}>
            <Text style={[styles.seasonTitle, { color: colors.text }]}>
              Saison {season.seasonNumber}
            </Text>
            {series?.isPremium && (
              <View style={styles.premiumBadgeSmall}>
                <Ionicons name="star" size={12} color="#92400E" />
                <Text style={styles.premiumTextSmall}>Premium</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.seasonEpisodes, { color: colors.textSecondary }]}>
            {season.totalEpisodes || 0} épisode{season.totalEpisodes > 1 ? 's' : ''}
          </Text>
          
          {season.description && (
            <Text style={[styles.seasonDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {season.description}
            </Text>
          )}
          
          <View style={styles.seasonFooter}>
            <Text style={[styles.seasonYear, { color: colors.textSecondary }]}>
              {season.releaseYear || series?.releaseYear || 'N/A'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#E23E3E" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRelatedCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.relatedCard}
        onPress={() => {
          navigation.push('SeriesDetail', { seriesId: item.id || item._id });
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.posterUrl || 'https://via.placeholder.com/200x300' }}
          style={styles.relatedImage}
          resizeMode="cover"
        />
        <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.isPremium && (
          <View style={[styles.premiumBadgeSmall, { position: 'absolute', top: 8, right: 8 }]}>
            <Ionicons name="star" size={10} color="#92400E" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <SnakeLoader size={50} />
      </View>
    );
  }

  if (!series) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="tv-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text }]}>Série introuvable</Text>
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
        {/* Header avec image */}
        <View style={styles.header}>
          <Image
            source={{ uri: series.posterUrl || 'https://via.placeholder.com/400x600' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            style={styles.headerGradient}
          >
            {series.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Titre */}
          <Text style={[styles.title, { color: colors.text }]}>{series.title}</Text>

          {/* Métadonnées et Actions sur la même ligne */}
          <View style={styles.metaAndActionsRow}>
            <View style={styles.metaRow}>
              {series.releaseYear && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {series.releaseYear}
                  </Text>
                </View>
              )}
              {series.totalSeasons && (
                <View style={styles.metaItem}>
                  <Ionicons name="list" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {series.totalSeasons} Saison{series.totalSeasons > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {series.totalEpisodes && (
                <View style={styles.metaItem}>
                  <Ionicons name="play-circle" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {series.totalEpisodes} Ép.
                  </Text>
                </View>
              )}
            </View>
            
            {/* Actions à droite */}
            <View style={styles.actionsContainer}>
              <ContentActions
                contentId={series.id}
                contentType="series"
                navigation={navigation}
              />
            </View>
          </View>

          {/* Genres */}
          {series.genre && (
            <View style={styles.genresContainer}>
              {(Array.isArray(series.genre) ? series.genre : series.genre.split(',')).map((genre, index) => (
                <View key={index} style={[styles.genreChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.genreText, { color: colors.text }]}>{typeof genre === 'string' ? genre.trim() : genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Statut */}
          {series.status && (
            <View style={styles.statusContainer}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Statut : </Text>
              <View style={[
                styles.statusBadge,
                series.status === 'ongoing' && styles.statusOngoing,
                series.status === 'completed' && styles.statusCompleted,
                series.status === 'upcoming' && styles.statusUpcoming,
              ]}>
                <Text style={styles.statusText}>
                  {series.status === 'ongoing' ? 'En cours' :
                   series.status === 'completed' ? 'Terminée' :
                   series.status === 'upcoming' ? 'À venir' : series.status}
                </Text>
              </View>
            </View>
          )}

          {/* Liste des saisons */}
          <View style={styles.seasonsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Saisons ({seasons.length})
            </Text>
            {seasons.length > 0 ? (
              <FlatList
                data={seasons}
                keyExtractor={(item) => item.id}
                renderItem={renderSeasonCard}
                scrollEnabled={false}
                contentContainerStyle={styles.seasonsList}
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune saison disponible
              </Text>
            )}
          </View>

          {/* Séries similaires */}
          {relatedSeries.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Séries similaires
              </Text>
              <FlatList
                horizontal
                data={relatedSeries}
                keyExtractor={(item) => item.id}
                renderItem={renderRelatedCard}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Premium */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => {
          setShowPremiumModal(false);
          setRequiredCategory(null);
        }}
        requiredCategory={requiredCategory}
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
    width: '100%',
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  premiumBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  premiumTextSmall: {
    color: '#92400E',
    fontSize: 8,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metaAndActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    marginLeft: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOngoing: {
    backgroundColor: '#E23E3E',
  },
  statusCompleted: {
    backgroundColor: '#10B981',
  },
  statusUpcoming: {
    backgroundColor: '#3B82F6',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seasonsSection: {
    marginTop: 12,
  },
  seasonsList: {
    gap: 6,
  },
  seasonCard: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  seasonImage: {
    width: 60,
    height: 78,
  },
  seasonContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  seasonEpisodes: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  seasonDescription: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  seasonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seasonYear: {
    fontSize: 10,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  relatedSection: {
    marginTop: 32,
  },
  relatedList: {
    paddingTop: 8,
  },
  relatedCard: {
    width: 140,
    marginRight: 12,
  },
  relatedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
