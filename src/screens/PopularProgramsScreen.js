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
import popularProgramService from '../services/popularProgramService';

export default function PopularProgramsScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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
  }, [programs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrograms();
    setRefreshing(false);
  };

  if (loading && programs.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="star" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Populaires</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des programmes...</Text>
        </View>
      </View>
    );
  }

  if (error && programs.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="star" size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Populaires</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.primary} />
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
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Populaires</Text>
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
        {displayPrograms.length === 0 ? (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="star-outline" size={80} color={colors.textSecondary} />
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
              style={styles.programCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ShowDetail', { showId: program.id, isPopularProgram: true })}
            >
              <Image 
                source={{ uri: program.image_url || program.image }} 
                style={styles.programImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.95)']}
                style={styles.programOverlay}
              >
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{program.category || 'Général'}</Text>
                </View>
                <Text style={styles.programTitle}>{program.title}</Text>
                <Text style={styles.programDescription} numberOfLines={2}>
                  {program.description}
                </Text>
                <View style={styles.programMeta}>
                  <View style={styles.scheduleContainer}>
                    <Ionicons name="time" size={14} color={colors.primary} />
                    <Text style={styles.scheduleText}>{program.schedule}</Text>
                  </View>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Ionicons name="list" size={14} color={colors.textSecondary} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  programCard: {
    width: '100%',
    height: 220,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  programImage: {
    width: '100%',
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
    backgroundColor: colors.primary,
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
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  programDescription: {
    color: colors.textSecondary,
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
    color: colors.text,
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
    color: colors.textSecondary,
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
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
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
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
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
