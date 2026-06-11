import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Modal, ScrollView, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, DRAWER_W } from '../../constants';
import { BF1Logo } from '../ui/BF1Logo';
import * as api from '../../services/api';

interface Props {
  onSearchPress:    () => void;
  scrollY?:         Animated.Value;
  onProfileTabPress?: (screen?: string) => void;
}

export function HomeHeader({ onSearchPress, scrollY, onProfileTabPress }: Props) {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const insets            = useSafeAreaInsets();
  const navigation        = useNavigation<any>();
  const { isAuthenticated, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey:        ['notifications'],
    queryFn:         api.getNotifications,
    enabled:         isAuthenticated,
    refetchInterval: 60_000,
    staleTime:       30_000,
  });
  const unreadCount = isAuthenticated
    ? ((notifications as any[] | undefined) ?? []).filter((n: any) => !n.is_read).length
    : 0;

  const bgOpacity = scrollY
    ? scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' })
    : 1;
  const borderOpacity = scrollY
    ? scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' })
    : 1;

  // Sections construites depuis les traductions
  const drawerSections = [
    {
      title: 'Navigation',
      items: [
        { icon: 'home',             label: t.nav.home,                    route: 'HomeTab'           },
        { icon: 'tv-outline',       label: t.nav.emissions,               route: 'EmissionsTab'      },
        { icon: 'radio-outline',    label: t.nav.live,                    route: 'LiveTab'           },
        { icon: 'play-circle',      label: t.nav.reels,                   route: 'ReelsTab'          },
      ],
    },
    {
      title: t.content.news + ' & ' + t.content.emissions,
      items: [
        { icon: 'time-outline',          label: t.home.missed,           route: 'MissedPage'         },
        { icon: 'videocam-outline',      label: t.home.jtMag,            route: 'JTandMagPage'       },
        { icon: 'film-outline',          label: t.home.reportages,       route: 'ReportagesPage'     },
        { icon: 'book-outline',          label: t.home.magazine,         route: 'MagazinePage'       },
        { icon: 'musical-notes-outline', label: t.home.divertissement,   route: 'DivertissementPage' },
        { icon: 'star-outline',          label: t.home.teleRealite,      route: 'TeleRealitePage'    },
        { icon: 'trophy-outline',        label: t.home.sports,           route: 'SportsPage'         },
        { icon: 'archive-outline',       label: t.home.archives,         route: 'ArchivePage'        },
        { icon: 'flash-outline',         label: t.home.flashInfo,        route: 'NewsPage'           },
        { icon: 'calendar-outline',      label: t.content.programs,      route: 'Programs'           },
      ],
    },
    {
      title: t.nav.profile,
      items: [
        { icon: 'person-circle-outline',      label: t.nav.profile,       route: 'ProfileTab', profileScreen: undefined     },
        { icon: 'heart-outline',              label: t.profile.favorites, route: 'ProfileTab', profileScreen: 'Favorites'   },
        { icon: 'information-circle-outline', label: t.profile.about,     route: 'ProfileTab', profileScreen: 'About'       },
        { icon: 'headset-outline',            label: t.profile.support,   route: 'ProfileTab', profileScreen: 'Support'     },
      ],
    },
  ];

  function navigateTo(route: string, profileScreen?: string) {
    setDrawerOpen(false);
    setTimeout(() => {
      if (profileScreen) {
        onProfileTabPress?.(profileScreen);
      } else if (route === 'ProfileTab') {
        onProfileTabPress?.();
      } else {
        navigation.navigate(route as any);
      }
    }, 200);
  }

  return (
    <>
      <Animated.View
        style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}
        pointerEvents="box-none"
      >
        {/* Fond animé */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg, opacity: bgOpacity }]}
          pointerEvents="none"
        />
        {/* Bordure rouge animée */}
        <Animated.View
          style={[styles.border, { backgroundColor: COLORS.primary, opacity: borderOpacity }]}
          pointerEvents="none"
        />

        <View style={styles.content} pointerEvents="box-none">
          {/* Hamburger gauche */}
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon name="menu-outline" size={26} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Logo centré */}
          <View style={styles.brandWrap}>
            <BF1Logo size="md" />
          </View>

          {/* Actions droite */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onSearchPress}
              style={styles.iconBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Icon name="search-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onProfileTabPress?.('Notifications')}
              style={styles.iconBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Icon
                name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                size={22}
                color={COLORS.primary}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* ── Side Drawer ── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={() => setDrawerOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />

          <Animated.View style={[
            styles.drawer,
            {
              backgroundColor:  theme.bg,
              borderRightColor: COLORS.primary,
              paddingTop:       insets.top,
            },
          ]}>

            {/* Header drawer */}
            <View style={[styles.drawerHeader, { borderBottomColor: COLORS.primary }]}>
              <BF1Logo size="lg" />
              <TouchableOpacity onPress={() => setDrawerOpen(false)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Icon name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {drawerSections.map((section, si) => (
                <View key={si}>
                  {/* Titre de section */}
                  <Text style={[styles.sectionTitle, { color: theme.text3 }]}>
                    {section.title}
                  </Text>

                  {section.items.map((item, ii) => (
                    <TouchableOpacity
                      key={ii}
                      style={[styles.drawerItem, { backgroundColor: 'transparent' }]}
                      onPress={() => navigateTo(item.route, (item as any).profileScreen)}
                      activeOpacity={0.65}
                    >
                      {/* Icône dans un cercle rouge translucide */}
                      <View style={styles.drawerIconWrap}>
                        <Icon name={item.icon as any} size={18} color={COLORS.primary} />
                      </View>
                      <Text style={[styles.drawerItemText, { color: theme.text }]}>
                        {item.label}
                      </Text>
                      <Icon name="chevron-forward" size={14} color={theme.text3} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                  ))}

                  {si < drawerSections.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  )}
                </View>
              ))}

              {/* Déconnexion */}
              {isAuthenticated && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => { setDrawerOpen(false); logout(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.drawerIconWrap, { backgroundColor: 'rgba(255,60,60,0.12)' }]}>
                      <Icon name="log-out-outline" size={18} color={COLORS.error} />
                    </View>
                    <Text style={[styles.drawerItemText, { color: COLORS.error }]}>
                      {t.auth.logout}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position:  'absolute',
    top:       0,
    left:      0,
    right:     0,
    zIndex:    100,
    minHeight: 56,
  },
  border: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   1,
  },
  content: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     10,
  },
  brandWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    width:          80,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    padding:        4,
    width:          40,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  badge: {
    position:          'absolute',
    top:               2,
    right:             2,
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    backgroundColor:   COLORS.primary,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 16,
  },

  // ── Drawer ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex:            1,
    flexDirection:   'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    width:            DRAWER_W,
    height:           '100%',
    borderRightWidth: 1.5,
    shadowColor:      '#000',
    shadowOffset:     { width: 4, height: 0 },
    shadowOpacity:    0.5,
    shadowRadius:     16,
    elevation:        20,
  },
  drawerHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize:          FONT_SIZE.xxs,
    fontWeight:        FONT_WEIGHT.bold,
    textTransform:     'uppercase',
    letterSpacing:     0.9,
    paddingHorizontal: SPACING.lg,
    paddingTop:        SPACING.lg,
    paddingBottom:     4,
  },
  drawerItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   12,
  },
  drawerIconWrap: {
    width:           34,
    height:          34,
    borderRadius:    RADIUS.md,
    backgroundColor: COLORS.redAlpha12,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  drawerItemText: {
    flex:       1,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  divider: {
    height:            1,
    marginVertical:    SPACING.sm,
    marginHorizontal:  SPACING.lg,
  },
});
