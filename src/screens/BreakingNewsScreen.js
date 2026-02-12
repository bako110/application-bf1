import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import newsService from '../services/newsService';
import { useFocusEffect } from '@react-navigation/native';
import { formatRelativeTime } from '../utils/dateUtils';
import useAutoRefresh from '../hooks/useAutoRefresh';

const { width } = Dimensions.get('window');

export default function BreakingNewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [viewMode, setViewMode] = useState('list'); // 'grid' ou 'list'
  const fadeAnim = new Animated.Value(1); // Initialisé à 1 pour être visible immédiatement

  const categories = ['Tous', 'Politique', 'Économie', 'Sport', 'Culture', 'Tech'];

  useEffect(() => {
    loadNews();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNews();
    }, [])
  );

  // Rafraîchissement automatique en arrière-plan toutes les 10 secondes
  const loadNewsSilently = async () => {
    try {
      const data = await newsService.getAllNews({ limit: 100 });
      setNews(data);
    } catch (error) {
      console.error('Error loading news silently:', error);
    }
  };
  
  useAutoRefresh(loadNewsSilently, 10000, true);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await newsService.getAllNews({ limit: 100 });
      console.log('📰 Flash Info - Données reçues:', data?.length || 0, 'actualités');
      if (data && data.length > 0) {
        console.log('📰 Première actualité:', data[0]);
      }
      setNews(data || []);
    } catch (error) {
      console.error('❌ Error loading news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = selectedCategory === 'Tous'
    ? news
    : news.filter(item => (item.category || item.edition) === selectedCategory);

  console.log('📰 News totales:', news.length, '| Filtrées:', filteredNews.length, '| Catégorie:', selectedCategory);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
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
      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* News List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#DC143C'} />
        }
      >
        {loading && news.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des actualités...</Text>
          </View>
        ) : filteredNews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={60} color={'#666'} />
            <Text style={styles.emptyText}>Aucune actualité disponible</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory !== 'Tous' 
                ? `Aucune actualité dans la catégorie "${selectedCategory}"`
                : 'Revenez plus tard pour voir les dernières actualités'}
            </Text>
          </View>
        ) : (
          <Animated.View 
            key={`news-list-${filteredNews.length}-${viewMode}`}
            style={[{ opacity: fadeAnim }, viewMode === 'grid' ? styles.gridContainer : styles.listContainer]}
          >
            {filteredNews.map((news, index) => (
            <TouchableOpacity 
              key={news.id} 
              style={viewMode === 'grid' ? styles.newsCardGrid : styles.newsCardList}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('NewsDetail', { newsId: news.id || news._id })}
            >
              <Image source={{ uri: news.image_url || news.image }} style={viewMode === 'grid' ? styles.newsImageGrid : styles.newsImageList} />
              {viewMode === 'grid' ? (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.95)']}
                  style={styles.newsOverlay}
                >
                  <View style={styles.newsBadge}>
                    <Ionicons name="flash" size={12} color="#fff" />
                    <Text style={styles.newsBadgeText}>{news.category}</Text>
                  </View>
                  <Text style={styles.newsTitle}>{news.title}</Text>
                  <Text style={styles.newsDescription} numberOfLines={2}>
                    {news.description}
                  </Text>
                  <View style={styles.newsMeta}>
                    <View style={styles.authorContainer}>
                      <Ionicons name="person-circle" size={16} color={'#B0B0B0'} />
                      <Text style={styles.authorText}>{news.author}</Text>
                    </View>
                    <Text style={styles.newsTime}>
                      {formatRelativeTime(news.created_at || news.time)}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.newsContentList}>
                  <View style={styles.newsBadge}>
                    <Ionicons name="flash" size={10} color="#fff" />
                    <Text style={styles.newsBadgeText}>{news.category}</Text>
                  </View>
                  <Text style={styles.newsTitleList} numberOfLines={2}>{news.title}</Text>
                  <Text style={styles.newsDescriptionList} numberOfLines={2}>
                    {news.description}
                  </Text>
                  <View style={styles.newsMetaList}>
                    <Text style={styles.newsTimeList}>
                      {formatRelativeTime(news.created_at || news.time)}
                    </Text>
                  </View>
                </View>
              )}
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
    paddingBottom: 12,
    paddingHorizontal: 16,
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
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listContainer: {
    flexDirection: 'column',
  },
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: '#000000',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A0000',
    borderWidth: 1,
    borderColor: '#330000',
  },
  categoryButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  categoryText: {
    color: '#B0B0B0',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  newsCardGrid: {
    width: '48%',
    height: 220,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
  },
  newsCardList: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
  },
  newsImageGrid: {
    width: '100%',
    height: '100%',
  },
  newsImageList: {
    width: 120,
    height: '100%',
  },
  newsContentList: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsTitleList: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsDescriptionList: {
    color: '#B0B0B0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  newsMetaList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsTimeList: {
    color: '#B0B0B0',
    fontSize: 11,
  },
  newsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  newsBadge: {
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
  newsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 26,
  },
  newsDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    color: '#B0B0B0',
    fontSize: 13,
  },
  newsTime: {
    color: '#DC143C',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
