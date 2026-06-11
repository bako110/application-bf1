import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
  Modal, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore, useUiStore } from '../stores';
import * as api from '../services/api';
import { PremiumModal } from '../components/profile/PremiumModal';
import { formatFullDate, formatViews } from '../utils';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SCREEN, HERO_H, REL_W, REL_H } from '../constants';
import type { HomeStackParams } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';

type Nav   = StackNavigationProp<HomeStackParams>;
type Route = RouteProp<HomeStackParams, 'ShowDetail'>;

const SW = SCREEN.W;

// ─── TYPE_CONFIG miroir de show-detail.js ────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  sport:          { label: 'Sport',          icon: 'trophy',        color: '#1DA1F2' },
  jtandmag:       { label: 'Journal',         icon: 'camera-video',  color: '#E23E3E' },
  magazine:       { label: 'Magazine',        icon: 'journal',       color: '#8B5CF6' },
  divertissement: { label: 'Divertissement',  icon: 'musical-notes', color: '#A855F7' },
  reportage:      { label: 'Reportage',       icon: 'film',          color: '#F59E0B' },
  archive:        { label: 'Archive',         icon: 'archive',       color: '#6B7280' },
  tele_realite:   { label: 'Télé Réalité',    icon: 'videocam',      color: '#EC4899' },
  missed:         { label: 'Rattrapage',      icon: 'time',          color: '#F59E0B' },
  show:           { label: 'Émission',        icon: 'play-circle',   color: COLORS.primary },
};

// ─── Pill d'action ────────────────────────────────────────────────────────────
function ActionPill({
  icon, label, active = false, color, loading = false, onPress,
}: {
  icon: string; label?: string | number; active?: boolean;
  color?: string; loading?: boolean; onPress?: () => void;
}) {
  const { theme } = useTheme();
  const c = color ?? COLORS.primary;
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        { backgroundColor: active ? `${c}22` : theme.surface, borderColor: active ? c : theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator size="small" color={c} />
        : <Icon name={`${icon}${active ? '' : '-outline'}` as any} size={18} color={active ? c : theme.text2} />}
      {label !== undefined && (
        <Text style={[styles.pillLabel, { color: active ? c : theme.text2 }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Partage réseau ───────────────────────────────────────────────────────────
// ─── Card related (152px) ─────────────────────────────────────────────────────
function RelatedCard({ item, onPress }: { item: any; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity style={styles.relCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.relThumb, { backgroundColor: theme.surface }]}>
        {(item.thumbnail || item.image_url || item.image) ? (
          <Image
            source={{ uri: item.thumbnail || item.image_url || item.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.relNoImg]}>
            <Icon name="play-circle-outline" size={28} color={COLORS.redAlpha50} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        {(item.duration_minutes || item.duration) ? (
          <View style={styles.relDur}>
            <Text style={styles.relDurText}>{item.duration_minutes ?? item.duration}min</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.relTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
}

// ─── Comments bottom sheet ────────────────────────────────────────────────────
function CommentsModal({
  visible, onClose, comments, onSend, isSending, isAuthenticated, theme, t, insets, typeColor,
}: {
  visible: boolean; onClose: () => void;
  comments: any[]; onSend: (text: string) => void;
  isSending: boolean; isAuthenticated: boolean;
  theme: any; t: any; insets: any; typeColor: string;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Fond semi-transparent cliquable pour fermer */}
      <TouchableOpacity
        style={cmStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={cmStyles.kav}
      >
        <View style={[cmStyles.sheet, { backgroundColor: theme.surface }]}>
          {/* Handle */}
          <View style={cmStyles.handleWrap}>
            <View style={[cmStyles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={[cmStyles.header, { borderBottomColor: theme.divider }]}>
            <Text style={[cmStyles.title, { color: theme.text }]}>
              {t.comments.title}
              {comments.length > 0 && (
                <Text style={[cmStyles.count, { color: theme.text3 }]}>  {comments.length}</Text>
              )}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Icon name="close" size={20} color={theme.text3} />
            </TouchableOpacity>
          </View>

          {/* Liste — flex: 1 pour remplir l'espace disponible */}
          <FlatList
            data={comments}
            keyExtractor={(item, i) => String(item.id ?? i)}
            style={cmStyles.list}
            contentContainerStyle={cmStyles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={cmStyles.empty}>
                <Icon name="chatbubble-ellipses-outline" size={44} color={theme.text3} />
                <Text style={[cmStyles.emptyText, { color: theme.text3 }]}>{t.comments.empty}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const name    = item.user?.username ?? item.username ?? 'Anonyme';
              const initial = (name[0] ?? '?').toUpperCase();
              const body    = item.text ?? item.content ?? '';
              const date    = item.created_at ?? item.date ?? null;
              return (
                <View style={[cmStyles.row, { borderBottomColor: theme.divider }]}>
                  <View style={[cmStyles.avatar, { backgroundColor: typeColor + 'cc' }]}>
                    <Text style={cmStyles.initial}>{initial}</Text>
                  </View>
                  <View style={cmStyles.rowBody}>
                    <View style={cmStyles.rowTop}>
                      <Text style={[cmStyles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                      {date && (
                        <Text style={[cmStyles.date, { color: theme.text3 }]}>
                          {new Date(date).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <Text style={[cmStyles.body, { color: theme.text2 }]}>{body}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Input */}
          <View style={[cmStyles.inputRow, {
            borderTopColor:  theme.divider,
            backgroundColor: theme.surface,
            paddingBottom:   Math.max(insets.bottom, 16),
          }]}>
            {isAuthenticated ? (
              <>
                <TextInput
                  ref={inputRef}
                  style={[cmStyles.input, { backgroundColor: theme.bg1, color: theme.text, borderColor: theme.border }]}
                  value={text}
                  onChangeText={setText}
                  placeholder={t.comments.placeholder}
                  placeholderTextColor={theme.text3}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!isSending}
                  multiline={false}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!text.trim() || isSending}
                  style={[cmStyles.sendBtn, {
                    backgroundColor: text.trim() && !isSending ? COLORS.primary : theme.bg2,
                  }]}
                >
                  {isSending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Icon name="send" size={16} color={text.trim() ? COLORS.white : theme.text3} />
                  }
                </TouchableOpacity>
              </>
            ) : (
              <View style={cmStyles.loginHint}>
                <Icon name="lock-closed-outline" size={14} color={theme.text3} />
                <Text style={[cmStyles.loginText, { color: theme.text3 }]}>{t.comments.loginRequired}</Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cmStyles = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  kav:         { flex: 1, justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  handleWrap:  { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle:      { width: 36, height: 4, borderRadius: 2 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  title:       { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  count:       { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.regular },
  list:        { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 8 },
  empty:       { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText:   { fontSize: FONT_SIZE.sm },
  row:         { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  avatar:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  initial:     { color: '#fff', fontSize: 14, fontWeight: FONT_WEIGHT.bold },
  rowBody:     { flex: 1, gap: 3 },
  rowTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:        { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, flex: 1 },
  date:        { fontSize: 11, flexShrink: 0, marginLeft: 8 },
  body:        { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0.5 },
  input:       { flex: 1, height: 44, borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: 16, fontSize: FONT_SIZE.sm },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  loginHint:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  loginText:   { fontSize: FONT_SIZE.sm },
});

// ─── Helpers YouTube ─────────────────────────────────────────────────────────
function extractYoutubeId(uri: string): string | null {
  if (!uri) return null;
  // Toutes les formes : watch?v=, embed/, shorts/, live/, youtu.be/
  const m = uri.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // ID brut de 11 caractères
  if (/^[a-zA-Z0-9_-]{11}$/.test(uri.trim())) return uri.trim();
  return null;
}


// ─── Écran principal ──────────────────────────────────────────────────────────
export function ShowDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const navigation        = useNavigation<Nav>();
  const route             = useRoute<Route>();
  const insets            = useSafeAreaInsets();
  const { isAuthenticated, canAccess, user } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const qc                = useQueryClient();

  const { id, type } = route.params;
  const idStr        = String(id);

  const [descExpanded,  setDescExpanded]  = useState(false);
  const [commentOpen,   setCommentOpen]   = useState(false);
  const [premiumOpen,   setPremiumOpen]   = useState(false);
  const [ytPlaying,     setYtPlaying]     = useState(true);
  const [ytReady,       setYtReady]       = useState(false);

  // ─── Show ──────────────────────────────────────────────────────────────────
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['show', idStr, type ?? 'default'],
    queryFn:  () => api.getShowById(id, type),
  });

  const contentType = type ?? show?.type ?? 'show';
  const typeConf    = TYPE_CONFIG[contentType] ?? TYPE_CONFIG.show;


  // ─── Related ───────────────────────────────────────────────────────────────
  const { data: related = [] } = useQuery({
    queryKey: ['related', idStr, contentType],
    queryFn:  () => api.getRelated(id, contentType),
    enabled:  !!show,
  });

  // ─── Likes ─────────────────────────────────────────────────────────────────
  const { data: likesCount = 0 } = useQuery({
    queryKey: ['likes-count', contentType, idStr],
    queryFn:  () => api.getLikesCount(contentType, idStr),
    enabled:  !!show,
  });
  const { data: isLiked = false } = useQuery({
    queryKey: ['liked', contentType, idStr],
    queryFn:  () => api.checkLiked(contentType, idStr),
    enabled:  !!show && isAuthenticated,
  });

  // ─── Favoris ───────────────────────────────────────────────────────────────
  const { data: isFavorited = false } = useQuery({
    queryKey: ['favorited', contentType, idStr],
    queryFn:  () => api.checkFavorite(contentType, idStr),
    enabled:  !!show && isAuthenticated,
  });

  // ─── Commentaires ──────────────────────────────────────────────────────────
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', contentType, idStr],
    queryFn:  () => api.getComments(contentType, idStr),
    enabled:  commentOpen && !!show,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(contentType, idStr),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['liked', contentType, idStr] });
      qc.invalidateQueries({ queryKey: ['likes-count', contentType, idStr] });
    },
  });
  const favMutation = useMutation({
    mutationFn: () => isFavorited
      ? api.removeFavorite(contentType, idStr)
      : api.addFavorite(contentType, idStr),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['favorited', contentType, idStr] });
    },
  });
  const commentMutation = useMutation({
    mutationFn: (text: string) => api.addComment(contentType, idStr, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', contentType, idStr] });
    },
  });

  // ─── Incrément vues ────────────────────────────────────────────────────────
  useEffect(() => {
    if (show?.id) {
      api.incrementView(contentType, idStr, user?.id ? String(user.id) : undefined);
    }
  }, [show?.id]);

  // ─── Auth-guard ────────────────────────────────────────────────────────────
  const guardedLike = () => {
    if (!isAuthenticated) { showLoginModal(); return; }
    likeMutation.mutate();
  };
  const guardedFav = () => {
    if (!isAuthenticated) { showLoginModal(); return; }
    favMutation.mutate();
  };
  const guardedComment = () => {
    if (!isAuthenticated) { showLoginModal(); return; }
    setCommentOpen(true);
  };

  // ─── Error states ──────────────────────────────────────────────────────────
  const httpStatus = (error as any)?.status ?? (error as any)?.response?.status;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (httpStatus === 401) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <TouchableOpacity style={[styles.backAbsolute, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Icon name="lock-closed" size={52} color={COLORS.primary} />
        <Text style={[styles.authTitle, { color: theme.text }]}>{t.show.loginRequired}</Text>
        <Text style={[styles.authSub, { color: theme.text3 }]}>{t.show.loginRequiredSub}</Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => showLoginModal()}>
          <Text style={styles.authBtnText}>{t.auth.login}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (httpStatus === 403) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <TouchableOpacity style={[styles.backAbsolute, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.paywallIconWrap, { width: 72, height: 72, borderRadius: 36, marginBottom: 16 }]}>
          <Icon name="star" size={36} color="#EAB308" />
        </View>
        <Text style={[styles.authTitle, { color: theme.text }]}>{t.show.premium}</Text>
        <Text style={[styles.authSub, { color: theme.text3 }]}>{t.show.premiumSub}</Text>
        <TouchableOpacity style={[styles.authBtn, { backgroundColor: '#EAB308', flexDirection: 'row', gap: 8, alignItems: 'center' }]} onPress={() => setPremiumOpen(true)}>
          <Icon name="lock-open-outline" size={16} color="#000" />
          <Text style={[styles.authBtnText, { color: '#000' }]}>{t.show.seeOffers}</Text>
        </TouchableOpacity>
        <PremiumModal visible={premiumOpen} onClose={() => setPremiumOpen(false)} onSuccess={() => { setPremiumOpen(false); navigation.goBack(); }} />
      </View>
    );
  }

  if (!show) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <TouchableOpacity style={[styles.backAbsolute, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Icon name="alert-circle-outline" size={48} color={theme.text3} />
        <Text style={[styles.authSub, { color: theme.text3, marginTop: 12 }]}>{t.show.notFound}</Text>
      </View>
    );
  }

  const heroImage = show.thumbnail || show.image_url || show.image || null;
  const duration  = show.duration_minutes ?? show.duration;
  const isLocked  = !canAccess(show.subscription);

  const videoUrl = show.video_url || show.stream_url || show.videoUrl || '';
  const ytId     = extractYoutubeId(videoUrl);
  const hasVideo = !isLocked && !!ytId;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Back button flottant — hors ScrollView pour passer au-dessus de la WebView YouTube */}
      {hasVideo && (
        <TouchableOpacity
          style={[styles.iconBtn, { position: 'absolute', top: insets.top + 8, left: SPACING.lg, zIndex: 99 }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} disableScrollViewPanResponder>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        {hasVideo ? (
          <View style={{ backgroundColor: '#000' }}>
            {/* Barre fixe status bar */}
            <View style={{ height: insets.top + 12, backgroundColor: '#000', width: '100%' }} />

            <View style={{ width: SW, height: SW * 9 / 16 }}>
              <YoutubePlayer
                height={SW * 9 / 16}
                width={SW}
                videoId={ytId!}
                play={ytPlaying}
                onReady={() => setYtReady(true)}
                onChangeState={state => {
                  if (state === 'playing') setYtPlaying(true);
                  if (state === 'paused' || state === 'ended') setYtPlaying(false);
                }}
                webViewProps={{
                  androidLayerType: 'hardware',
                  allowsFullscreenVideo: true,
                }}
              />
              {/* Overlay miniature + bouton play custom */}
              {!ytPlaying && (
                <TouchableOpacity
                  style={styles.ytOverlay}
                  onPress={() => setYtPlaying(true)}
                  activeOpacity={1}
                >
                  {heroImage ? (
                    <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : null}
                  <View style={styles.ytPlayBtn}>
                    <Icon name="play" size={32} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.hero}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d0008' }]} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />
            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
            </View>
            <View style={styles.heroBottom}>
              <View style={styles.heroBadgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
                  <Icon name={typeConf.icon as any} size={10} color="#fff" />
                  <Text style={styles.typeBadgeText}>{typeConf.label.toUpperCase()}</Text>
                </View>
                {duration ? (
                  <View style={styles.durBadge}>
                    <Icon name="time-outline" size={10} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.durText}>{duration}min</Text>
                  </View>
                ) : null}
                {isLocked && (
                  <View style={[styles.durBadge, { backgroundColor: 'rgba(242,180,0,0.75)' }]}>
                    <Icon name="lock-closed" size={10} color="#fff" />
                    <Text style={styles.durText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle} numberOfLines={3}>{show.title}</Text>
              {isLocked && (
                <TouchableOpacity style={[styles.watchBtn, styles.watchBtnLocked]} onPress={() => setPremiumOpen(true)} activeOpacity={0.85}>
                  <Icon name="lock-open-outline" size={18} color="#000" />
                  <Text style={[styles.watchBtnText, { color: '#000' }]}>Débloquer ce contenu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── TITRE sous le player (uniquement si vidéo) ────────────────────── */}
        {hasVideo && (
          <View style={[styles.body, { backgroundColor: theme.bg, paddingTop: 12, paddingBottom: 0 }]}>
            <Text style={[styles.heroTitle, { color: theme.text, fontSize: 18, marginBottom: 6 }]} numberOfLines={3}>
              {show.title}
            </Text>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
                <Icon name={typeConf.icon as any} size={10} color="#fff" />
                <Text style={styles.typeBadgeText}>{typeConf.label.toUpperCase()}</Text>
              </View>
              {duration ? (
                <View style={styles.durBadge}>
                  <Icon name="time-outline" size={10} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.durText}>{duration}min</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── CORPS ─────────────────────────────────────────────────────────── */}
        <View style={[styles.body, { backgroundColor: theme.bg }]}>

          {/* Stats bar */}
          <View style={[styles.statsBar, { borderBottomColor: theme.border }]}>
            {show.views ? (
              <View style={styles.stat}>
                <Icon name="eye-outline" size={13} color={theme.text3} />
                <Text style={[styles.statText, { color: theme.text3 }]}>{formatViews(show.views)}</Text>
              </View>
            ) : null}
            {show.created_at ? (
              <View style={styles.stat}>
                <Icon name="calendar-outline" size={13} color={theme.text3} />
                <Text style={[styles.statText, { color: theme.text3 }]}>{formatFullDate(show.created_at)}</Text>
              </View>
            ) : null}
            {duration ? (
              <View style={styles.stat}>
                <Icon name="time-outline" size={13} color={theme.text3} />
                <Text style={[styles.statText, { color: theme.text3 }]}>{duration}min</Text>
              </View>
            ) : null}
          </View>

          {/* Actions : Like | Favoris | Commenter */}
          <View style={styles.actionsRow}>
            <ActionPill
              icon="heart"
              label={likesCount > 0 ? likesCount : undefined}
              active={isLiked}
              color={COLORS.primary}
              loading={likeMutation.isPending}
              onPress={guardedLike}
            />
            <ActionPill
              icon="bookmark"
              label={t.show.favorites}
              active={isFavorited}
              color="#F59E0B"
              loading={favMutation.isPending}
              onPress={guardedFav}
            />
            <ActionPill
              icon="chatbubble"
              label={(comments as any[]).length > 0 ? (comments as any[]).length : t.show.comment}
              active={commentOpen}
              color="#3B82F6"
              onPress={guardedComment}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Description expandable */}
          {show.description ? (
            <View style={styles.descSection}>
              <Text
                style={[styles.desc, { color: theme.text2 }]}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {show.description}
              </Text>
              {show.description.length > 120 && (
                <TouchableOpacity
                  style={styles.readMore}
                  onPress={() => setDescExpanded(v => !v)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.readMoreText, { color: COLORS.primary }]}>
                    {descExpanded ? t.show.readLess : t.show.readMore}
                  </Text>
                  <Icon name={descExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Hôte / Présentateur */}
          {(show.presenter || show.host) ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={[styles.hostCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.hostAvatar, { backgroundColor: typeConf.color }]}>
                  <Icon name="person" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hostRole, { color: theme.text3 }]}>{t.show.presenter}</Text>
                  <Text style={[styles.hostName, { color: theme.text }]}>{show.presenter ?? show.host}</Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Paywall card */}
          {isLocked && (
            <View style={[styles.paywallCard, { backgroundColor: theme.surface, borderColor: 'rgba(226,62,62,0.25)' }]}>
              <LinearGradient
                colors={['rgba(226,62,62,0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                pointerEvents="none"
              />
              <View style={styles.paywallTop}>
                <View style={styles.paywallIconWrap}>
                  <Icon name="star" size={22} color="#EAB308" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paywallTitle, { color: theme.text }]}>Contenu Premium</Text>
                  <Text style={[styles.paywallSub, { color: theme.text3 }]}>
                    {show.subscription
                      ? `Abonnement ${show.subscription} requis pour regarder ce contenu.`
                      : 'Un abonnement est requis pour accéder à ce contenu.'}
                  </Text>
                </View>
              </View>
              <View style={styles.paywallFeatures}>
                {['Accès illimité aux archives', 'Qualité HD / 4K', 'Sans publicité'].map(f => (
                  <View key={f} style={styles.paywallFeatureRow}>
                    <Icon name="checkmark-circle" size={13} color="#22C55E" />
                    <Text style={[styles.paywallFeatureText, { color: theme.text2 }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.paywallBtn}
                onPress={() => setPremiumOpen(true)}
                activeOpacity={0.85}
              >
                <Icon name="lock-open-outline" size={15} color="#fff" />
                <Text style={styles.paywallBtnText}>Voir les offres d'abonnement</Text>
                <Icon name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Vidéos similaires */}
          {(related as any[]).length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.show.similar}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relScroll}
              >
                {(related as any[]).map((item: any) => (
                  <RelatedCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.push('ShowDetail', { id: item.id, type: item.type ?? contentType })}
                  />
                ))}
              </ScrollView>
            </>
          )}


          <View style={{ height: insets.bottom + 24 }} />
        </View>
      </ScrollView>


      {/* Modal commentaires */}
      <CommentsModal
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        comments={comments as any[]}
        onSend={(text) => commentMutation.mutate(text)}
        isSending={commentMutation.isPending}
        isAuthenticated={isAuthenticated}
        theme={theme}
        t={t}
        insets={insets}
        typeColor={typeConf.color}
      />

      {/* PremiumModal */}
      <PremiumModal
        visible={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        requiredCategory={show?.subscription ?? null}
        onSuccess={() => setPremiumOpen(false)}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    width:           '100%',
    height:          HERO_H + 60,
    backgroundColor: '#000',
    justifyContent:  'flex-end',
  },
  heroTopBar: {
    position:          'absolute',
    top:               0, left: 0, right: 0,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     8,
    zIndex:            10,
  },
  heroBottom: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.xl,
    gap:               8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap:           8,
    flexWrap:      'wrap',
  },
  iconBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  typeBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      RADIUS.full,
  },
  typeBadgeText: {
    color:         '#fff',
    fontSize:      10,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.8,
  },
  durBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
    backgroundColor:   'rgba(0,0,0,0.5)',
  },
  durText: {
    color:      'rgba(255,255,255,0.85)',
    fontSize:   11,
    fontWeight: FONT_WEIGHT.semibold,
  },
  heroTitle: {
    color:            '#fff',
    fontSize:         FONT_SIZE.xl,
    fontWeight:       FONT_WEIGHT.extrabold,
    lineHeight:       28,
    letterSpacing:    -0.4,
    textShadowColor:  'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // ── Corps ─────────────────────────────────────────────────────────────────
  ytOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#000',
  },
  ytPlayBtn: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: 'rgba(226,62,62,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#E23E3E',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.5,
    shadowRadius:    12,
    elevation:       8,
  },
  body: {
    flex: 1,
    paddingTop: 4,
  },
  statsBar: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 1,
  },
  stat: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  statText: {
    fontSize: FONT_SIZE.sm,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection:     'row',
    gap:               SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    flexWrap:          'wrap',
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:      RADIUS.full,
    borderWidth:       1.5,
  },
  pillLabel: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },


  divider: {
    height:           1,
    marginHorizontal: SPACING.lg,
    marginVertical:   SPACING.md,
  },

  // ── Description ───────────────────────────────────────────────────────────
  descSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom:      SPACING.sm,
  },
  desc: {
    fontSize:   FONT_SIZE.md,
    lineHeight: 22,
  },
  readMore: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     6,
    alignSelf:     'flex-start',
  },
  readMoreText: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Hôte ──────────────────────────────────────────────────────────────────
  hostCard: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              SPACING.md,
    marginHorizontal: SPACING.lg,
    padding:          SPACING.md,
    borderRadius:     RADIUS.lg,
    borderWidth:      1,
  },
  hostAvatar: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
  },
  hostRole: {
    fontSize:     FONT_SIZE.xs,
    marginBottom: 2,
  },
  hostName: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Bouton verrouillé ─────────────────────────────────────────────────────
  watchBtnLocked: {
    backgroundColor: '#EAB308',
  },

  // ── Paywall card ──────────────────────────────────────────────────────────
  paywallCard: {
    marginHorizontal: SPACING.lg,
    marginTop:        SPACING.sm,
    borderRadius:     RADIUS.xl,
    borderWidth:      1.5,
    padding:          SPACING.lg,
    overflow:         'hidden',
  },
  paywallTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           SPACING.md,
    marginBottom:  SPACING.md,
  },
  paywallIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   14,
    backgroundColor:'rgba(234,179,8,0.15)',
    borderWidth:     1,
    borderColor:    'rgba(234,179,8,0.3)',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  paywallTitle: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 4,
  },
  paywallSub: {
    fontSize:   FONT_SIZE.sm,
    lineHeight: 18,
  },
  paywallFeatures: {
    gap:          6,
    marginBottom: SPACING.md,
  },
  paywallFeatureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  paywallFeatureText: {
    fontSize: FONT_SIZE.sm,
  },
  paywallBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    backgroundColor:   COLORS.primary,
    borderRadius:      RADIUS.lg,
    paddingVertical:   13,
  },
  paywallBtnText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize:          FONT_SIZE.lg,
    fontWeight:        FONT_WEIGHT.extrabold,
    letterSpacing:     -0.4,
    paddingHorizontal: SPACING.lg,
    marginBottom:      SPACING.sm,
  },

  // ── Related ───────────────────────────────────────────────────────────────
  relScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     8,
    gap:               12,
  },
  relCard: {
    width:      REL_W,
    flexShrink: 0,
  },
  relThumb: {
    width:        REL_W,
    height:       REL_H,
    borderRadius: RADIUS.md,
    overflow:     'hidden',
    marginBottom: 6,
  },
  relNoImg: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  relDur: {
    position:          'absolute',
    bottom:            5,
    right:             5,
    backgroundColor:   'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical:   2,
    borderRadius:      RADIUS.sm,
  },
  relDurText: {
    color:      '#fff',
    fontSize:   10,
    fontWeight: FONT_WEIGHT.semibold,
  },
  relTitle: {
    fontSize:   FONT_SIZE.sm,
    lineHeight: 18,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ── Bouton Regarder ───────────────────────────────────────────────────────
  watchBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    alignSelf:         'flex-start',
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical:   11,
    borderRadius:      RADIUS.full,
    marginTop:         6,
    shadowColor:       COLORS.primary,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.4,
    shadowRadius:      10,
    elevation:         6,
  },
  watchBtnText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3,
  },

  // ── VideoPlayer modal ──────────────────────────────────────────────────────
  playerModal: {
    flex:            1,
    backgroundColor: '#000',
  },
  playerTapZone: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  playerTopBar: {
    position:          'absolute',
    top:               0, left: 0, right: 0,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.md,
    paddingTop:        SPACING.lg,
    paddingBottom:     SPACING.md,
    zIndex:            5,
  },
  playerBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  playerPauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         2,
  },
  playerPauseCircle: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Auth screens ──────────────────────────────────────────────────────────
  backAbsolute: {
    position: 'absolute',
    left:     20,
    padding:  8,
  },
  authTitle: {
    fontSize:     FONT_SIZE.xl,
    fontWeight:   FONT_WEIGHT.extrabold,
    marginTop:    SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign:    'center',
  },
  authSub: {
    fontSize:  FONT_SIZE.md,
    textAlign: 'center',
    maxWidth:  260,
  },
  authBtn: {
    marginTop:         SPACING.xl,
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 36,
    paddingVertical:   12,
    borderRadius:      RADIUS.full,
  },
  authBtnText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },

  // ── Auth toast ────────────────────────────────────────────────────────────
  authToast: {
    position:          'absolute',
    bottom:            80,
    left:              16,
    right:             16,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    padding:           SPACING.md,
    borderRadius:      RADIUS.lg,
    borderWidth:       1,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.15,
    shadowRadius:      12,
    elevation:         8,
  },
  authToastText: {
    flex:       1,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
