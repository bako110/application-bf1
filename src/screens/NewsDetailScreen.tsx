import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, Share,
  ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, Animated, Alert, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore, useUiStore } from '../stores';
import { ImageWithSkeleton } from '../components/ui/ImageWithSkeleton';
import * as api from '../services/api';
import { formatFullDate } from '../utils';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import type { HomeStackParams } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';

type Nav   = StackNavigationProp<HomeStackParams>;
type Route = RouteProp<HomeStackParams, 'NewsDetail'>;

const CONTENT_TYPE = 'breaking_news';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(d: string | null | undefined, t: any): string {
  if (!d) return t.newsDetail.recently;
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t.newsDetail.justNow;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7)  return `${j}j`;
  return formatFullDate(d);
}

// ─── Composant commentaire ────────────────────────────────────────────────────

function CommentItem({
  comment, currentUserId, onDelete, onUpdate,
}: {
  comment:       any;
  currentUserId?: string | null;
  onDelete:      (id: string) => void;
  onUpdate:      (id: string, text: string) => void;
}) {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const isOwn = currentUserId && String(comment.user_id) === String(currentUserId);
  const username = comment.username || comment.user?.username || t.newsDetail.defaultUser;
  const letter = (username[0] || 'U').toUpperCase();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text || '');

  return (
    <View style={styles.cmItem}>
      {/* Avatar */}
      <View style={styles.cmAvatar}>
        <Text style={styles.cmAvatarLetter}>{letter}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.cmHeader}>
          <Text style={[styles.cmUsername, { color: theme.text }]}>{username}</Text>
          <View style={styles.cmMeta}>
            <Text style={styles.cmTime}>{formatRelative(comment.created_at, t)}</Text>
            {isOwn && !editing && (
              <>
                <TouchableOpacity onPress={() => setEditing(true)} style={styles.cmAction}>
                  <Icon name="pencil-outline" size={14} color={theme.text3} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert(t.newsDetail.deleteCommentTitle, t.newsDetail.deleteCommentConfirm, [
                    { text: t.common.cancel, style: 'cancel' },
                    { text: t.newsDetail.deleteCommentTitle, style: 'destructive', onPress: () => onDelete(String(comment.id || comment._id)) },
                  ])}
                  style={styles.cmAction}
                >
                  <Icon name="trash-outline" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {editing ? (
          <View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              style={[styles.cmEditInput, { color: theme.text, borderColor: COLORS.primary, backgroundColor: theme.bg3 }]}
              autoFocus
            />
            <View style={styles.cmEditBtns}>
              <TouchableOpacity onPress={() => { setEditing(false); setEditText(comment.text); }} style={[styles.cmEditBtn, { backgroundColor: theme.bg3 }]}>
                <Text style={{ color: theme.text3, fontSize: FONT_SIZE.sm }}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { if (editText.trim()) { onUpdate(String(comment.id || comment._id), editText.trim()); setEditing(false); } }}
                style={[styles.cmEditBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={{ color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold }}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.cmText, { color: theme.text2 }]}>{comment.text}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Modal commentaires ───────────────────────────────────────────────────────

function CommentsModal({
  visible, newsId, allowComments, commentCount, onCountChange, onClose,
}: {
  visible:        boolean;
  newsId:         string;
  allowComments:  boolean;
  commentCount:   number;
  onCountChange:  (n: number) => void;
  onClose:        () => void;
}) {
  const { theme }           = useTheme();
  const { t }               = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const qc                  = useQueryClient();
  const [inputText, setInputText] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue:         1,
        useNativeDriver: true,
        tension:         65,
        friction:        11,
      }).start();
    }
  }, [visible]);

  const { data: comments = [], isLoading } = useQuery({
    queryKey:  ['comments', CONTENT_TYPE, newsId],
    queryFn:   () => api.getComments(CONTENT_TYPE, newsId),
    enabled:   visible,
  });

  useEffect(() => {
    if (comments.length !== commentCount) onCountChange(comments.length);
  }, [comments]);

  const addMut = useMutation({
    mutationFn: (text: string) => api.addComment(CONTENT_TYPE, newsId, text),
    onSuccess:  () => {
      setInputText('');
      qc.invalidateQueries({ queryKey: ['comments', CONTENT_TYPE, newsId] });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.deleteComment(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['comments', CONTENT_TYPE, newsId] }),
  });

  const updMut = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => api.updateComment(id, text),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['comments', CONTENT_TYPE, newsId] }),
  });

  const translateY = slideAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [600, 0],
  });

  if (!visible) return null;

  return (
    <View style={styles.modalBackdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[styles.modalSheet, { backgroundColor: theme.bg, transform: [{ translateY }] }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {t.newsDetail.commentsTitle} ({commentCount})
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Liste */}
        {isLoading ? (
          <View style={styles.cmCenter}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={c => String(c.id || c._id)}
            renderItem={({ item }) => (
              <CommentItem
                comment={item}
                currentUserId={user?.id}
                onDelete={id => delMut.mutate(id)}
                onUpdate={(id, text) => updMut.mutate({ id, text })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.cmCenter}>
                <Icon name="chatbubbles-outline" size={40} color={theme.text3} />
                <Text style={[styles.cmEmpty, { color: theme.text3 }]}>{t.newsDetail.commentsEmpty}</Text>
              </View>
            }
            contentContainerStyle={{ padding: SPACING.lg, flexGrow: 1 }}
          />
        )}

        {/* Input ou invite connexion */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {isAuthenticated ? (
            <View style={[styles.cmInputRow, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={t.newsDetail.addCommentPlaceholder}
                placeholderTextColor={theme.text3}
                multiline
                maxLength={1000}
                style={[styles.cmInput, { color: theme.text, backgroundColor: theme.bg3 }]}
                onSubmitEditing={() => { if (inputText.trim()) addMut.mutate(inputText.trim()); }}
              />
              <TouchableOpacity
                onPress={() => { if (inputText.trim()) addMut.mutate(inputText.trim()); }}
                style={[styles.cmSendBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
                disabled={!inputText.trim() || addMut.isPending}
              >
                {addMut.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Icon name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cmLoginBtn}
              onPress={() => { onClose(); setTimeout(() => showLoginModal(t.newsDetail.loginToComment), 350); }}
            >
              <Text style={styles.cmLoginText}>{t.newsDetail.loginToComment}</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function NewsDetailScreen() {
  const { theme, isDark }        = useTheme();
  const { t }                    = useTranslation();
  const navigation               = useNavigation<Nav>();
  const route                    = useRoute<Route>();
  const insets                   = useSafeAreaInsets();
  const { isAuthenticated }      = useAuthStore();
  const { showLoginModal } = useUiStore();
  const qc                       = useQueryClient();
  const newsId                   = String(route.params.id);

  const [descExpanded,    setDescExpanded]    = useState(false);
  const [descOverflows,   setDescOverflows]   = useState(false);
  const [commentsOpen,    setCommentsOpen]    = useState(false);
  const [commentCount,    setCommentCount]    = useState(0);
  const [liked,           setLiked]           = useState(false);
  const [likesCount,      setLikesCount]      = useState(0);
  const [favorited,       setFavorited]       = useState(false);
  const [likeLoading,     setLikeLoading]     = useState(false);
  const [favLoading,      setFavLoading]      = useState(false);

  // ── Chargement principal ──────────────────────────────────────────────────
  const { data: news, isLoading } = useQuery({
    queryKey: ['news', newsId],
    queryFn:  () => api.getNewsById(newsId as any),
  });

  const { data: related = [] } = useQuery({
    queryKey: ['news-related', newsId],
    queryFn:  () => api.getRelatedByType('news', newsId),
    enabled:  !!news,
  });

  // ── Init likes/favs/comments en parallèle ─────────────────────────────────
  useEffect(() => {
    if (!news) return;
    api.getLikesCount(CONTENT_TYPE, newsId).then(n => setLikesCount(n ?? 0)).catch(() => {});
    api.getComments(CONTENT_TYPE, newsId).then(c => setCommentCount(c?.length ?? 0)).catch(() => {});
    if (isAuthenticated) {
      api.checkLiked(CONTENT_TYPE, newsId).then(v => setLiked(!!v)).catch(() => {});
      api.checkFavorite(CONTENT_TYPE, newsId).then(v => setFavorited(!!v)).catch(() => {});
    }
  }, [news, isAuthenticated]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      showLoginModal(t.newsDetail.loginToLike);
      return;
    }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res  = await api.toggleLike(CONTENT_TYPE, newsId);
      const next = res?.liked ?? !liked;
      setLiked(next);
      setLikesCount(c => next ? c + 1 : Math.max(0, c - 1));
    } catch {
    } finally {
      setLikeLoading(false);
    }
  }, [isAuthenticated, liked, likeLoading, newsId]);

  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      showLoginModal(t.newsDetail.loginToSave);
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (favorited) {
        await api.removeFavorite(CONTENT_TYPE, newsId);
        setFavorited(false);
      } else {
        await api.addFavorite(CONTENT_TYPE, newsId);
        setFavorited(true);
      }
    } catch {
    } finally {
      setFavLoading(false);
    }
  }, [isAuthenticated, favorited, favLoading, newsId]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title:   news?.title ?? t.newsDetail.flashInfoCategory,
        message: `${news?.title ?? ''}\n\n${t.newsDetail.shareAppMsg}`,
      });
    } catch {}
  }, [news]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !news) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const img    = news.image_url || news.thumbnail || news.image || null;
  const cat    = news.category || news.edition || t.newsDetail.flashInfoCategory;
  const desc   = news.content || news.body || news.description || '';
  const allowCm = news.allow_comments !== false;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero ── */}
        <View style={styles.heroWrapper}>
          <ImageWithSkeleton uri={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Badge Flash Info */}
          <View style={[styles.flashBadge, { top: insets.top + 50 }]}>
            <Icon name="flash" size={10} color="#fff" />
            <Text style={styles.flashBadgeText}>{t.newsDetail.flashBadge}</Text>
          </View>
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <Icon name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Catégorie */}
          <View style={styles.catBadge}>
            <View style={styles.catBar} />
            <Text style={styles.catText}>{cat.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Contenu ── */}
        <View style={[styles.content, { backgroundColor: theme.bg }]}>

          {/* Date */}
          <Text style={[styles.date, { color: theme.text3 }]}>
            {formatFullDate(news.created_at ?? news.published_at)}
          </Text>

          {/* Titre */}
          <Text style={[styles.title, { color: theme.text }]}>{news.title}</Text>

          {/* Auteur */}
          {news.author ? (
            <View style={styles.authorRow}>
              <Icon name="person-circle-outline" size={18} color={theme.text3} />
              <Text style={[styles.authorText, { color: theme.text3 }]}>{t.newsDetail.byAuthor} {news.author}</Text>
            </View>
          ) : null}

          {/* ── Barre interactions : Like / Commentaires / Favori ── */}
          <View style={[styles.actionBar, { borderBottomColor: theme.border }]}>
            {/* Like */}
            <TouchableOpacity
              onPress={handleLike}
              disabled={likeLoading}
              style={[styles.actionBtn, liked && styles.actionBtnActive]}
            >
              <Icon name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#fff' : theme.text2} />
              <Text style={[styles.actionBtnText, { color: liked ? '#fff' : theme.text2 }]}>
                {likesCount > 0 ? likesCount : ''} {liked ? t.newsDetail.liked : t.newsDetail.like}
              </Text>
            </TouchableOpacity>

            {/* Commentaires */}
            <TouchableOpacity
              onPress={() => {
                if (!allowCm) return;
                setCommentsOpen(true);
              }}
              style={[styles.actionBtn, { opacity: allowCm ? 1 : 0.45 }]}
            >
              <Icon name={allowCm ? 'chatbubble-outline' : 'chatbubble-ellipses-outline'} size={16} color={theme.text2} />
              <Text style={[styles.actionBtnText, { color: theme.text2 }]}>
                {commentCount > 0 ? commentCount : ''} {commentCount === 1 ? t.newsDetail.comment_one : t.newsDetail.comment_other}
              </Text>
            </TouchableOpacity>

            {/* Favori */}
            <TouchableOpacity
              onPress={handleFavorite}
              disabled={favLoading}
              style={[styles.actionBtn, favorited && styles.actionBtnFav]}
            >
              <Icon name={favorited ? 'bookmark' : 'bookmark-outline'} size={16} color={favorited ? '#fff' : theme.text2} />
            </TouchableOpacity>
          </View>

          {/* ── Description / texte ── */}
          {desc ? (
            <View style={styles.descBlock}>
              <Text
                style={[styles.body, { color: theme.text2 }]}
                numberOfLines={descExpanded ? undefined : 6}
                onTextLayout={e => {
                  if (!descExpanded) setDescOverflows(e.nativeEvent.lines.length >= 6);
                }}
              >
                {desc}
              </Text>
              {descOverflows && (
                <TouchableOpacity onPress={() => setDescExpanded(v => !v)} style={styles.readMoreBtn}>
                  <Text style={styles.readMoreText}>
                    {descExpanded ? t.newsDetail.readLess : t.newsDetail.readMore}
                  </Text>
                  <Icon name={descExpanded ? 'chevron-up' : 'chevron-down'} size={13} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Édition */}
          {news.edition ? (
            <View style={styles.editionRow}>
              <Icon name="newspaper-outline" size={16} color={theme.text3} />
              <Text style={[styles.editionText, { color: theme.text3 }]}>{t.newsDetail.edition} : {news.edition}</Text>
            </View>
          ) : null}

          {/* ── Partager ── */}
          <View style={styles.shareBlock}>
            <Text style={[styles.shareLabel, { color: theme.text3 }]}>{t.newsDetail.shareLabel}</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Icon name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>{t.newsDetail.share}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Articles liés ── */}
          {related.length > 0 && (
            <View style={styles.relatedBlock}>
              <View style={styles.relatedHeader}>
                <Icon name="flash" size={16} color={COLORS.primary} />
                <Text style={[styles.relatedTitle, { color: theme.text }]}>
                  {t.newsDetail.relatedTitle} ({related.length})
                </Text>
              </View>
              {(related as any[]).map((item: any) => (
                <TouchableOpacity
                  key={String(item.id || item._id)}
                  style={[styles.relatedItem, { backgroundColor: theme.bg2 }]}
                  onPress={() => navigation.push('NewsDetail', { id: item.id || item._id })}
                >
                  <View style={styles.relatedThumb}>
                    <ImageWithSkeleton
                      uri={item.image_url || item.thumbnail || item.image}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.relatedInfo}>
                    <Text style={[styles.relatedItemTitle, { color: theme.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.relatedMeta, { color: theme.text3 }]}>
                      {formatRelative(item.created_at, t)}
                      {item.category ? ` · ${item.category}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: insets.bottom + SPACING.xl }} />
        </View>
      </ScrollView>

      {/* ── Modal commentaires ── */}
      <CommentsModal
        visible={commentsOpen}
        newsId={newsId}
        allowComments={allowCm}
        commentCount={commentCount}
        onCountChange={setCommentCount}
        onClose={() => setCommentsOpen(false)}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroWrapper: {
    width:           '100%',
    height:          260,
    backgroundColor: '#111',
    position:        'relative',
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
  },
  flashBadge: {
    position:          'absolute',
    left:              SPACING.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   'rgba(226,62,62,0.9)',
    paddingHorizontal: 9,
    paddingVertical:   3,
    borderRadius:      RADIUS.sm,
  },
  flashBadgeText: {
    color:       '#fff',
    fontSize:    FONT_SIZE.xxs,
    fontWeight:  FONT_WEIGHT.bold,
    letterSpacing: 0.5,
  },
  catBadge: {
    position:      'absolute',
    bottom:        SPACING.md,
    left:          SPACING.lg,
    flexDirection: 'row',
    alignItems:    'center',
  },
  catBar: {
    width:           3,
    height:          18,
    borderRadius:    2,
    backgroundColor: COLORS.primary,
  },
  catText: {
    backgroundColor:   'rgba(0,0,0,0.75)',
    color:             '#fff',
    fontSize:          FONT_SIZE.xs,
    fontWeight:        FONT_WEIGHT.bold,
    paddingHorizontal: 7,
    paddingVertical:   3,
    letterSpacing:     0.5,
  },

  // Content
  content: {
    padding: SPACING.lg,
  },
  date: {
    fontSize:     FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize:     FONT_SIZE.xl,
    fontWeight:   FONT_WEIGHT.bold,
    lineHeight:   28,
    marginBottom: SPACING.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  SPACING.md,
  },
  authorText: {
    fontSize: FONT_SIZE.sm,
  },

  // Action bar
  actionBar: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    marginBottom:   SPACING.lg,
    paddingBottom:  SPACING.lg,
    borderBottomWidth: 1,
  },
  actionBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      RADIUS.full,
  },
  actionBtnActive: {
    backgroundColor: COLORS.primary,
  },
  actionBtnFav: {
    backgroundColor: '#F59E0B',
  },
  actionBtnText: {
    fontSize:   FONT_SIZE.sm,
  },

  // Description
  descBlock: {
    marginBottom: SPACING.lg,
  },
  body: {
    fontSize:  FONT_SIZE.base,
    lineHeight: 26,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     SPACING.sm,
  },
  readMoreText: {
    color:      COLORS.primary,
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // Edition
  editionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  SPACING.lg,
  },
  editionText: {
    fontSize: FONT_SIZE.sm,
  },

  // Share
  shareBlock: {
    marginBottom: SPACING.xl,
  },
  shareLabel: {
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.6,
    marginBottom:  SPACING.sm,
  },
  shareBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   '#333',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderRadius:      RADIUS.md,
    alignSelf:         'flex-start',
  },
  shareBtnText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // Related
  relatedBlock: {
    marginBottom: SPACING.xl,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  SPACING.md,
  },
  relatedTitle: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  relatedItem: {
    flexDirection: 'row',
    borderRadius:  RADIUS.md,
    overflow:      'hidden',
    marginBottom:  SPACING.md,
  },
  relatedThumb: {
    width:    110,
    height:   80,
    flexShrink: 0,
    position: 'relative',
    backgroundColor: '#222',
  },
  relatedInfo: {
    flex:    1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  relatedItemTitle: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 18,
  },
  relatedMeta: {
    fontSize: FONT_SIZE.xs,
  },

  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'flex-end',
    zIndex:          999,
  },
  modalSheet: {
    height:              '80%',
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow:             'hidden',
  },
  modalHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        SPACING.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Comments
  cmItem: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  SPACING.lg,
  },
  cmAvatar: {
    flexShrink:      0,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cmAvatarLetter: {
    color:      '#fff',
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  cmHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   4,
  },
  cmUsername: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cmMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  cmTime: {
    fontSize: FONT_SIZE.xs,
    color:    '#555',
  },
  cmAction: {
    padding: 2,
  },
  cmText: {
    fontSize:   FONT_SIZE.sm,
    lineHeight: 20,
  },
  cmEditInput: {
    borderWidth:  1,
    borderRadius: RADIUS.sm,
    padding:      SPACING.sm,
    fontSize:     FONT_SIZE.sm,
    minHeight:    60,
    marginTop:    SPACING.xs,
  },
  cmEditBtns: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            SPACING.sm,
    marginTop:      SPACING.sm,
  },
  cmEditBtn: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      RADIUS.sm,
  },
  cmEmpty: {
    fontSize:   FONT_SIZE.sm,
    marginTop:  SPACING.md,
    textAlign:  'center',
  },
  cmCenter: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        SPACING.xl,
  },
  cmInputRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:            SPACING.sm,
    padding:        SPACING.md,
    borderTopWidth: 1,
  },
  cmInput: {
    flex:          1,
    borderRadius:  RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    fontSize:      FONT_SIZE.sm,
    maxHeight:     100,
  },
  cmSendBtn: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: COLORS.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cmLoginBtn: {
    margin:          SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius:    RADIUS.md,
    padding:         SPACING.md,
    alignItems:      'center',
  },
  cmLoginText: {
    color:      '#fff',
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
