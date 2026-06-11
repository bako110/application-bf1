import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Modal, Image,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';
import type { ProfileStackParams } from '../../navigation/types';

type Nav = StackNavigationProp<ProfileStackParams, 'Login'>;

// ─── Overlay Google OAuth ──────────────────────────────────────────────────────

function GoogleOAuthOverlay({
  visible,
  onCancel,
}: {
  visible: boolean;
  onCancel: () => void;
}) {
  // Points animés Google colors
  const dots = [
    { color: '#4285F4', anim: useRef(new Animated.Value(0)).current },
    { color: '#EA4335', anim: useRef(new Animated.Value(0)).current },
    { color: '#FBBC05', anim: useRef(new Animated.Value(0)).current },
    { color: '#34A853', anim: useRef(new Animated.Value(0)).current },
  ];
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;

    // Fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();

    // Spinner
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    spin.start();

    // Dots pulse avec délai
    const dotLoops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(d.anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d.anim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(4 * 180 - i * 180),
        ]),
      ),
    );
    dotLoops.forEach(l => l.start());

    return () => {
      spin.stop();
      dotLoops.forEach(l => l.stop());
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    };
  }, [visible]);

  const spinInterp = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.oauthBg, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.oauthCard, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Logo Google avec spinner */}
          <View style={styles.googleLogoWrap}>
            <Animated.View
              style={[styles.googleSpinner, { transform: [{ rotate: spinInterp }] }]}
            />
            <View style={styles.googleLogoCircle}>
              {/* SVG Google logo via Text paths simulé avec couleurs */}
              <Text style={styles.googleG}>G</Text>
            </View>
          </View>

          <Text style={styles.oauthTitle}>Connexion avec Google</Text>
          <Text style={styles.oauthSub}>
            Une fenêtre Google va s'ouvrir.{'\n'}Suivez les instructions pour vous connecter.
          </Text>

          {/* Points animés */}
          <View style={styles.dotsRow}>
            {dots.map((d, i) => {
              const scale = d.anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
              const opacity = d.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { backgroundColor: d.color, transform: [{ scale }], opacity }]}
                />
              );
            })}
          </View>

          <TouchableOpacity style={styles.oauthCancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.oauthCancelText}>Annuler</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const navigation        = useNavigation<Nav>();
  const insets            = useSafeAreaInsets();
  const { login, loginWithGoogle, loading } = useAuthStore();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleOverlay, setGoogleOverlay] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim())    e.email    = 'E-mail requis';
    if (!password)        e.password = 'Mot de passe requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      navigation.goBack();
    } catch (err: any) {
      setErrors({ general: err?.message || t.auth.invalidCredentials });
    }
  };

  // ─── Google Sign-In ───────────────────────────────────────────────────────

  // Configure une seule fois au montage
  useEffect(() => {
    GoogleSignin.configure({
      // Web Client ID — à récupérer dans Firebase console →
      // Paramètres du projet → Général → ton app Web → OAuth 2.0 client ID
      // ou dans Google Cloud Console → APIs → Identifiants → Client OAuth Web
      webClientId: '1059019203717-REMPLACE_PAR_TON_WEB_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setGoogleOverlay(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const tokens   = await GoogleSignin.getTokens();
      const idToken  = tokens.idToken ?? (userInfo as any)?.idToken ?? '';

      if (!idToken) throw new Error('Token Google introuvable');

      await loginWithGoogle(idToken, {
        email:    (userInfo as any)?.user?.email ?? (userInfo as any)?.data?.user?.email,
        name:     (userInfo as any)?.user?.name  ?? (userInfo as any)?.data?.user?.name,
        photo:    (userInfo as any)?.user?.photo ?? (userInfo as any)?.data?.user?.photo,
        googleId: (userInfo as any)?.user?.id    ?? (userInfo as any)?.data?.user?.id,
      });

      setGoogleOverlay(false);
      setGoogleLoading(false);
      navigation.goBack();
    } catch (err: any) {
      setGoogleOverlay(false);
      setGoogleLoading(false);
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
        // Annulé par l'utilisateur — pas d'erreur à afficher
      } else if (err?.code === statusCodes.IN_PROGRESS) {
        // Déjà en cours
      } else if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrors({ general: 'Google Play Services non disponible' });
      } else {
        setErrors({ general: err?.message || 'Erreur de connexion Google' });
      }
    }
  }, [loginWithGoogle, navigation]);

  const handleCancelGoogle = useCallback(() => {
    setGoogleOverlay(false);
    setGoogleLoading(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        >
          {/* Brand */}
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={[styles.subtitle, { color: theme.text3 }]}>
            Bienvenue, connectez-vous pour continuer
          </Text>

          {/* Error banner */}
          {errors.general ? (
            <View style={[styles.errorBanner, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
              <Icon name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text2 }]}>{t.auth.email}</Text>
            <View style={[
              styles.inputWrapper,
              { backgroundColor: theme.surface, borderColor: errors.email ? COLORS.error : theme.border },
            ]}>
              <Icon name="mail-outline" size={18} color={theme.text3} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={email}
                onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: '', general: '' })); }}
                placeholder={t.auth.email}
                placeholderTextColor={theme.text3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text2 }]}>{t.auth.password}</Text>
            <View style={[
              styles.inputWrapper,
              { backgroundColor: theme.surface, borderColor: errors.password ? COLORS.error : theme.border },
            ]}>
              <Icon name="lock-closed-outline" size={18} color={theme.text3} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={password}
                onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: '', general: '' })); }}
                placeholder={t.auth.password}
                placeholderTextColor={theme.text3}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                <Icon
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.text3}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          {/* Mot de passe oublié */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgotText, { color: COLORS.primary }]}>
              {t.auth.forgotPassword}
            </Text>
          </TouchableOpacity>

          {/* Bouton Se connecter */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : (
                  <View style={styles.btnInner}>
                    <Icon name="log-in-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>{t.auth.login}</Text>
                  </View>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.text3 }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* Bouton Google */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleGoogle}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={theme.text3} />
            ) : (
              <>
                {/* Logo Google SVG inline comme View colorée */}
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={[styles.googleBtnText, { color: theme.text }]}>
                  Continuer avec Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Lien inscription */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerPrompt, { color: theme.text3 }]}>
              {t.auth.noAccount}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: COLORS.primary }]}>
                {' '}{t.auth.register}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Modal overlay Google OAuth */}
      <GoogleOAuthOverlay visible={googleOverlay} onCancel={handleCancelGoogle} />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn:      { padding: 4 },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xl,
  },

  logoImg: {
    width:        90,
    height:       90,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize:     FONT_SIZE.md,
    marginBottom: SPACING.xxl,
    lineHeight:   20,
  },

  errorBanner: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            SPACING.sm,
    borderRadius:   RADIUS.md,
    padding:        SPACING.md,
    marginBottom:   SPACING.lg,
  },
  errorBannerText: { flex: 1, color: COLORS.error, fontSize: FONT_SIZE.sm },

  inputGroup:   { marginBottom: SPACING.lg },
  label:        { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, marginBottom: 6 },
  inputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderRadius:      RADIUS.lg,
    height:            52,
    paddingHorizontal: SPACING.md,
  },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: FONT_SIZE.base, height: '100%' },
  eyeBtn:     { padding: 6 },
  fieldError: { color: COLORS.error, fontSize: FONT_SIZE.xs, marginTop: 4 },

  forgotBtn:  { alignSelf: 'flex-end', marginBottom: SPACING.xl },
  forgotText: { fontSize: FONT_SIZE.sm },

  submitBtn: {
    borderRadius:   RADIUS.lg,
    height:         54,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.lg,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  submitText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    marginVertical: SPACING.lg,
    gap:            SPACING.md,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: FONT_SIZE.sm },

  googleBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               SPACING.md,
    borderWidth:       1,
    borderRadius:      RADIUS.lg,
    height:            52,
    marginBottom:      SPACING.xl,
  },
  googleIconWrap: {
    width:           22,
    height:          22,
    borderRadius:    4,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.2,
    shadowRadius:    2,
    elevation:       2,
  },
  googleIconText: {
    fontSize:   13,
    fontWeight: FONT_WEIGHT.bold,
    color:      '#4285F4',
    lineHeight: 22,
  },
  googleBtnText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },

  registerRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  registerPrompt: { fontSize: FONT_SIZE.sm },
  registerLink:   { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  // ─── OAuth Overlay ─────────────────────────────────────────────────────────
  oauthBg: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  oauthCard: {
    backgroundColor: '#1a1a1a',
    borderRadius:    24,
    padding:         SPACING.xxl,
    width:           300,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 24 },
    shadowOpacity:   0.6,
    shadowRadius:    48,
    elevation:       24,
  },
  googleLogoWrap: {
    width:          72,
    height:         72,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.xl,
  },
  googleSpinner: {
    position:     'absolute',
    width:        72,
    height:       72,
    borderRadius: 36,
    borderWidth:  2.5,
    borderColor:  'transparent',
    borderTopColor:   '#4285F4',
    borderRightColor: '#EA4335',
  },
  googleLogoCircle: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.3,
    shadowRadius:    6,
    elevation:       4,
  },
  googleG: {
    fontSize:   22,
    fontWeight: FONT_WEIGHT.bold,
    color:      '#4285F4',
    lineHeight: 40,
  },
  oauthTitle: {
    color:        '#fff',
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    letterSpacing: -0.2,
    marginBottom:  SPACING.sm,
    textAlign:    'center',
  },
  oauthSub: {
    color:        '#666',
    fontSize:     FONT_SIZE.sm,
    textAlign:    'center',
    lineHeight:   18,
    marginBottom: SPACING.xl,
  },
  dotsRow: {
    flexDirection:  'row',
    gap:            6,
    marginBottom:   SPACING.xl,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
  },
  oauthCancelBtn: {
    width:           '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
    borderRadius:    RADIUS.lg,
    paddingVertical: 13,
    alignItems:      'center',
  },
  oauthCancelText: {
    color:     '#888',
    fontSize:  FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
