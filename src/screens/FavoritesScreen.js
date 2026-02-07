import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import favoriteService from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';

export default function FavoritesScreen({ navigation }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, movie, show

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoriteService.getMyFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId, contentTitle) => {
    Alert.alert(
      'Retirer des favoris',
      `Voulez-vous retirer "${contentTitle}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteService.removeFavorite(favoriteId);
              loadFavorites();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de retirer ce favori');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToContent = (favorite) => {
    if (favorite.content_type === 'movie') {
      navigation.navigate('Films', {
        screen: 'MovieDetail',
        params: { movieId: favorite.movie_id }
      });
    } else if (favorite.content_type === 'show') {
      navigation.navigate('Programme', {
        screen: 'ShowDetail',
        params: { showId: favorite.show_id }
      });
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    if (filter === 'all') return true;
    return fav.content_type === filter;
  });

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Connectez-vous</Text>
          <Text style={styles.emptyText}>
            Connectez-vous pour voir vos favoris
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Profil')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tous ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'movie' && styles.filterButtonActive]}
          onPress={() => setFilter('movie')}
        >
          <Ionicons name="film" size={16} color={filter === 'movie' ? colors.text : colors.textSecondary} />
          <Text style={[styles.filterText, filter === 'movie' && styles.filterTextActive]}>
            Films ({favorites.filter(f => f.content_type === 'movie').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'show' && styles.filterButtonActive]}
          onPress={() => setFilter('show')}
        >
          <Ionicons name="tv" size={16} color={filter === 'show' ? colors.text : colors.textSecondary} />
          <Text style={[styles.filterText, filter === 'show' && styles.filterTextActive]}>
            Émissions ({favorites.filter(f => f.content_type === 'show').length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredFavorites.length > 0 ? (
        <ScrollView
          style={styles.favoritesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.favoritesContent}
        >
          <View style={styles.favoritesGrid}>
            {filteredFavorites.map((favorite) => (
              <View key={favorite.id} style={styles.favoriteCard}>
                <TouchableOpacity
                  onPress={() => handleNavigateToContent(favorite)}
                  style={styles.favoriteImageContainer}
                >
                  <Image
                    source={{ uri: favorite.image_url || 'https://via.placeholder.com/200x300' }}
                    style={styles.favoriteImage}
                  />
                  <View style={styles.favoriteTypeBadge}>
                    <Ionicons
                      name={favorite.content_type === 'movie' ? 'film' : 'tv'}
                      size={12}
                      color={colors.text}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFavorite(favorite.id, favorite.content_title)}
                >
                  <Ionicons name="heart" size={20} color={colors.error} />
                </TouchableOpacity>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteTitle} numberOfLines={2}>
                    {favorite.content_title}
                  </Text>
                  <Text style={styles.favoriteDate}>
                    Ajouté le {new Date(favorite.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Ajoutez des films et émissions à vos favoris en cliquant sur l'étoile ⭐
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Films')}
          >
            <Text style={styles.exploreButtonText}>Explorer les films</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesContainer: {
    flex: 1,
  },
  favoritesContent: {
    paddingBottom: 24,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  favoriteCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 20,
  },
  favoriteImageContainer: {
    position: 'relative',
  },
  favoriteImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  favoriteTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 20,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 20,
  },
  favoriteInfo: {
    marginTop: 8,
  },
  favoriteTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
