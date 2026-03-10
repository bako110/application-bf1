import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import seriesService from '../services/seriesService';
import { createSeriesStyles } from '../styles/seriesStyles';
import SnakeLoader from '../components/LoadingScreen';

export default function SeriesScreen({ navigation }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  
  // Calculer le nombre de colonnes selon la largeur (comme sportScreen)
  const numColumns = width > 1200 ? 5 : width > 900 ? 4 : width > 600 ? 3 : 2;
  const styles = createSeriesStyles(colors, numColumns);
  
  // États simples
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filtres simples avec icônes
  const filters = [
    { key: 'all', label: 'Tout', icon: 'apps' },
    { key: 'premium', label: 'Premium', icon: 'star' },
    { key: 'free', label: 'Gratuit', icon: 'gift' },
    { key: 'new', label: 'Nouveautés', icon: 'sparkles' },
  ];

  // Fonction helper pour obtenir le badge de catégorie
  const getSubscriptionBadge = (category) => {
    if (!category) return { label: 'Gratuit', color: '#4CAF50', icon: 'checkmark-circle' };
    if (category === 'basic') return { label: 'Basic', color: '#2196F3', icon: 'shield' };
    if (category === 'standard') return { label: 'Standard', color: '#9C27B0', icon: 'shield-checkmark' };
    if (category === 'premium') return { label: 'Premium', color: '#FF6F00', icon: 'star' };
    return { label: 'Gratuit', color: '#4CAF50', icon: 'checkmark-circle' };
  };

  // Chargement des séries quand le filtre change
  useEffect(() => {
    loadSeries();
  }, [selectedFilter]);

  // Fonction de chargement simple
  const loadSeries = async () => {
    try {
      setLoading(true);
      
      // Préparer les paramètres selon le filtre
      let params = {};
      if (selectedFilter === 'premium') {
        params.required_subscription_category = 'premium';
      } else if (selectedFilter === 'free') {
        params.required_subscription_category = null;
      } else if (selectedFilter === 'new') {
        params.status = 'ongoing'; // Séries en cours = nouvelles
      }
      
      console.log('📺 [DEBUG] Filtre sélectionné:', selectedFilter);
      console.log('📺 [DEBUG] Paramètres envoyés:', params);
      
      // Charger depuis le backend
      const data = await seriesService.getAllSeries(params);
      console.log('📺 [DEBUG] Nombre de séries reçues:', data.length);
      if (data.length > 0) {
        console.log('📺 [DEBUG] Première série - required_subscription_category:', data[0].required_subscription_category);
      }
      setSeries(data || []);
    } catch (error) {
      console.error('Erreur chargement séries:', error);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchissement simple
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSeries();
    setRefreshing(false);
  };

  // Render d'une carte série (système sportScreen)
  const renderSeriesCard = ({ item }) => {
    const seriesId = item.id || item._id;
    
    return (
      <View style={{ width: `${100 / numColumns - 2}%` }}>
        <TouchableOpacity
          style={[styles.card, { marginBottom: 12 }]}
          onPress={() => {
            console.log('📺 Navigation vers série:', seriesId);
            navigation.navigate('SeriesDetail', { seriesId });
          }}
          activeOpacity={0.8}
        >
          {/* Image */}
          <Image
            source={{ uri: item.posterUrl || item.imageUrl || 'https://via.placeholder.com/300x450' }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          
          {/* Badge Catégorie d'abonnement */}
          {item.required_subscription_category && (
            <View style={[styles.premiumBadge, { backgroundColor: getSubscriptionBadge(item.required_subscription_category).color }]}>
              <Ionicons name={getSubscriptionBadge(item.required_subscription_category).icon} size={14} color="#FFF" />
            </View>
          )}

          {/* Titre */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {item.totalSeasons || 1} Saison{(item.totalSeasons || 1) > 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Loader simple
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <SnakeLoader size={50} />
      </View>
    );
  }

  // Render principal simple
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Séries</Text>
        <Text style={styles.headerSubtitle}>{series.length} disponible{series.length > 1 ? 's' : ''}</Text>
      </View>

      {/* Filtres simples */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.key ? '#FFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste simple avec FlatList */}
      <FlatList
        data={series}
        renderItem={renderSeriesCard}
        keyExtractor={(item) => (item.id || item._id)?.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: 12 }
        ]}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="tv-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Aucune série</Text>
          </View>
        }
      />
    </View>
  );
}
