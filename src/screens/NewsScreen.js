import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import newsService from '../services/newsService';


export default function NewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [liveNews, setLiveNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState('all');

  useEffect(() => {
    loadNews();
  }, [selectedEdition]);

  // Rafraîchir les actualités quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      loadNews();
    }, [selectedEdition])
  );

  const loadNews = async () => {
    try {
      const [allNews, live] = await Promise.all([
        selectedEdition === 'all'
          ? newsService.getAllNews({ limit: 50 })
          : newsService.getNewsByEdition(selectedEdition),
        newsService.getLiveNews(),
      ]);
      setNews(allNews);
      setLiveNews(live);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  const editions = ['all', '6h30', '7h30', '12h30', '19h30'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Editions Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.editionsContainer}
      >
        {editions.map((edition) => (
          <TouchableOpacity
            key={edition}
            style={[
              styles.editionButton,
              selectedEdition === edition && styles.editionButtonActive,
            ]}
            onPress={() => setSelectedEdition(edition)}
          >
            <Text
              style={[
                styles.editionText,
                selectedEdition === edition && styles.editionTextActive,
              ]}
            >
              {edition === 'all' ? 'Toutes' : `JT ${edition}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
        {/* Live News */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="radio" size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>En Direct</Text>
          </View>
          {liveNews.length > 0 ? (
            liveNews.map((item) => (
              <TouchableOpacity key={item.id} style={styles.liveCard}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/400x250' }}
                  style={styles.liveImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.liveOverlay}
                >
                  <View style={styles.liveBadge}>
                    <View style={styles.liveIndicator} />
                    <Text style={styles.liveText}>EN DIRECT</Text>
                  </View>
                  <Text style={styles.liveTitle}>{item.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.placeholderText}>Aucune actualité en direct pour le moment.</Text>
            </View>
          )}
        </View>

        {/* All News */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernières Actualités</Text>
          {news.length > 0 ? (
            news.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.newsCard}
                onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
              >
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/120x120' }}
                  style={styles.newsImage}
                />
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.newsExcerpt} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <View style={styles.newsMeta}>
                    {item.edition && (
                      <View style={styles.editionTag}>
                        <Text style={styles.editionTagText}>JT {item.edition}</Text>
                      </View>
                    )}
                    <Text style={styles.newsDate}>
                      {new Date(item.published_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="newspaper-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.placeholderText}>Aucune actualité disponible pour le moment.</Text>
            </View>
          )}
        </View>
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
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  editionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  editionButtonActive: {
    backgroundColor: colors.primary,
  },
  editionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  editionTextActive: {
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  liveCard: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  liveImage: {
    width: '100%',
    height: '100%',
  },
  liveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text,
    marginRight: 6,
  },
  liveText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  newsImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  newsContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  newsExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editionTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  editionTagText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  newsDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
