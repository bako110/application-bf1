import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import newsService from '../services/newsService';
import { createNewsStyles } from '../styles/newsStyles'; // Import des styles séparés

export default function NewsScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = createNewsStyles(colors);

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
        contentContainerStyle={styles.editionsContent}
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
            colors={[colors.primary]}
          />
        }
      >
        {/* Live News */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="radio" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>En Direct</Text>
          </View>
          {liveNews.length > 0 ? (
            liveNews.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.liveCard}
                onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
              >
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
                  <Text style={styles.liveTitle} numberOfLines={2}>{item.title}</Text>
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
          <View style={styles.sectionHeader}>
            <Ionicons name="newspaper" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Dernières Actualités</Text>
          </View>
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
                    {item.content || item.description || ''}
                  </Text>
                  <View style={styles.newsMeta}>
                    {item.edition && (
                      <View style={styles.editionTag}>
                        <Text style={styles.editionTagText}>JT {item.edition}</Text>
                      </View>
                    )}
                    <Text style={styles.newsDate}>
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : ''}
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