import { useState } from 'react';
import likeService from '../services/likeService';
import favoriteService from '../services/favoriteService';
import commentService from '../services/commentService';
import authService from '../services/authService';

/**
 * Hook personnalisé pour gérer les actions sur le contenu (like, favorite, comment)
 */
const useContentActions = (contentId, contentType, allowComments = true) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Charger les états initiaux
  const loadInitialState = async () => {
    try {
      console.log('🔄 Chargement état initial pour:', { contentId, contentType });
      
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        const [likedStatus, favorites] = await Promise.all([
          likeService.checkLiked(contentId, contentType),
          favoriteService.getMyFavorites(),
        ]);
        
        console.log('✅ État likes:', likedStatus);
        console.log('📋 Tous mes favoris:', favorites.length);
        
        setLiked(likedStatus);
        
        // Vérifier si le contenu est dans les favoris
        const isFavorited = favorites.some(fav => {
          if (contentType === 'show') return fav.show_id === contentId;
          if (contentType === 'movie') return fav.movie_id === contentId;
          if (contentType === 'series') return fav.series_id === contentId;
          if (contentType === 'archive') return fav.archive_id === contentId;
          return false;
        });
        
        console.log('⭐ Est favori?', isFavorited, 'pour', contentType, contentId);
        setFavorited(isFavorited);
      }
      
      // Charger les compteurs (accessible sans auth)
      const [likes, comments] = await Promise.all([
        likeService.countLikes(contentId, contentType),
        commentService.countComments(contentId, contentType),
      ]);
      
      console.log('📊 Compteurs - Likes:', likes, 'Comments:', comments);
      
      setLikeCount(likes);
      setCommentCount(comments);
    } catch (error) {
      console.error('❌ Erreur chargement état:', error);
    }
  };

  // Toggle like
  const handleLike = async () => {
    console.log('❤️ Toggle like pour:', { contentId, contentType, currentLiked: liked });
    
    try {
      await likeService.toggleLike(contentId, contentType);
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      console.log('✅ Like toggled:', newLiked ? 'Liké' : 'Unliké');
    } catch (error) {
      console.error('❌ Erreur toggle like:', error);
      // Si erreur d'authentification, afficher modal de connexion
      if (error.requiresAuth) {
        console.log('🔐 Authentification requise pour liker');
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
    console.log('💬 Ouverture modal commentaires pour:', { contentId, contentType, allowComments });
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
    allowComments,
  };
};

export default useContentActions;
