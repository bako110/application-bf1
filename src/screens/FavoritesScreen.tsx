import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { useLoginNavigation } from '../hooks/useLoginNavigation';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import type { ProfileStackParams } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';

type Nav = StackNavigationProp<ProfileStackParams>;

// ─── Config type → label + couleur + icône ────────────────────────────────────

const TYPE_CFG: Record<string, { label: string; icon: string; color: string }> = {
  breaking_news:     { label: 'Flash Info',    icon: 'flash',         color: COLORS.primary },
  sport:             { label: 'Sport',          icon: 'trophy',        color: '#1DA1F2'      },
  jtandmag:          { label: 'JT & Mag',       icon: 'videocam',      color: COLORS.primary },
  magazine:          { label: 'Magazine',       icon: 'journal',       color: '#8B5CF6'      },
  divertissement:    { label: 'Divertissement', icon: 'musical-notes', color: '#A855F7'      },
  reportage:         { label: 'Reportage',      icon: 'film',          color: '#F59E0B'      },
  archive:           { label: 'Archive',        icon: 'archive',       color: '#6B7280'      },
  tele_realite:      { label: 'Télé Réalité',   icon: 'camera',        color: '#EC4899'      },
  show:              { label: 'Émission',       icon: 'tv',            color: '#10B981'      },
  movie:             { label: 'Film',           icon: 'film-outline',  color: '#F97316'      },
  series:            { label: 'Série',          icon: 'albums',        color: '#8B5CF6'      },
  reel:              { label: 'Reel',           icon: 'play-circle',   color: '#EC4899'      },
  emission_category: { label: 'Émissions',      icon: 'grid',          color: COLORS.primary },
};

const FILTER_TABS = [
  { key: 'all',              label: 'Tout'          },
  { key: 'emission_category',label: 'Émissions'     },
  { key: 'breaking_news',    label: 'News'          },
  { key: 'sport',            label: 'Sport'         },
  { key: 'jtandmag',         label: 'JT & Mag'      },
  { key: 'magazine',         label: 'Magazine'      },
  { key: 'divertissement',   label: 'Divertissement'},
  { key: 'reportage',        label: 'Reportage'     },
  { key: 'archive',          label: 'Archive'       },
  { key: 'tele_realite',     label: 'Télé Réalité'  },
  { key: 'show',             label: 'Émission'      },
];

// ─── Navigation selon content_type ───────────────────────────────────────────

function navigateToFav(navigation: Nav, fav: any) {
  const t = fav.content_type as string;
  switch (t) {
    case 'breaking_news':
      navigation.navigate('ShowDetail', { id: fav.content_id, type: 'news' });
      break;
    case 'emission_category':
      navigation.navigate('ShowDetail', { id: fav.content_id, type: 'show' });
      break;
    default:
      navigation.navigate('ShowDetail', { id: fav.content_id, type: t });
  }
}

// ─── Carte favorite (horizontale) ────────────────────────────────────────────

function FavCard({
  fav, onRemove, onPress, theme, removing,
}: {
  fav:      any;
  onRemove: () => void;
  onPress:  () => void;
  theme:    any;
  removing: boolean;
}) {
  const cfg   = TYPE_CFG[fav.content_type] ?? { label: fav.content_type ?? '?', icon: 'star', color: '#888' };
  const img   = fav.image_url || fav.image_main || fav.thumbnail || '';
  const title = fav.content_title || 'Sans titre';
  const date  = fav.added_at || fav.created_at
    ? new Date(fav.added_at || fav.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, opacity: removing ? 0.45 : 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={removing}
    >
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: theme.bg3 ?? '#111' }]}>
        {img ? (
          <>
            <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbFallback]}>
            <Icon name={cfg.icon as any} size={24} color={`${cfg.color}99`} />
          </View>
        )}
        {/* Badge type */}
        <View style={[styles.typeBadge, { backgroundColor: cfg.color }]}>
          <Icon name={cfg.icon as any} size={8} color="#fff" />
          <Text style={styles.typeBadgeText}>{cfg.label}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {date && (
          <Text style={[styles.cardDate, { color: theme.text3 }]}>{date}</Text>
        )}
      </View>

      {/* Bouton retirer */}
      <TouchableOpacity
        style={[styles.removeBtn, { backgroundColor: theme.bg3 ?? theme.surface }]}
        onPress={e => { e.stopPropagation?.(); onRemove(); }}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        disabled={removing}
      >
        <Icon name={removing ? 'hourglass-outline' : 'bookmark'} size={14} color={removing ? theme.text3 : COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ theme }: { theme: any }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={[styles.thumb, { backgroundColor: theme.bg3 ?? '#1a1a1a' }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skLine, { width: '90%', backgroundColor: theme.bg3 ?? '#1a1a1a' }]} />
        <View style={[styles.skLine, { width: '60%', height: 10, marginTop: 6, backgroundColor: theme.bg3 ?? '#1a1a1a' }]} />
      </View>
    </View>
  );
}

// ─── Écran non connecté ───────────────────────────────────────────────────────

function GuestView({ theme, isDark, insets, t }: any) {
  const navigateToLogin = useLoginNavigation();
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{t.favorites.loginTitle}</Text>
        <View style={{ width: 38 }} />
      </View>
      {/* Content */}
      <View style={styles.guestWrap}>
        <View style={[styles.guestIconWrap, { backgroundColor: `${COLORS.primary}18` }]}>
          <Icon name="bookmark-outline" size={46} color={COLORS.primary} />
        </View>
        <Text style={[styles.guestTitle, { color: theme.text }]}>{t.favorites.loginTitle}</Text>
        <Text style={[styles.guestSub, { color: theme.text3 }]}>{t.favorites.loginSub}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={navigateToLogin}
          activeOpacity={0.85}
        >
          <Icon name="log-in-outline" size={16} color="#fff" />
          <Text style={styles.loginBtnText}>{t.auth.login}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function FavoritesScreen() {
  const { theme, isDark }   = useTheme();
  const { t }               = useTranslation();
  const navigation          = useNavigation<Nav>();
  const insets              = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const qc                  = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing,   setRefreshing]   = useState(false);
  const [removingIds,  setRemovingIds]  = useState<Set<string>>(new Set());

  // ── Données ──────────────────────────────────────────────────────────────
  const { data: rawFavs, isLoading, refetch } = useQuery({
    queryKey:  ['my-favorites'],
    queryFn:   () => api.getMyFavorites(),
    enabled:   isAuthenticated,
    staleTime: 2 * 60_000,
  });

  const allFavs: any[] = useMemo(
    () => (Array.isArray(rawFavs) ? rawFavs : []),
    [rawFavs]
  );

  const removeMutation = useMutation({
    mutationFn: (fav: any) => api.removeFavorite(fav.content_type, String(fav.content_id)),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['my-favorites'] }),
    onSettled:  (_d, _e, fav) => {
      setRemovingIds(prev => { const next = new Set(prev); next.delete(String(fav.id ?? fav._id)); return next; });
    },
  });

  const handleRemove = useCallback((fav: any) => {
    const id = String(fav.id ?? fav._id);
    setRemovingIds(prev => new Set([...prev, id]));
    removeMutation.mutate(fav);
  }, [removeMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Filtres ──────────────────────────────────────────────────────────────
  const visibleTabs = useMemo(() => {
    const present = new Set(allFavs.map((f: any) => f.content_type));
    return FILTER_TABS.filter(tab => tab.key === 'all' || present.has(tab.key));
  }, [allFavs]);

  const filtered = useMemo(() => {
    const list = activeFilter === 'all' ? allFavs : allFavs.filter((f: any) => f.content_type === activeFilter);
    return [...list].sort((a: any, b: any) =>
      new Date(b.added_at ?? b.created_at ?? 0).getTime() -
      new Date(a.added_at ?? a.created_at ?? 0).getTime()
    );
  }, [allFavs, activeFilter]);

  // ── Guest ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <GuestView theme={theme} isDark={isDark} insets={insets} t={t} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.bg, borderBottomColor: theme.border },
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{t.favorites.title}</Text>
          {allFavs.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.countBadgeText}>{allFavs.length}</Text>
            </View>
          )}
        </View>
        <Icon name="bookmark" size={20} color={COLORS.primary} />
      </View>

      {/* Filter bar */}
      {!isLoading && visibleTabs.length > 1 && (
        <View style={[styles.filterWrap, { borderBottomColor: theme.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {visibleTabs.map(tab => {
              const active = activeFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? COLORS.primary : theme.surface,
                      borderColor:     active ? COLORS.primary : theme.border,
                    },
                  ]}
                  onPress={() => setActiveFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.text2 }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.md }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} theme={theme} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id ?? item._id ?? item.content_id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingTop:        SPACING.sm,
            paddingBottom:     insets.bottom + 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: `${COLORS.primary}12` }]}>
                <Icon name="bookmark-outline" size={44} color={COLORS.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeFilter !== 'all' ? t.favorites.emptyCategory : t.favorites.empty}
              </Text>
              <Text style={[styles.emptySub, { color: theme.text3 }]}>
                {t.favorites.emptyHint}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <FavCard
              fav={item}
              theme={theme}
              removing={removingIds.has(String(item.id ?? item._id))}
              onPress={() => navigateToFav(navigation, item)}
              onRemove={() => handleRemove(item)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     12,
    borderBottomWidth: 0.5,
    gap:               SPACING.sm,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle:    { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  countBadge: {
    borderRadius:      RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical:   2,
    minWidth:          22,
    alignItems:        'center',
  },
  countBadgeText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.bold,
  },

  filterWrap: {
    borderBottomWidth: 0.5,
  },
  filterBar: {
    flexDirection: 'row',
    gap:           8,
    paddingHorizontal: SPACING.md,
    paddingVertical:   10,
  },
  filterChip: {
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    paddingHorizontal: 14,
    paddingVertical:   6,
  },
  filterChipText: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Card horizontale ──────────────────────────────────────────────────────
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   RADIUS.lg,
    marginBottom:   10,
    overflow:       'hidden',
    height:         76,
  },
  thumb: {
    width:           114,    // 16:9 × 64 ≈ 114
    height:          '100%' as any,
    position:        'relative',
    flexShrink:      0,
    backgroundColor: '#111',
  },
  thumbFallback: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position:          'absolute',
    bottom:            5,
    left:              5,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    borderRadius:      3,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  typeBadgeText: {
    color:      '#fff',
    fontSize:   8,
    fontWeight: FONT_WEIGHT.bold,
  },
  cardBody: {
    flex:              1,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.sm,
    justifyContent:    'center',
    gap:               3,
  },
  cardTitle: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: FONT_SIZE.xxs,
  },
  removeBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    SPACING.sm,
    flexShrink:     0,
  },

  // ── Skeleton ─────────────────────────────────────────────────────────────
  skLine: {
    height:       13,
    borderRadius: 6,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems:        'center',
    paddingTop:        72,
    paddingHorizontal: SPACING.xl,
    gap:               SPACING.md,
  },
  emptyIconWrap: {
    width:          84,
    height:         84,
    borderRadius:   42,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.sm,
  },
  emptyTitle: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign:  'center',
  },
  emptySub: {
    fontSize:  FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Guest ─────────────────────────────────────────────────────────────────
  guestWrap: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SPACING.xl,
    gap:               SPACING.md,
  },
  guestIconWrap: {
    width:          96,
    height:         96,
    borderRadius:   48,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.sm,
  },
  guestTitle: {
    fontSize:   FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign:  'center',
  },
  guestSub: {
    fontSize:  FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth:  280,
    lineHeight: 20,
  },
  loginBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   COLORS.primary,
    borderRadius:      RADIUS.xl,
    paddingVertical:   13,
    paddingHorizontal: 36,
    marginTop:         SPACING.sm,
  },
  loginBtnText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
});
