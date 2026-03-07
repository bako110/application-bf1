import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import useAutoRefresh from '../hooks/useAutoRefresh';
import NotificationHeader from '../components/NotificationHeader';
import likeService from '../services/likeService';
import reportageService from '../services/reportageService';
import { createReportagesStyles } from '../styles/reportagesStyles';
import SnakeLoader  from '../components/LoadingScreen'; // Import du loader

// Fonctions utilitaires
const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  
  const minutes = parseInt(duration);
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 120) {
    return '1h ' + (minutes - 60) + ' min';
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes} min`;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Récemment';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  
  if (diffDays === 1) {
    return 'Hier';
  }
  
  if (diffDays <= 7) {
    const options = { weekday: 'long' };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  if (date.getFullYear() === now.getFullYear()) {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
};

function ReportagesScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [hasAnimated, setHasAnimated] = useState(false);
  const [likesData, setLikesData] = useState({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const styles = createReportagesStyles(viewMode);

  useEffect(() => {
    loadVideos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadVideos();
    }, [])
  );

  const loadVideosSilently = async () => {
    try {
      const response = await api.get('/reportage');
      const data = response.data.map(reportage => ({
        ...reportage,
        id: reportage._id || reportage.id,
        image_url: reportage.thumbnail || reportage.image_url,
      })).sort((a, b) => {
        // Trier par date de création (plus récents en premier)
        const dateA = new Date(a.created_at || a.aired_at || 0);
        const dateB = new Date(b.created_at || b.aired_at || 0);
        return dateB - dateA; // Plus récents en premier
      });
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos silently:', error);
    }
  };
  
  useAutoRefresh(loadVideosSilently, 10000, true);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reportage', { params: { limit: 50 } });
      const videosData = response.data.map(video => ({
        ...video,
        id: video._id || video.id,
        image_url: video.thumbnail || video.image_url,
      })).sort((a, b) => {
        // Trier par date de création (plus récents en premier)
        const dateA = new Date(a.created_at || a.aired_at || 0);
        const dateB = new Date(b.created_at || b.aired_at || 0);
        return dateB - dateA; // Plus récents en premier
      });
      setVideos(videosData);
      
      await loadLikes(videosData);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikes = async (videosData) => {
    const likesInfo = {};
    for (const video of videosData) {
      try {
        const [liked, count] = await Promise.all([
          likeService.checkLiked(video.id, 'reportage'),
          likeService.countLikes(video.id, 'reportage')
        ]);
        likesInfo[video.id] = { liked, count };
      } catch (error) {
        console.error(`Error loading likes for video ${video.id}:`, error);
        likesInfo[video.id] = { liked: false, count: 0 };
      }
    }
    setLikesData(likesInfo);
  };

  const handleLike = async (videoId) => {
    try {
      const result = await likeService.toggleLike(videoId, 'reportage');
      console.log('❤️ Résultat toggle like:', result);
      
      setLikesData(prev => ({
        ...prev,
        [videoId]: {
          liked: !prev[videoId]?.liked,
          count: prev[videoId]?.liked ? prev[videoId].count - 1 : prev[videoId].count + 1
        }
      }));
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
      if (error.requiresAuth) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour liker un contenu');
      }
    }
  };

  useEffect(() => {
    if (videos.length > 0 && !hasAnimated) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
      setHasAnimated(true);
    }
  }, [videos.length > 0]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <NotificationHeader />
        </View>
      ),
    });
  }, [navigation, viewMode]);

  const filteredVideos = videos;

  // Afficher le loader pendant le chargement initial
  if (loading && videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <SnakeLoader />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#E23E3E'} />
        }
      >
        {filteredVideos.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="videocam-outline" size={80} color={'#B0B0B0'} />
            <Text style={styles.emptyTitle}>Aucun reportage disponible</Text>
            <Text style={styles.emptySubtitle}>
              Les reportages apparaîtront ici
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadVideos}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {filteredVideos.map((video, index) => (
              <TouchableOpacity 
                key={video.id || video._id || index} 
                style={viewMode === 'grid' ? styles.videoCard : styles.videoCardList}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ShowDetail', { showId: video.id || video._id, isReportage: true })}
              >
                <Image source={{ uri: video.image_url || video.image || 'https://via.placeholder.com/400x250' }} style={viewMode === 'grid' ? styles.videoImage : styles.videoImageList} />
                
                {/* Gradient pour améliorer la lisibilité */}
                {viewMode === 'grid' && (
                  <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    locations={[0, 0.3, 0.7, 1]}
                    style={styles.imageGradient}
                  />
                )}
                
                {/* Conteneur pour durée et like en mode grille */}
                {viewMode === 'grid' && (
                  <View style={styles.topMetaContainer}>
                    <TouchableOpacity 
                      style={styles.likeButtonTop}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLike(video.id);
                      }}
                    >
                      <Ionicons 
                        name={likesData[video.id]?.liked ? 'heart' : 'heart-outline'} 
                        size={16} 
                        color={likesData[video.id]?.liked ? '#FF0000' : '#FFFFFF'} 
                      />
                      {likesData[video.id]?.count > 0 && (
                        <Text style={styles.likeCountTop}>{likesData[video.id].count}</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time" size={12} color="#fff" />
                      <Text style={styles.durationText}>{formatDuration(video.duration || video.duration_minutes)}</Text>
                    </View>
                  </View>
                )}
                
                {/* Durée en mode liste */}
                {viewMode === 'list' && (
                  <View style={styles.durationBadge}>
                    <Ionicons name="time" size={12} color="#fff" />
                    <Text style={styles.durationText}>{formatDuration(video.duration || video.duration_minutes)}</Text>
                  </View>
                )}
                
                {/* Like button en mode liste (ancienne position) */}
                {viewMode === 'list' && (
                  <TouchableOpacity 
                    style={styles.likeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLike(video.id);
                    }}
                  >
                    <Ionicons 
                      name={likesData[video.id]?.liked ? 'heart' : 'heart-outline'} 
                      size={20} 
                      color={likesData[video.id]?.liked ? '#FF0000' : '#FFFFFF'} 
                    />
                    {likesData[video.id]?.count > 0 && (
                      <Text style={styles.likeCount}>{likesData[video.id].count}</Text>
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.videoInfo}>
                  <Text style={viewMode === 'grid' ? styles.videoTitle : styles.videoTitleList} numberOfLines={2}>{video.title}</Text>
                  <View style={viewMode === 'grid' ? styles.videoMeta : styles.videoMetaList}>
                    <View style={styles.metaItem}>
                      <Ionicons name="eye" size={10} color={'#B0B0B0'} />
                      <Text style={styles.metaText}>{video.views_count || video.views || 0} vues</Text>
                    </View>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.dateText}>{formatDate(video.aired_at || video.created_at)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default ReportagesScreen;