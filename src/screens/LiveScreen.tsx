import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  FlatList, Image, Animated, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import OrientationLib from 'react-native-orientation-locker';
const Orientation = (OrientationLib as any)?.default ?? OrientationLib;

import { useTheme }           from '../hooks/useTheme';
import { useTranslation }     from '../hooks/useTranslation';
import { useAuthStore }       from '../stores';
import { useUiStore }         from '../stores';
import { useLoginNavigation } from '../hooks/useLoginNavigation';
import { useLiveChat }         from '../hooks/useLiveChat';
import { LiveChatModal }        from '../components/live/LiveChatModal';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, LIST_THUMB_W, LIST_THUMB_H } from '../constants';
import { formatFullDate, formatViews, getImageUrl } from '../utils';
import * as api from '../services/api';
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
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0`;
  }
  return url;
}

// ─── Types tabs contenu ───────────────────────────────────────────────────────

type ContentTab = 'recent' | 'episodes' | 'highlights' | 'schedule';

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
  const pulseAnim           = useRef(new Animated.Value(1)).current;

  const [activeTab,      setActiveTab]      = useState<ContentTab>('recent');
  const [chatVisible,    setChatVisible]    = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [reminderIds,    setReminderIds]    = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Hook WebSocket chat — instancié ici pour afficher le compteur sur le bouton
  const chat = useLiveChat(user?.id ?? null);

  // Fermer le modal automatiquement si l'admin ferme le chat
  useEffect(() => {
    if (!chat.chatOpen && chatVisible) {
      setChatVisible(false);
    }
  }, [chat.chatOpen, chatVisible]);

  // ── Status live ──────────────────────────────────────────────────────────
  const { data: liveData, isLoading: liveLoading } = useQuery({
    queryKey:        ['live-status'],
    queryFn:         () => api.getLive(),
    refetchInterval: 30_000,
  });
  const isOnAir   = !!liveData?.is_live;
  const viewers   = liveData?.viewers ?? 0;
  const playerUrl = buildPlayerUrl(liveData);

  // ── Grille programme — sans filtre date, le backend retourne les prochains ──
  const { data: scheduleData, isLoading: lSchedule } = useQuery({
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
  const { data: sports        } = useQuery({ queryKey: ['sports-live'],        queryFn: () => api.getSports(0, 20) });
  const { data: jtandmag      } = useQuery({ queryKey: ['jtandmag-live'],      queryFn: () => api.getJTandMag(0, 20) });
  const { data: divertissement} = useQuery({ queryKey: ['divertissement-live'],queryFn: () => api.getDivertissement(0, 20) });
  const { data: reportages    } = useQuery({ queryKey: ['reportages-live'],    queryFn: () => api.getReportages(0, 20) });
  const { data: teleRealite   } = useQuery({ queryKey: ['telerealite-live'],   queryFn: () => api.getTeleRealite(0, 20) });

  // Contenu de chaque onglet (miroir exact de bf1_tv_mobile loadLive)
  const allRecent = React.useMemo(() => {
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

  const allEpisodes = React.useMemo(() => {
    return [
      ...(jtandmag?.items      ?? []).map((i: any) => ({ ...i, _contentType: 'jtandmag' })),
      ...(divertissement?.items?? []).map((i: any) => ({ ...i, _contentType: 'divertissement' })),
    ].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
     .slice(0, 15);
  }, [jtandmag, divertissement]);

  const allHighlights = React.useMemo(() => {
    return [
      ...(sports?.items    ?? []).map((i: any) => ({ ...i, _contentType: 'sport' })),
      ...(reportages?.items?? []).map((i: any) => ({ ...i, _contentType: 'reportage' })),
    ].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
     .slice(0, 15);
  }, [sports, reportages]);

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

  // ── Pulse animation live ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnAir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isOnAir]);

  // ── Plein écran ──────────────────────────────────────────────────────────
  const openFullscreen = useCallback(() => {
    try { Orientation?.lockToLandscape?.(); } catch {}
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    try { Orientation?.lockToPortrait?.(); } catch {}
    setIsFullscreen(false);
  }, []);

  // Nettoyer l'orientation quand on quitte l'écran
  useEffect(() => {
    return () => {
      try { Orientation?.lockToPortrait?.(); } catch {}
    };
  }, []);

  // ── Navigation vers détail ───────────────────────────────────────────────
  const handleEpisodePress = useCallback((item: any) => {
    navigation.navigate('ShowDetail', { id: item.id ?? item._id, type: item._contentType });
  }, [navigation]);

  // ── Onglets ──────────────────────────────────────────────────────────────
  const tabs: { key: ContentTab; label: string }[] = [
    { key: 'recent',     label: t.live.tabRecent },
    { key: 'episodes',   label: t.live.tabEpisodes },
    { key: 'highlights', label: t.live.tabHighlights },
    { key: 'schedule',   label: t.live.tabSchedule },
  ];

  const currentItems =
    activeTab === 'recent'     ? allRecent :
    activeTab === 'episodes'   ? allEpisodes :
    activeTab === 'highlights' ? allHighlights :
    scheduleItems;

  const isContentLoading =
    activeTab === 'schedule' ? lSchedule :
    !sports && !jtandmag;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Player 16:9 (haut fixe) ── */}
      <View style={[styles.playerWrapper, { marginTop: insets.top }]}>
        {liveLoading ? (
          <View style={styles.playerLoader}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : isOnAir && playerUrl !== 'about:blank' ? (
          <WebView
            source={{ uri: playerUrl }}
            style={StyleSheet.absoluteFill}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
          />
        ) : (
          <View style={styles.offAirWrap}>
            <Icon name="wifi-outline" size={32} color={theme.text3} />
            <Text style={[styles.offAirText, { color: theme.text3 }]}>
              {isOnAir ? t.live.noStream : t.live.offAir}
            </Text>
          </View>
        )}

        {/* Badge EN DIRECT */}
        {isOnAir && (
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveText}>{t.player.live}</Text>
          </View>
        )}

        {/* Compteur spectateurs */}
        {viewers > 0 && (
          <View style={styles.viewersBadge}>
            <Icon name="eye" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.viewersText}>{formatViews(viewers)}</Text>
          </View>
        )}

        {/* Bouton plein écran */}
        {isOnAir && playerUrl !== 'about:blank' && (
          <TouchableOpacity
            style={styles.fullscreenBtn}
            onPress={openFullscreen}
            activeOpacity={0.8}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon name="expand-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Modal plein écran paysage ── */}
      <Modal
        visible={isFullscreen}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFullscreen}
        supportedOrientations={['landscape']}
      >
        <View style={styles.fsContainer}>
          <StatusBar hidden />
          <WebView
            source={{ uri: playerUrl }}
            style={StyleSheet.absoluteFill}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            originWhitelist={['*']}
          />
          {/* Badge EN DIRECT */}
          {isOnAir && (
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>{t.player.live}</Text>
            </View>
          )}
          {/* Bouton fermer */}
          <TouchableOpacity
            style={styles.fsCloseBtn}
            onPress={closeFullscreen}
            activeOpacity={0.8}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon name="contract-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

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

        {/* Liste d'épisodes */}
        {isContentLoading ? (
          <View style={styles.contentLoader}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={currentItems}
            keyExtractor={(item, i) => String(item.id ?? item._id ?? i)}
            scrollEventThrottle={16}
            renderItem={({ item }) =>
              activeTab === 'schedule' ? (
                <ScheduleCard
                  item={item}
                  isOnAir={isCurrentProgram(item)}
                  hasReminder={reminderIds.has(String(item.id ?? item._id ?? ''))}
                  onToggleReminder={toggleReminder}
                  theme={theme}
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

  liveBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(226,62,62,0.92)',
    borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 5, zIndex: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.white },
  liveText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.white, letterSpacing: 0.5 },

  viewersBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5, zIndex: 10,
  },
  viewersText: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FONT_WEIGHT.semibold },

  fullscreenBtn: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.sm,
    padding: 7, zIndex: 10,
  },

  // Plein écran
  fsContainer: {
    flex: 1, backgroundColor: '#000',
  },
  fsCloseBtn: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: RADIUS.sm,
    padding: 8, zIndex: 20,
  },

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
