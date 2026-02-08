import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../contexts/ThemeContext';
import newsService from '../services/newsService';
import ContentActions from '../components/contentActions';
import { formatLongDate, formatRelativeTime } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function NewsDetailScreen({ route, navigation }) {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [newsId]);

  const loadNews = async () => {
    try {
      const data = await newsService.getNewsById(newsId);
      setNews(data);
      
      // Charger les actualités similaires
      const allNews = await newsService.getAllNews({ limit: 20 });
      const filtered = allNews
        .filter(item => item.id !== newsId && item._id !== newsId)
        .slice(0, 6);
      setRelatedNews(filtered);
    } catch (error) {
      console.error('Erreur chargement actualité:', error);
    }
    setLoading(false);
  };

  // Fonction de partage sur Facebook
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://bf1tv.com/news/' + newsId)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Facebook');
    });
  };

  // Fonction de partage sur Twitter
  const shareOnTwitter = () => {
    const text = encodeURIComponent(news?.title || 'Actualité BF1');
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent('https://bf1tv.com/news/' + newsId)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Twitter');
    });
  };

  // Fonction de partage sur WhatsApp
  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${news?.title || 'Actualité BF1'} - https://bf1tv.com/news/${newsId}`);
    const url = `whatsapp://send?text=${text}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
    });
  };

  // Fonction de partage natif
  const shareNative = async () => {
    try {
      await Share.share({
        message: `${news?.title || 'Actualité BF1'} - https://bf1tv.com/news/${newsId}`,
        title: news?.title || 'Actualité BF1',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Actualité introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image de couverture */}
      {news.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: news.image_url }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.gradient}
          />
          
          {/* Bouton retour */}
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu */}
      <View style={styles.content}>
        {/* Catégorie et date */}
        <View style={styles.metaRow}>
          {news.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{news.category}</Text>
            </View>
          )}
          {news.created_at && (
            <Text style={styles.dateText}>
              {formatLongDate(news.created_at)}
            </Text>
          )}
        </View>

        {/* Titre */}
        <Text style={styles.title}>{news.title}</Text>

        {/* Auteur */}
        {news.author && (
          <View style={styles.authorRow}>
            <Ionicons name="person-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.authorText}>Par {news.author}</Text>
          </View>
        )}

        {/* Actions (Like, Comment, Favorite) */}
        <ContentActions
          contentId={newsId}
          contentType="breaking_news"
          navigation={navigation}
        />

        {/* Contenu de l'article */}
        {(news.content || news.description) && (
          <View style={styles.articleContent}>
            <Text style={styles.contentText}>{news.content || news.description}</Text>
          </View>
        )}

        {/* Édition */}
        {news.edition && (
          <View style={styles.editionContainer}>
            <Ionicons name="newspaper" size={18} color={colors.textSecondary} />
            <Text style={styles.editionText}>Édition: {news.edition}</Text>
          </View>
        )}

        {/* Partage */}
        <View style={styles.shareSection}>
          <Text style={styles.shareSectionTitle}>Partager cet article</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={shareOnFacebook}>
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              <Text style={styles.shareButtonText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareOnTwitter}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
              <Text style={styles.shareButtonText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareOnWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.shareButtonText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareNative}>
              <Ionicons name="share-social" size={24} color={colors.primary} />
              <Text style={styles.shareButtonText}>Plus</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Autres actualités */}
        {relatedNews.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="newspaper" size={20} color={colors.primary} />
              <Text style={styles.relatedTitle}>Autres actualités</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedNews.map((item) => (
                <TouchableOpacity
                  key={item.id || item._id}
                  style={styles.relatedCard}
                  onPress={() => navigation.push('NewsDetail', { newsId: item.id || item._id })}
                >
                  <Image
                    source={{ uri: item.image_url || item.image }}
                    style={styles.relatedImage}
                  />
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.relatedTime}>
                      {formatRelativeTime(item.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  imageContainer: {
    width: width,
    height: width * 0.6,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backIconButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 34,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  authorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  articleContent: {
    marginTop: 24,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  editionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 24,
  },
  editionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  shareSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  shareSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 6,
  },
  shareButtonText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  relatedSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  relatedCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  relatedImage: {
    width: '100%',
    height: 120,
  },
  relatedContent: {
    padding: 12,
  },
  relatedCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  relatedTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
