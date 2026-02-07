import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import showService from '../services/showService';
import ShowCard from '../components/showCard';
import FilterBar from '../components/filterBar';
import Logo from '../components/logo';

export default function LiveScreen({ navigation }) {
  const [liveShows, setLiveShows] = useState([]);
  const [scheduledShows, setScheduledShows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('live');

  useEffect(() => {
    loadContent();
  }, []);

  // Rafraîchir le contenu en direct quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      loadContent();
    }, [])
  );

  const loadContent = async () => {
    try {
      const [live, scheduled, cats] = await Promise.all([
        showService.getLiveShows(),
        showService.getScheduledShows(),
        showService.getCategories(),
      ]);
      setLiveShows(live);
      setScheduledShows(scheduled.slice(0, 10));
      setCategories(cats);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadContent();
  };

  const getFilteredShows = () => {
    const shows = activeTab === 'live' ? liveShows : scheduledShows;
    if (activeFilter === 'all') return shows;
    return shows.filter(show => show.category === activeFilter);
  };

  const filters = [
    { label: 'Tout', value: 'all', icon: 'apps-outline' },
    ...categories.map(cat => ({ label: cat, value: cat })),
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const filteredShows = getFilteredShows();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FFB800']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Logo size="small" showText={false} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {activeTab === 'live' ? 'En Direct' : 'À Venir'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredShows.length} émission(s)
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && styles.tabActive]}
          onPress={() => setActiveTab('live')}
        >
          <Ionicons
            name="radio"
            size={20}
            color={activeTab === 'live' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
            En Direct ({liveShows.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scheduled' && styles.tabActive]}
          onPress={() => setActiveTab('scheduled')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={activeTab === 'scheduled' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>
            Programmées ({scheduledShows.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showIcons={true}
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredShows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'live' ? 'radio-outline' : 'calendar-outline'}
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'live'
                ? 'Aucune émission en direct pour le moment'
                : 'Aucune émission programmée'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Accueil')}>
              <Text style={styles.emptyButtonText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.showsList}>
            {filteredShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onPress={() => {
                  if (activeTab === 'live') {
                    navigation.navigate('LiveShowFullScreen', { show });
                  }
                }}
                showTime={activeTab === 'scheduled'}
              />
            ))}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  showsList: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
