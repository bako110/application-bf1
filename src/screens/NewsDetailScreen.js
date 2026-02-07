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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [newsId]);

  const loadNews = async () => {
    try {
      const data = await newsService.getNewsById(newsId);
      setNews(data);
    } catch (error) {
      console.error('Erreur chargement actualité:', error);
    }
    setLoading(false);
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
          contentType="news"
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
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-social" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
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
    gap: 16,
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
