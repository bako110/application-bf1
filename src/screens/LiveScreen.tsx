import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Image, ActivityIndicator, ScrollView, RefreshControl, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme }           from '../hooks/useTheme';
import { useTranslation }     from '../hooks/useTranslation';
import { useAuthStore }       from '../stores';
import { useUiStore }         from '../stores';
import { useLiveStore }       from '../stores';
import { useLoginNavigation } from '../hooks/useLoginNavigation';
import { useLiveChat }         from '../hooks/useLiveChat';
import { LiveChatModal }        from '../components/live/LiveChatModal';
import { ImageWithSkeleton }    from '../components/ui/ImageWithSkeleton';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, LIST_THUMB_W, LIST_THUMB_H, SCREEN } from '../constants';
import { formatFullDate, formatViews, getImageUrl } from '../utils';
import * as api from '../services/api';
import type { LiveHighlight as ApiLiveHighlight } from '../services/api';
import {
  scheduleReminder,
  cancelReminder,
  getReminderIds,
  requestNotificationPermission,
} from '../services/notificationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayerUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? '';
  if (!url) return 'about:blank';
  if (url.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0&controls=0`;
  }
  return url;
}

// ─── Types tabs contenu ───────────────────────────────────────────────────────

type ContentTab = 'a_ne_pas_manquer' | 'schedule' | 'moments_forts' | 'emissions';

function formatHighlightDate(dt?: string | null): string | null {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} · ${hours}:${minutes}`;
}

// ─── Carte épisode (style bf1_tv_mobile) ─────────────────────────────────────

interface EpisodeCardProps {
  item:   any;
  theme:  any;
  onPress: (item: any) => void;
}

function EpisodeCard({ item, theme, onPress }: EpisodeCardProps) {
  const { t }    = useTranslation();
  const title    = item.title ?? item.name ?? t.common.untitled;
  const image    = item.thumbnail ?? item.image_url ?? item.image ?? null;
  const duration = item.duration;
  const views    = item.views;
  const date     = item.published_at ?? item.created_at;

  return (
    <TouchableOpacity
      style={[styles.episodeCard, { backgroundColor: theme.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      <View style={styles.episodeThumb}>
        {image ? (
          <Image source={{ uri: getImageUrl(image) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Icon name="play-circle-outline" size={28} color={theme.text3} />
          </View>
        )}
        {duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}min</Text>
          </View>
        ) : null}
        <View style={styles.progressBar} />
      </View>

      {/* Info */}
      <View style={styles.episodeInfo}>
        {views != null && (
          <Text style={[styles.episodeMeta, { color: theme.text3 }]}>{formatViews(views)} vues</Text>
        )}
        {date ? (
          <Text style={[styles.episodeMeta, { color: theme.text3 }]}>
            Publiée le {formatFullDate(date)}
          </Text>
        ) : null}
        <Text style={[styles.episodeTitle, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Carrousel "À ne pas manquer" — édition premium ──────────────────────────
// Cartes cinématographiques plein cadre : poster 16:9, dégradé profond, titre en
// surimpression, badges glassmorphism, barre de progression segmentée animée.

const CAROUSEL_H_MARGIN  = SPACING.lg;
const CAROUSEL_CARD_W     = Math.round(SCREEN.W - CAROUSEL_H_MARGIN * 2);
const CAROUSEL_POSTER_H   = Math.round(CAROUSEL_CARD_W * 9 / 16);
const CAROUSEL_SNAP       = CAROUSEL_CARD_W + SPACING.md;
const CAROUSEL_AUTO_DELAY = 5000;

interface HighlightCarouselProps {
  items:   ApiLiveHighlight[];
  theme:   any;
  onPress: (item: ApiLiveHighlight) => void;
}

function HighlightCarousel({ items, theme, onPress }: HighlightCarouselProps) {
  const flatRef   = useRef<FlatList>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Pastille "live" qui pulse
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const goTo = useCallback((idx: number) => {
    if (!items.length) return;
    const next = ((idx % items.length) + items.length) % items.length;
    setActiveIdx(next);
    flatRef.current?.scrollToOffset({ offset: next * CAROUSEL_SNAP, animated: true });
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goTo(activeIdx + 1), CAROUSEL_AUTO_DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, items.length, goTo]);

  if (!items.length) {
    return (
      <View style={cs.emptyCard}>
        <View style={[cs.emptyInner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="sparkles-outline" size={26} color={theme.text3} />
        </View>
      </View>
    );
  }

  return (
    <View style={cs.root}>
      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CAROUSEL_SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={cs.content}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_SNAP);
          setActiveIdx(Math.max(0, Math.min(idx, items.length - 1)));
        }}
        renderItem={({ item }) => {
          const date = formatHighlightDate(item.event_date);
          return (
            <TouchableOpacity
              style={[cs.card, { shadowColor: COLORS.primary }]}
              onPress={() => onPress(item)}
              activeOpacity={0.92}
            >
              <ImageWithSkeleton
                uri={item.image_url}
                style={StyleSheet.absoluteFill}
                fallback={
                  <View style={[StyleSheet.absoluteFill, cs.fallback, { backgroundColor: theme.bg3 }]}>
                    <Icon name="film-outline" size={34} color={COLORS.redAlpha50} />
                  </View>
                }
              />

              {/* Dégradé cinématographique */}
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.92)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Rangée haute : badge "À ne pas manquer" + date */}
              <View style={cs.topRow}>
                <View style={cs.tagPill}>
                  <Animated.View
                    style={[
                      cs.tagDot,
                      { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) },
                    ]}
                  />
                  <View style={cs.tagDotCore} />
                  <Text style={cs.tagText}>À NE PAS MANQUER</Text>
                </View>
                {date ? (
                  <View style={cs.datePill}>
                    <Icon name="calendar-outline" size={11} color="#fff" />
                    <Text style={cs.dateText}>{date}</Text>
                  </View>
                ) : null}
              </View>

              {/* Bouton play glassmorphism */}
              {item.video_url ? (
                <View style={cs.playWrap}>
                  <View style={cs.playGlass}>
                    <Icon name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
                  </View>
                </View>
              ) : null}

              {/* Bas : titre + description en surimpression */}
              <View style={cs.bottom}>
                <Text style={cs.title} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                  <Text style={cs.desc} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Barre de progression segmentée */}
      {items.length > 1 && (
        <View style={cs.progress}>
          {items.map((it, i) => (
            <View
              key={it.id}
              style={[
                cs.segment,
                { backgroundColor: theme.border },
                i === activeIdx && { backgroundColor: COLORS.primary, flex: 2.4 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  root:    { paddingTop: SPACING.sm },
  content: { paddingHorizontal: CAROUSEL_H_MARGIN },
  card: {
    width:        CAROUSEL_CARD_W,
    height:       CAROUSEL_POSTER_H,
    marginRight:  SPACING.md,
    borderRadius: RADIUS.xxl,
    overflow:     'hidden',
    backgroundColor: COLORS.blackAlpha90,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius:  16,
    elevation:     8,
  },
  fallback: { alignItems: 'center', justifyContent: 'center' },

  topRow: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tagPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(226,62,62,0.92)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  tagDot:     { position: 'absolute', left: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  tagDotCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  tagText:    { color: '#fff', fontSize: 9.5, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 0.7 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  dateText: { color: '#fff', fontSize: FONT_SIZE.xxs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.2 },

  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  playGlass: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  bottom: {
    position: 'absolute', left: 16, right: 16, bottom: 16, gap: 5,
  },
  title: {
    color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold,
    lineHeight: 22, letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  desc: {
    color: 'rgba(255,255,255,0.82)', fontSize: FONT_SIZE.xs,
    lineHeight: 17, letterSpacing: 0.1,
  },

  progress: {
    flexDirection: 'row', gap: 5, alignSelf: 'center',
    marginTop: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  segment: { flex: 1, height: 3, borderRadius: 2, maxWidth: 40 },

  emptyCard: { paddingHorizontal: CAROUSEL_H_MARGIN, paddingTop: SPACING.sm },
  emptyInner: {
    height: CAROUSEL_POSTER_H, borderRadius: RADIUS.xxl, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Carte programme (grille quotidienne) ────────────────────────────────────

interface ScheduleCardProps {
  item:            any;
  isOnAir:         boolean;
  hasReminder:     boolean;
  onToggleReminder: (item: any) => void;
  theme:           any;
}

function ScheduleCard({ item, isOnAir, hasReminder, onToggleReminder, theme }: ScheduleCardProps) {
  const { t }    = useTranslation();
  const title    = item.title ?? item.name ?? t.common.untitled;
  const image    = item.thumbnail ?? item.image_url ?? item.image ?? null;
  const category = item.category ?? item.type ?? null;

  const fmt = (dt: string | null | undefined) => {
    if (!dt) return '';
    const d = new Date(dt);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  const timeStart = fmt(item.start_time ?? item.start_at ?? item.aired_at);
  const timeEnd   = fmt(item.end_time   ?? item.end_at);
  const timeLabel = timeEnd ? `${timeStart} – ${timeEnd}` : timeStart;

  // Bouton rappel visible seulement si l'émission n'a pas encore commencé
  const rawStart   = item.start_time ?? item.start_at ?? item.aired_at;
  const startMs    = rawStart ? new Date(rawStart).getTime() : 0;
  const canRemind  = !isOnAir && startMs > Date.now() + 5 * 60_000;

  return (
    <View style={[
      schedStyles.row,
      { borderLeftColor: isOnAir ? COLORS.primary : 'transparent',
        backgroundColor: isOnAir ? (theme.surface + 'cc') : theme.surface },
    ]}>
      {/* Thumbnail */}
      <View style={schedStyles.thumb}>
        {image ? (
          <Image source={{ uri: getImageUrl(image) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, schedStyles.thumbBg,
            { backgroundColor: isOnAir ? COLORS.primary + '33' : theme.bg }]}>
            <Icon name="tv-outline" size={18} color={isOnAir ? COLORS.primary : theme.text3} />
          </View>
        )}
        {isOnAir && <View style={schedStyles.onAirDot} />}
      </View>

      {/* Infos */}
      <View style={schedStyles.info}>
        <Text style={[schedStyles.time, { color: isOnAir ? COLORS.primary : theme.text3 }]}>
          {timeLabel}
        </Text>
        <Text style={[schedStyles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {category ? (
          <Text style={[schedStyles.cat, { color: theme.text3 }]}>{category}</Text>
        ) : null}
      </View>

      {/* Droite : badge EN COURS ou bouton rappel */}
      <View style={schedStyles.right}>
        {isOnAir ? (
          <View style={schedStyles.badge}>
            <Text style={schedStyles.badgeText}>{t.live.onAir}</Text>
          </View>
        ) : canRemind ? (
          <TouchableOpacity
            onPress={() => onToggleReminder(item)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={[
              schedStyles.reminderBtn,
              hasReminder && { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary },
            ]}
            activeOpacity={0.7}
          >
            <Icon
              name={hasReminder ? 'notifications' : 'notifications-outline'}
              size={16}
              color={hasReminder ? COLORS.primary : theme.text3}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const schedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderLeftWidth: 3, borderRadius: RADIUS.md, marginBottom: SPACING.md,
    padding: SPACING.md, overflow: 'hidden',
  },
  thumb: {
    width: 64, height: 64, borderRadius: RADIUS.sm,
    overflow: 'hidden', flexShrink: 0, position: 'relative',
  },
  thumbBg:  { alignItems: 'center', justifyContent: 'center' },
  onAirDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  info:  { flex: 1, minWidth: 0, gap: 3 },
  time:  { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  title: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, lineHeight: 19 },
  cat:   { fontSize: FONT_SIZE.xxs },
  right: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeText: { fontSize: 9, fontWeight: FONT_WEIGHT.bold, color: COLORS.white, letterSpacing: 0.5 },
  reminderBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
});

// ─── Écran Live principal ─────────────────────────────────────────────────────

export function LiveScreen() {
  const { theme }          = useTheme();
  const { t }              = useTranslation();
  const insets             = useSafeAreaInsets();
  const navigation         = useNavigation<any>();
  const { isAuthenticated, user } = useAuthStore();
  const { showLoginModal }  = useUiStore();
  const navigateToLogin     = useLoginNavigation();
  const [activeTab,   setActiveTab]   = useState<ContentTab>('a_ne_pas_manquer');
  const [chatVisible, setChatVisible] = useState(false);
  const [reminderIds, setReminderIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { setLiveData, isFullscreen, pendingFullscreen, consumeFullscreen } = useLiveStore();

  // Hook WebSocket chat — instancié ici pour afficher le compteur sur le bouton
  const chat = useLiveChat(user?.id ?? null);

  // Fermer le modal automatiquement si l'admin ferme le chat
  useEffect(() => {
    if (!chat.chatOpen && chatVisible) {
      setChatVisible(false);
    }
  }, [chat.chatOpen, chatVisible]);

  // ── Status live ──────────────────────────────────────────────────────────
  const { data: liveData, isLoading: liveLoading, refetch: refetchLiveStatus } = useQuery({
    queryKey:        ['live-status'],
    queryFn:         () => api.getLive(),
    refetchInterval: 30_000,
  });
  const isOnAir   = !!liveData?.is_live;
  const viewers   = liveData?.viewers ?? 0;
  const playerUrl = buildPlayerUrl(liveData);

  // Synchroniser vers le store global dès que les données live changent
  useEffect(() => {
    setLiveData(playerUrl, isOnAir, viewers);
  }, [playerUrl, isOnAir, viewers]);

  // Consommer le fullscreen différé dès que les données sont prêtes
  useEffect(() => {
    if (pendingFullscreen && playerUrl !== 'about:blank') {
      consumeFullscreen();
    }
  }, [pendingFullscreen, playerUrl]);

  // ── Grille programme — sans filtre date, le backend retourne les prochains ──
  const { data: scheduleData, isLoading: lSchedule, refetch: refetchSchedule } = useQuery({
    queryKey:        ['program-grid-today'],
    queryFn:         () => api.getProgramGrid(),
    staleTime:       5 * 60_000,
    refetchInterval: 60_000,
  });

  // Flatten, filtre aujourd'hui uniquement, tri chronologique
  const scheduleItems: any[] = React.useMemo(() => {
    const days: any[] = scheduleData?.days ?? (Array.isArray(scheduleData) ? scheduleData : []);
    const items: any[] = days.flatMap((d: any) => d.programs ?? d.items ?? d.slots ?? []);
    const all = items.length > 0 ? items : (Array.isArray(scheduleData) ? scheduleData : []);
    const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return all
      .filter((p: any) => {
        const start = p.start_time ?? p.start_at ?? p.aired_at ?? '';
        return start.slice(0, 10) === todayDate;
      })
      .sort((a: any, b: any) => {
        const ta = new Date(a.start_time ?? a.start_at ?? a.aired_at ?? 0).getTime();
        const tb = new Date(b.start_time ?? b.start_at ?? b.aired_at ?? 0).getTime();
        return ta - tb;
      });
  }, [scheduleData]);

  const nowMs = Date.now();
  const isCurrentProgram = (item: any): boolean => {
    const start = new Date(item.start_time ?? item.start_at ?? item.aired_at ?? 0).getTime();
    const end   = new Date(item.end_time   ?? item.end_at   ?? 0).getTime();
    if (!start) return false;
    if (end && end > start) return nowMs >= start && nowMs < end;
    // Pas de fin → considère "en cours" si commencé il y a moins de 60 min
    return nowMs >= start && nowMs < start + 60 * 60_000;
  };

  // ── Contenus pour les onglets ────────────────────────────────────────────
  const { data: sports,         refetch: refetchSports }         = useQuery({ queryKey: ['sports-live'],        queryFn: () => api.getSports(0, 20) });
  const { data: jtandmag,       refetch: refetchJtandmag }       = useQuery({ queryKey: ['jtandmag-live'],      queryFn: () => api.getJTandMag(0, 20) });
  const { data: divertissement, refetch: refetchDivertissement } = useQuery({ queryKey: ['divertissement-live'],queryFn: () => api.getDivertissement(0, 20) });
  const { data: reportages,     refetch: refetchReportages }     = useQuery({ queryKey: ['reportages-live'],    queryFn: () => api.getReportages(0, 20) });
  const { data: teleRealite,    refetch: refetchTeleRealite }    = useQuery({ queryKey: ['telerealite-live'],   queryFn: () => api.getTeleRealite(0, 20) });

  // Contenu de l'onglet Émissions (miroir exact de bf1_tv_mobile loadLive)
  const allEmissions = React.useMemo(() => {
    const merge = [
      ...(sports?.items        ?? []).map((i: any) => ({ ...i, _contentType: 'sport' })),
      ...(jtandmag?.items      ?? []).map((i: any) => ({ ...i, _contentType: 'jtandmag' })),
      ...(divertissement?.items?? []).map((i: any) => ({ ...i, _contentType: 'divertissement' })),
      ...(reportages?.items    ?? []).map((i: any) => ({ ...i, _contentType: 'reportage' })),
      ...(teleRealite?.items   ?? []).map((i: any) => ({ ...i, _contentType: 'tele_realite' })),
    ];
    return merge
      .sort((a, b) => new Date(b.published_at ?? b.created_at ?? 0).getTime() - new Date(a.published_at ?? a.created_at ?? 0).getTime())
      .slice(0, 15);
  }, [sports, jtandmag, divertissement, reportages, teleRealite]);

  // ── Mises en avant gérées depuis l'admin (À ne pas manquer / Moments forts) ──
  const { data: aNePasManquer = [], refetch: refetchANePasManquer } = useQuery({
    queryKey:        ['live-highlights', 'a_ne_pas_manquer'],
    queryFn:         () => api.getLiveHighlights('a_ne_pas_manquer'),
    staleTime:       60_000,
    refetchInterval: 60_000,
  });
  const { data: momentsForts = [], refetch: refetchMomentsForts } = useQuery({
    queryKey:        ['live-highlights', 'moments_forts'],
    queryFn:         () => api.getLiveHighlights('moments_forts'),
    staleTime:       60_000,
    refetchInterval: 60_000,
  });

  // ── Rappels programme — charge les IDs persistés ─────────────────────────
  useEffect(() => {
    getReminderIds().then(ids => setReminderIds(ids));
  }, []);

  const toggleReminder = useCallback(async (item: any) => {
    if (!isAuthenticated) {
      showLoginModal(t.live.reminderLogin);
      return;
    }
    const id = String(item.id ?? item._id ?? '');
    if (!id) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    if (reminderIds.has(id)) {
      await cancelReminder(id);
      setReminderIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      const ok = await scheduleReminder({ id, ...item });
      if (ok) {
        setReminderIds(prev => new Set(prev).add(id));
      }
    }
  }, [isAuthenticated, reminderIds]);

  // ── Navigation vers détail ───────────────────────────────────────────────
  const handleEpisodePress = useCallback((item: any) => {
    navigation.navigate('ShowDetail', { id: item.id ?? item._id, type: item._contentType });
  }, [navigation]);

  // ── "À ne pas manquer" : écran de détail dédié (vidéo ou affiche en hero) ──
  const handleANePasManquerPress = useCallback((item: ApiLiveHighlight) => {
    navigation.navigate('LiveHighlightDetail', { id: item.id });
  }, [navigation]);

  // ── "Moments forts" : réutilise l'écran de détail standard des émissions ──
  const handleMomentsFortsPress = useCallback((item: ApiLiveHighlight) => {
    navigation.navigate('ShowDetail', { id: item.id, type: 'live_highlight' });
  }, [navigation]);

  // ── Pull-to-refresh — recharge toutes les données de l'écran Live ────────
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchLiveStatus(),
        refetchSchedule(),
        refetchSports(),
        refetchJtandmag(),
        refetchDivertissement(),
        refetchReportages(),
        refetchTeleRealite(),
        refetchANePasManquer(),
        refetchMomentsForts(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchLiveStatus, refetchSchedule, refetchSports, refetchJtandmag,
    refetchDivertissement, refetchReportages, refetchTeleRealite,
    refetchANePasManquer, refetchMomentsForts,
  ]);

  // ── Onglets ──────────────────────────────────────────────────────────────
  const tabs: { key: ContentTab; label: string }[] = [
    { key: 'a_ne_pas_manquer', label: t.live.tabRecent },
    { key: 'schedule',         label: t.live.tabSchedule },
    { key: 'moments_forts',    label: t.live.tabHighlights },
    { key: 'emissions',        label: t.live.tabEpisodes },
  ];

  // Moments forts seul reste en liste verticale — À ne pas manquer utilise le carrousel horizontal
  const isHighlightListTab = activeTab === 'moments_forts';

  const currentItems =
    activeTab === 'a_ne_pas_manquer' ? aNePasManquer :
    activeTab === 'moments_forts'    ? momentsForts :
    activeTab === 'emissions'        ? allEmissions :
    scheduleItems;

  const isContentLoading =
    activeTab === 'schedule' ? lSchedule :
    activeTab === 'emissions' ? (!sports && !jtandmag) :
    false;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" hidden={isFullscreen} />

      {/* ── Zone player 16:9 — réserve l'espace, les contrôles sont dans GlobalLivePlayer ── */}
      {!isFullscreen && (
        <View style={[styles.playerWrapper, { marginTop: insets.top }]}>
          {liveLoading ? (
            <View style={styles.playerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : !isOnAir ? (
            <View style={styles.offAirWrap}>
              <Icon name="wifi-outline" size={32} color={theme.text3} />
              <Text style={[styles.offAirText, { color: theme.text3 }]}>{t.live.offAir}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Section scrollable (style bf1_tv_mobile #live-sections) ── */}
      <View style={[styles.sections, { backgroundColor: theme.bg }]}>

        {/* Bouton Chat & Commentaires (bf1_tv_mobile #live-chat-btn-bar) */}
        <View style={styles.chatBtnBar}>
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setChatVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="chatbubbles" size={17} color={COLORS.primary} />
            <View style={styles.chatBtnText}>
              <Text style={[styles.chatBtnTitle, { color: theme.text }]}>Chat &amp; Commentaires</Text>
              <Text style={[styles.chatBtnSub, { color: theme.text3 }]}>
                {chat.messages.length > 0 ? `${chat.messages.length} message${chat.messages.length > 1 ? 's' : ''}` : t.live.joinChat}
              </Text>
            </View>
            <Icon name="chevron-up" size={13} color={theme.text3} />
          </TouchableOpacity>
        </View>

        {/* Drag handle */}
        <View style={styles.dragHandleWrap}>
          <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
        </View>

        {/* Onglets Programme / À ne pas manquer / Émissions entières / Moments forts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsScroll, { borderBottomColor: theme.divider, backgroundColor: theme.bg }]}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, { color: active ? theme.text : theme.text3 }]} numberOfLines={1}>
                  {tab.label}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Contenu de l'onglet */}
        {isContentLoading ? (
          <View style={styles.contentLoader}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : activeTab === 'a_ne_pas_manquer' ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.carouselWrap}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshAll} tintColor={COLORS.primary} />
            }
          >
            <HighlightCarousel
              items={aNePasManquer}
              theme={theme}
              onPress={handleANePasManquerPress}
            />
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={currentItems}
            keyExtractor={(item, i) => String(item.id ?? item._id ?? i)}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshAll} tintColor={COLORS.primary} />
            }
            renderItem={({ item }) =>
              activeTab === 'schedule' ? (
                <ScheduleCard
                  item={item}
                  isOnAir={isCurrentProgram(item)}
                  hasReminder={reminderIds.has(String(item.id ?? item._id ?? ''))}
                  onToggleReminder={toggleReminder}
                  theme={theme}
                />
              ) : isHighlightListTab ? (
                <EpisodeCard
                  item={{ ...item, published_at: item.event_date }}
                  theme={theme}
                  onPress={handleMomentsFortsPress}
                />
              ) : (
                <EpisodeCard item={item} theme={theme} onPress={handleEpisodePress} />
              )
            }
            style={styles.list}
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: Math.max(insets.bottom, SPACING.xl) + 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Icon name={activeTab === 'schedule' ? 'calendar-outline' : 'film-outline'} size={36} color={theme.text3} />
                <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.common.noContent}</Text>
              </View>
            }
          />
        )}
      </View>

      <LiveChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        currentUser={user}
        isAuthenticated={isAuthenticated}
        onLoginPress={() => {
          setChatVisible(false);
          setTimeout(navigateToLogin, 300);
        }}
        messages={chat.messages}
        chatOpen={chat.chatOpen}
        wsStatus={chat.wsStatus}
        hasMoreOlder={chat.hasMoreOlder}
        loadingOlder={chat.loadingOlder}
        loadOlder={chat.loadOlder}
        sendMessage={chat.sendMessage}
        deleteMessage={chat.deleteMessage}
        editMessage={chat.editMessage}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Player
  playerWrapper: {
    width: '100%', aspectRatio: 16 / 9,
    backgroundColor: '#000', overflow: 'hidden',
    position: 'relative',
  },
  playerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offAirWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  offAirText:   { fontSize: FONT_SIZE.sm },

  // Sections
  sections: {
    flex: 1, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    marginTop: -1, overflow: 'hidden',
  },

  // Bouton chat
  chatBtnBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 4 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md,
  },
  chatBtnText:  { flex: 1, minWidth: 0 },
  chatBtnTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  chatBtnSub:   { fontSize: FONT_SIZE.xs, marginTop: 1 },

  // Drag handle
  dragHandleWrap: { alignItems: 'center', paddingVertical: SPACING.sm },
  dragHandle:     { width: 40, height: 4, borderRadius: 2 },

  // Onglets
  tabs: {
    flexDirection: 'row', borderBottomWidth: 0.5,
    overflow: 'hidden',
  },
  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 0.5,
  },
  tabsScrollContent: {
    flexDirection: 'row', alignItems: 'stretch',
  },
  tab: {
    paddingVertical: 13, paddingHorizontal: SPACING.md,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', minWidth: 0,
  },
  tabActive:    {},
  tabLabel:     { fontSize: 12, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2.5, backgroundColor: COLORS.primary, borderRadius: 2,
  },

  // Episodes list
  contentLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  list:          { flex: 1 },
  carouselWrap:  { flexGrow: 1, paddingTop: SPACING.md, paddingBottom: SPACING.xl },

  episodeCard: {
    flexDirection: 'row', gap: SPACING.md, borderRadius: RADIUS.md,
    marginBottom: SPACING.lg, overflow: 'hidden', padding: SPACING.md,
  },
  episodeThumb: {
    width: LIST_THUMB_W, height: LIST_THUMB_H, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.blackAlpha90, overflow: 'hidden',
    position: 'relative', flexShrink: 0,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  durationBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: RADIUS.sm,
    paddingHorizontal: 5, paddingVertical: 2, zIndex: 2,
  },
  durationText: { color: COLORS.white, fontSize: FONT_SIZE.xxs, fontWeight: FONT_WEIGHT.semibold },
  progressBar:  {
    position: 'absolute', bottom: 0, left: 0,
    width: '30%', height: 3, backgroundColor: COLORS.primary, zIndex: 3,
  },

  episodeInfo:  { flex: 1, minWidth: 0, gap: 3 },
  episodeMeta:  { fontSize: FONT_SIZE.xxs },
  episodeTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, lineHeight: 19, marginTop: 2 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.sm },
});
