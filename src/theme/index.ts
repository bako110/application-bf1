import { COLORS } from '../constants';

// ─── Tokens dark (identiques à themes.css :root) ─────────────────────────────
export const darkTheme = {
  mode: 'dark' as const,

  // Backgrounds
  bg:       '#070707',
  bg1:      '#000000',
  bg2:      '#0d0d0d',
  bg3:      '#1a1a1a',
  surface:  '#141414',
  cardBg:   '#1a1a1a',
  hoverBg:  '#111111',

  // Textes
  text:           '#FFFFFF',
  text1:          '#FFFFFF',
  text2:          '#CCCCCC',
  text3:          '#A0A0A0',
  text4:          '#888888',
  textSecondary:  '#A0A0A0',
  headingColor:   '#FFFFFF',

  // Bordures
  border:  '#2a2a2a',
  divider: '#1e1e1e',

  // Header
  headerBg:     '#000000',
  headerBorder: '#1e1e1e',
  headerText:   '#FFFFFF',

  // Badges
  badgeBg:   '#2a2a2a',
  badgeText: '#CCCCCC',

  // Skeleton
  skeletonBg:      '#1a1a1a',
  skeletonShimmer: 'rgba(255,255,255,0.07)',

  // Boutons secondaires
  btnSecondaryBg:     '#1a1a1a',
  btnSecondaryText:   '#FFFFFF',
  btnSecondaryBorder: '#2a2a2a',

  // Fixes (idem dans les 2 thèmes)
  primary:      COLORS.primary,
  primaryDark:  COLORS.primaryDark,
  primaryLight: COLORS.primaryLight,
  success:      COLORS.success,
  error:        COLORS.error,
  warning:      COLORS.warning,
  info:         COLORS.info,

  // Icône de tab live
  tabBar: {
    bg:           '#000000',
    border:       COLORS.primary,
    active:       COLORS.primary,
    inactive:     '#A0A0A0',
    shadow:       'rgba(226,62,62,0.2)',
  },
} as const;

// ─── Tokens light (identiques à themes.css [data-theme="light"]) ─────────────
export const lightTheme = {
  mode: 'light' as const,

  bg:       '#F2F2F2',
  bg1:      '#FFFFFF',
  bg2:      '#F5F5F5',
  bg3:      '#EEEEEE',
  surface:  '#FFFFFF',
  cardBg:   '#EEEEEE',
  hoverBg:  '#E8E8E8',

  text:           '#111111',
  text1:          '#1a1a1a',
  text2:          '#444444',
  text3:          '#666666',
  text4:          '#FFFFFF',
  textSecondary:  '#555555',
  headingColor:   '#1a1a1a',

  border:  '#DDDDDD',
  divider: '#E0E0E0',

  headerBg:     '#FFFFFF',
  headerBorder: '#DDDDDD',
  headerText:   '#1a1a1a',

  badgeBg:   '#EEEEEE',
  badgeText: '#444444',

  skeletonBg:      '#E8E8E8',
  skeletonShimmer: 'rgba(0,0,0,0.03)',

  btnSecondaryBg:     '#F0F0F0',
  btnSecondaryText:   '#1a1a1a',
  btnSecondaryBorder: '#DDDDDD',

  primary:      COLORS.primary,
  primaryDark:  COLORS.primaryDark,
  primaryLight: 'rgba(226,62,62,0.08)',
  success:      COLORS.success,
  error:        COLORS.error,
  warning:      COLORS.warning,
  info:         COLORS.info,

  tabBar: {
    bg:       '#FFFFFF',
    border:   COLORS.primary,
    active:   COLORS.primary,
    inactive: '#999999',
    shadow:   'rgba(226,62,62,0.15)',
  },
} as const;

export type Theme = typeof darkTheme | typeof lightTheme;
export type ThemeMode = 'dark' | 'light';

export const themes = { dark: darkTheme, light: lightTheme } as const;
