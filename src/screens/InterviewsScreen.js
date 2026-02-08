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
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import interviewService from '../services/interviewService';
import { useFocusEffect } from '@react-navigation/native';

export default function InterviewsScreen({ navigation }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadInterviews();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadInterviews();
    }, [])
  );

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getAllInterviews({ limit: 50 });
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviews.length > 0) {
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
    }
  }, [interviews, viewMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInterviews();
    setRefreshing(false);
  };

  if (loading && interviews.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#1a1a1a']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="mic" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Interviews</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.viewToggle}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des interviews...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="mic" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Interviews</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {interviews.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="mic-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune interview disponible</Text>
            <Text style={styles.emptySubtitle}>Les interviews apparaîtront ici</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadInterviews}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {interviews.map((interview, index) => (
                <TouchableOpacity 
                  key={interview.id || index} 
                  style={viewMode === 'grid' ? styles.interviewCard : styles.interviewCardList}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ShowDetail', { showId: interview.id, isInterview: true })}
                >
                  <Image 
                    source={{ uri: interview.image_url || interview.image || 'https://via.placeholder.com/400x250' }} 
                    style={viewMode === 'grid' ? styles.interviewImage : styles.interviewImageList}
                  />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.95)']}
                  style={styles.interviewOverlay}
                >
                  <View style={styles.interviewBadge}>
                    <Ionicons name="mic" size={12} color="#fff" />
                    <Text style={styles.interviewBadgeText}>Interview</Text>
                  </View>
                  <Text style={styles.interviewTitle}>{interview.title}</Text>
                  <View style={styles.interviewMeta}>
                    <Ionicons name="person" size={14} color={colors.primary} />
                    <Text style={styles.interviewGuest}>{interview.guest || 'Invité'}</Text>
                  </View>
                  {interview.duration && (
                    <View style={styles.interviewDuration}>
                      <Ionicons name="time" size={14} color={colors.textSecondary} />
                      <Text style={styles.interviewDurationText}>{interview.duration} min</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  gridContainer: {
    paddingHorizontal: 0,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  interviewCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  interviewCardList: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    height: 140,
  },
  interviewImage: {
    width: '100%',
    height: 220,
  },
  interviewImageList: {
    width: 120,
    height: '100%',
  },
  interviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  interviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  interviewBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  interviewTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  interviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  interviewGuest: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  interviewDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interviewDurationText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
});
