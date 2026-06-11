import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Image, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import {
  launchImageLibrary,
  launchCamera,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { BF1Logo } from '../components/ui/BF1Logo';
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
  if (cat === 'premium')  return { bg: 'rgba(255,111,0,0.18)',  text: '#FF6F00', icon: 'star'         as const };
  if (cat === 'standard') return { bg: 'rgba(156,39,176,0.18)', text: '#9C27B0', icon: 'star-half'    as const };
  if (cat === 'basic')    return { bg: 'rgba(33,150,243,0.18)', text: '#2196F3', icon: 'star-outline'  as const };
  return                         { bg: 'rgba(76,175,80,0.18)',  text: '#4CAF50', icon: 'gift-outline'  as const };
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

// ─── Ligne info abonnement ────────────────────────────────────────────────────
function SubRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={[styles.subRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.subRowLabel, { color: theme.text3 }]}>{label}</Text>
      <Text style={[styles.subRowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

// ─── Item de menu ─────────────────────────────────────────────────────────────
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
        <Icon name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <Icon name="chevron-forward" size={16} color={theme.text3} />
    </TouchableOpacity>
  );
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
            style={[styles.modalInput, { backgroundColor: theme.bg, borderColor: error ? COLORS.primary : theme.border, color: theme.text }]}
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
            <TouchableOpacity style={[styles.modalBtnCancel, { borderColor: theme.border }]} onPress={onClose}>
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
  const { user, isAuthenticated, logout, setUser } = useAuthStore() as any;

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

  // Abonnement
  const { data: subData } = useQuery({
    queryKey:  ['my-subscription'],
    queryFn:   api.getMySubscription,
    enabled:   isAuthenticated,
    staleTime: 5 * 60_000,
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
      // Build base64 or use URI directly
      const base64 = asset.base64 ? `data:${asset.type};base64,${asset.base64}` : null;
      const payload = base64 ? { avatar: base64 } : { avatar_url: asset.uri };
      const updated = await api.updateProfile(payload);
      const newUri  = base64 ?? asset.uri;
      setLocalAvatar(newUri);
      if (setUser) setUser({ ...user, ...(updated ?? {}), avatar_url: newUri });
    } catch {
      Alert.alert(t.errors.unknown, t.profile.avatarError);
    } finally {
      setAvatarLoading(false);
    }
  }, [user, setUser]);

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
  }, [pickAvatarFromResponse]);

  // ── Username ──────────────────────────────────────────────────────────────
  const openUsernameEdit = useCallback(() => {
    setNewUsername(user?.username ?? '');
    setUsernameError('');
    setUsernameOpen(true);
  }, [user]);

  const saveUsername = useCallback(async () => {
    const v = newUsername.trim();
    if (!v || v.length < 3) { setUsernameError(t.profile.minChars); return; }
    setUsernameLoading(true);
    try {
      const updated = await api.updateProfile({ username: v });
      if (setUser) setUser({ ...user, ...(updated ?? { username: v }) });
      setUsernameOpen(false);
    } catch { setUsernameError(t.profile.saveError); }
    finally  { setUsernameLoading(false); }
  }, [newUsername, user, setUser]);

  // ── Email ─────────────────────────────────────────────────────────────────
  const openEmailEdit = useCallback(() => {
    setNewEmail(user?.email ?? '');
    setEmailError('');
    setEmailOpen(true);
  }, [user]);

  const saveEmail = useCallback(async () => {
    const v = newEmail.trim();
    if (!v || !v.includes('@')) { setEmailError(t.profile.invalidEmail); return; }
    setEmailLoading(true);
    try {
      const updated = await api.updateProfile({ email: v });
      if (setUser) setUser({ ...user, ...(updated ?? { email: v }) });
      setEmailOpen(false);
    } catch { setEmailError(t.profile.saveError); }
    finally  { setEmailLoading(false); }
  }, [newEmail, user, setUser]);

  // ── Déconnexion ───────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert(t.profile.logoutConfirmTitle, t.profile.logoutConfirmMsg, [
      { text: t.common.cancel,         style: 'cancel' },
      { text: t.profile.logoutConfirm, style: 'destructive', onPress: () => logout() },
    ]);
  }, [logout]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        {/* ── HEADER GRADIENT ────────────────────────────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#1a0505', '#0d0d0d'] : ['#fff0f0', theme.bg]}
          start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: Math.max(insets.top + 12, 32) }]}
        >
          {isAuthenticated && user ? (
            <View style={styles.userRow}>
              {/* ── Avatar cliquable ── */}
              <TouchableOpacity
                style={[styles.avatarWrap, { borderColor: COLORS.primary, backgroundColor: theme.surface }]}
                onPress={handleAvatarPress}
                activeOpacity={0.8}
                disabled={avatarLoading}
              >
                {avatarLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <Icon name="person" size={36} color={theme.text} />
                )}
                <View style={styles.cameraOverlay}>
                  <Icon name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* ── Infos ── */}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                {/* Username + crayon */}
                <View style={styles.usernameRow}>
                  <Text style={[styles.userName, { color: isDark ? '#fff' : theme.text }]} numberOfLines={1}>
                    {user.username ?? user.name ?? t.profile.userFallback}
                  </Text>
                  <TouchableOpacity onPress={openUsernameEdit} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Icon name="pencil" size={13} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {/* Email + crayon */}
                <View style={styles.emailRow}>
                  <Text style={[styles.userEmail, { color: isDark ? '#A0A0A0' : theme.text3 }]} numberOfLines={1}>
                    {user.email ?? ''}
                  </Text>
                  <TouchableOpacity onPress={openEmailEdit} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Icon name="pencil" size={11} color={theme.text3} />
                  </TouchableOpacity>
                </View>

                {/* Badge abonnement */}
                <View style={[styles.badgeWrap, { backgroundColor: badge.bg }]}>
                  <Icon name={badge.icon as any} size={11} color={badge.text} />
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {isPremium ? t.subscription.premium : t.profile.free}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* ── Non connecté ── */
            <View style={styles.guestBox}>
              <View style={styles.logoWrap}><BF1Logo size="xl" /></View>
              <Text style={[styles.guestSlogan, { color: theme.text3 }]}>{t.profile.welcomeSlogan}</Text>
              <Text style={[styles.guestTitle,  { color: theme.text }]}>{t.profile.welcomeTitle}</Text>
              <Text style={[styles.guestSub,    { color: theme.text3 }]}>{t.profile.welcomeSub}</Text>
              <View style={[styles.benefitRow, { backgroundColor: COLORS.redAlpha12 }]}>
                <Icon name="chatbubbles" size={22} color={COLORS.primary} />
                <Text style={[styles.benefitText, { color: theme.text }]}>{t.profile.benefitComment}</Text>
              </View>
              <View style={[styles.benefitRow, { backgroundColor: COLORS.redAlpha12 }]}>
                <Icon name="notifications" size={22} color={COLORS.primary} />
                <Text style={[styles.benefitText, { color: theme.text }]}>{t.profile.benefitNotif}</Text>
              </View>
              <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login', {})} activeOpacity={0.85}>
                <Icon name="log-in-outline" size={16} color="#fff" />
                <Text style={styles.loginBtnText}>{t.auth.login}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.registerBtn, { borderColor: COLORS.primary }]} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                <Text style={[styles.registerBtnText, { color: COLORS.primary }]}>{t.profile.createAccount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[styles.guestLink, { color: theme.text3 }]}>{t.profile.continueGuest}</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── ABONNEMENT ─────────────────────────────────────────────────── */}
        {isAuthenticated && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Icon name={isPremium ? 'card' : 'star-outline'} size={18} color={COLORS.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {isPremium ? t.profile.mySubscription : t.profile.discoverPlans}
              </Text>
            </View>
            {isPremium && subscription ? (
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
                      color={subscription.is_active ? '#4CAF50' : COLORS.primary}
                    />
                    <Text style={{ color: subscription.is_active ? '#4CAF50' : COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                      {subscription.is_active ? t.profile.active : t.profile.expired}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.freeRow}>
                  <View style={[styles.freeBadge, { backgroundColor: 'rgba(76,175,80,0.15)' }]}>
                    <Icon name="gift-outline" size={12} color="#4CAF50" />
                    <Text style={[styles.freeBadgeText, { color: '#4CAF50' }]}>{t.profile.free}</Text>
                  </View>
                </View>
                <Text style={[styles.freeDesc, { color: theme.text3 }]}>{t.profile.freePlan}</Text>
                {[
                  { ok: true,  label: t.profile.freeContent  },
                  { ok: false, label: t.profile.premiumAccess },
                  { ok: false, label: t.profile.hdQuality     },
                ].map(row => (
                  <View key={row.label} style={styles.featureRow}>
                    <Icon name={row.ok ? 'checkmark-circle' : 'close-circle'} size={16} color={row.ok ? '#4CAF50' : COLORS.primary} />
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
        )}

        {/* ── MENU CONNECTÉ ──────────────────────────────────────────────── */}
        {isAuthenticated && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0 }]}>
            <MenuItem icon="heart"               label={t.profile.menuFavorites} onPress={() => navigation.navigate('Favorites')}    theme={theme} />
            <MenuItem icon="notifications"       label={t.profile.menuNotif}     onPress={() => navigation.navigate('Notifications')} theme={theme} />
            <MenuItem icon="settings-outline"    label={t.profile.menuSettings}  onPress={() => navigation.navigate('Settings')}     theme={theme} />
            <MenuItem icon="headset-outline"     label={t.profile.menuSupport}   onPress={() => navigation.navigate('Support')}      theme={theme} />
            <MenuItem icon="information-circle-outline" label={t.profile.menuAbout} onPress={() => navigation.navigate('About')}    theme={theme} last />
          </View>
        )}

        {/* Menu invité */}
        {!isAuthenticated && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 0 }]}>
            <MenuItem icon="settings-outline"    label={t.profile.menuSettings} onPress={() => navigation.navigate('Settings')} theme={theme} />
            <MenuItem icon="headset-outline"     label={t.profile.menuSupport}  onPress={() => navigation.navigate('Support')}  theme={theme} />
            <MenuItem icon="information-circle-outline" label={t.profile.menuAbout} onPress={() => navigation.navigate('About')}   theme={theme} last />
          </View>
        )}

        {/* ── DÉCONNEXION ────────────────────────────────────────────────── */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.logoutCard, { backgroundColor: theme.surface, borderColor: 'rgba(226,62,62,0.2)' }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="log-out-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.logoutText, { color: COLORS.primary }]}>{t.profile.logout}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.version, { color: theme.text3 }]}>{t.profile.version}</Text>
      </ScrollView>

      {/* ── PREMIUM MODAL ────────────────────────────────────────────────── */}
      <PremiumModal
        visible={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        onSuccess={() => setPremiumOpen(false)}
      />

      {/* ── MODAL PSEUDO ─────────────────────────────────────────────────── */}
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

      {/* ── MODAL EMAIL ──────────────────────────────────────────────────── */}
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

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },

  userRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  avatarImg:     { width: '100%', height: '100%' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },

  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName:    { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, flex: 1 },
  emailRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userEmail:   { fontSize: FONT_SIZE.sm, flex: 1 },
  badgeWrap:   {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },

  guestBox:    { alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xl },
  logoWrap:    { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  guestSlogan: { fontSize: FONT_SIZE.xs, fontStyle: 'italic', textAlign: 'center' },
  guestTitle:  { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  guestSub:    { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md, width: '100%' },
  benefitText: { fontSize: FONT_SIZE.sm },
  loginBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.lg, width: '100%' },
  loginBtnText:    { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  registerBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, width: '100%' },
  registerBtnText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  guestLink:       { fontSize: FONT_SIZE.sm, textAlign: 'center' },

  card:       { marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1, overflow: 'hidden', padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  cardTitle:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

  subBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
  subBadgeLbl: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  subRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 0.5 },
  subRowLabel: { fontSize: FONT_SIZE.sm },
  subRowValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  freeRow:       { marginBottom: SPACING.sm },
  freeBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  freeBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  freeDesc:      { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText:   { fontSize: FONT_SIZE.sm },
  premiumBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 11, marginTop: SPACING.md },
  premiumBtnText:{ color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },

  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 15, gap: SPACING.md, borderBottomWidth: 0.5 },
  menuIconWrap:{ width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { flex: 1, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },

  logoutCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.xl, paddingVertical: 14, borderWidth: 1 },
  logoutText:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  version:     { textAlign: 'center', fontSize: 11, marginTop: SPACING.xl, marginBottom: 4 },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  modalCard:      { width: '85%', maxWidth: 360, borderRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: 1 },
  modalTitle:     { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.lg },
  modalInput:     { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.base, marginBottom: SPACING.sm },
  modalErr:       { color: COLORS.primary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  modalBtns:      { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  modalBtnCancel: { flex: 1, padding: 12, borderWidth: 1, borderRadius: RADIUS.lg, alignItems: 'center' },
  modalBtnSave:   { flex: 1, padding: 12, borderRadius: RADIUS.lg, alignItems: 'center' },
});
