import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import movieService from '../services/movieService';
import likeService from '../services/likeService';
import usePagination from '../hooks/usePagination';
import LoadingFooter from '../components/LoadingFooter';
import { createMoviesStyles } from '../styles/moviesStyles'; // Import des styles séparés

const { width: screenWidth } = Dimensions.get('window');

export default function MoviesScreen({ navigation }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likesData, setLikesData] = useState({}); // {movieId: {liked: bool, count: number}}
  const [selectedGenre, setSelectedGenre] = useState('Tous');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, title
  const [viewMode, setViewMode] = useState('list'); // row, grid, list
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const genres = ['Tous', 'Action', 'Drame', 'Comédie', 'Thriller', 'Romance', 'Documentaire'];

  // Pagination
  const fetchMovies = async (skip, limit) => {
    if (filter === 'premium') {
      return await movieService.getPremiumMovies({ skip, limit });
    } else if (filter === 'free') {
      return await movieService.getFreeMovies({ skip, limit });
    } else {
      return await movieService.getAllMovies({ skip, limit });
    }
  };

  const {
    data: movies,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData: setMovies,
  } = usePagination(fetchMovies, 20);

  useEffect(() => {
    loadInitial();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (movies.length === 0) {
        loadInitial();
      }
    }, [])
  );

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

  const styles = createMoviesStyles(colors, screenWidth);

  return (
    <View style={styles.container}>
      {/* Compact Header with Search and Filter */}
      <View style={styles.compactHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={'#B0B0B0'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un film..."
            placeholderTextColor={'#B0B0B0'}
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
            <Ionicons name="refresh" size={16} color={'#E23E3E'} />
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
        <LoadingScreen />
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
                    color={likesData[movie.id]?.liked ? '#FF0000' : '#FFFFFF'}
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
              <Ionicons name="film-outline" size={60} color={'#B0B0B0'} />
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
                        color={likesData[movie.id]?.liked ? '#FF0000' : '#FFFFFF'}
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
                          <Ionicons name="heart" size={14} color={'#FF0000'} />
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
                        color={likesData[movie.id]?.liked ? '#FF0000' : '#B0B0B0'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={60} color={'#B0B0B0'} />
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
          <LoadingFooter loading={loadingMore} hasMore={hasMore} />
        </ScrollView>
      )}
    </View>
  );
}