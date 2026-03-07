import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking,
  Alert,
} from 'react-native';
import LoadingScreen from '../../components/LoadingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../contexts/ThemeContext';
import newsService from '../../services/newsService';
import ContentActions from '../../components/contentActions';
import { formatLongDate, formatRelativeTime } from '../../utils/dateUtils';
import ExpandableText from '../../components/ExpandableText';

const { width } = Dimensions.get('window');

export default function NewsDetailScreen({ route, navigation }) {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [newsId]);

  // Fonction pour trier du plus récent au plus ancien
  const sortByDate = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at || a.date || 0);
      const dateB = new Date(b.created_at || b.published_at || b.date || 0);
      return dateB - dateA;
    });
  };

  const loadNews = async () => {
    try {
      console.log('📰 Chargement news:', newsId);
      const data = await newsService.getNewsById(newsId);
      setNews(data);
      
      // Charger toutes les news similaires
      const allNews = await newsService.getAllNews({ limit: 50 });
      
      // Filtrer pour exclure la news courante
      const filtered = allNews
        .filter(item => (item.id || item._id) !== (newsId || data.id || data._id));
      
      // Trier du plus récent au plus ancien
      const sortedFiltered = sortByDate(filtered);
      
      console.log(`📦 ${sortedFiltered.length} news similaires chargées et triées`);
      setRelatedNews(sortedFiltered);
    } catch (error) {
      console.error('❌ Erreur chargement news:', error);
    }
    setLoading(false);
  };

  // Fonctions de partage
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://bf1tv.com/news/' + newsId)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Facebook');
    });
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(news?.title || 'News BF1');
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent('https://bf1tv.com/news/' + newsId)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir Twitter');
    });
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${news?.title || 'News BF1'} - https://bf1tv.com/news/${newsId}`);
    const url = `whatsapp://send?text=${text}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
    });
  };

  const shareNative = async () => {
    try {
      await Share.share({
        message: `${news?.title || 'News BF1'} - https://bf1tv.com/news/${newsId}`,
        title: news?.title || 'News BF1',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#E23E3E" />
        <Text style={styles.errorText}>News introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Image de couverture */}
      {news.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: news.image_url }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['transparent', '#000000']}
            style={styles.gradient}
          />
          
          {/* Badge Flash Info (gardé pour l'UI) */}
          <View style={styles.flashBadge}>
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.flashBadgeText}>FLASH INFO</Text>
          </View>
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
            <Ionicons name="person-circle" size={20} color={'#B0B0B0'} />
            <Text style={styles.authorText}>Par {news.author}</Text>
          </View>
        )}

        {/* Actions (Like, Comment, Favorite) */}
        <ContentActions
          contentId={newsId}
          contentType="breaking_news" 
          navigation={navigation}
          allowComments={news?.allow_comments !== false}
        />

        {/* Contenu de l'article */}
        {(news.content || news.description) && (
          <View style={styles.articleContent}>
            <Text style={styles.contentLabel}>Contenu</Text>
            <ExpandableText
              text={news.content || news.description}
              numberOfLines={5}
              style={styles.contentText}
              expandedStyle={styles.contentText}
            />
          </View>
        )}

        {/* Édition */}
        {news.edition && (
          <View style={styles.editionContainer}>
            <Ionicons name="newspaper" size={18} color={'#B0B0B0'} />
            <Text style={styles.editionText}>Édition: {news.edition}</Text>
          </View>
        )}

        {/* Partage */}
        <View style={styles.shareSection}>
          <Text style={styles.shareSectionTitle}>Partager ce flash info</Text>
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
              <Ionicons name="share-social" size={24} color={'#E23E3E'} />
              <Text style={styles.shareButtonText}>Plus</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Autres flash info (gardé pour l'UI) */}
        {relatedNews.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Ionicons name="flash" size={20} color={'#E23E3E'} />
              <Text style={styles.relatedTitle}>
                Autres flash info ({relatedNews.length})
              </Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedNews.map((item) => {
                // Formater la date pour l'afficher
                const itemDate = item.created_at || item.published_at || item.date;
                const formattedDate = itemDate ? 
                  formatRelativeTime(itemDate) : null;
                
                return (
                  <TouchableOpacity
                    key={item.id || item._id}
                    style={styles.relatedCard}
                    onPress={() => {
                      navigation.push('NewsDetail', { newsId: item.id || item._id });
                    }}
                  >
                    <Image
                      source={{ uri: item.image_url || item.image || item.thumbnail || 'https://via.placeholder.com/120x100' }}
                      style={styles.relatedImage}
                    />
                    <View style={styles.relatedContent}>
                      <Text style={styles.relatedCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.relatedMeta}>
                        <Ionicons name="time" size={12} color="#B0B0B0" />
                        <Text style={styles.relatedTime}>
                          {formattedDate || formatRelativeTime(item.created_at)}
                        </Text>
                      </View>
                      {item.category && (
                        <View style={styles.relatedCategoryBadge}>
                          <Ionicons name="flash" size={8} color="#E23E3E" />
                          <Text style={styles.relatedCategoryText}>{item.category}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  flashBadge: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    zIndex: 10,
  },
  flashBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#E23E3E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#E23E3E',
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#B0B0B0',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    color: '#B0B0B0',
    fontStyle: 'italic',
  },
  articleContent: {
    marginTop: 24,
    marginBottom: 24,
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  editionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1A0000',
    borderRadius: 8,
    marginBottom: 24,
  },
  editionText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  shareSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A0000',
  },
  shareSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#1A0000',
    gap: 6,
  },
  shareButtonText: {
    fontSize: 11,
    color: '#B0B0B0',
    fontWeight: '500',
    marginTop: 4,
  },
  relatedSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A0000',
    marginBottom: 20,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  relatedGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  relatedCard: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
    height: 100,
  },
  relatedImage: {
    width: 120,
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  relatedContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  relatedCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  relatedTime: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  relatedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  relatedCategoryText: {
    fontSize: 10,
    color: '#E23E3E',
    fontWeight: '500',
  },
});