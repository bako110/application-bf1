/**
 * Utilitaires pour formater les dates
 */

/**
 * Formate une date en format relatif (Il y a X minutes/heures/jours)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'À l\'instant';
  } else if (diffMin < 60) {
    return `Il y a ${diffMin} min`;
  } else if (diffHour < 24) {
    return `Il y a ${diffHour}h`;
  } else if (diffDay < 7) {
    return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  } else if (diffWeek < 4) {
    return `Il y a ${diffWeek} semaine${diffWeek > 1 ? 's' : ''}`;
  } else if (diffMonth < 12) {
    return `Il y a ${diffMonth} mois`;
  } else {
    return `Il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
  }
};

/**
 * Formate une date en format court (DD/MM/YYYY)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Formate une date en format long (DD Mois YYYY)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatLongDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une date avec l'heure (DD/MM/YYYY à HH:MM)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const today = new Date();
  const d = new Date(date);
  
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

/**
 * Vérifie si une date est hier
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean}
 */
export const isYesterday = (date) => {
  if (!date) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

/**
 * Formate une date de manière intelligente (Aujourd'hui, Hier, ou date relative)
 * @param {string|Date} date - Date à formater
 * @returns {string} - Date formatée
 */
export const formatSmartDate = (date) => {
  if (!date) return '';
  
  if (isToday(date)) {
    return 'Aujourd\'hui';
  } else if (isYesterday(date)) {
    return 'Hier';
  } else {
    return formatRelativeTime(date);
  }
};
