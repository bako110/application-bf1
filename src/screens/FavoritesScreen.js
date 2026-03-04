import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import favoriteService from '../services/favoriteService';
import { useAuth } from '../contexts/AuthContext';
import { createFavoritesStyles } from '../styles/favoritesStyles';
import LoadingScreen from '../components/LoadingScreen'; // Import du loader

export default function FavoritesScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, movie, show, breaking_news, trending_show, reportage, divertissement, etc.
  const [counts, setCounts] = useState({ 
    all: 0, 
    movie: 0, 
    show: 0, 
    breaking_news: 0, 
    trending_show: 0, 
    reportage: 0, 
    divertissement: 0,
    archive: 0,
    reel: 0,
    emission_category: 0
  }); // Pour les compteurs
  const filterScrollViewRef = useRef(null); // Référence pour le défilement horizontal

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, filter]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadFavorites();
      }
    }, [user, filter])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des favoris - Filtre actuel:', filter);
      
      // Charger tous les favoris pour les compteurs (une seule fois)
      const allData = await favoriteService.getMyFavorites();
      console.log('📊 Tous les favoris chargés:', allData.length);
      
      // Compter tous les types de contenu
      const newCounts = {
        all: allData.length,
        movie: allData.filter(f => f.content_type === 'movie').length,
        show: allData.filter(f => f.content_type === 'show').length,
        breaking_news: allData.filter(f => f.content_type === 'breaking_news').length,
        trending_show: allData.filter(f => f.content_type === 'trending_show').length,
        reportage: allData.filter(f => f.content_type === 'reportage').length,
        divertissement: allData.filter(f => f.content_type === 'divertissement').length,
        archive: allData.filter(f => f.content_type === 'archive').length,
        reel: allData.filter(f => f.content_type === 'reel').length,
        emission_category: allData.filter(f => f.content_type === 'emission_category').length,
      };
      
      console.log('📈 Compteurs calculés:', newCounts);
      setCounts(newCounts);
      
      // Charger les favoris filtrés pour l'affichage
      const contentType = filter === 'all' ? null : filter;
      console.log('🔍 Chargement des favoris filtrés - Type:', contentType);
      
      const data = await favoriteService.getMyFavorites(contentType);
      console.log('✅ Favoris filtrés reçus:', data.length);
      
      // Afficher le contenu détaillé pour déboguer
      if (data.length > 0) {
        console.log('📋 Contenu détaillé des favoris reçus:');
        data.forEach((fav, index) => {
          console.log(`  [${index}] content_type: "${fav.content_type}", content_title: "${fav.content_title}"`);
        });
      }
      
      // Vérifier que les données sont bien filtrées
      if (contentType && data.length > 0) {
        const filteredCheck = data.filter(f => f.content_type === contentType);
        console.log(`🔍 Vérification filtrage ${contentType}: ${filteredCheck.length}/${data.length} correspondent`);
        
        if (filteredCheck.length !== data.length) {
          console.warn('⚠️ Le backend n\'a pas correctement filtré les données!');
          console.log('📋 Données non filtrées:', data.filter(f => f.content_type !== contentType));
        }
      }
      
      setFavorites(data);
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date inconnue';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateString);
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error, dateString);
      return 'Date invalide';
    }
  };

  const getContentTypeInfo = (contentType) => {
    const types = {
      movie: { label: 'Films', icon: 'film' },
      show: { label: 'Émissions', icon: 'tv' },
      breaking_news: { label: 'Actualités', icon: 'newspaper' },
      trending_show: { label: 'Tendances', icon: 'trending-up' },
      reportage: { label: 'Reportages', icon: 'play-circle' },
      divertissement: { label: 'Divertissements', icon: 'person' },
      archive: { label: 'Archives', icon: 'archive' },
      reel: { label: 'Reels', icon: 'videocam' },
      emission_category: { label: 'Catégories', icon: 'grid' }
    };
    return types[contentType] || { label: contentType, icon: 'help-circle' };
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    
    // Faire défiler le filtre sélectionné vers la vue
    setTimeout(() => {
      if (filterScrollViewRef.current) {
        // Trouver l'index du filtre sélectionné
        const filterOrder = ['all', 'movie', 'show', 'breaking_news', 'trending_show', 'reportage', 'divertissement', 'archive', 'reel', 'emission_category'];
        const filterIndex = filterOrder.indexOf(newFilter);
        
        if (filterIndex !== -1) {
          // Calculer la position approximative du filtre
          const filterWidth = 100; // Largeur approximative d'un filtre
          const gap = 12; // Espacement entre les filtres
          const scrollX = filterIndex * (filterWidth + gap) - 50; // Centrer le filtre
          
          filterScrollViewRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
        }
      }
    }, 100);
  };

  const handleRemoveFavorite = async (favoriteId, contentTitle) => {
    console.log('🗑️ [FavoritesScreen] handleRemoveFavorite appelé:', { favoriteId, contentTitle });
    
    Alert.alert(
      'Retirer des favoris',
      `Voulez-vous retirer "${contentTitle}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ [FavoritesScreen] Utilisateur clique sur "Retirer" pour:', favoriteId);
            try {
              console.log('🗑️ [FavoritesScreen] Appel de favoriteService.removeFavorite...');
              await favoriteService.removeFavorite(favoriteId);
              console.log('✅ [FavoritesScreen] Favori retiré avec succès, rechargement...');
              loadFavorites();
            } catch (error) {
              console.error('❌ [FavoritesScreen] Erreur lors du retrait:', error);
              Alert.alert('Erreur', 'Impossible de retirer ce favori');
            }
          },
        },
      ]
    );
  };

  // Les favoris sont déjà filtrés par le backend
  const filteredFavorites = favorites;

  const styles = createFavoritesStyles(colors);

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
      <ScrollView
        ref={filterScrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Tous ({counts.all})
          </Text>
        </TouchableOpacity>
        
        {/* Afficher tous les filtres dynamiquement */}
        {counts.movie > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'movie' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('movie')}
          >
            <Ionicons name="film-outline" size={16} color={filter === 'movie' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'movie' && styles.filterTextActive]}>
              Films ({counts.movie})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.show > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'show' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('show')}
          >
            <Ionicons name="tv-outline" size={16} color={filter === 'show' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'show' && styles.filterTextActive]}>
              Émissions ({counts.show})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.breaking_news > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'breaking_news' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('breaking_news')}
          >
            <Ionicons name="newspaper-outline" size={16} color={filter === 'breaking_news' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'breaking_news' && styles.filterTextActive]}>Actus ({counts.breaking_news})</Text>
          </TouchableOpacity>
        )}
        
        {counts.trending_show > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'trending_show' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('trending_show')}
          >
            <Ionicons name="trending-up-outline" size={16} color={filter === 'trending_show' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'trending_show' && styles.filterTextActive]}>
              Tendances ({counts.trending_show})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.reportage > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'reportage' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('reportage')}
          >
            <Ionicons name="play-circle-outline" size={16} color={filter === 'reportage' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'reportage' && styles.filterTextActive]}>
              Reportages ({counts.reportage})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.divertissement > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'divertissement' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('divertissement')}
          >
            <Ionicons name="person-outline" size={16} color={filter === 'divertissement' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'divertissement' && styles.filterTextActive]}>
              Divertissements ({counts.divertissement})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.archive > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'archive' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('archive')}
          >
            <Ionicons name="archive-outline" size={16} color={filter === 'archive' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'archive' && styles.filterTextActive]}>
              Archives ({counts.archive})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.reel > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'reel' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('reel')}
          >
            <Ionicons name="videocam-outline" size={16} color={filter === 'reel' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'reel' && styles.filterTextActive]}>
              Reels ({counts.reel})
            </Text>
          </TouchableOpacity>
        )}
        
        {counts.emission_category > 0 && (
          <TouchableOpacity
            style={[styles.filterButton, filter === 'emission_category' && styles.filterButtonActive]}
            onPress={() => handleFilterChange('emission_category')}
          >
            <Ionicons name="grid-outline" size={16} color={filter === 'emission_category' ? colors.text : colors.textSecondary} />
            <Text style={[styles.filterText, filter === 'emission_category' && styles.filterTextActive]}>
              Catégories ({counts.emission_category})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {loading ? (
        <LoadingScreen />
      ) : filteredFavorites.length > 0 ? (
        <ScrollView
          style={styles.favoritesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.favoritesContent}
        >
          <View style={styles.favoritesGrid}>
            {filteredFavorites.map((favorite) => (
              <View key={favorite.id || favorite._id || Math.random().toString()} style={styles.favoriteCard}>
                <TouchableOpacity
                  onPress={() => {
                    // Navigation selon le type de contenu
                    switch (favorite.content_type) {
                      case 'movie':
                        navigation.navigate('Accueil', { 
                          screen: 'MovieDetail', 
                          params: { movieId: favorite.content_id } 
                        });
                        break;
                      case 'show':
                        navigation.navigate('Accueil', { 
                          screen: 'ShowDetail', 
                          params: { showId: favorite.content_id } 
                        });
                        break;
                      case 'breaking_news':
                        navigation.navigate('Accueil', { 
                          screen: 'NewsDetail', 
                          params: { newsId: favorite.content_id } 
                        });
                        break;
                      case 'reportage':
                        navigation.navigate('Accueil', { 
                          screen: 'ShowDetail', 
                          params: { showId: favorite.content_id, isReportage: true } 
                        });
                        break;
                      case 'divertissement':
                        navigation.navigate('Accueil', { 
                          screen: 'ShowDetail', 
                          params: { showId: favorite.content_id, isDivertissement: true } 
                        });
                        break;
                      case 'emission_category':
                        navigation.navigate('Accueil', { 
                          screen: 'EmissionDetail', 
                          params: { 
                            emissionId: favorite.content_id,
                            title: favorite.content_title 
                          } 
                        });
                        break;
                      default:
                        console.warn('Type de contenu non géré:', favorite.content_type);
                    }
                  }}
                  style={styles.favoriteImageContainer}
                >
                  <Image
                    source={{ uri: favorite.image_url || 'https://via.placeholder.com/200x300' }}
                    style={styles.favoriteImage}
                  />
                  <View style={styles.favoriteTypeBadge}>
                    <Ionicons
                      name={getContentTypeInfo(favorite.content_type).icon}
                      size={12}
                      color={colors.text}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFavorite(favorite.id, favorite.content_title)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error || '#E23E3E'} />
                </TouchableOpacity>
                <View style={styles.favoriteInfo}>
                  <Text style={styles.favoriteTitle} numberOfLines={2}>
                    {favorite.content_title}
                  </Text>
                  <Text style={styles.favoriteDate}>
                    Ajouté le {formatDate(favorite.added_at)}
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
            onPress={() => navigation.navigate('Accueil', { screen: 'Movies' })}
          >
            <Text style={styles.exploreButtonText}>Explorer les films</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}