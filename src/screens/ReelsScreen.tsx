import React, { useRef, useState, useCallback } from 'react';
import {
  View, FlatList, Dimensions, StyleSheet, StatusBar,
  ActivityIndicator, Text, TouchableOpacity, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore, useUiStore } from '../stores';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import * as api from '../services/api';

const { height: SH, width: SW } = Dimensions.get('window');

function fmtCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtTimeAgo(d: string) {
  try {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)  return "à l'instant";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  } catch { return ''; }
}

// ─── Drawer commentaires ──────────────────────────────────────────────────────
function CommentsDrawer({
  reelId, visible, onClose,
}: {
  reelId: string; visible: boolean; onClose: () => void;
}) {
  const { isAuthenticated, user } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['reel-comments', reelId],
    queryFn:  () => api.getComments('reel', reelId),
    enabled:  visible,
    staleTime: 30_000,
  });

  const addMut = useMutation({
    mutationFn: () => api.addComment('reel', reelId, text.trim()),
    onSuccess:  () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['reel-comments', reelId] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    addMut.mutate();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay semi-transparent */}
      <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.drawerContainer,
          {
            backgroundColor:      theme.surface,
            borderTopColor:       theme.border,
            paddingBottom:        insets.bottom + 8,
          },
        ]}
      >
        {/* Handle + titre */}
        <View style={[styles.drawerHeader, { borderBottomColor: theme.divider }]}>
          <View style={[styles.drawerHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.drawerTitle, { color: theme.text }]}>
            {t.comments.title}{Array.isArray(comments) && comments.length > 0 ? ` (${comments.length})` : ''}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Icon name="close" size={20} color={theme.text3} />
          </TouchableOpacity>
        </View>

        {/* Liste */}
        {isLoading ? (
          <View style={styles.drawerCenter}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : !Array.isArray(comments) || comments.length === 0 ? (
          <View style={styles.drawerCenter}>
            <Icon name="chatbubble-outline" size={36} color={theme.text3} />
            <Text style={[styles.drawerEmpty, { color: theme.text3 }]}>{t.reels.noComments}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.drawerList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {(comments as any[]).map((c: any) => (
              <View key={c.id ?? c._id} style={[styles.commentRow, { borderBottomColor: theme.divider }]}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentInitial}>
                    {((c.user?.username ?? c.username ?? '?')[0] ?? '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentMeta}>
                    <Text style={[styles.commentUser, { color: theme.text }]}>
                      {c.user?.username ?? c.username ?? 'Anonyme'}
                    </Text>
                    {c.created_at && (
                      <Text style={[styles.commentTime, { color: theme.text3 }]}>{fmtTimeAgo(c.created_at)}</Text>
                    )}
                  </View>
                  <Text style={[styles.commentText, { color: theme.text2 }]}>{c.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Saisie ou bouton login */}
        {isAuthenticated ? (
          <View style={[styles.drawerInput, { borderTopColor: theme.border }]}>
            <View style={styles.inputAvatar}>
              <Text style={styles.commentInitial}>
                {(user?.username?.[0] ?? 'M').toUpperCase()}
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.bg,
                  color:           theme.text,
                  borderColor:     theme.border,
                },
              ]}
              value={text}
              onChangeText={setText}
              placeholder={t.comments.placeholder}
              placeholderTextColor={theme.text3}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || addMut.isPending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!text.trim() || addMut.isPending}
            >
              {addMut.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Icon name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.drawerLoginRow, { borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity style={styles.drawerLoginBtn} onPress={() => { onClose(); setTimeout(() => showLoginModal(t.comments.loginRequired), 350); }}>
              <Text style={styles.drawerLoginText}>{t.comments.loginRequired}</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Item Reel ────────────────────────────────────────────────────────────────
function ReelItem({
  item, isActive, itemHeight,
}: {
  item: any; isActive: boolean; itemHeight: number;
}) {
  const { isAuthenticated } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [muted,         setMuted]         = useState(true);
  const [paused,        setPaused]        = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [commentsOpen,  setCommentsOpen]  = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const idStr    = String(item.id ?? item._id);
  const videoUrl = item.video_url || item.videoUrl || '';
  const thumb    = item.thumbnail_url || item.thumbnail || item.image_url || item.image || '';
  const author   = item.author_name || item.author || 'BF1 TV';

  // Compteurs initiaux depuis l'item
  const initLikes    = Number(Array.isArray(item.likes)    ? item.likes.length    : (item.likes    ?? item.likes_count    ?? 0));
  const initComments = Number(Array.isArray(item.comments) ? item.comments.length : (item.comments ?? item.comments_count ?? 0));

  // Like — état + compteur depuis API
  const { data: isLiked = false } = useQuery({
    queryKey: ['reel-liked', idStr],
    queryFn:  () => api.checkLiked('reel', idStr),
    enabled:  isAuthenticated && isActive,
    staleTime: 60_000,
  });
  const { data: likesCount = initLikes } = useQuery({
    queryKey: ['reel-likes-count', idStr],
    queryFn:  () => api.getLikesCount('reel', idStr),
    enabled:  isActive,
    staleTime: 30_000,
  });

  // Commentaires — compteur
  const { data: commentsData } = useQuery({
    queryKey: ['reel-comments', idStr],
    queryFn:  () => api.getComments('reel', idStr),
    enabled:  isActive,
    staleTime: 30_000,
  });
  const commentsCount = Array.isArray(commentsData) ? commentsData.length : initComments;

  // Mutation like optimiste
  const likeMut = useMutation({
    mutationFn: () => api.toggleLike('reel', idStr),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['reel-liked', idStr] });
      await qc.cancelQueries({ queryKey: ['reel-likes-count', idStr] });
      const prevLiked = qc.getQueryData(['reel-liked', idStr]);
      const prevCount = qc.getQueryData(['reel-likes-count', idStr]) as number ?? initLikes;
      qc.setQueryData(['reel-liked', idStr],        !prevLiked);
      qc.setQueryData(['reel-likes-count', idStr],  prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      return { prevLiked, prevCount };
    },
    onError: (_err, _vars, ctx: any) => {
      qc.setQueryData(['reel-liked', idStr],       ctx?.prevLiked);
      qc.setQueryData(['reel-likes-count', idStr], ctx?.prevCount);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['reel-liked', idStr] });
      qc.invalidateQueries({ queryKey: ['reel-likes-count', idStr] });
    },
  });

  const handleTap = () => {
    setPaused(v => !v);
    setShowIndicator(true);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setShowIndicator(false), 800);
  };

  const handleLike = () => {
    if (!isAuthenticated) { showLoginModal(t.reels.loginToLike); return; }
    likeMut.mutate();
  };

  const handleComment = () => {
    setCommentsOpen(true);
  };

  return (
    <View style={[styles.reelItem, { height: itemHeight }]}>

      {/* Vidéo ou Thumbnail */}
      {isActive && videoUrl ? (
        <Video
          source={{ uri: videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
          paused={paused || !isActive}
          muted={muted}
          ignoreSilentSwitch="ignore"
        />
      ) : thumb ? (
        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noThumb]} />
      )}

      {/* Gradient bas */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={{ position: 'absolute', top: '35%', left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />

      {/* Zone tap — derrière les boutons */}
      <TouchableOpacity
        style={styles.tapZone}
        onPress={handleTap}
        activeOpacity={1}
      />

      {/* Indicateur play/pause */}
      {showIndicator && (
        <View style={styles.playIndicator} pointerEvents="none">
          <View style={styles.playIndicatorCircle}>
            <Icon name={paused ? 'play' : 'pause'} size={30} color="#fff" />
          </View>
        </View>
      )}

      {/* ── Barre d'actions droite ── */}
      <View style={styles.actionBar}>

        {/* Mute */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => setMuted(v => !v)}>
          <View style={styles.actionIcon}>
            <Icon name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.8}>
          <View style={[styles.actionIcon, isLiked && styles.actionIconLiked]}>
            <Icon
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? COLORS.primary : '#fff'}
            />
          </View>
          <Text style={styles.actionLabel}>
            {(likesCount as number) > 0 ? fmtCount(likesCount as number) : ''}
          </Text>
        </TouchableOpacity>

        {/* Commentaire */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleComment} activeOpacity={0.8}>
          <View style={styles.actionIcon}>
            <Icon name="chatbubble-ellipses-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>
            {commentsCount > 0 ? fmtCount(commentsCount) : ''}
          </Text>
        </TouchableOpacity>

      </View>

      {/* Infos bas gauche */}
      <View style={styles.infoBlock} pointerEvents="none">
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Icon name="person" size={13} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.authorName} numberOfLines={1}>@{author}</Text>
        </View>
        {item.title ? (
          <Text style={styles.reelTitle} numberOfLines={2}>{item.title}</Text>
        ) : null}
        {item.description ? (
          <Text style={styles.reelDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>

      {/* Barre de progression bas */}
      <View style={styles.progressBar} pointerEvents="none" />

      {/* Drawer commentaires */}
      <CommentsDrawer
        reelId={idStr}
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn:  () => api.getReels(),
    staleTime: 5 * 60_000,
  });

  const reels: any[] = Array.isArray(data) ? data : ((data as any)?.items ?? []);

  const onViewableChanged = useCallback(({ viewableItems }: any) => {
    const first = viewableItems[0];
    if (first) setActiveIndex(first.index ?? 0);
  }, []);

  const itemHeight = SH - insets.top;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Icon name="play-circle-outline" size={64} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>{t.reels.empty}</Text>
        <Text style={styles.emptySub}>{t.reels.emptySub}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <FlatList
        ref={flatRef}
        data={reels}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            isActive={index === activeIndex}
            itemHeight={itemHeight}
          />
        )}
        keyExtractor={item => String(item.id ?? item._id ?? Math.random())}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({
          length: itemHeight, offset: itemHeight * index, index,
        })}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, backgroundColor: '#000',
  },
  emptyTitle: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  emptySub:   { color: 'rgba(255,255,255,0.5)', fontSize: FONT_SIZE.sm, textAlign: 'center' },

  reelItem: { width: SW, overflow: 'hidden', backgroundColor: '#000' },
  noThumb:  { backgroundColor: '#0d0d0d' },

  // tap zone — zIndex bas, les boutons sont au-dessus
  tapZone: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  playIndicator: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  playIndicatorCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Actions droite ────────────────────────────────────────────────────────
  actionBar: {
    position:   'absolute',
    right:      14,
    bottom:     110,
    alignItems: 'center',
    gap:        18,
    zIndex:     10,   // au-dessus de tapZone
  },
  actionBtn: {
    alignItems: 'center',
    gap:        4,
  },
  actionIcon: {
    width:           50,
    height:          50,
    borderRadius:    25,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.25)',
  },
  actionIconLiked: {
    backgroundColor: 'rgba(226,62,62,0.25)',
    borderColor:     COLORS.primary,
  },
  actionLabel: {
    color:      '#fff',
    fontSize:   12,
    fontWeight: FONT_WEIGHT.bold,
    textShadowColor:  'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    minWidth:   20,
    textAlign:  'center',
  },

  // ── Infos bas gauche ──────────────────────────────────────────────────────
  infoBlock: {
    position: 'absolute', bottom: 56, left: SPACING.lg, right: 82,
    gap: 5, zIndex: 3,
  },
  authorRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', flexShrink: 0,
  },
  authorName: {
    color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    flex: 1,
  },
  reelTitle: {
    color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  reelDesc: {
    color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.sm, lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  progressBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 4,
  },

  // ── Drawer commentaires ───────────────────────────────────────────────────
  drawerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerContainer: {
    // backgroundColor passé inline via theme.surface
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth:       0.5,
    maxHeight: SH * 0.72,
    minHeight: 320,
  },
  drawerHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingTop:        12,
    paddingBottom:     14,
    borderBottomWidth: 0.5,
    // borderBottomColor passé inline
  },
  drawerHandle: {
    position:  'absolute',
    top:       8,
    left:      '50%',
    width:     40,
    height:    4,
    borderRadius: 2,
    // backgroundColor passé inline via theme.border
    marginLeft: -20,
  },
  drawerTitle: {
    flex:       1,
    // color passé inline
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  drawerCenter: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.md,
    paddingVertical: 40,
  },
  drawerEmpty: {
    // color passé inline
    fontSize:   FONT_SIZE.sm,
    textAlign:  'center',
    lineHeight: 20,
  },
  drawerList: { flex: 1, paddingHorizontal: SPACING.lg },

  // Lignes de commentaires
  commentRow: {
    flexDirection:    'row',
    gap:              10,
    paddingVertical:  12,
    borderBottomWidth: 0.5,
    // borderBottomColor passé inline
  },
  commentAvatar: {
    width:          34,
    height:         34,
    borderRadius:   17,
    backgroundColor: COLORS.primary,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  commentInitial: {
    color:      '#fff',
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  commentUser: {
    // color passé inline
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  commentTime: {
    // color passé inline
    fontSize: FONT_SIZE.xs,
  },
  commentText: {
    // color passé inline
    fontSize:   FONT_SIZE.sm,
    lineHeight: 18,
  },

  // Saisie commentaire
  drawerLoginRow: {
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingTop:        SPACING.md,
    borderTopWidth:    0.5,
  },
  drawerLoginBtn: {
    width:            '100%',
    backgroundColor:  COLORS.primary,
    borderRadius:     RADIUS.lg,
    paddingVertical:  13,
    alignItems:       'center',
  },
  drawerLoginText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  drawerInput: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    gap:               10,
    paddingHorizontal: SPACING.lg,
    paddingTop:        12,
    borderTopWidth:    0.5,
    // borderTopColor passé inline
  },
  inputAvatar: {
    width:          34,
    height:         34,
    borderRadius:   17,
    backgroundColor: COLORS.primary,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  inputField: {
    flex:              1,
    // backgroundColor, color, borderColor passés inline
    borderRadius:      RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical:   10,
    fontSize:          FONT_SIZE.sm,
    maxHeight:         100,
    borderWidth:       1,
  },
  sendBtn: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
});
