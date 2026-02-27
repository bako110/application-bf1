/**
 * Utilitaires pour la gestion des vidéos (YouTube, URLs normales, etc.)
 */

/**
 * Extrait l'ID d'une vidéo YouTube depuis différents formats d'URL
 * @param {string} url - URL YouTube
 * @returns {string|null} - ID de la vidéo ou null si ce n'est pas une URL YouTube
 */
export function extractYouTubeVideoId(url) {
  if (!url) return null;

  // Patterns YouTube supportés
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // ID direct
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Vérifie si une URL est une vidéo YouTube
 * @param {string} url - URL à vérifier
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  if (!url) return false;
  
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    extractYouTubeVideoId(url) !== null
  );
}

/**
 * Détermine le type de vidéo (youtube, direct, local)
 * @param {string} url - URL de la vidéo
 * @returns {object} - { type: 'youtube'|'direct'|'local', videoId?: string }
 */
export function getVideoType(url) {
  if (!url) {
    return { type: 'local' };
  }

  // Vérifier si c'est YouTube
  const youtubeId = extractYouTubeVideoId(url);
  if (youtubeId) {
    return { type: 'youtube', videoId: youtubeId };
  }

  // Vérifier si c'est une URL HTTP/HTTPS
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { type: 'direct' };
  }

  // Sinon, c'est probablement un fichier local
  return { type: 'local' };
}

/**
 * Formate une URL YouTube pour l'embed
 * @param {string} videoId - ID de la vidéo YouTube
 * @returns {string} - URL embed
 */
export function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Exemples d'URLs YouTube supportées :
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - dQw4w9WgXcQ (ID direct)
 */
