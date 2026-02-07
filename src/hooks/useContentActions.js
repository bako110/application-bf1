import { useState } from 'react';
import likeService from '../services/likeService';
import favoriteService from '../services/favoriteService';
import commentService from '../services/commentService';
import authService from '../services/authService';

/**
 * Hook personnalisé pour gérer les actions sur le contenu (like, favorite, comment)
 */
const useContentActions = (contentId, contentType) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Charger les états initiaux
  const loadInitialState = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const [likedStatus, favorites] = await Promise.all([
          likeService.checkLiked(contentId, contentType),
          favoriteService.getMyFavorites(),
        ]);
        
        setLiked(likedStatus);
        
        // Vérifier si le contenu est dans les favoris
        const isFavorited = favorites.some(fav => {
          if (contentType === 'show') return fav.show_id === contentId;
          if (contentType === 'movie') return fav.movie_id === contentId;
          return false;
        });
        setFavorited(isFavorited);
      }
      
      // Charger les compteurs (accessible sans auth)
      const [likes, comments] = await Promise.all([
        likeService.countLikes(contentId, contentType),
        commentService.countComments(contentId, contentType),
      ]);
      
      setLikeCount(likes);
      setCommentCount(comments);
    } catch (error) {
      console.error('Erreur chargement état:', error);
    }
  };

  // Toggle like
  const handleLike = async () => {
    try {
      await likeService.toggleLike(contentId, contentType);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      // Si erreur d'authentification, afficher modal de connexion
      if (error.requiresAuth) {
        setShowLoginModal(true);
      } else {
        console.error('Erreur toggle like:', error);
      }
    }
  };

  // Toggle favorite
  const handleFavorite = async () => {
    console.log('🌟 Bouton favori cliqué!', { contentId, contentType, favorited });
    
    try {
      if (favorited) {
        console.log('🗑️ Retrait du favori...');
        await favoriteService.removeFavoriteByContent(contentId, contentType);
        setFavorited(false);
        console.log('✅ Favori retiré avec succès');
      } else {
        console.log('➕ Ajout au favori...');
        await favoriteService.addFavorite(contentId, contentType);
        setFavorited(true);
        console.log('✅ Favori ajouté avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur toggle favorite:', error);
      // Si erreur d'authentification, afficher modal de connexion
      if (error.requiresAuth) {
        console.log('🔐 Authentification requise');
        setShowLoginModal(true);
      } else {
        console.error('Erreur toggle favorite:', error);
      }
    }
  };

  // Ouvrir les commentaires
  const handleComment = () => {
    setShowCommentsModal(true);
  };

  return {
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
  };
};

export default useContentActions;
