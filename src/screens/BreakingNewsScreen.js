import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { createBreakingNewsStyles } from '../styles/breakingNewsStyles';
import newsService from '../services/newsService';
import categoryService from '../services/categoryService';
import { useFocusEffect } from '@react-navigation/native';
import { formatRelativeTime, formatViews } from '../utils/dateUtils';
import useAutoRefresh from '../hooks/useAutoRefresh';
import NotificationHeader from '../components/NotificationHeader';
import LoadingScreen from '../components/LoadingScreen';

const { width } = Dimensions.get('window');

export default function BreakingNewsScreen({ navigation }) {
  const { colors } = useTheme();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [viewMode, setViewMode] = useState('list');
  const [categories, setCategories] = useState(['Tous']);

  const styles = createBreakingNewsStyles(colors);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadNews();
    loadCategories();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNews();
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      if (data && data.length > 0) {
        const categoryNames = data.map(cat => cat.name);
        setCategories(['Tous', ...categoryNames]);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setCategories(['Tous', 'Politique', 'Économie', 'Sport', 'Culture', 'Tech']);
    }
  };

  const loadNewsSilently = async () => {
    try {
      const data = await newsService.getAllNews({ limit: 100 });
      setNews(data);
    } catch (error) {
      console.error('Error loading news silently:', error);
    }
  };
  
  useAutoRefresh(loadNewsSilently, 10000, true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <NotificationHeader />
        </View>
      ),
    });
  }, [navigation, viewMode]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await newsService.getAllNews({ limit: 100 });
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

  if (loading && news.length === 0) {
    return <LoadingScreen />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={'#E23E3E'} />
        }
      >
        {filteredNews.length === 0 ? (
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye-outline" size={14} color={'#B0B0B0'} />
                      <Text style={styles.newsTime}>{formatViews(news.views || news.view_count || news.views_count || 0)}</Text>
                    </View>
                    <Text style={styles.newsTime}>•</Text>
                    <View style={styles.authorContainer}>
                      <Ionicons name="person-circle" size={16} color={'#B0B0B0'} />
                      <Text style={styles.authorText}>{news.author}</Text>
                    </View>
                    <Text style={styles.newsTime}>•</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye-outline" size={12} color={'#B0B0B0'} />
                      <Text style={styles.newsTimeList}>{formatViews(news.views || news.view_count || news.views_count || 0)}</Text>
                    </View>
                    <Text style={styles.newsTimeList}>•</Text>
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