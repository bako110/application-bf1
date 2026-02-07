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
import movieService from '../services/movieService';
import ContentActions from '../components/contentActions';
import PremiumModal from '../components/premiumModal';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen({ route, navigation }) {
  const { movieId } = route.params;
  const { isPremium } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    loadMovie();
  }, [movieId]);

  const loadMovie = async () => {
    try {
      const data = await movieService.getMovieById(movieId);
      setMovie(data);
    } catch (error) {
      console.error('Erreur chargement film:', error);
    }
    setLoading(false);
  };

  const handlePlay = () => {
    if (movie?.is_premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    navigation.navigate('MoviePlayer', { movie });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image de couverture */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: movie.image_url || 'https://via.placeholder.com/400x600' }}
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
              <Ionicons name="film" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{movie.genre}</Text>
            </View>
          )}
          {movie.duration && (
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{movie.duration} min</Text>
            </View>
          )}
          {movie.year && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{movie.year}</Text>
            </View>
          )}
        </View>

        {/* Bouton de lecture */}
        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons name="play" size={28} color="#fff" />
          <Text style={styles.playButtonText}>Regarder maintenant</Text>
        </TouchableOpacity>

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
            <Text style={styles.description}>{movie.description}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
    flex: 1,
    textAlign: 'right',
  },
});
