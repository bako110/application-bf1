import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import movieService from '../services/movieService';
import likeService from '../services/likeService';

const { width: screenWidth } = Dimensions.get('window');

export default function MoviesScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likesData, setLikesData] = useState({}); // {movieId: {liked: bool, count: number}}
  const [selectedGenre, setSelectedGenre] = useState('Tous');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, title
  const [viewMode, setViewMode] = useState('list'); // row, grid, list
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const genres = ['Tous', 'Action', 'Drame', 'Comédie', 'Thriller', 'Romance', 'Documentaire'];

  useEffect(() => {
    loadMovies();
  }, [filter]);

  // Rafraîchir les films quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      loadMovies();
    }, [filter])
  );

  const loadMovies = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === 'premium') {
        data = await movieService.getPremiumMovies();
      } else if (filter === 'free') {
        data = await movieService.getFreeMovies();
      } else {
        data = await movieService.getAllMovies({ limit: 50 });
      }
      setMovies(data);
      
      // Charger les likes pour chaque film
      await loadLikesData(data);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikesData = async (moviesData) => {
    const likesInfo = {};
    for (const movie of moviesData) {
      try {
        const [liked, count] = await Promise.all([
          likeService.checkLiked(movie.id, 'movie'),
          likeService.countLikes(movie.id, 'movie')
        ]);
        likesInfo[movie.id] = { liked, count };
      } catch (error) {
        likesInfo[movie.id] = { liked: false, count: 0 };
      }
    }
    setLikesData(likesInfo);
  };

  const handleLike = async (movieId) => {
    if (!movieId) {
      console.error('movieId est undefined ou null');
      return;
    }

    try {
      const result = await likeService.toggleLike(movieId, 'movie');
      console.log('❤️ Résultat toggle like:', result);
      
      // Mettre à jour l'état local immédiatement
      const currentLikeData = likesData[movieId] || { liked: false, count: 0 };
      const newLiked = result.action === 'liked';
      const newCount = newLiked ? currentLikeData.count + 1 : Math.max(0, currentLikeData.count - 1);
      
      setLikesData(prev => ({
        ...prev,
        [movieId]: { liked: newLiked, count: newCount }
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      if (error.requiresAuth) {
        alert('Vous devez être connecté pour liker un film. Veuillez vous connecter depuis votre profil.');
        navigation.navigate('Profil');
      }
    }
  };

  const filteredMovies = movies
    .filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'Tous' || movie.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (likesData[b.id]?.count || 0) - (likesData[a.id]?.count || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return b.id - a.id;
      }
    });

  return (
    <View style={styles.container}>
      {/* Compact Header with Search and Filter */}
      <View style={styles.compactHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un film..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterIconButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={26} color="#fff" />
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>•</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtrer les films</Text>

          <TouchableOpacity 
            onPress={() => {
              setFilter('all');
              setSelectedGenre('Tous');
              setSortBy('recent');
              setViewMode('grid');
            }} 
            style={styles.resetBtn}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.resetBtnText}>Réinitialiser</Text>
          </TouchableOpacity>

          {/* Type de contenu */}
          <Text style={styles.modalLabel}>Type de contenu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'free' && styles.filterBtnActive]}
              onPress={() => setFilter('free')}
            >
              <Text style={[styles.filterBtnText, filter === 'free' && styles.filterBtnTextActive]}>
                Gratuit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'premium' && styles.filterBtnActive]}
              onPress={() => setFilter('premium')}
            >
              <Text style={[styles.filterBtnText, filter === 'premium' && styles.filterBtnTextActive]}>
                Premium
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Genres */}
          <Text style={styles.modalLabel}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[styles.filterBtn, selectedGenre === genre && styles.filterBtnActive]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[styles.filterBtnText, selectedGenre === genre && styles.filterBtnTextActive]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tri */}
          <Text style={styles.modalLabel}>Trier par</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, sortBy === 'recent' && styles.filterBtnActive]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.filterBtnText, sortBy === 'recent' && styles.filterBtnTextActive]}>Récent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, sortBy === 'popular' && styles.filterBtnActive]}
              onPress={() => setSortBy('popular')}
            >
              <Text style={[styles.filterBtnText, sortBy === 'popular' && styles.filterBtnTextActive]}>Populaire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, sortBy === 'title' && styles.filterBtnTextActive]}
              onPress={() => setSortBy('title')}
            >
              <Text style={[styles.filterBtnText, sortBy === 'title' && styles.filterBtnTextActive]}>A-Z</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Mode d'affichage */}
          <Text style={styles.modalLabel}>Affichage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, viewMode === 'row' && styles.filterBtnActive]}
              onPress={() => setViewMode('row')}
            >
              <Text style={[styles.filterBtnText, viewMode === 'row' && styles.filterBtnTextActive]}>Horizontal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, viewMode === 'grid' && styles.filterBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={[styles.filterBtnText, viewMode === 'grid' && styles.filterBtnTextActive]}>Grille</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, viewMode === 'list' && styles.filterBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.filterBtnText, viewMode === 'list' && styles.filterBtnTextActive]}>Liste</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.modalApplyBtnText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Movies Display */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'row' ? (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.moviesContainer}
          contentContainerStyle={styles.moviesRowContent}
        >
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie) => (
              <TouchableOpacity 
                key={movie.id} 
                style={styles.movieCardRow}
                onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
              >
                <Image
                  source={{ uri: movie.image_url || 'https://via.placeholder.com/200x300' }}
                  style={styles.movieImageRow}
                />
                {movie.is_premium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLike(movie.id);
                  }}
                >
                  <Ionicons 
                    name={likesData[movie.id]?.liked ? "heart" : "heart-outline"}
                    size={20} 
                    color={likesData[movie.id]?.liked ? colors.error : colors.text}
                  />
                  {likesData[movie.id]?.count > 0 && (
                    <Text style={styles.likeCount}>{likesData[movie.id].count}</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.movieInfo}>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {movie.title}
                  </Text>
                  {movie.genre && (
                    <Text style={styles.movieGenre}>{movie.genre}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun film trouvé' : 'Aucun film disponible'}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.moviesContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.moviesContent}
        >
          {filteredMovies.length > 0 ? (
            <View style={viewMode === 'grid' ? styles.moviesGrid : styles.moviesList}>
              {filteredMovies.map((movie) => (
                viewMode === 'grid' ? (
                  <TouchableOpacity 
                    key={movie.id} 
                    style={styles.movieCard}
                    onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
                  >
                    <Image
                      source={{ uri: movie.image_url || 'https://via.placeholder.com/200x300' }}
                      style={styles.movieImage}
                    />
                    {movie.is_premium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLike(movie.id);
                      }}
                    >
                      <Ionicons 
                        name={likesData[movie.id]?.liked ? "heart" : "heart-outline"}
                        size={20} 
                        color={likesData[movie.id]?.liked ? colors.error : colors.text}
                      />
                      {likesData[movie.id]?.count > 0 && (
                        <Text style={styles.likeCount}>{likesData[movie.id].count}</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.movieInfo}>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      {movie.genre && (
                        <Text style={styles.movieGenre}>{movie.genre}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    key={movie.id} 
                    style={styles.movieListItem}
                    onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
                  >
                    <Image
                      source={{ uri: movie.image_url || 'https://via.placeholder.com/200x300' }}
                      style={styles.movieListImage}
                    />
                    <View style={styles.movieListInfo}>
                      <Text style={styles.movieListTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      {movie.genre && (
                        <Text style={styles.movieListGenre}>{movie.genre}</Text>
                      )}
                      <View style={styles.movieListMeta}>
                        {movie.is_premium && (
                          <View style={styles.premiumTag}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.premiumTagText}>Premium</Text>
                          </View>
                        )}
                        <View style={styles.likesInfo}>
                          <Ionicons name="heart" size={14} color={colors.error} />
                          <Text style={styles.likesInfoText}>{likesData[movie.id]?.count || 0}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.listLikeButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLike(movie.id);
                      }}
                    >
                      <Ionicons 
                        name={likesData[movie.id]?.liked ? "heart" : "heart-outline"}
                        size={24} 
                        color={likesData[movie.id]?.liked ? colors.error : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun film trouvé' : 'Aucun film disponible'}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>Effacer la recherche</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  filtersWrapper: {
    height: 48,
    marginBottom: 4,
  },
  filtersContainer: {
    flexGrow: 0,
    height: 48,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    marginRight: 12,
    minWidth: 60,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterTextActive: {
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moviesContainer: {
    flex: 1,
  },
  moviesContent: {
    flexGrow: 1,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  movieCard: {
    width: screenWidth < 500 ? '48%' : screenWidth < 768 ? '31%' : '23%',
    marginBottom: 16,
  },
  movieImage: {
    width: '100%',
    height: screenWidth < 500 ? 240 : screenWidth < 768 ? 200 : 180,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 20,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 20,
  },
  movieInfo: {
    marginTop: 8,
  },
  movieTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  movieGenre: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  likeCount: {
    color: colors.text,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  genresWrapper: {
    marginBottom: 12,
  },
  genresContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  genreTextActive: {
    color: colors.text,
  },
  optionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
  },
  sortText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortTextActive: {
    color: colors.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  viewButtonActive: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
  },
  moviesList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  movieListItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  movieListImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  movieListInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  movieListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  movieListGenre: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  movieListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  premiumTagText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },
  likesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listLikeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 16,
    padding: 8,
  },
  resetBtnText: {
    color: colors.primary,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 12,
  },
  filterBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    marginLeft: 8,
  },
  modalApplyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  moviesRowContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  movieCardRow: {
    width: 180,
    marginRight: 16,
  },
  movieImageRow: {
    width: 180,
    height: 270,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
});