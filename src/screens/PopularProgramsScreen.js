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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import ExpandableText from '../components/ExpandableText';
import popularProgramService from '../services/popularProgramService';
import useAutoRefresh from '../hooks/useAutoRefresh';

export default function PopularProgramsScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadPrograms();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPrograms();
    }, [])
  );

  // Rafraîchissement automatique en arrière-plan toutes les 10 secondes
  const loadProgramsSilently = async () => {
    try {
      const data = await popularProgramService.getAllPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs silently:', error);
    }
  };
  
  useAutoRefresh(loadProgramsSilently, 10000, true);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await popularProgramService.getAllPrograms({ limit: 50 });
      setPrograms(data);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError(err.message || 'Erreur lors du chargement des programmes');
      Alert.alert('Erreur', 'Impossible de charger les programmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programs.length > 0) {
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
  }, [programs, viewMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  };

  if (loading && programs.length === 0) {
    return (
      <View style={styles.container}>
        {/* <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={'#FFFFFF'} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="star" size={24} color={'#DC143C'} />
            <Text style={styles.headerTitle}>Programmes Populaires</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient> */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={'#DC143C'} />
          <Text style={styles.loadingText}>Chargement des programmes...</Text>
        </View>
      </View>
    );
  }

  if (error && programs.length === 0) {
    return (
      <View style={styles.container}>
        {/* <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={'#FFFFFF'} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="star" size={24} color={'#DC143C'} />
            <Text style={styles.headerTitle}>Programmes Populaires</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient> */}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={'#DC143C'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPrograms}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const displayPrograms = programs;

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={'#FFFFFF'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="star" size={24} color={'#DC143C'} />
          <Text style={styles.headerTitle}>Programmes Populaires</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={styles.viewToggle}
        >
          <Ionicons 
            name={viewMode === 'grid' ? 'list' : 'grid'} 
            size={24} 
            color={'#FFFFFF'} 
          />
        </TouchableOpacity>
      </LinearGradient> */}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#DC143C'} />
        }
      >
        {displayPrograms.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="star-outline" size={80} color={'#B0B0B0'} />
            <Text style={styles.emptyTitle}>Aucun programme populaire</Text>
            <Text style={styles.emptySubtitle}>Les programmes populaires apparaîtront ici</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadPrograms}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {displayPrograms.map((program, index) => (
              <TouchableOpacity 
                key={program.id || index} 
                style={viewMode === 'grid' ? styles.programCard : styles.programCardList}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ShowDetail', { 
                  showId: program.id, 
                  isPopularProgram: true,
                  programData: program
                })}
              >
                <Image 
                  source={{ uri: program.image_url || program.image }} 
                  style={viewMode === 'grid' ? styles.programImage : styles.programImageList}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.95)']}
                  style={styles.programOverlay}
                >
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{program.category || 'Général'}</Text>
                  </View>
                  <Text style={styles.programTitle}>{program.title}</Text>
                  <ExpandableText
                    text={program.description}
                    numberOfLines={2}
                    style={styles.programDescription}
                    expandedStyle={styles.programDescription}
                  />
                  <View style={styles.programMeta}>
                    <View style={styles.scheduleContainer}>
                      <Ionicons name="time" size={14} color={'#DC143C'} />
                      <Text style={styles.scheduleText}>{program.schedule}</Text>
                    </View>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Ionicons name="list" size={14} color={'#B0B0B0'} />
                        <Text style={styles.statText}>{program.episodes} ép.</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.statText}>{program.rating}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
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
  gridContainer: {
    paddingHorizontal: 0,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  programCard: {
    width: '100%',
    height: 220,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
  },
  programCardList: {
    width: '100%',
    height: 140,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
  },
  programImage: {
    width: '100%',
    height: '100%',
  },
  programImageList: {
    width: 120,
    height: '100%',
  },
  programOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  categoryBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  programTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  programDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#B0B0B0',
    fontSize: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
