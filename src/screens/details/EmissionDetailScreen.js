import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import emissionsService from '../../services/emissionsService';
import { createEmissionDetailStyles } from '../../styles/emissionDetailStyles'; // Import des styles séparés

/**
 * Écran de détail d'une émission
 * Affiche toutes les informations sur une émission spécifique
 */
export default function EmissionDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { emissionId } = route.params;
  const [emission, setEmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadEmission();
  }, [emissionId]);

  const loadEmission = async () => {
    try {
      setLoading(true);
      const emissionData = await emissionsService.getEmissionById(emissionId);
      setEmission(emissionData);
      
      // Incrémenter les vues
      await emissionsService.incrementViews(emissionId);
      
      // Mettre à jour le titre de l'écran
      navigation.setOptions({ title: emissionData.title });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'émission:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'émission');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
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
      const result = await emissionsService.toggleLike(emissionId, action);
      if (result.success) {
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const styles = createEmissionDetailStyles(colors);

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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {emission.video_url ? (
          <Video
            ref={videoRef}
            source={{ uri: emission.video_url }}
            style={styles.emissionImage}
            resizeMode="cover"
            paused={!isPlaying}
            repeat={false}
            controls={true}
            muted={false}
            playInBackground={false}
            playWhenInactive={false}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000
            }}
            renderLoader={() => (
              <View style={styles.videoLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        ) : (
          <>
            <Image source={{ uri: emission.image }} style={styles.emissionImage} />
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.content}>
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
                {emission.likes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={colors.text} />
              <Text style={styles.actionText}>
                Partager
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatDuration(emission.duration)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatDate(emission.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="eye" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {emission.views.toLocaleString()} vues
              </Text>
            </View>
            {emission.presenter && (
              <View style={styles.infoItem}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  {emission.presenter}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>
            Description
          </Text>
          <Text style={styles.description}>
            {emission.description}
          </Text>
        </View>

        {emission.tags && emission.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {emission.tags.map((tag, index) => (
                <View 
                  key={index}
                  style={styles.tag}
                >
                  <Text style={styles.tagText}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}