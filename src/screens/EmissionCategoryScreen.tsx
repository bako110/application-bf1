import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore, useUiStore } from '../stores';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, HERO_H, EP_THUMB_W } from '../constants';
import type { HomeStackParams } from '../navigation/types';

type Nav   = StackNavigationProp<HomeStackParams>;
type Route = RouteProp<HomeStackParams, 'EmissionCategory'>;

const LIMIT  = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null, publishLabel = 'Publiée le') {
  if (!d) return '';
  try {
    return (
      publishLabel + ' ' +
      new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' - ' +
      new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return ''; }
}

function fmtViews(v?: number | null) {
  if (v == null) return null;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

// ─── Ligne épisode ────────────────────────────────────────────────────────────
function EpisodeRow({
  item, isFavorited, onToggleFav, onPress, theme, isDark,
}: {
  item: any; isFavorited: boolean;
  onToggleFav: (id: string) => void;
  onPress: () => void; theme: any; isDark: boolean;
}) {
  const { t } = useTranslation();
  const id    = String(item.id ?? item._id);
  const img   = item.thumbnail || item.image_url || item.image || '';
  const dur   = item.duration   ? `${Math.round(item.duration / 60) || item.duration}min` : null;
  const views = fmtViews(item.views);
  const date  = fmtDate(item.created_at || item.date || item.published_at, t.content.publishedAt);
  const isNew = item.is_new ||
    (item.created_at && Date.now() - new Date(item.created_at).getTime() < 7 * 24 * 3600_000);

  return (
    <TouchableOpacity
      style={[styles.epRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Miniature 16:9 */}
      <View style={[styles.epThumb, { backgroundColor: isDark ? '#1a1a1a' : '#e8e8e8' }]}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.epFallback]}>
            <Icon name="play-circle-outline" size={28} color={COLORS.redAlpha50} />
          </View>
        )}
        {/* Badge NOUVEAU */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t.emissions.new}</Text>
          </View>
        )}
        {/* Durée bas-droite */}
        {dur && (
          <View style={styles.durBadge}>
            <Text style={styles.durText}>{dur}</Text>
          </View>
        )}
        {/* Icône play centré */}
        <View style={styles.playOverlay}>
          <Icon name="play" size={14} color="#fff" />
        </View>
      </View>

      {/* Infos texte */}
      <View style={styles.epInfo}>
        {(views || date) ? (
          <View style={styles.epMeta}>
            {views ? (
              <Text style={[styles.epMetaText, { color: theme.text3 }]}>
                {views} vue{Number(item.views) !== 1 ? 's' : ''}
              </Text>
            ) : null}
            {date ? (
              <Text style={[styles.epMetaText, { color: theme.text3 }]} numberOfLines={1}>
                {date}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text style={[styles.epTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title ?? 'Sans titre'}
        </Text>
      </View>

      {/* Bouton + / ✓ */}
      <TouchableOpacity
        style={[
          styles.plusBtn,
          isFavorited
            ? { backgroundColor: 'rgba(14,122,254,0.9)', borderColor: 'rgba(14,122,254,0.6)' }
            : { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={() => onToggleFav(id)}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Icon
          name={isFavorited ? 'checkmark' : 'add'}
          size={18}
          color={isFavorited ? '#fff' : theme.text}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonList({ theme }: { theme: any }) {
  return (
    <View>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[styles.epRow, { borderBottomColor: theme.border }]}>
          <View style={[styles.epThumb, { backgroundColor: theme.surface }]} />
          <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
            <View style={[styles.skLine, { width: '55%', backgroundColor: theme.surface }]} />
            <View style={[styles.skLine, { width: '90%', height: 14, backgroundColor: theme.surface }]} />
            <View style={[styles.skLine, { width: '72%', height: 14, backgroundColor: theme.surface }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export function EmissionCategoryScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const insets     = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { showLoginModal } = useUiStore();

  const { name, filterPath } = route.params as any;

  const [activeTab,  setActiveTab]  = useState<0 | 1>(0);
  const [favIds,     setFavIds]     = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // ── Toutes les catégories (pour le hero + onglet "À voir aussi") ──────────
  const { data: allEmissions = [] } = useQuery({
    queryKey: ['emission-categories'],
    queryFn:  () => api.getEmissions(),
    staleTime: 10 * 60_000,
  });

  // Infos de la catégorie courante (image hero, schedule…)
  const catInfo: any = useMemo(() => {
    if (!name) return null;
    const normName = normalize(name);
    return (allEmissions as any[]).find((e: any) =>
      normalize(e.name ?? '') === normName ||
      (e.filter_path && e.filter_path === filterPath)
    ) ?? null;
  }, [allEmissions, name, filterPath]);

  const schedule    = catInfo?.schedule || catInfo?.broadcast_time || null;
  const displayName = name || catInfo?.name || '';

  // ── Épisodes (infinite scroll) ────────────────────────────────────────────
  const {
    data, isLoading, fetchNextPage, hasNextPage,
    isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['emission-cat-shows', filterPath],
    queryFn: ({ pageParam }: { pageParam: unknown }) =>
      api.getShowsByFilterPath(filterPath ?? '', pageParam as number ?? 0, LIMIT),
    initialPageParam: 0,
    getNextPageParam: (last: any, pages: any[]) => {
      const fetched = pages.reduce((n: number, p: any) => n + (p.items?.length ?? 0), 0);
      return fetched < (last?.total ?? 0) ? fetched : undefined;
    },
    enabled: !!filterPath,
  });

  const allShows: any[]     = (data as any)?.pages?.flatMap((p: any) => p.items ?? []) ?? [];
  const contentType: string = (data as any)?.pages?.[0]?.contentType ?? 'show';
  const totalCount: number  = (data as any)?.pages?.[0]?.total ?? allShows.length;

  // Hero image : catégorie → première image des shows
  const firstShowImg = allShows[0]?.thumbnail || allShows[0]?.image_url || allShows[0]?.image || null;
  const heroImg = catInfo?.image_background || catInfo?.image_main || catInfo?.image_url || catInfo?.image || firstShowImg || null;

  // ── Émissions "À voir aussi" ──────────────────────────────────────────────
  const discoverList = useMemo(() =>
    (allEmissions as any[]).filter(
      (e: any) => normalize(e.name ?? '') !== normalize(displayName)
    ).slice(0, 20),
  [allEmissions, displayName]);

  // ── Favoris ───────────────────────────────────────────────────────────────
  const { data: existingFavs } = useQuery({
    queryKey: ['my-favorites', contentType],
    queryFn: () => api.getMyFavorites(contentType),
    enabled: isAuthenticated && !!contentType,
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!existingFavs) return;
    const ids = new Set((existingFavs as any[]).map((f: any) => String(f.content_id ?? f.id ?? '')).filter(Boolean));
    setFavIds(ids);
  }, [existingFavs]);

  const favMutation = useMutation({
    mutationFn: ({ id, isFav }: { id: string; isFav: boolean }) =>
      isFav ? api.removeFavorite(contentType, id) : api.addFavorite(contentType, id),
    onSuccess: (_, { id, isFav }) => {
      setFavIds(prev => {
        const next = new Set(prev);
        isFav ? next.delete(id) : next.add(id);
        return next;
      });
    },
  });

  const handleFav = useCallback((id: string) => {
    if (!isAuthenticated) { showLoginModal(t.emissions.loginFav); return; }
    favMutation.mutate({ id, isFav: favIds.has(id) });
  }, [isAuthenticated, favIds, showLoginModal, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <FlatList
        data={activeTab === 0 ? allShows : discoverList}
        keyExtractor={(item, i) => String(item.id ?? item._id ?? item.name ?? i)}
        showsVerticalScrollIndicator={false}
        onEndReached={activeTab === 0 ? onEndReached : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}

        ListHeaderComponent={
          <View>
            {/* ── HERO ── */}
            <View style={styles.hero}>
              {heroImg ? (
                <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={['#1a0505', '#2a0a0a', '#0d0d0d']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              {/* Gradient bas */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.25 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
              />

              {/* Bouton retour */}
              <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 8 }]}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Icon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Contenu hero bas */}
              <View style={styles.heroContent}>
                {schedule ? (
                  <Text style={styles.heroSchedule}>{schedule}</Text>
                ) : null}
                <Text style={styles.heroTitle} numberOfLines={2}>{displayName}</Text>
                {totalCount > 0 && (
                  <Text style={styles.heroCount}>
                    {totalCount} {totalCount > 1 ? t.emissions.episode_other : t.emissions.episode_one}
                  </Text>
                )}
              </View>
            </View>

            {/* ── ONGLETS ── */}
            <View style={[styles.tabs, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
              {([t.emissions.replay, t.emissions.discover] as const).map((label, i) => (
                <TouchableOpacity
                  key={label}
                  style={styles.tab}
                  onPress={() => setActiveTab(i as 0 | 1)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabText,
                    { color: activeTab === i ? theme.text : theme.text3 },
                    activeTab === i && styles.tabTextActive,
                  ]}>
                    {label}
                  </Text>
                  {activeTab === i && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Skeleton pendant chargement */}
            {isLoading && activeTab === 0 && <SkeletonList theme={theme} />}
          </View>
        }

        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Icon name="film-outline" size={48} color={theme.text3} />
              <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.emissions.noContent}</Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : null
        }

        renderItem={({ item }) => {
          // Onglet "À voir aussi"
          if (activeTab === 1) {
            const emImg = item.image_main || item.image_url || item.image || '';
            return (
              <TouchableOpacity
                style={[styles.discoverRow, { borderBottomColor: theme.border }]}
                onPress={() => navigation.navigate('EmissionCategory', {
                  name:       item.name,
                  filterPath: item.filter_path,
                  categoryId: item.id,
                })}
                activeOpacity={0.75}
              >
                <View style={[styles.discoverThumb, { backgroundColor: isDark ? '#1a1a1a' : '#e8e8e8' }]}>
                  {emImg ? (
                    <Image source={{ uri: emImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, styles.epFallback]}>
                      <Icon name="tv-outline" size={20} color={COLORS.redAlpha50} />
                    </View>
                  )}
                </View>
                <Text style={[styles.discoverName, { color: theme.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Icon name="chevron-forward" size={16} color={theme.text3} />
              </TouchableOpacity>
            );
          }

          // Onglet "Replay"
          return (
            <EpisodeRow
              item={item}
              isFavorited={favIds.has(String(item.id ?? item._id))}
              onToggleFav={handleFav}
              onPress={() => navigation.navigate('ShowDetail', {
                id:   item.id ?? item._id,
                type: item._contentType ?? contentType,
              })}
              theme={theme}
              isDark={isDark}
            />
          );
        }}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    width:           '100%',
    height:          HERO_H,
    backgroundColor: '#000',
    justifyContent:  'flex-end',
  },
  backBtn: {
    position:        'absolute',
    left:            SPACING.lg,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  heroContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.xl,
    gap:               4,
  },
  heroSchedule: {
    color:         COLORS.primary,
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color:         '#fff',
    fontSize:      26,
    fontWeight:    FONT_WEIGHT.extrabold,
    lineHeight:    32,
    letterSpacing: -0.5,
    textShadowColor:  'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroCount: {
    color:    'rgba(255,255,255,0.55)',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Onglets ───────────────────────────────────────────────────────────────
  tabs: {
    flexDirection:     'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: 15,
    position:        'relative',
  },
  tabText: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  tabTextActive: {
    fontWeight: FONT_WEIGHT.bold,
  },
  tabUnderline: {
    position:        'absolute',
    bottom:          0,
    left:            '20%',
    right:           '20%',
    height:          2.5,
    backgroundColor: COLORS.primary,
    borderRadius:    2,
  },

  // ── Ligne épisode ─────────────────────────────────────────────────────────
  epRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   14,
    gap:               14,
    borderBottomWidth: 0.5,
  },
  epThumb: {
    width:        EP_THUMB_W,
    aspectRatio:  16 / 9,
    borderRadius: RADIUS.md,
    overflow:     'hidden',
    flexShrink:   0,
  },
  epFallback: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  newBadge: {
    position:          'absolute',
    top:               5,
    left:              5,
    backgroundColor:   COLORS.primary,
    borderRadius:      3,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  newBadgeText: {
    color:         '#fff',
    fontSize:      8,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.4,
  },
  durBadge: {
    position:          'absolute',
    bottom:            4,
    right:             4,
    backgroundColor:   'rgba(0,0,0,0.75)',
    borderRadius:      3,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  durText: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: FONT_WEIGHT.semibold,
  },
  playOverlay: {
    position:        'absolute',
    top:             '50%',
    left:            '50%',
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -15,
    marginLeft:      -15,
  },
  epInfo: {
    flex:     1,
    gap:      5,
    minWidth: 0,
  },
  epMeta: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  epMetaText: {
    fontSize: FONT_SIZE.xs,
  },
  epTitle: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 20,
  },
  plusBtn: {
    width:          34,
    height:         34,
    borderRadius:   RADIUS.md,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  // ── À voir aussi ──────────────────────────────────────────────────────────
  discoverRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    gap:               SPACING.md,
    borderBottomWidth: 0.5,
  },
  discoverThumb: {
    width:        72,
    aspectRatio:  3 / 4,
    borderRadius: RADIUS.md,
    overflow:     'hidden',
    flexShrink:   0,
  },
  discoverName: {
    flex:       1,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 20,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skLine: {
    height:       10,
    borderRadius: 4,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    paddingVertical: 80,
    alignItems:      'center',
    gap:             14,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
  },
});
