import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useContentActions from '../hooks/useContentActions';
import LoginRequiredModal from './loginRequiredModal';
import CommentsModal from './commentsModal';

const ContentActions = ({ contentId, contentType, navigation }) => {
  const {
    liked,
    likeCount,
    favorited,
    commentCount,
    showLoginModal,
    setShowLoginModal,
    showCommentsModal,
    setShowCommentsModal,
    handleLike,
    handleFavorite,
    handleComment,
    loadInitialState,
  } = useContentActions(contentId, contentType);

  useEffect(() => {
    loadInitialState();
  }, [contentId]);

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    if (navigation) {
      // Naviguer vers le tab Profil puis vers l'écran Login
      navigation.getParent()?.navigate('Profil', {
        screen: 'Login'
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Bouton Like */}
      <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
        <Text style={styles.icon}>{liked ? '❤️' : '🤍'}</Text>
        <Text style={styles.count}>{likeCount}</Text>
      </TouchableOpacity>

      {/* Bouton Commentaire */}
      <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.count}>{commentCount}</Text>
      </TouchableOpacity>

      {/* Bouton Favori */}
      <TouchableOpacity 
        style={[styles.actionButton, styles.favoriteButton]} 
        onPress={handleFavorite}
        activeOpacity={0.6}
      >
        <Text style={[styles.icon, favorited && styles.favoritedIcon]}>
          {favorited ? '⭐' : '☆'}
        </Text>
        <Text style={styles.favoriteLabel}>
          {favorited ? 'Favori' : 'Ajouter'}
        </Text>
      </TouchableOpacity>

      {/* Modal de connexion requise */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginRedirect}
        message="Connectez-vous pour interagir avec ce contenu"
      />

      {/* Modal des commentaires */}
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        contentId={contentId}
        contentType={contentType}
        onLoginRequired={() => {
          setShowCommentsModal(false);
          setShowLoginModal(true);
        }}
        onCommentChange={loadInitialState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favoriteButton: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  icon: {
    fontSize: 24,
  },
  favoritedIcon: {
    transform: [{ scale: 1.1 }],
  },
  favoriteLabel: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

export default ContentActions;
