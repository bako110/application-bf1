import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { useLoginNavigation } from '../hooks/useLoginNavigation';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import { formatTimeAgo } from '../utils';

// ─── État invité ──────────────────────────────────────────────────────────────

function GuestView({ theme, isDark }: { theme: any; isDark: boolean }) {
  const { t } = useTranslation();
  const navigateToLogin = useLoginNavigation();
  const [accepted, setAccepted] = useState(false);
  const bellAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bellAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(bellAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bellAnim]);

  // Interpolation cloche : 0-1 → rotation degrees matching CSS keyframes
  const rotate = bellAnim.interpolate({
    inputRange: [0, 0.15, 0.30, 0.45, 0.60, 0.75, 1],
    outputRange: ['0deg', '14deg', '-12deg', '8deg', '-6deg', '3deg', '0deg'],
  });

  const WHAT_YOU_GET = [
    { icon: 'newspaper',   text: t.notifications.news },
    { icon: 'radio',       text: t.notifications.liveAlerts },
    { icon: 'star',        text: t.notifications.exclusive },
    { icon: 'chatbubbles', text: t.notifications.replies },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Carte principale */}
      <View style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border, margin: SPACING.lg }]}>

        {/* Illustration */}
        <View style={[styles.guestIllustration, { borderBottomColor: theme.divider }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon name="notifications" size={52} color={COLORS.primary} />
          </Animated.View>
          <Text style={[styles.guestHeadline, { color: theme.text }]}>{t.notifications.stayInformed}</Text>
          <Text style={[styles.guestSubHeadline, { color: theme.text3 }]}>{t.notifications.stayInformedSub}</Text>
        </View>

        {/* Ce que vous recevrez */}
        <View style={styles.guestFeatures}>
          <Text style={[styles.guestFeaturesTitle, { color: theme.text3 }]}>{t.notifications.whatYouGet}</Text>
          {WHAT_YOU_GET.map(item => (
            <View key={item.icon} style={styles.guestFeatureRow}>
              <View style={[styles.guestFeatureIcon, { backgroundColor: COLORS.redAlpha12 }]}>
                <Icon name={item.icon} size={15} color={COLORS.primary} />
              </View>
              <Text style={[styles.guestFeatureText, { color: theme.text2 }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Conditions */}
        <View style={[styles.guestCheckWrap, { backgroundColor: theme.bg, borderColor: theme.border, margin: SPACING.md }]}>
          <TouchableOpacity
            style={styles.guestCheckRow}
            onPress={() => setAccepted(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              { borderColor: accepted ? COLORS.primary : theme.border },
              accepted && { backgroundColor: COLORS.primary },
            ]}>
              {accepted && <Icon name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={[styles.guestCheckText, { color: theme.text3 }]}>
              {t.notifications.acceptTerms}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton connexion */}
        <View style={{ padding: SPACING.md, paddingTop: 0 }}>
          <TouchableOpacity
            style={[
              styles.connectBtn,
              {
                backgroundColor: accepted ? COLORS.primary : theme.surface,
                borderColor:     accepted ? COLORS.primary : theme.border,
              },
            ]}
            onPress={() => {
              if (!accepted) return;
              navigateToLogin();
            }}
            activeOpacity={accepted ? 0.85 : 1}
          >
            <Icon name="log-in-outline" size={18} color={accepted ? '#fff' : theme.text3} />
            <Text style={[styles.connectBtnText, { color: accepted ? '#fff' : theme.text3 }]}>
              {t.notifications.loginRequired}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.registerHint, { color: theme.text3 }]}>
            {t.notifications.noAccount}{' '}
            <Text
              style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}
              onPress={() => navigateToLogin()}
            >
              {t.notifications.register}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const { theme, isDark }   = useTheme();
  const { t }               = useTranslation();
  const navigation          = useNavigation();
  const insets              = useSafeAreaInsets();
  const qc                  = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn:  api.getNotifications,
    enabled:  isAuthenticated,
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any[]) =>
        (old ?? []).map(n => String(n.id ?? n._id) === id ? { ...n, is_read: true } : n)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(['notifications'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any[]) =>
        (old ?? []).filter(n => String(n.id ?? n._id) !== id)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(['notifications'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: api.markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], (old: any[]) =>
        (old ?? []).map(n => ({ ...n, is_read: true }))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['notifications'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: api.deleteAllNotifications,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const prev = qc.getQueryData(['notifications']);
      qc.setQueryData(['notifications'], []);
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['notifications'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleDeleteAll = () => {
    Alert.alert(t.notifications.deleteAllConfirmTitle, t.notifications.deleteAllConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => deleteAllMutation.mutate() },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{t.notifications.title}</Text>
          {isAuthenticated && unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Icon name="notifications" size={22} color={COLORS.primary} />
      </View>

      {/* État invité */}
      {!isAuthenticated ? (
        <GuestView theme={theme} isDark={isDark} />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications as any[]}
          keyExtractor={item => String(item.id ?? item._id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            (notifications as any[]).length > 0 ? (
              <View style={[styles.actionsBar, { backgroundColor: theme.bg, borderBottomColor: theme.divider }]}>
                <TouchableOpacity
                  onPress={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending || unreadCount === 0}
                  style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Icon name="checkmark-done" size={14} color={unreadCount > 0 ? COLORS.info : theme.text3} />
                  <Text style={[styles.actionText, { color: unreadCount > 0 ? COLORS.info : theme.text3 }]}>
                    {t.notifications.markAllRead}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAll}
                  disabled={deleteAllMutation.isPending}
                  style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Icon name="trash-outline" size={14} color={COLORS.error} />
                  <Text style={[styles.actionText, { color: COLORS.error }]}>{t.notifications.deleteAll}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="notifications-off-outline" size={52} color={theme.text3} />
              <Text style={[styles.emptyTitle, { color: theme.text2 }]}>{t.notifications.empty}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.text3 }]}>{t.notifications.emptyHint}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = !item.is_read;
            const id = String(item.id ?? item._id);
            return (
              <TouchableOpacity
                onPress={() => {
                  if (isUnread) markReadMutation.mutate(id);
                  // Navigation vers le contenu lié
                  const contentId   = String(item.content_id ?? item.related_id ?? '');
                  const contentType = item.content_type ?? item.related_type ?? item.type ?? '';
                  if (contentId) {
                    if (contentType === 'news') {
                      (navigation as any).navigate('NewsDetail', { id: contentId });
                    } else {
                      (navigation as any).navigate('ShowDetail', { id: contentId, type: contentType });
                    }
                  }
                }}
                style={[
                  styles.notifItem,
                  {
                    backgroundColor:  isUnread ? 'rgba(226,62,62,0.07)' : theme.bg,
                    borderBottomColor: theme.divider,
                  },
                ]}
                activeOpacity={0.7}
              >
                {/* Icône */}
                <View style={[
                  styles.notifIcon,
                  { backgroundColor: isUnread ? COLORS.primary : theme.surface },
                ]}>
                  <Icon
                    name={isUnread ? 'notifications' : 'notifications-outline'}
                    size={18}
                    color={isUnread ? '#fff' : theme.text3}
                  />
                </View>

                {/* Contenu */}
                <View style={styles.notifContent}>
                  <View style={styles.notifTop}>
                    <Text
                      style={[
                        styles.notifTitle,
                        {
                          color:      isUnread ? theme.text : theme.text2,
                          fontWeight: isUnread ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.notifTime, { color: theme.text3 }]}>
                      {formatTimeAgo(item.created_at)}
                    </Text>
                  </View>
                  {item.message || item.body ? (
                    <Text style={[styles.notifBody, { color: theme.text2 }]} numberOfLines={2}>
                      {item.message ?? item.body}
                    </Text>
                  ) : null}
                </View>

                {/* Bouton supprimer */}
                <TouchableOpacity
                  onPress={() => deleteMutation.mutate(id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Icon name="close" size={16} color={theme.text3} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     12,
    borderBottomWidth: 1,
    minHeight:         56,
    gap:               SPACING.sm,
  },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle:    { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  unreadBadge: {
    backgroundColor:   COLORS.primary,
    borderRadius:      10,
    paddingHorizontal: 6,
    paddingVertical:   2,
    minWidth:          20,
    alignItems:        'center',
  },
  unreadBadgeText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  // Guest
  guestCard: {
    borderRadius: RADIUS.xl,
    borderWidth:  1,
    overflow:     'hidden',
  },
  guestIllustration: {
    alignItems:        'center',
    paddingVertical:   SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    gap:               SPACING.sm,
    backgroundColor:   'rgba(226,62,62,0.04)',
  },
  guestHeadline:    { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.md },
  guestSubHeadline: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  guestFeatures: {
    padding:       SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  guestFeaturesTitle: {
    fontSize:     FONT_SIZE.xs,
    fontWeight:   FONT_WEIGHT.bold,
    letterSpacing: 0.7,
    marginBottom:  SPACING.md,
  },
  guestFeatureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
    marginBottom:  SPACING.sm,
  },
  guestFeatureIcon: {
    width:          34,
    height:         34,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  guestFeatureText: { fontSize: FONT_SIZE.sm },
  guestCheckWrap: {
    borderRadius:  RADIUS.lg,
    borderWidth:   1,
    padding:       SPACING.md,
  },
  guestCheckRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           SPACING.md,
  },
  checkbox: {
    width:          18,
    height:         18,
    borderRadius:   4,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      2,
  },
  guestCheckText: { flex: 1, fontSize: FONT_SIZE.xs, lineHeight: 18 },
  connectBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.sm,
    borderRadius:   RADIUS.xl,
    borderWidth:    1,
    paddingVertical: 14,
    marginBottom:   SPACING.md,
  },
  connectBtnText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  registerHint: { textAlign: 'center', fontSize: FONT_SIZE.xs },

  // Actions bar
  actionsBar: {
    flexDirection:     'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.sm,
    gap:               SPACING.md,
    borderBottomWidth: 0.5,
  },
  actionBtn:  {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderWidth:       1,
    borderRadius:      RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical:   7,
  },
  actionText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  // List
  notifItem: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    padding:           SPACING.lg,
    gap:               SPACING.md,
    borderBottomWidth: 0.5,
  },
  notifIcon: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  notifContent: { flex: 1, minWidth: 0 },
  notifTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            8,
    marginBottom:   4,
  },
  notifTitle: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 18 },
  notifTime:  { flexShrink: 0, fontSize: FONT_SIZE.xs },
  notifBody:  { fontSize: FONT_SIZE.sm, lineHeight: 18 },
  deleteBtn:  { padding: 4, alignSelf: 'center', flexShrink: 0 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:  { alignItems: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTitle:    { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  emptySubtitle: { fontSize: FONT_SIZE.sm },
});
