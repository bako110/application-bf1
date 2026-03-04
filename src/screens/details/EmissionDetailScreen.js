import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import SportService from '../../services/sportService';
import JTService from '../../services/jtandMagService';
import DivertissementService from '../../services/divertissementService';
import ReportageService from '../../services/reportageService';
import { createEmissionDetailStyles } from '../../styles/emissionDetailStyles';

/**
 * Écran de détail d'une émission
 * Affiche toutes les informations sur une émission spécifique
 */
export default function EmissionDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { emissionId, contentType, title } = route.params;
  
  const [emission, setEmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedEmissions, setRelatedEmissions] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const styles = createEmissionDetailStyles(colors);
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  useEffect(() => {
    loadEmission();
  }, [emissionId, contentType]);

  useEffect(() => {
    if (emission) {
      loadRelatedEmissions();
    }
  }, [emission]);

  const loadEmission = async () => {
    try {
      setLoading(true);
      
      let emissionData = null;
      
      // Charger selon le type de contenu
      switch (contentType) {
        case 'sports':
          emissionData = await SportService.getSportById(emissionId);
          break;
        case 'jtandmag':
          emissionData = await JTService.getJTandMagById(emissionId);
          break;
        case 'divertissement':
          emissionData = await DivertissementService.getDivertissementById(emissionId);
          break;
        case 'reportages':
          emissionData = await ReportageService.getReportageById(emissionId);
          break;
        default:
          // Essayer tous les services si le type n'est pas spécifié
          try {
            emissionData = await SportService.getSportById(emissionId);
            if (emissionData) contentType = 'sports';
          } catch (e) {
            try {
              emissionData = await JTService.getJTandMagById(emissionId);
              if (emissionData) contentType = 'jtandmag';
            } catch (e) {
              try {
                emissionData = await DivertissementService.getDivertissementById(emissionId);
                if (emissionData) contentType = 'divertissement';
              } catch (e) {
                try {
                  emissionData = await ReportageService.getReportageById(emissionId);
                  if (emissionData) contentType = 'reportages';
                } catch (e) {}
              }
            }
          }
      }
      
      if (emissionData) {
        setEmission({
          ...emissionData,
          contentType: contentType
        });
        
        // Incrémenter les vues selon le type
        switch (contentType) {
          case 'sports':
            await SportService.incrementViews(emissionId);
            break;
          case 'jtandmag':
            await JTService.incrementViews(emissionId);
            break;
          case 'divertissement':
            await DivertissementService.incrementViews(emissionId);
            break;
          case 'reportages':
            await ReportageService.incrementViews(emissionId);
            break;
        }
      } else {
        Alert.alert('Erreur', 'Émission non trouvée');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'émission');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedEmissions = async () => {
    if (!emission || !contentType) return;
    
    try {
      setLoadingRelated(true);
      
      let related = [];
      
      // Charger les émissions similaires (même catégorie)
      switch (contentType) {
        case 'sports':
          related = await SportService.getAllSports({ limit: 10 });
          break;
        case 'jtandmag':
          related = await JTService.getJTandMag({ limit: 10 });
          break;
        case 'divertissement':
          related = await DivertissementService.getAllDivertissements({ limit: 10 });
          break;
        case 'reportages':
          related = await ReportageService.getAllShows({ limit: 10 });
          break;
      }
      
      // Filtrer pour exclure l'émission courante
      const filteredRelated = (related || [])
        .filter(item => (item.id || item._id) !== emissionId)
        .slice(0, 8); // Garder 8 éléments maximum
      
      setRelatedEmissions(filteredRelated);
    } catch (error) {
      console.error('Erreur chargement émissions similaires:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: emission.title,
        message: `Regarde "${emission.title}" sur BF1 TV!\n\n${emission.description}`,
        url: emission.image,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleLike = async () => {
    try {
      const action = isLiked ? 'remove' : 'add';
      let result;
      
      switch (contentType) {
        case 'sports':
          result = await SportService.toggleLike(emissionId, action);
          break;
        case 'jtandmag':
          result = await JTService.toggleLike(emissionId, action);
          break;
        case 'divertissement':
          result = await DivertissementService.toggleLike(emissionId, action);
          break;
        case 'reportages':
          result = await ReportageService.toggleLike(emissionId, action);
          break;
      }
      
      if (result?.success) {
        setIsLiked(!isLiked);
        setEmission(prev => ({
          ...prev,
          likes: isLiked ? prev.likes - 1 : prev.likes + 1
        }));
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${minutes}min`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderRelatedItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.relatedCard, { width: 140 }]}
      onPress={() => {
        navigation.push('EmissionDetail', {
          emissionId: item.id || item._id,
          contentType: contentType,
          title: item.title
        });
      }}
    >
      <Image 
        source={{ uri: item.image || item.image_url || item.thumbnail }} 
        style={styles.relatedImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.relatedGradient}
      >
        <Text style={styles.relatedTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.views && (
          <View style={styles.relatedViews}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={styles.relatedViewsText}>
              {item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Chargement de l'émission...
        </Text>
      </View>
    );
  }

  if (!emission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="tv-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.errorText}>
          Émission non trouvée
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image en haut */}
      <View style={styles.header}>
        <Image 
          source={{ uri: emission.image || emission.image_url || emission.thumbnail }} 
          style={styles.emissionImage}
        />
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.imageOverlay}
        />
        
        {/* Bouton retour */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Bouton partage */}
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Titre et actions */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {emission.title}
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? colors.primary : colors.text} 
              />
              <Text style={styles.actionText}>
                {emission.likes || 0}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionButton}>
              <Ionicons name="eye-outline" size={20} color={colors.text} />
              <Text style={styles.actionText}>
                {emission.views?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {formatDuration(emission.duration || emission.duration_minutes * 60)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {formatDate(emission.date || emission.created_at)}
              </Text>
            </View>
          </View>
          
          {(emission.presenter || emission.host) && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="person" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  {emission.presenter || emission.host}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>
          <Text style={styles.description}>
            {emission.description}
          </Text>
        </View>

        {/* Tags */}
        {emission.tags && emission.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {emission.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section horizontale des autres émissions */}
        {relatedEmissions.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>
              Dans la même catégorie
            </Text>
            
            {loadingRelated ? (
              <View style={styles.relatedLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={relatedEmissions}
                renderItem={renderRelatedItem}
                keyExtractor={(item) => `related-${item.id || item._id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
              />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}