import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import emissionsService from '../services/emissionsService';
import { createEmissionsStyles } from '../styles/emissionsStyles'; // Import des styles séparés

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16 padding + 16 padding + 16 space between

export default function EmissionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emissions, setEmissions] = useState([]);

  useEffect(() => {
    loadEmissions();
  }, []);

  const loadEmissions = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les émissions en parallèle depuis l'API
      const emissionsData = await emissionsService.getAllEmissions();
      
      // Transformer les données pour correspondre au format attendu
      const formattedEmissions = emissionsData.map(emission => ({
        id: emission._id || emission.id,
        title: emission.title,
        image: emission.image || emission.thumbnail || 'https://via.placeholder.com/300x200',
        description: emission.description,
        duration: emission.duration,
        views: emission.views || 0,
        likes: emission.likes || 0,
        presenter: emission.presenter,
        date: emission.date,
        isNew: emission.is_new || false,
        featured: emission.featured || false,
      }));
      
      setEmissions(formattedEmissions);
    } catch (error) {
      console.error('Erreur lors du chargement des émissions:', error);
      setEmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmissions();
    setRefreshing(false);
  };

  
  const renderEmission = ({ item, index }) => {
    const styles = createEmissionsStyles(colors);
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          index % 2 === 0 ? styles.cardLeft : styles.cardRight,
        ]}
        activeOpacity={0.85}
        onPress={async () => {
          // Incrémenter les vues
          await emissionsService.incrementViews(item.id);
          navigation.navigate('EmissionDetail', { emissionId: item.id });
        }}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />

        {/* Gradient overlay pour meilleure lisibilité */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {/* Badge NEW */}
        {item.isNew && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Nouveau</Text>
          </View>
        )}

        {/* Titre */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createEmissionsStyles(colors);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des émissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Émissions */}
      <FlatList
        data={emissions}
        renderItem={renderEmission}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.emissionsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="tv-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Aucune émission trouvée</Text>
          </View>
        }
      />
    </View>
  );
}