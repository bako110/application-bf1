import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { createReelStyles } from '../styles/reelStyles';
import ReelVideoPlayer from '../components/ReelVideoPlayer';
import reelService from '../services/reelService';
import commentService from '../services/commentService';
import authService from '../services/authService';
import viewService from '../services/viewService';
import { formatRelativeTime } from '../utils/dateUtils';
import usePagination from '../hooks/usePagination';
import LoadingFooter from '../components/LoadingFooter';
import SnakeLoader from '../components/LoadingScreen';

const { width, height } = Dimensions.get('window');

function ReelScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createReelStyles(colors);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [likedReels, setLikedReels] = useState(new Set());
  const [reelStats, setReelStats] = useState({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState(null);
  const [selectedReel, setSelectedReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedReelForOptions, setSelectedReelForOptions] = useState(null);
  const [likingReels, setLikingReels] = useState(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  // Pagination
  const fetchReels = async (skip, limit) => {
    return await reelService.getAllReels({ skip, limit });
  };

  const {
    data: reels,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    setData: setReels,
  } = usePagination(fetchReels, 10);
  
  const flatListRef = useRef(null);
  const viewedReelsRef = useRef(new Set());
  
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const currentReel = viewableItems[0];
      setCurrentIndex(currentReel.index);
      
      const reelId = currentReel.item?.id || currentReel.item?._id;
      if (reelId && !viewedReelsRef.current.has(reelId)) {
        viewedReelsRef.current.add(reelId);
        viewService.incrementView(reelId, 'reel');
      }
    }
  }).current;
  
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    loadCurrentUser();
    loadMyLikedReels();
  }, []);

  // Initialiser les stats quand les reels sont chargés
  useEffect(() => {
    if (reels && reels.length > 0) {
      const initialStats = {};
      reels.forEach(reel => {
        initialStats[reel.id] = {
          likes: reel.likes || 0,
          comments: reel.comments || 0,
          shares: reel.shares || 0,
          views: reel.views || 0,
        };
      });
      setReelStats(prev => ({ ...prev, ...initialStats }));
    }
  }, [reels]);

  const loadMyLikedReels = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        console.log('⚠️ Utilisateur non connecté, likes non chargés');
        return;
      }

      const likedReelsData = await reelService.getMyLikedReels();
      console.log('📥 Likes reçus du serveur:', likedReelsData);
      
      const likedIds = new Set(likedReelsData.map(like => like.content_id));
      setLikedReels(likedIds);
      console.log('✅ Reels likés chargés:', likedIds.size, 'IDs:', Array.from(likedIds));
    } catch (error) {
      console.error('❌ Erreur chargement likes:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setPaused(false);
      if (reels.length === 0) {
        loadInitial();
      }
      // Recharger les likes à chaque fois qu'on revient sur l'écran
      loadMyLikedReels();
      
      return () => {
        setPaused(true);
      };
    }, [])
  );

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadReelsSilently = async () => {
    try {
      const data = await reelService.getAllReels({ limit: reels.length || 10 });
      setReels(data);
    } catch (error) {
      console.error('Error loading reels silently:', error);
    }
  };

  const handleLike = async (reelId) => {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour liker un reel. Voulez-vous vous connecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Mon compte') }
        ]
      );
      return;
    }

    // Empêcher les clics multiples pendant le traitement
    if (likingReels.has(reelId)) {
      console.log('⚠️ Like déjà en cours de traitement pour ce reel');
      return;
    }

    // Sauvegarder l'état avant pour le rollback
    const wasLikedBefore = likedReels.has(reelId);

    try {
      // Marquer ce reel comme étant en cours de traitement
      setLikingReels(prev => new Set([...prev, reelId]));
      
      console.log('❤️ Toggle like:', { reelId, wasLikedBefore });
      
      if (wasLikedBefore) {
        // Unlike - Mise à jour optimiste de l'UI
        setLikedReels(prev => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        setReelStats(prev => ({
          ...prev,
          [reelId]: {
            ...prev[reelId],
            likes: Math.max(0, (prev[reelId]?.likes || 0) - 1)
          }
        }));
        
        // Appel API
        await reelService.unlikeReel(reelId);
        console.log('✅ Unlike réussi');
      } else {
        // Like - Mise à jour optimiste de l'UI
        setLikedReels(prev => new Set([...prev, reelId]));
        setReelStats(prev => ({
          ...prev,
          [reelId]: {
            ...prev[reelId],
            likes: (prev[reelId]?.likes || 0) + 1
          }
        }));
        
        // Appel API
        await reelService.likeReel(reelId);
        console.log('✅ Like réussi');
      }
    } catch (err) {
      console.error('❌ Erreur lors du like:', err);
      
      // Rollback en cas d'erreur
      if (wasLikedBefore) {
        // On avait essayé de unlike, on remet le like
        setLikedReels(prev => new Set([...prev, reelId]));
        setReelStats(prev => ({
          ...prev,
          [reelId]: {
            ...prev[reelId],
            likes: (prev[reelId]?.likes || 0) + 1
          }
        }));
      } else {
        // On avait essayé de like, on enlève le like
        setLikedReels(prev => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        setReelStats(prev => ({
          ...prev,
          [reelId]: {
            ...prev[reelId],
            likes: Math.max(0, (prev[reelId]?.likes || 0) - 1)
          }
        }));
      }
      
      if (err.message?.includes('auth') || err.requiresAuth) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour liker un reel');
      } else {
        Alert.alert('Erreur', 'Impossible de liker ce reel');
      }
    } finally {
      // Retirer ce reel de la liste des traitements en cours
      setLikingReels(prev => {
        const newSet = new Set(prev);
        newSet.delete(reelId);
        return newSet;
      });
    }
  };

  const handleComment = async (reelId) => {
    // Trouver le reel complet pour accéder à allow_comments
    const reel = reels.find(r => r.id === reelId);
    
    // Vérifier si les commentaires sont autorisés
    if (reel && reel.allow_comments === false) {
      Alert.alert(
        'Commentaires désactivés',
        'Les commentaires sont désactivés pour ce reel.'
      );
      return;
    }
    
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour commenter. Voulez-vous vous connecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Mon compte') }
        ]
      );
      return;
    }

    setSelectedReelId(reelId);
    setSelectedReel(reel);
    setCommentModalVisible(true);
    await loadComments(reelId);
  };

  const loadComments = async (reelId) => {
    try {
      setLoadingComments(true);
      const data = await reelService.getReelComments(reelId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submittingComment) {
      console.log('❌ Commentaire vide ou déjà en cours de soumission');
      return;
    }

    console.log('📝 Tentative d\'ajout de commentaire:', {
      reelId: selectedReelId,
      text: commentText.trim()
    });

    try {
      setSubmittingComment(true);
      const result = await reelService.createComment(selectedReelId, commentText.trim());
      console.log('✅ Commentaire créé avec succès:', result);
      
      setReelStats(prev => ({
        ...prev,
        [selectedReelId]: {
          ...prev[selectedReelId],
          comments: (prev[selectedReelId]?.comments || 0) + 1
        }
      }));
      
      await loadComments(selectedReelId);
      setCommentText('');
      Alert.alert('Succès', 'Commentaire publié');
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du commentaire:', err);
      console.error('Détails de l\'erreur:', JSON.stringify(err, null, 2));
      
      if (err.message?.includes('auth') || err.requiresAuth) {
        setSelectedReel(null);
        Alert.alert('Connexion requise', 'Vous devez être connecté pour commenter');
      } else {
        const errorMessage = err.detail || err.message || 'Impossible de publier le commentaire';
        Alert.alert('Erreur', errorMessage);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedReelId(null);
    setComments([]);
    setCommentText('');
    setEditingCommentId(null);
    setEditText('');
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
      return;
    }

    try {
      await commentService.updateComment(commentId, editText.trim());
      setEditingCommentId(null);
      setEditText('');
      await loadComments(selectedReelId);
      Alert.alert('Succès', 'Commentaire modifié');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le commentaire');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentService.deleteComment(commentId);
              await loadComments(selectedReelId);
              setReelStats(prev => ({
                ...prev,
                [selectedReelId]: {
                  ...prev[selectedReelId],
                  comments: Math.max(0, (prev[selectedReelId]?.comments || 0) - 1)
                }
              }));
              Alert.alert('Succès', 'Commentaire supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (reelId) => {
    try {
      await reelService.shareReel(reelId);
      
      setReelStats(prev => ({
        ...prev,
        [reelId]: {
          ...prev[reelId],
          shares: (prev[reelId]?.shares || 0) + 1
        }
      }));
      
      Alert.alert('Succès', 'Reel partagé');
    } catch (err) {
      console.error('Error sharing reel:', err);
      if (err.message?.includes('auth') || err.requiresAuth) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour partager');
      } else {
        Alert.alert('Erreur', 'Impossible de partager le reel');
      }
    }
  };

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const renderReel = ({ item, index }) => {
    const isActive = index === currentIndex;
    const isLiked = likedReels.has(item.id);
    const isExpanded = expandedDescriptions.has(item.id);

    return (
      <View style={styles.reelContainer}>
        <ReelVideoPlayer
          videoUrl={item.videoUrl || item.video_url}
          isActive={isActive}
          paused={paused}
          onError={(error) => {}}
          onBuffer={({ isBuffering }) => {}}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomContentContainer}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.title || 'Titre du reel'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setExpandedDescriptions(prev => {
                  const newSet = new Set(prev);
                  if (isExpanded) {
                    newSet.delete(item.id);
                  } else {
                    newSet.add(item.id);
                  }
                  return newSet;
                });
              }}
            >
              <Text 
                style={styles.description} 
                numberOfLines={isExpanded ? undefined : 2} 
                ellipsizeMode="tail"
              >
                {item.description || 'Description du reel'}
                {!isExpanded && item.description && item.description.length > 80 && (
                  <Text style={styles.seeMoreText}> ...plus</Text>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <TouchableOpacity
          style={styles.videoTouchable}
          activeOpacity={1}
          onPress={togglePlayPause}
        >
          {paused && (
            <View style={styles.pausedOverlay}>
              <Ionicons name="play-circle" size={80} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
            disabled={likingReels.has(item.id)}
          >
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={32} 
              color={isLiked ? '#E23E3E' : '#fff'} 
            />
            <Text style={styles.actionText}>
              {reelStats[item.id]?.likes ?? item.likes ?? 0}
            </Text>
          </TouchableOpacity>

          {/* Bouton Commentaire - Affiché seulement si les commentaires sont autorisés */}
          {(item.allow_comments !== false) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleComment(item.id)}
            >
              <Ionicons name="chatbubble-outline" size={30} color="#fff" />
              <Text style={styles.actionText}>
                {reelStats[item.id]?.comments ?? item.comments ?? 0}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item.id)}
          >
            <Ionicons name="arrow-redo-outline" size={30} color="#fff" />
            <Text style={styles.actionText}>
              {reelStats[item.id]?.shares ?? item.shares ?? 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setSelectedReelForOptions(item);
              setShowOptionsModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (loading && reels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <SnakeLoader />
      </View>
    );
  }

  if (error && reels.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={'#E23E3E'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReelsSilently}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChangedRef}
        viewabilityConfig={viewabilityConfigRef}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={<LoadingFooter loading={loadingMore} hasMore={hasMore} />}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {/* Modal Commentaires */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCommentModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commentaires</Text>
              <TouchableOpacity onPress={closeCommentModal}>
                <Ionicons name="close" size={28} color={'#FFFFFF'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {loadingComments ? (
                <ActivityIndicator size="large" color={'#E23E3E'} style={{ marginTop: 20 }} />
              ) : comments.length > 0 ? (
                comments.map((comment) => {
                  const isOwner = currentUser && comment.user_id === currentUser.id;
                  const username = comment.user?.username || comment.username || 'Utilisateur';
                  
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        <Ionicons name="person" size={16} color="#fff" />
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUsername}>{username}</Text>
                        {editingCommentId === comment.id ? (
                          <View style={styles.editContainer}>
                            <TextInput
                              style={styles.editInput}
                              value={editText}
                              onChangeText={setEditText}
                              multiline
                              autoFocus
                            />
                            <View style={styles.editActions}>
                              <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelEdit}
                              >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => handleUpdateComment(comment.id)}
                              >
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.commentText}>{comment.text}</Text>
                            <Text style={styles.commentTime}>
                              {formatRelativeTime(comment.created_at)}
                            </Text>
                          </>
                        )}
                      </View>
                      {isOwner && editingCommentId !== comment.id && (
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            onPress={() => handleEditComment(comment)}
                            style={styles.commentActionButton}
                          >
                            <Ionicons name="create-outline" size={18} color={'#E23E3E'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment.id)}
                            style={styles.commentActionButton}
                          >
                            <Ionicons name="trash-outline" size={18} color={'#FF0000'} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={48} color={'#B0B0B0'} />
                  <Text style={styles.emptyCommentsText}>Aucun commentaire</Text>
                  <Text style={styles.emptyCommentsSubtext}>Soyez le premier à commenter</Text>
                </View>
              )}
            </ScrollView>

            {/* Zone de saisie - Affichée seulement si les commentaires sont autorisés */}
            {selectedReel && selectedReel.allow_comments !== false ? (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Ajouter un commentaire..."
                  placeholderTextColor={'#B0B0B0'}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, (!commentText.trim() || submittingComment) && styles.sendButtonDisabled]}
                  onPress={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator size="small" color={'#E23E3E'} />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color={commentText.trim() ? '#E23E3E' : '#B0B0B0'}
                    />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.commentInputContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="lock-closed" size={24} color={'#B0B0B0'} />
                <Text style={styles.emptyCommentsText}>Les commentaires sont désactivés</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Options */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.optionsOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                if (selectedReelForOptions) {
                  handleShare(selectedReelForOptions.id);
                }
                setShowOptionsModal(false);
              }}
            >
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.optionText}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                Alert.alert('Copié', 'Lien copié dans le presse-papier');
                setShowOptionsModal(false);
              }}
            >
              <Ionicons name="link" size={24} color="#fff" />
              <Text style={styles.optionText}>Copier le lien</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                Alert.alert('Enregistré', 'Reel enregistré dans vos favoris');
                setShowOptionsModal(false);
              }}
            >
              <Ionicons name="bookmark" size={24} color="#fff" />
              <Text style={styles.optionText}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                Alert.alert('Signalé', 'Ce contenu a été signalé');
                setShowOptionsModal(false);
              }}
            >
              <Ionicons name="flag" size={24} color="#E23E3E" />
              <Text style={[styles.optionText, { color: '#E23E3E' }]}>Signaler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionItem, styles.cancelOption]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default ReelScreen;