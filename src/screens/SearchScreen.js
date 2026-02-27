import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import searchService from '../services/searchService';
import { createSearchStyles } from '../styles/searchStyles';

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createSearchStyles(colors);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    items: [],
    categoryResults: {},
    suggestions: [],
    totalFound: 0,
    hasMore: false
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);
  
  // Créer la recherche avec debouncing
  const debouncedSearch = useRef(
    searchService.createDebouncedSearch(300)
  ).current;

  useEffect(() => {
    // Focus automatique sur l'entrée de recherche
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Effet pour la recherche en temps réel
  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.trim().length < 2) {
        setResults({
          items: [],
          categoryResults: {},
          suggestions: [],
          totalFound: 0,
          hasMore: false
        });
        return;
      }

      setLoading(true);
      try {
        // Recherche dynamique avec debounce
        const searchResults = await debouncedSearch(query.trim(), {
          limit: 8, // 8 résultats par catégorie
          minQueryLength: 2
        });
        
        console.log(' [FRONTEND] Résultats reçus:', searchResults);
        console.log(' [FRONTEND] Items:', searchResults.items?.length || 0);
        console.log(' [FRONTEND] CategoryResults:', searchResults.categoryResults);
        
        // Log détaillé de chaque catégorie
        Object.entries(searchResults.categoryResults || {}).forEach(([category, items]) => {
          console.log(` [FRONTEND] ${category}: ${items?.length || 0} items`);
        });
        
        console.log(' [FRONTEND] TotalFound:', searchResults.totalFound);
        console.log(' [FRONTEND] Query:', searchResults.query);
        
        setResults(searchResults);
      } catch (error) {
        console.error(' [FRONTEND] Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]); // ← Déclenché à chaque changement de query

  const addToRecentSearches = (search) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search);
      return [search, ...filtered].slice(0, 5);
    });
  };

  const clearSearch = () => {
    setQuery('');
    setResults({
      items: [],
      categoryResults: {},
      suggestions: [],
      totalFound: 0,
      hasMore: false
    });
    searchInputRef.current?.focus();
  };

  const navigateToDetail = (item) => {
    // Ajouter à l'historique des recherches
    addToRecentSearches(query);
    
    // Navigation selon le type
    switch (item.type) {
      case 'emission':
        navigation.navigate('EmissionDetail', { emissionId: item.id });
        break;
      case 'show':
        navigation.navigate('ShowDetail', { showId: item.id });
        break;
      case 'reportage':
        navigation.navigate('ShowDetail', { showId: item.id, isReportage: true });
        break;
      case 'divertissement':
        navigation.navigate('ShowDetail', { showId: item.id, isDivertissement: true });
        break;
      case 'jtandmag':
        navigation.navigate('ShowDetail', { showId: item.id, isJTandMag: true });
        break;
      case 'news':
        navigation.navigate('NewsDetail', { newsId: item.id });
        break;
      case 'program':
        navigation.navigate('ShowDetail', { showId: item.id, isProgram: true });
        break;
      default:
        console.warn('Unknown content type:', item.type);
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigateToDetail(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150x100' }}
        style={styles.resultImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.resultGradient}
      >
        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>
            {item.type === 'emission' ? 'Émission' : 
             item.type === 'show' ? 'Programme' : 
             item.type === 'reportage' ? 'Reportage' :
             item.type === 'divertissement' ? 'Divertissement' :
             item.type === 'jtandmag' ? 'JT/Mag' :
             item.type === 'news' ? 'Actualité' : 
             item.type === 'program' ? 'Programme TV' : 'Contenu'}
          </Text>
        </View>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.resultDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  // Rendu des suggestions
  const renderSuggestions = () => {
    if (!query || query.length < 2 || results.suggestions.length === 0) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggestions</Text>
        {results.suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => setQuery(suggestion)}
          >
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Rendu des résultats par catégorie
  const renderCategoryResults = () => {
    if (results.items.length === 0) return null;

    return Object.entries(results.categoryResults).map(([category, items]) => {
      if (items.length === 0) return null;

      return (
        <View key={category} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons 
              name={
                category === 'emissions' ? 'tv' :
                category === 'shows' ? 'play-circle' :
                category === 'reportages' ? 'film' :
                category === 'divertissements' ? 'mic' :
                category === 'jtandmag' ? 'newspaper' :
                category === 'news' ? 'flash' :
                category === 'programs' ? 'calendar' : 'help-circle'
              } 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>
              {category === 'emissions' ? 'Émissions' :
               category === 'shows' ? 'Programmes' :
               category === 'reportages' ? 'Reportages' :
               category === 'divertissements' ? 'Divertissements' :
               category === 'jtandmag' ? 'JT et Mag' :
               category === 'news' ? 'Actualités' :
               category === 'programs' ? 'Programmes TV' : category}
            </Text>
            <Text style={styles.sectionCount}>({items.length})</Text>
          </View>
          <FlatList
            horizontal
            data={items}
            renderItem={renderResultItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionContent}
          />
        </View>
      );
    });
  };

  // Rendu des recherches récentes
  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <View style={styles.recentSearches}>
        <Text style={styles.recentTitle}>Recherches récentes</Text>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => setQuery(search)}
          >
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.recentText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Rechercher émissions, programmes, actualités..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery} // ← Changement en temps réel
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            // Recherche manuelle si nécessaire
            if (query.trim().length >= 2) {
              // La recherche se fait automatiquement via useEffect
              // Mais on peut forcer une recherche si besoin
              console.log('Recherche manuelle déclenchée pour:', query);
            }
          }}
          disabled={query.trim().length < 2}
        >
          <Text style={styles.searchButtonText}>Chercher</Text>
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {renderSuggestions()}

      {/* Résultats */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        ) : query.trim().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Recherchez du contenu</Text>
            <Text style={styles.emptySubtitle}>
              Trouvez vos émissions, programmes, reportages, JT et actualités préférés
            </Text>
            {renderRecentSearches()}
          </View>
        ) : results.totalFound === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySubtitle}>
              Essayez avec d'autres mots-clés
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.totalFound} résultat{results.totalFound > 1 ? 's' : ''} trouvé{results.totalFound > 1 ? 's' : ''}
              </Text>
            </View>
            {renderCategoryResults()}
          </>
        )}
      </ScrollView>
    </View>
  );
}