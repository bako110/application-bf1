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
import { colors } from '../../contexts/ThemeContext';
import movieService from '../../services/movieService';
import viewService from '../../services/viewService';
import ContentActions from '../../components/contentActions';
import ExpandableText from '../../components/ExpandableText';
import PremiumModal from '../../components/premiumModal';
import UniversalVideoPlayer from '../../components/UniversalVideoPlayer';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen({ route, navigation }) {
  const { movieId } = route.params;
  const { isPremium } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState([]);

  useEffect(() => {
    loadMovie();
  }, [movieId]);

  // Pause vidéo quand l'utilisateur quitte l'écran
  useFocusEffect(
    React.useCallback(() => {
      // L'écran est actif
      return () => {
        // L'écran n'est plus actif - arrêter la vidéo
        console.log('⏸️ Pause vidéo - utilisateur a quitté MovieDetailScreen');
      };
    }, [])
  );

  const loadMovie = async () => {
    try {
      const data = await movieService.getMovieById(movieId);
      setMovie(data);
      
      // Incrémenter les vues (fonctionne pour tous les utilisateurs)
      await viewService.incrementView(movieId, 'movie');
      
      // Charger les films similaires
      const allMovies = await movieService.getAllMovies({ limit: 50 });
      const filtered = allMovies
        .filter(item => (item.id || item._id) !== movieId);
      setRelatedMovies(filtered);
    } catch (error) {
      console.error('Erreur chargement film:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (movie?.is_premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    // La vidéo se lit directement dans le VideoPlayer
    // Pas de navigation vers une autre page
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#E23E3E'} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Film introuvable</Text>
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
        <UniversalVideoPlayer
          videoUrl={movie?.video_url}
          posterUrl={movie?.image_url}
          onPlayPress={handlePlay}
          isPremium={movie?.is_premium || false}
          userHasPremium={isPremium}
          onPremiumRequired={() => setShowPremiumModal(true)}
          style={styles.headerVideo}
        />
        
        {/* Bouton retour - Masqué car déjà géré par le header */}
        {/* <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity> */}

        {/* Badge Premium */}
        {movie.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre */}
        <Text style={styles.title}>{movie.title}</Text>

        {/* Informations */}
        <View style={styles.infoRow}>
          {movie.genre && (
            <View style={styles.infoItem}>
              <Ionicons name="film" size={16} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{movie.genre}</Text>
            </View>
          )}
          {movie.duration && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{movie.duration} min</Text>
            </View>
          )}
          {movie.year && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={'#B0B0B0'} />
              <Text style={styles.infoText}>{movie.year}</Text>
            </View>
          )}
        </View>


        {/* Actions (Like, Comment, Favorite) */}
        <ContentActions
          contentId={movieId}
          contentType="movie"
          navigation={navigation}
        />

        {/* Description */}
        {movie.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <ExpandableText
              text={movie.description}
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
            {movie.director && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Réalisateur</Text>
                <Text style={styles.detailValue}>{movie.director}</Text>
              </View>
            )}
            {movie.cast && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Acteurs</Text>
                <Text style={styles.detailValue}>{movie.cast}</Text>
              </View>
            )}
            {movie.created_at && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ajouté le</Text>
                <Text style={styles.detailValue}>
                  {new Date(movie.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Films similaires */}
        {relatedMovies.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="film" size={20} color={'#E23E3E'} />
              <Text style={styles.relatedTitle}>Films similaires</Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedMovies.map((item) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={styles.relatedCard}
                  onPress={() => navigation.push('MovieDetail', { movieId: item.id || item._id })}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.relatedImage}
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.genre && (
                      <Text style={styles.relatedTime}>{item.genre}</Text>
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
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#E23E3E',
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
    height: width * 1.5,
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
  premiumBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
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
    fontSize: 12,
    color: '#B0B0B0',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E23E3E',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
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
    fontSize: 12,
    color: '#B0B0B0',
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  relatedTime: {
    fontSize: 12,
    color: '#B0B0B0',
  },
});
