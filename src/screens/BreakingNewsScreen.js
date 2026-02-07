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

const { width } = Dimensions.get('window');

export default function BreakingNewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const fadeAnim = new Animated.Value(0);

  const categories = ['Tous', 'Politique', 'Économie', 'Sport', 'Culture', 'Tech'];

  useEffect(() => {
    loadNews();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNews();
    }, [])
  );

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await newsService.getAllNews({ limit: 100 });
      setNews(data);
    } catch (error) {
      console.error('Error loading news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = selectedCategory === 'Tous'
    ? news
    : news.filter(item => (item.category || item.edition) === selectedCategory);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedCategory, news]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

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
          <Ionicons name="flash" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Breaking News</Text>
        </View>
        <View style={styles.placeholder} />
      </LinearGradient>

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredNews.map((news, index) => (
            <TouchableOpacity 
              key={news.id} 
              style={styles.newsCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('NewsDetail', { newsId: news.id || news._id })}
            >
              <Image source={{ uri: news.image_url || news.image }} style={styles.newsImage} />
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
                    <Ionicons name="person-circle" size={16} color={colors.textSecondary} />
                    <Text style={styles.authorText}>{news.author}</Text>
                  </View>
                  <Text style={styles.newsTime}>
                    {formatRelativeTime(news.created_at || news.time)}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>
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
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textSecondary,
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
  newsCard: {
    width: '100%',
    height: 280,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  newsImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: colors.primary,
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
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 26,
  },
  newsDescription: {
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontSize: 13,
  },
  newsTime: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 30,
  },
});
