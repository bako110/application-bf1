/**
 * Services centralisés pour l'application BF1 TV
 * Tous les services API sont exportés depuis ce fichier pour une meilleure organisation
 */

// Services d'authentification et utilisateur
export { default as authService } from './authService';
export { default as userService } from './userService';
export { default as userSettingsService } from './userSettingsService';

// Services de contenu
export { default as showService } from './showService';
export { default as movieService } from './movieService';
export { default as newsService } from './newsService';
export { default as reelService } from './reelService';
export { default as replayService } from './replayService';
export { default as interviewService } from './interviewService';
export { default as archiveService } from './archiveService';

// Services de programmes
export { default as trendingShowService } from './trendingShowService';
export { default as popularProgramService } from './popularProgramService';

// Services d'interaction
export { default as favoriteService } from './favoriteService';
export { default as likeService } from './likeService';
export { default as commentService } from './commentService';

// Services de notifications et abonnements
export { default as notificationService } from './notificationService';
export { default as subscriptionService } from './subscriptionService';

// Services de support et informations
export { default as supportService } from './supportService';
export { default as aboutService } from './aboutService';

// Services utilitaires
export { default as locationService } from './locationService';

/**
 * Exemple d'utilisation :
 * 
 * import { authService, userSettingsService, supportService } from '../services';
 * 
 * // Utiliser les services
 * const settings = await userSettingsService.getMySettings();
 * const faqs = await supportService.getFAQs();
 */
