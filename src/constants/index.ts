// ─── Dimensions responsives (calculées une fois au démarrage) ────────────────
import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const SCREEN = {
  W: SCREEN_W,
  H: SCREEN_H,
} as const;

// Carte portrait (42% de l'écran, max 200px sur petits écrans)
export const CARD_W   = Math.min(SCREEN_W * 0.42, 200);
export const CARD_H   = Math.round(CARD_W * 1.55);   // ratio ~2:3

// Carte landscape — "Vous l'avez raté" / Reportages
export const LAND_W   = Math.min(SCREEN_W * 0.66, 240);
export const LAND_H   = Math.round(LAND_W * 0.5625); // ratio 16:9

// Carte related dans ShowDetail (3 colonnes environ)
export const REL_W    = Math.round(SCREEN_W * 0.38);
export const REL_H    = Math.round(REL_W * 0.5625);  // 16:9

// Hero plein écran 16:9
export const HERO_H   = Math.round(SCREEN_W * 9 / 16);

// Miniature liste épisode (EmissionCategory)
export const EP_THUMB_W = Math.round(SCREEN_W * 0.30);

// Miniature large dans une liste (LiveScreen épisodes, ratio 16:9)
export const LIST_THUMB_W = Math.round(Math.min(SCREEN_W * 0.38, 160));
export const LIST_THUMB_H = Math.round(LIST_THUMB_W * (9 / 16));

// Carte en grille 2 colonnes (PageScreen) — largeur = (écran - 3 × padding) / 2
export const GRID_CARD_W = Math.floor((SCREEN_W - 16 * 3) / 2);
export const GRID_CARD_H = Math.round(GRID_CARD_W * 1.55);

// Mini-player live (coin bas-droite) — partagé LivePlayer / LiveMiniPlayer / LivePlayerOverlay
export const MINI_PLAYER_W = Math.round(Math.min(SCREEN_W * 0.52, 210));
export const MINI_PLAYER_H = Math.round(MINI_PLAYER_W * (9 / 16));

// Drawer latéral (HomeHeader)
export const DRAWER_W = Math.round(Math.min(SCREEN_W * 0.78, 290));

// Bouton play circulaire (LiveBanner hero)
export const PLAY_BTN_SIZE = Math.round(Math.min(SCREEN_W * 0.18, 70));

// ─── Couleurs fixes BF1 (jamais changées par le thème) ──────────────────────
export const COLORS = {
  primary:       '#E23E3E',
  primaryDark:   '#C93535',
  primaryLight:  'rgba(226,62,62,0.12)',

  // Abonnements
  basic:    '#3B82F6',
  standard: '#9C27B0',
  premium:  '#FF6F00',

  // États
  success: '#34C759',
  error:   '#FF3B30',
  warning: '#FF9500',
  info:    '#007AFF',

  // Fixes
  white: '#FFFFFF',
  black: '#000000',

  // Alpha
  redAlpha90: 'rgba(226,62,62,0.9)',
  redAlpha50: 'rgba(226,62,62,0.5)',
  redAlpha20: 'rgba(226,62,62,0.2)',
  redAlpha12: 'rgba(226,62,62,0.12)',
  blackAlpha90: 'rgba(0,0,0,0.9)',
  blackAlpha70: 'rgba(0,0,0,0.7)',
  blackAlpha50: 'rgba(0,0,0,0.5)',
  blackAlpha30: 'rgba(0,0,0,0.3)',
  whiteAlpha20: 'rgba(255,255,255,0.2)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha08: 'rgba(255,255,255,0.08)',
} as const;

// ─── Espacements ─────────────────────────────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
} as const;

// ─── Typographie ─────────────────────────────────────────────────────────────
export const FONT_SIZE = {
  xxs:  9,
  xs:   10,
  sm:   12,
  md:   14,
  base: 15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 28,
} as const;

export const FONT_WEIGHT = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
  black:     '900' as const,
};

// ─── Rayons de bordure ───────────────────────────────────────────────────────
export const RADIUS = {
  sm:   6,
  md:   10,
  lg:   12,
  xl:   16,
  xxl:  20,
  full: 999,
} as const;

// ─── API ─────────────────────────────────────────────────────────────────────
export const API_CONFIG = {
  IS_PRODUCTION: true,
  PRODUCTION_URL: 'http://161.97.117.46:8090',
  LOCAL_URL:      'http://192.168.137.1:8000',
  get BASE_URL() {
    return `${this.IS_PRODUCTION ? this.PRODUCTION_URL : this.LOCAL_URL}/api/v1`;
  },
  CACHE_TTL: 5 * 60 * 1000, // 5 min
  TIMEOUT:   10_000,
} as const;

export const LIVE_STREAM_URL =
  'https://geo.dailymotion.com/player/xtv3w.html?video=xa4kdv6&ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0';

// ─── Navigation ──────────────────────────────────────────────────────────────
export const ROUTES = {
  // Tabs
  HOME:        'Home',
  LIVE:        'Live',
  EMISSIONS:   'Emissions',
  REELS:       'Reels',
  PROFILE:     'Profile',

  // Auth
  LOGIN:           'Login',
  REGISTER:        'Register',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Contenu
  NEWS:              'News',
  MISSED:            'Missed',
  JTANDMAG:          'JTandMag',
  MAGAZINE:          'Magazine',
  SPORTS:            'Sports',
  DIVERTISSEMENT:    'Divertissement',
  REPORTAGES:        'Reportages',
  ARCHIVE:           'Archive',
  TELE_REALITE:      'TeleRealite',
  MOVIES:            'Movies',
  SERIES:            'Series',
  PROGRAMS:          'Programs',
  EMISSION_CATEGORY: 'EmissionCategory',

  // Détails
  SHOW_DETAIL:   'ShowDetail',
  NEWS_DETAIL:   'NewsDetail',
  SERIES_DETAIL: 'SeriesDetail',

  // Profil
  FAVORITES:     'Favorites',
  NOTIFICATIONS: 'Notifications',
  SETTINGS:      'Settings',
  SUPPORT:       'Support',
  ABOUT:         'About',
  SEARCH:        'Search',
} as const;

// ─── Abonnements ─────────────────────────────────────────────────────────────
export const SUB_HIERARCHY: Record<string, number> = {
  basic:    1,
  standard: 2,
  premium:  3,
};

export const SUB_BADGE = {
  basic:    { label: 'Basic',    color: 'linear-gradient(135deg,#3B82F6,#2563EB)' },
  standard: { label: 'Standard', color: 'linear-gradient(135deg,#9C27B0,#7B1FA2)' },
  premium:  { label: 'Premium',  color: 'linear-gradient(135deg,#FF6F00,#F57C00)' },
} as const;
