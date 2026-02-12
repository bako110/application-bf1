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
import { useTheme } from '../contexts/ThemeContext';
import interviewService from '../services/interviewService';
import { useFocusEffect } from '@react-navigation/native';
import viewService from '../services/viewService';
import useAutoRefresh from '../hooks/useAutoRefresh';
import usePagination from '../hooks/usePagination';
import LoadingFooter from '../components/LoadingFooter';

export default function InterviewsScreen({ navigation }) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState('list');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Pagination
  const fetchInterviews = async (skip, limit) => {
    return await interviewService.getAllInterviews({ skip, limit });
  };

  const {
    data: interviews,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData: setInterviews,
  } = usePagination(fetchInterviews, 20);

  useFocusEffect(
    React.useCallback(() => {
      if (interviews.length === 0) {
        loadInitial();
      }
    }, [])
  );

  // Rafraîchissement automatique en arrière-plan
  const loadInterviewsSilently = async () => {
    try {
      const data = await interviewService.getAllInterviews({ limit: interviews.length || 20 });
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews silently:', error);
    }
  };
  
  useAutoRefresh(loadInterviewsSilently, 10000, true);

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (interviews.length > 0 && !hasAnimated) {
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
  }, [interviews.length > 0]);


  const styles = createStyles(colors);

  if (loading && interviews.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des interviews...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header personnalisé supprimé - utilisation du header natif */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {interviews.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="mic-outline" size={80} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune interview disponible</Text>
            <Text style={styles.emptySubtitle}>Les interviews apparaîtront ici</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
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
                  onPress={async () => {
                    const interviewId = interview.id || interview._id;
                    await viewService.incrementView(interviewId, 'interview');
                    navigation.navigate('ShowDetail', {
                      showId: interviewId,
                      isInterview: true
                    });
                  }}
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

            {/* Section Archives */}
            <View style={styles.archiveSection}>
              <View style={styles.archiveHeader}>
                <View style={styles.archiveTitleContainer}>
                  <Ionicons name="archive" size={24} color={colors.primary} />
                  <Text style={styles.archiveSectionTitle}>Archives</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Archive')}
                >
                  <Text style={styles.viewAllText}>Voir tout</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.premiumBadgeText}>Contenu Premium</Text>
              </View>
              <Text style={styles.archiveDescription}>
                Accédez à nos archives d'interviews exclusives avec un abonnement premium
              </Text>
              <TouchableOpacity 
                style={styles.archiveButton}
                onPress={() => navigation.navigate('Archive')}
              >
                <Ionicons name="archive-outline" size={20} color="#fff" />
                <Text style={styles.archiveButtonText}>Découvrir les archives</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 35,
    paddingBottom: 10,
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
    backgroundColor: '#DC143C',
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
    backgroundColor: '#DC143C',
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
  archiveSection: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  archiveTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  archiveSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  archiveDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  archiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
