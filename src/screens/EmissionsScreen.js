import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmissionCategoryService from '../services/emissionCategoryService';
import { EmissionStyles } from '../styles/emissionStyles';
import favoriteService from '../services/favoriteService';
import authService from '../services/authService';
import LoadingScreen from '../components/LoadingScreen';

export default function EmissionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const styles = EmissionStyles(colors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await EmissionCategoryService.getActiveCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement catégories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleAddToFavorites = async (category) => {
    try {
      // Vérifier si l'utilisateur est connecté
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        Alert.alert(
          'Connexion requise',
          'Vous devez être connecté pour ajouter des émissions à vos favoris.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Se connecter', 
              onPress: () => navigation.navigate('Mon compte')
            }
          ]
        );
        return;
      }
      
      console.log('➕ Ajout aux favoris:', category.name);
      
      // Ajouter la catégorie aux favoris
      await favoriteService.addFavorite(
        category.id || category._id,
        'emission_category' // Type de contenu pour les catégories d'émissions
      );
      
      Alert.alert(
        'Succès',
        `"${category.name}" a été ajouté à vos favoris`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Erreur ajout favoris:', error);
      
      // Vérifier si c'est déjà dans les favoris
      if (error.response?.status === 400) {
        Alert.alert(
          'Information',
          `"${category.name}" est déjà dans vos favoris`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ajouter aux favoris. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderCategoryCard = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.categoryCard}
        onPress={() => {
          navigation.navigate('CategoryDetail', {
            categoryId: item.id || item._id,
            categoryName: item.name
          });
        }}
      >
        <Image 
          source={{ uri: item.image_main || 'https://via.placeholder.com/400x560' }} 
          style={styles.categoryImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.categoryGradient}
        />

        {item.is_new && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Nouveau</Text>
          </View>
        )}

        <View style={styles.categoryContent}>
          {item.image_icon && (
            <Image 
              source={{ uri: item.image_icon }} 
              style={styles.categoryIcon}
            />
          )}
          <Text style={styles.categoryTitle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToFavorites(item);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id || item._id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.categoriesGrid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="grid-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.empty}>Aucune catégorie disponible</Text>
            <Text style={styles.emptySubtext}>
              Les catégories d'émissions seront affichées ici
            </Text>
          </View>
        }
      />
    </View>
  );
}