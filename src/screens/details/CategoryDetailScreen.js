import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SportService from '../../services/sportService';
import JTService from '../../services/jtandMagService';
import DivertissementService from '../../services/divertissementService';
import ReportageService from '../../services/reportageService';
import { CategoryDetailStyles } from '../../styles/categoryDetailStyles';
import LoadingScreen from '../../components/LoadingScreen';

const { width, height } = Dimensions.get('window');

export default function CategoryDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const styles = CategoryDetailStyles(colors);
  
  const { categoryId, categoryName } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [emissions, setEmissions] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  // Images du carrousel - utiliser les images des premières émissions
  const carouselImages = emissions.slice(0, 5).map(e => 
    e.image || e.image_url || e.thumbnail || 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800'
  );

  useEffect(() => {
    loadEmissions();
  }, [categoryId]);

  // Auto-scroll du carrousel
  useEffect(() => {
    if (carouselImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carouselImages.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 10000); // Change toutes les 10 secondes

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const loadEmissions = async () => {
    try {
      setLoading(true);
      let data = [];
      
      // Charger les émissions selon la catégorie
      const categoryNameLower = categoryName.toLowerCase();
      
      if (categoryNameLower.includes('sport')) {
        data = await SportService.getAllSports();
      } else if (categoryNameLower.includes('jt') || categoryNameLower.includes('mag')) {
        data = await JTService.getJTandMag();
      } else if (categoryNameLower.includes('divertissement')) {
        data = await DivertissementService.getAllDivertissements();
      } else if (categoryNameLower.includes('reportage')) {
        data = await ReportageService.getAllReportages();
      }
      
      setEmissions(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement émissions:', error);
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

  const renderEmissionCard = ({ item }) => {
    // Déterminer les paramètres selon la catégorie
    const getShowParams = () => {
      const categoryLower = categoryName.toLowerCase();
      const showId = item.id || item._id;
      
      if (categoryLower.includes('sport')) {
        return { showId, isSport: true };
      } else if (categoryLower.includes('jt') || categoryLower.includes('mag')) {
        return { showId, isJTandMag: true };
      } else if (categoryLower.includes('divertissement')) {
        return { showId, isDivertissement: true };
      } else if (categoryLower.includes('reportage')) {
        return { showId, isReportage: true };
      }
      return { showId, isSport: true }; // Par défaut
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.emissionCard}
        onPress={() => {
          navigation.navigate('ShowDetail', getShowParams());
        }}
      >
        {/* Image à gauche */}
        <View style={styles.emissionImageContainer}>
          <Image 
            source={{ uri: item.image || item.image_url || item.thumbnail || 'https://via.placeholder.com/300x200' }} 
            style={styles.emissionImage}
            resizeMode="cover"
          />
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Informations à droite */}
        <View style={styles.emissionInfo}>
          <Text style={styles.emissionTitle} numberOfLines={2}>
            {item.title ? String(item.title) : 'Sans titre'}
          </Text>
          
          {item.description && typeof item.description === 'string' && (
            <Text style={styles.emissionDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.emissionMeta}>
            {item.views !== undefined && item.views !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={12} color={colors.primary} />
                <Text style={styles.metaText}>{String(item.views)}</Text>
              </View>
            )}
            {item.duration !== undefined && item.duration !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
                <Text style={styles.metaText}>{String(item.duration)}</Text>
              </View>
            )}
            <View style={styles.playButton}>
              <Ionicons name="play" size={14} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Carrousel d'images en haut (moitié de l'écran) */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {carouselImages.map((imageUrl, index) => (
            <View key={index} style={styles.carouselSlide}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.carouselGradient}
              />
            </View>
          ))}
        </ScrollView>

        {/* Indicateurs de pagination */}
        <View style={styles.paginationContainer}>
          {carouselImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentImageIndex === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Liste des émissions en bas */}
      <View style={styles.emissionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Toutes les émissions</Text>
          <Text style={styles.sectionCount}>{emissions.length}</Text>
        </View>

        <FlatList
          data={emissions}
          renderItem={renderEmissionCard}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.emissionsList}
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
              <Ionicons name="film-outline" size={60} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Aucune émission disponible</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
