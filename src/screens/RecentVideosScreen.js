import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import api from '../config/api';
import { useFocusEffect } from '@react-navigation/native';
import useAutoRefresh from '../hooks/useAutoRefresh';

function RecentVideosScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [hasAnimated, setHasAnimated] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadVideos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadVideos();
    }, [])
  );

  // Rafraîchissement automatique en arrière-plan toutes les 10 secondes
  const loadVideosSilently = async () => {
    try {
      const response = await api.get('/replays');
      const data = response.data.map(replay => ({
        ...replay,
        id: replay._id || replay.id,
        image_url: replay.thumbnail || replay.image_url,
      }));
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos silently:', error);
    }
  };
  
  useAutoRefresh(loadVideosSilently, 10000, true);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/replays', { params: { limit: 50 } });
      const data = response.data.map(replay => ({
        ...replay,
        id: replay._id || replay.id,
        image_url: replay.thumbnail || replay.image_url
      }));
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
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

  // Exposer toggleViewMode et viewMode via les params de navigation
  useEffect(() => {
    navigation.setParams({
      toggleViewMode: () => setViewMode(viewMode === 'grid' ? 'list' : 'grid'),
      viewMode: viewMode
    });
  }, [navigation, viewMode]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#DC143C'} />
        }
      >
        {videos.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="videocam-outline" size={80} color={'#B0B0B0'} />
            <Text style={styles.emptyTitle}>Aucune vidéo récente</Text>
            <Text style={styles.emptySubtitle}>Les replays apparaîtront ici</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadVideos}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {videos.map((video, index) => (
              <TouchableOpacity 
                key={video.id || video._id || index} 
                style={viewMode === 'grid' ? styles.videoCard : styles.videoCardList}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ShowDetail', { showId: video.id || video._id, isReplay: true })}
              >
              <Image source={{ uri: video.image_url || video.image || 'https://via.placeholder.com/400x250' }} style={viewMode === 'grid' ? styles.videoImage : styles.videoImageList} />
              <View style={styles.durationBadge}>
                <Ionicons name="time" size={12} color="#fff" />
                <Text style={styles.durationText}>{video.duration || 'N/A'}</Text>
              </View>
              <View style={styles.playButton}>
                <Ionicons name="play" size={30} color={'#DC143C'} />
              </View>
              <View style={styles.videoInfo}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{video.category || 'Vidéo'}</Text>
                </View>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <View style={styles.videoMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="eye" size={14} color={'#B0B0B0'} />
                    <Text style={styles.metaText}>{video.views_count || video.views || 0} vues</Text>
                  </View>
                  <Text style={styles.dateText}>{video.created_at ? new Date(video.created_at).toLocaleDateString('fr-FR') : 'Récemment'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 35,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  videoCard: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
  },
  videoCardList: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
    height: 140,
  },
  videoImage: {
    width: '100%',
    height: 200,
  },
  videoImageList: {
    width: 120,
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    top: 85,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  categoryBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#B0B0B0',
    fontSize: 13,
  },
  dateText: {
    color: '#DC143C',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RecentVideosScreen;
