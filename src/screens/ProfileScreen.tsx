import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, Alert, Modal, TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import {
  launchImageLibrary,
  launchCamera,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import * as api from '../services/api';
import { PremiumModal } from '../components/profile/PremiumModal';
import type { ProfileStackParams } from '../navigation/types';

type Nav = StackNavigationProp<ProfileStackParams, 'Profile'>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function subBadgeStyle(cat?: string) {
  if (cat === 'premium')  return { bg: 'rgba(255,111,0,0.15)',  text: '#FF6F00', icon: 'star'          as const };
  if (cat === 'standard') return { bg: 'rgba(156,39,176,0.15)', text: '#9C27B0', icon: 'star-half'     as const };
  if (cat === 'basic')    return { bg: 'rgba(33,150,243,0.15)', text: '#2196F3', icon: 'star-outline'  as const };
  return                         { bg: 'rgba(52,199,89,0.15)',  text: '#34C759', icon: 'gift-outline'  as const };
}

function fmtDate(d?: string | null, lang = 'fr') {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtOffer(o?: string | null, t?: any) {
  if (!t) return o ?? 'Premium';
  return ({ monthly: t.profile.offerMonthly, quarterly: t.profile.offerQuarterly, yearly: t.profile.offerYearly } as any)[o ?? ''] ?? o ?? 'Premium';
}

function fmtPrice(n?: number | null) {
  if (!n) return null;
  return n.toLocaleString('fr-FR') + ' XOF';
}

// ─── Bandeau de feedback (succès / erreur, auto-dismiss) ──────────────────────

type Feedback = { kind: 'success' | 'error'; message: string } | null;

function FeedbackBanner({ feedback, onHide }: { feedback: Feedback; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (feedback) {
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current && clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
          if (finished) onHide();
        });
      }, 2600);
    }
    return () => { timer.current && clearTimeout(timer.current); };
  }, [feedback]);

  if (!feedback) return null;
  const ok  = feedback.kind === 'success';
  const bg  = ok ? 'rgba(52,199,89,0.14)'  : 'rgba(255,59,48,0.14)';
  const bd  = ok ? 'rgba(52,199,89,0.45)'  : 'rgba(255,59,48,0.45)';
  const fg  = ok ? COLORS.success : COLORS.error;
  const ico = ok ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg, borderColor: bd, opacity }]}>
      <Icon name={ico as any} size={16} color={fg} />
      <Text style={[styles.bannerText, { color: fg }]} numberOfLines={2}>{feedback.message}</Text>
    </Animated.View>
  );
}

// ─── Petits blocs ────────────────────────────────────────────────────────────

function SectionLabel({ children, theme }: { children: string; theme: any }) {
  return <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{children.toUpperCase()}</Text>;
}

function InfoRow({
  label, value, onPress, theme, last = false,
}: { label: string; value: string; onPress?: () => void; theme: any; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.infoRow, { borderBottomColor: theme.border }, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.infoLabel, { color: theme.text3 }]}>{label}</Text>
      <View style={styles.infoRight}>
        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
        {onPress && <Icon name="chevron-forward" size={15} color={theme.text3} />}
      </View>
    </TouchableOpacity>
  );
}

function SubRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={[styles.subRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.subRowLabel, { color: theme.text3 }]}>{label}</Text>
      <Text style={[styles.subRowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function MenuItem({
  icon, iconColor = COLORS.primary, label, onPress, theme, last = false,
}: {
  icon: string; iconColor?: string; label: string;
  onPress: () => void; theme: any; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.border }, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Icon name={icon as any} size={19} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <Icon name="chevron-forward" size={16} color={theme.text3} />
    </TouchableOpacity>
  );
}

function SkeletonLine({ w, theme }: { w: number | string; theme: any }) {
  return <View style={[styles.skelLine, { width: w as any, backgroundColor: theme.skeletonBg ?? theme.border }]} />;
}

// ─── Modal texte générique ────────────────────────────────────────────────────
function EditModal({
  visible, onClose, title, value, onChange, onSave,
  loading, error, placeholder, keyboardType, autoCapitalize,
  theme, cancelLabel, saveLabel,
}: {
  visible: boolean; onClose: () => void;
  title: string; value: string; onChange: (v: string) => void;
  onSave: () => void; loading: boolean; error: string;
  placeholder: string; keyboardType?: any; autoCapitalize?: any;
  theme: any; cancelLabel?: string; saveLabel?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.bg, borderColor: error ? COLORS.error : theme.border, color: theme.text }]}
            value={value}
            onChangeText={v => onChange(v)}
            placeholder={placeholder}
            placeholderTextColor={theme.text3}
            keyboardType={keyboardType ?? 'default'}
            autoCapitalize={autoCapitalize ?? 'none'}
            autoFocus
          />
          {!!error && <Text style={styles.modalErr}>{error}</Text>}
          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: theme.border }]} onPress={onClose} disabled={loading}>
              <Text style={{ color: theme.text2, fontSize: FONT_SIZE.sm }}>{cancelLabel ?? 'Annuler'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: COLORS.primary }]} onPress={onSave} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold }}>{saveLabel ?? 'Enregistrer'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { t, lang }  = useTranslation();
  const navigation   = useNavigation<Nav>();
  const insets       = useSafeAreaInsets();
  const { user, isAuthenticated, loading: authLoading, logout, setUser } = useAuthStore() as any;

  // Feedback centralisé (bandeau inline)
  const [feedback, setFeedback] = useState<Feedback>(null);
  const notifySuccess = useCallback((m: string) => setFeedback({ kind: 'success', message: m }), []);
  const notifyError   = useCallback((m: string) => setFeedback({ kind: 'error',   message: m }), []);

  // Édition username
  const [usernameOpen,    setUsernameOpen]    = useState(false);
  const [newUsername,     setNewUsername]     = useState('');
  const [usernameError,   setUsernameError]   = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Édition email
  const [emailOpen,    setEmailOpen]    = useState(false);
  const [newEmail,     setNewEmail]     = useState('');
  const [emailError,   setEmailError]   = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Avatar upload
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [localAvatar,   setLocalAvatar]   = useState<string | null>(null);

  // PremiumModal
  const [premiumOpen, setPremiumOpen] = useState(false);

  // Abonnement — 3 états explicites (loading / error / data)
  const {
    data: subData,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSub,
  } = useQuery({
    queryKey:  ['my-subscription'],
    queryFn:   api.getMySubscription,
    enabled:   isAuthenticated,
    staleTime: 5 * 60_000,
    retry:     1,
  });
  const subscription: any = Array.isArray(subData)
    ? (subData.find((s: any) => s.is_active) ?? subData[0] ?? null)
    : (subData ?? null);

  const badge     = subBadgeStyle(user?.subscription_category ?? user?.subscription);
  const isPremium = user?.is_premium || user?.subscription_category === 'premium' || user?.subscription === 'premium';
  const avatarUri = localAvatar || user?.avatar_url || user?.avatar || null;

  // ── Avatar ────────────────────────────────────────────────────────────────
  const pickAvatarFromResponse = useCallback(async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorCode) return;
    const asset = response.assets?.[0];
    if (!asset?.uri) return;
    setAvatarLoading(true);
    try {
      const base64 = asset.base64 ? `data:${asset.type};base64,${asset.base64}` : null;
      const payload = base64 ? { avatar: base64 } : { avatar_url: asset.uri };
      const updated = await api.updateProfile(payload);
      const newUri  = base64 ?? asset.uri;
      setLocalAvatar(newUri);
      if (setUser) setUser({ ...user, ...(updated ?? {}), avatar_url: newUri });
      notifySuccess(t.profile.avatarSaved);
    } catch {
      notifyError(t.profile.avatarError);
    } finally {
      setAvatarLoading(false);
    }
  }, [user, setUser, notifySuccess, notifyError, t]);

  const handleAvatarPress = useCallback(() => {
    Alert.alert(t.profile.photoTitle, '', [
      {
        text: t.profile.takePhoto,
        onPress: () =>
          launchCamera({ mediaType: 'photo', quality: 0.7, includeBase64: true }, pickAvatarFromResponse),
      },
      {
        text: t.profile.chooseGallery,
        onPress: () =>
          launchImageLibrary({ mediaType: 'photo', quality: 0.7, includeBase64: true }, pickAvatarFromResponse),
      },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  }, [pickAvatarFromResponse, t]);

  // ── Username ──────────────────────────────────────────────────────────────
  const openUsernameEdit = useCallback(() => {
    setNewUsername(user?.username ?? '');
    setUsernameError('');
    setUsernameOpen(true);
  }, [user]);

  const saveUsername = useCallback(async () => {
    const v = newUsername.trim();
    if (!v || v.length < 3) { setUsernameError(t.profile.minChars); return; }
    if (v === user?.username) { setUsernameOpen(false); return; }
    setUsernameLoading(true);
    try {
      const updated = await api.updateProfile({ username: v });
      if (setUser) setUser({ ...user, ...(updated ?? { username: v }) });
      setUsernameOpen(false);
      notifySuccess(t.profile.usernameSaved);
    } catch { setUsernameError(t.profile.saveError); }
    finally  { setUsernameLoading(false); }
  }, [newUsername, user, setUser, notifySuccess, t]);

  // ── Email ─────────────────────────────────────────────────────────────────
  const openEmailEdit = useCallback(() => {
    setNewEmail(user?.email ?? '');
    setEmailError('');
    setEmailOpen(true);
  }, [user]);

  const saveEmail = useCallback(async () => {
    const v = newEmail.trim();
    if (!v || !v.includes('@')) { setEmailError(t.profile.invalidEmail); return; }
    if (v === user?.email) { setEmailOpen(false); return; }
    setEmailLoading(true);
    try {
      const updated = await api.updateProfile({ email: v });
      if (setUser) setUser({ ...user, ...(updated ?? { email: v }) });
      setEmailOpen(false);
      notifySuccess(t.profile.emailSaved);
    } catch { setEmailError(t.profile.saveError); }
    finally  { setEmailLoading(false); }
  }, [newEmail, user, setUser, notifySuccess, t]);

  // ── Déconnexion ───────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(t.profile.logoutConfirmTitle, t.profile.logoutConfirmMsg, [
      { text: t.common.cancel,         style: 'cancel' },
      {
        text: t.profile.logoutConfirm, style: 'destructive',
        onPress: async () => {
          await logout();
          setLocalAvatar(null);
        },
      },
    ]);
  }, [logout, t]);

  // ── État: initialisation auth en cours ───────────────────────────────────
  if (authLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = user?.username ?? user?.name ?? t.profile.userFallback;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>

        {/* En-tête simple */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 10, 28) }]}>
          <Text style={[styles.topTitle, { color: theme.text }]}>{t.profile.title}</Text>
        </View>

        <FeedbackBanner feedback={feedback} onHide={() => setFeedback(null)} />

        {isAuthenticated && user ? (
          <>
            {/* ── CARTE IDENTITÉ ────────────────────────────────────────── */}
            <View style={[styles.identityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.avatarWrap, { borderColor: theme.border, backgroundColor: theme.bg }]}
                onPress={handleAvatarPress}
                activeOpacity={0.85}
                disabled={avatarLoading}
              >
                {avatarLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <Icon name="person" size={40} color={theme.text3} />
                )}
                <View style={[styles.cameraBadge, { backgroundColor: COLORS.primary, borderColor: theme.surface }]}>
                  <Icon name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={[styles.identName, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
              {!!user.email && (
                <Text style={[styles.identEmail, { color: theme.text3 }]} numberOfLines={1}>{user.email}</Text>
              )}

              <View style={[styles.badgeWrap, { backgroundColor: badge.bg }]}>
                <Icon name={badge.icon as any} size={11} color={badge.text} />
                <Text style={[styles.badgeText, { color: badge.text }]}>
                  {isPremium ? t.subscription.premium : t.profile.free}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.editCta, { borderColor: theme.border }]}
                onPress={openUsernameEdit}
                activeOpacity={0.7}
              >
                <Icon name="create-outline" size={15} color={theme.text2} />
                <Text style={[styles.editCtaText, { color: theme.text2 }]}>{t.profile.editProfileCta}</Text>
              </TouchableOpacity>
            </View>

            {/* ── SECTION COMPTE ────────────────────────────────────────── */}
            <SectionLabel theme={theme}>{t.profile.sectionAccount}</SectionLabel>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0 }]}>
              <InfoRow label={t.profile.editUsername} value={displayName}          onPress={openUsernameEdit} theme={theme} />
              <InfoRow label={t.profile.editEmail}    value={user.email ?? '—'}    onPress={openEmailEdit}    theme={theme} last />
            </View>

            {/* ── SECTION ABONNEMENT ────────────────────────────────────── */}
            <SectionLabel theme={theme}>{t.profile.subscription}</SectionLabel>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Icon name={isPremium ? 'card' : 'star-outline'} size={17} color={COLORS.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {isPremium ? t.profile.mySubscription : t.profile.discoverPlans}
                </Text>
              </View>

              {subLoading ? (
                <View style={{ gap: 12, paddingVertical: 4 }}>
                  <SkeletonLine w="55%" theme={theme} />
                  <SkeletonLine w="80%" theme={theme} />
                  <SkeletonLine w="40%" theme={theme} />
                </View>
              ) : subError ? (
                <View style={styles.subErrorBox}>
                  <Icon name="cloud-offline-outline" size={20} color={theme.text3} />
                  <Text style={[styles.subErrorText, { color: theme.text3 }]}>{t.profile.subLoadError}</Text>
                  <TouchableOpacity style={[styles.retryBtn, { borderColor: theme.border }]} onPress={() => refetchSub()}>
                    <Icon name="refresh" size={14} color={COLORS.primary} />
                    <Text style={[styles.retryText, { color: COLORS.primary }]}>{t.profile.retry}</Text>
                  </TouchableOpacity>
                </View>
              ) : isPremium && subscription ? (
                <View>
                  {subscription.category && (
                    <View style={[styles.subBadgeRow, { backgroundColor: `${badge.text}18` }]}>
                      <Icon name={badge.icon as any} size={14} color={badge.text} />
                      <Text style={[styles.subBadgeLbl, { color: badge.text }]}>
                        {(t.subscription as any)[subscription.category] ?? subscription.category}
                      </Text>
                    </View>
                  )}
                  <SubRow label={t.profile.planLabel}  value={fmtOffer(subscription.offer, t)}         theme={theme} />
                  <SubRow label={t.profile.startDate}  value={fmtDate(subscription.start_date, lang)}  theme={theme} />
                  <SubRow label={t.profile.endDate}    value={subscription.end_date ? fmtDate(subscription.end_date, lang) : t.profile.unlimited} theme={theme} />
                  {fmtPrice(subscription.final_price) && (
                    <SubRow label={t.profile.pricePaid} value={fmtPrice(subscription.final_price)!} theme={theme} />
                  )}
                  <View style={[styles.subRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.subRowLabel, { color: theme.text3 }]}>{t.profile.status}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon
                        name={subscription.is_active ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={subscription.is_active ? COLORS.success : COLORS.error}
                      />
                      <Text style={{ color: subscription.is_active ? COLORS.success : COLORS.error, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                        {subscription.is_active ? t.profile.active : t.profile.expired}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.freeRow}>
                    <View style={[styles.freeBadge, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
                      <Icon name="gift-outline" size={12} color={COLORS.success} />
                      <Text style={[styles.freeBadgeText, { color: COLORS.success }]}>{t.profile.free}</Text>
                    </View>
                  </View>
                  <Text style={[styles.freeDesc, { color: theme.text3 }]}>{t.profile.freePlan}</Text>
                  {[
                    { ok: true,  label: t.profile.freeContent  },
                    { ok: false, label: t.profile.premiumAccess },
                    { ok: false, label: t.profile.hdQuality     },
                  ].map(row => (
                    <View key={row.label} style={styles.featureRow}>
                      <Icon name={row.ok ? 'checkmark-circle' : 'close-circle'} size={16} color={row.ok ? COLORS.success : theme.text3} />
                      <Text style={[styles.featureText, { color: row.ok ? theme.text : theme.text3 }]}>{row.label}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.premiumBtn} activeOpacity={0.85} onPress={() => setPremiumOpen(true)}>
                    <Icon name="arrow-up" size={14} color="#fff" />
                    <Text style={styles.premiumBtnText}>{t.profile.upgradePremium}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── SECTION PRÉFÉRENCES ───────────────────────────────────── */}
            <SectionLabel theme={theme}>{t.profile.sectionPrefs}</SectionLabel>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0 }]}>
              <MenuItem icon="heart-outline"              label={t.profile.menuFavorites} onPress={() => navigation.navigate('Favorites')}     theme={theme} />
              <MenuItem icon="notifications-outline"      label={t.profile.menuNotif}     onPress={() => navigation.navigate('Notifications')} theme={theme} />
              <MenuItem icon="settings-outline"          label={t.profile.menuSettings}  onPress={() => navigation.navigate('Settings')}      theme={theme} />
              <MenuItem icon="headset-outline"           label={t.profile.menuSupport}   onPress={() => navigation.navigate('Support')}       theme={theme} />
              <MenuItem icon="information-circle-outline" label={t.profile.menuAbout}     onPress={() => navigation.navigate('About')}         theme={theme} last />
            </View>

            {/* ── DÉCONNEXION ───────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.logoutCard, { backgroundColor: theme.surface, borderColor: 'rgba(255,59,48,0.25)' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Icon name="log-out-outline" size={19} color={COLORS.error} />
              <Text style={[styles.logoutText, { color: COLORS.error }]}>{t.profile.logout}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ── NON CONNECTÉ ─────────────────────────────────────────── */}
            <View style={[styles.guestCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.guestIconWrap, { backgroundColor: COLORS.redAlpha12 }]}>
                <Icon name="person-circle-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={[styles.guestHeadline, { color: theme.text }]}>{t.profile.guestHeadline}</Text>
              <Text style={[styles.guestBody, { color: theme.text3 }]}>{t.profile.guestBody}</Text>

              <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login', {})} activeOpacity={0.85}>
                <Icon name="log-in-outline" size={16} color="#fff" />
                <Text style={styles.loginBtnText}>{t.auth.login}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.registerBtn, { borderColor: COLORS.primary }]} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                <Text style={[styles.registerBtnText, { color: COLORS.primary }]}>{t.profile.createAccount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => (navigation as any).getParent?.()?.navigate('HomeTab')} style={{ paddingVertical: 6 }}>
                <Text style={[styles.guestLink, { color: theme.text3 }]}>{t.profile.continueGuest}</Text>
              </TouchableOpacity>
            </View>

            {/* Menu invité */}
            <SectionLabel theme={theme}>{t.profile.sectionPrefs}</SectionLabel>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0 }]}>
              <MenuItem icon="settings-outline"          label={t.profile.menuSettings} onPress={() => navigation.navigate('Settings')} theme={theme} />
              <MenuItem icon="headset-outline"           label={t.profile.menuSupport}  onPress={() => navigation.navigate('Support')}  theme={theme} />
              <MenuItem icon="information-circle-outline" label={t.profile.menuAbout}    onPress={() => navigation.navigate('About')}    theme={theme} last />
            </View>
          </>
        )}

        <Text style={[styles.version, { color: theme.text3 }]}>{t.profile.version}</Text>
      </ScrollView>

      {/* ── MODALES ──────────────────────────────────────────────────────── */}
      <PremiumModal
        visible={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        onSuccess={() => { setPremiumOpen(false); refetchSub(); }}
      />

      <EditModal
        visible={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        title={t.profile.editUsername}
        value={newUsername}
        onChange={v => { setNewUsername(v); setUsernameError(''); }}
        onSave={saveUsername}
        loading={usernameLoading}
        error={usernameError}
        placeholder={t.profile.newUsername}
        autoCapitalize="none"
        cancelLabel={t.common.cancel}
        saveLabel={t.common.save}
        theme={theme}
      />

      <EditModal
        visible={emailOpen}
        onClose={() => setEmailOpen(false)}
        title={t.profile.editEmail}
        value={newEmail}
        onChange={v => { setNewEmail(v); setEmailError(''); }}
        onSave={saveEmail}
        loading={emailLoading}
        error={emailError}
        placeholder={t.profile.newEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        cancelLabel={t.common.cancel}
        saveLabel={t.common.save}
        theme={theme}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { alignItems: 'center', justifyContent: 'center' },

  topBar:   { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  topTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },

  // Bandeau feedback
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1,
  },
  bannerText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  // Carte identité
  identityCard: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xs,
    borderRadius: RADIUS.xl, borderWidth: 1,
    alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg,
    gap: 6,
  },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    marginBottom: 6,
  },
  avatarImg:   { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  identName:  { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, maxWidth: '100%' },
  identEmail: { fontSize: FONT_SIZE.sm, maxWidth: '100%' },
  badgeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
    marginTop: 4,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },
  editCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: 9,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  editCtaText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  // Sections
  sectionLabel: {
    fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.8,
    marginHorizontal: SPACING.lg + 4, marginTop: SPACING.xl, marginBottom: SPACING.xs,
  },

  card: {
    marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl, borderWidth: 1,
    overflow: 'hidden', padding: SPACING.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  cardTitle:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

  // InfoRow (compte)
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: 15, borderBottomWidth: 0.5, gap: SPACING.md,
  },
  infoLabel: { fontSize: FONT_SIZE.sm },
  infoRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, flexShrink: 1, textAlign: 'right' },

  // Skeleton
  skelLine: { height: 12, borderRadius: 6 },

  // Abonnement
  subBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  subBadgeLbl: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  subRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 0.5 },
  subRowLabel: { fontSize: FONT_SIZE.sm },
  subRowValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  subErrorBox:  { alignItems: 'center', gap: 8, paddingVertical: SPACING.md },
  subErrorText: { fontSize: FONT_SIZE.sm, textAlign: 'center' },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, marginTop: 2 },
  retryText:    { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  freeRow:       { marginBottom: SPACING.sm },
  freeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  freeBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  freeDesc:      { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText:   { fontSize: FONT_SIZE.sm },
  premiumBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 11, marginTop: SPACING.md },
  premiumBtnText:{ color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },

  // Menu
  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, gap: SPACING.md, borderBottomWidth: 0.5 },
  menuIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { flex: 1, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },

  // Déconnexion
  logoutCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginTop: SPACING.xl, borderRadius: RADIUS.xl, paddingVertical: 14, borderWidth: 1 },
  logoutText:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },

  version: { textAlign: 'center', fontSize: 11, marginTop: SPACING.xl, marginBottom: 4 },

  // Invité
  guestCard: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xs,
    borderRadius: RADIUS.xl, borderWidth: 1,
    alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg, gap: SPACING.sm,
  },
  guestIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
  guestHeadline: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  guestBody:     { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, maxWidth: 300, marginBottom: SPACING.sm },
  loginBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.lg, width: '100%' },
  loginBtnText:  { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  registerBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, width: '100%' },
  registerBtnText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  guestLink:       { fontSize: FONT_SIZE.sm, textAlign: 'center' },

  // Modales
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  modalCard:      { width: '85%', maxWidth: 360, borderRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: 1 },
  modalTitle:     { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },
  modalInput:     { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.base, marginBottom: SPACING.sm },
  modalErr:       { color: COLORS.error, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  modalBtns:      { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  modalBtnCancel: { flex: 1, padding: 12, borderWidth: 1, borderRadius: RADIUS.lg, alignItems: 'center' },
  modalBtnSave:   { flex: 1, padding: 12, borderRadius: RADIUS.lg, alignItems: 'center' },
});
