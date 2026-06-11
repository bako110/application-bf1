import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores';
import * as api from '../../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';
import type { ProfileStackParams } from '../../navigation/types';

type Nav = StackNavigationProp<ProfileStackParams, 'Register'>;

// ─── Validation username ───────────────────────────────────────────────────────
function validateUsername(val: string): { ok: boolean; hint: string; color: string } {
  if (!val) return { ok: false, hint: '', color: '' };
  const hasLetter = /[a-zA-Z]/.test(val);
  const hasDigit  = /[0-9]/.test(val);
  if (!hasLetter || !hasDigit) {
    return { ok: false, hint: 'Doit contenir lettres et chiffres', color: COLORS.error };
  }
  if (val.length < 3) {
    return { ok: false, hint: 'Trop court (min 3 caractères)', color: COLORS.error };
  }
  return { ok: true, hint: '✓ valide', color: COLORS.success };
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function RegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const navigation        = useNavigation<Nav>();
  const insets            = useSafeAreaInsets();
  const { register, loading } = useAuthStore();

  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // Username hint (suggéré ou validation)
  const [usernameHint, setUsernameHint] = useState<{ text: string; color: string } | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Auto-suggestion username depuis email ────────────────────────────────

  const suggestFromEmail = useCallback(async (emailVal: string) => {
    if (!emailVal.includes('@')) return;
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    suggestTimerRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      setUsernameHint({ text: '⏳ suggestion...', color: '#888' });
      try {
        const suggested = await api.suggestUsername(emailVal);
        if (suggested) {
          setUsername(suggested);
          setUsernameHint({ text: '✓ suggéré', color: COLORS.success });
        } else {
          setUsernameHint(null);
        }
      } catch {
        setUsernameHint(null);
      } finally {
        setSuggestLoading(false);
      }
    }, 400);
  }, []);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) {
      e.username = 'Nom d\'utilisateur requis';
    } else {
      const { ok } = validateUsername(username.trim());
      if (!ok) e.username = 'Doit contenir lettres et chiffres (min 3 car.)';
    }
    if (!email.trim())          e.email    = 'E-mail requis';
    else if (!email.includes('@')) e.email = 'Adresse e-mail invalide';
    if (!password)              e.password = 'Mot de passe requis';
    else if (password.length < 6) e.password = 'Minimum 6 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register(username.trim(), email.trim(), password);
      navigation.goBack();
    } catch (err: any) {
      setErrors({ general: err?.message || t.errors.unknown });
    }
  };

  // ─── Handlers champs ──────────────────────────────────────────────────────

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setErrors(p => ({ ...p, username: '' }));
    if (val.trim()) {
      const { hint, color } = validateUsername(val.trim());
      setUsernameHint(hint ? { text: hint, color } : null);
    } else {
      setUsernameHint(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors(p => ({ ...p, email: '', general: '' }));
  };

  const handleEmailBlur = () => {
    if (email.trim() && !username.trim()) {
      suggestFromEmail(email.trim());
    }
  };

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
            Créez votre compte gratuitement
          </Text>

          {/* Error banner */}
          {errors.general ? (
            <View style={[styles.errorBanner, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
              <Icon name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorBannerText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Email — en premier pour permettre l'auto-suggestion du username */}
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
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder={t.auth.email}
                placeholderTextColor={theme.text3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.text2 }]}>{t.auth.username}</Text>
              {suggestLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
              )}
              {usernameHint && !suggestLoading && (
                <Text style={[styles.hintText, { color: usernameHint.color }]}>
                  {usernameHint.text}
                </Text>
              )}
            </View>
            <View style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.surface,
                borderColor: errors.username
                  ? COLORS.error
                  : (usernameHint?.color === COLORS.success ? COLORS.success : theme.border),
              },
            ]}>
              <Icon name="person-outline" size={18} color={theme.text3} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="ex: mohamad42"
                placeholderTextColor={theme.text3}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {usernameHint?.color === COLORS.success && (
                <Icon name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 4 }} />
              )}
            </View>
            {errors.username ? (
              <Text style={styles.fieldError}>{errors.username}</Text>
            ) : (
              <Text style={[styles.fieldHint, { color: theme.text3 }]}>
                Doit contenir lettres et chiffres (ex: jean42)
              </Text>
            )}
          </View>

          {/* Mot de passe */}
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
                placeholder="Minimum 6 caractères"
                placeholderTextColor={theme.text3}
                secureTextEntry={!showPass}
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
            {/* Indicateur force mot de passe */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map(i => {
                  const filled = password.length >= i * 2;
                  const color = password.length < 4 ? COLORS.error
                    : password.length < 7 ? '#FBBC05'
                    : COLORS.success;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: filled ? color : theme.border },
                      ]}
                    />
                  );
                })}
                <Text style={[styles.strengthLabel, { color: theme.text3 }]}>
                  {password.length < 4 ? 'Faible' : password.length < 7 ? 'Moyen' : 'Fort'}
                </Text>
              </View>
            )}
          </View>

          {/* Bouton S'inscrire */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={{ marginTop: SPACING.sm }}
          >
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
                    <Icon name="person-add-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>{t.auth.register}</Text>
                  </View>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* CGU */}
          <Text style={[styles.cgu, { color: theme.text3 }]}>
            En vous inscrivant, vous acceptez nos{' '}
            <Text style={{ color: COLORS.primary }}>Conditions d'utilisation</Text>
            {' '}et notre{' '}
            <Text style={{ color: COLORS.primary }}>Politique de confidentialité</Text>.
          </Text>

          {/* Lien connexion */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginPrompt, { color: theme.text3 }]}>
              {t.auth.alreadyAccount}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', {})}>
              <Text style={[styles.loginLink, { color: COLORS.primary }]}>
                {' '}{t.auth.login}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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

  inputGroup: { marginBottom: SPACING.lg },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  6,
  },
  label:     { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  hintText:  { marginLeft: 'auto', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
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
  fieldHint:  { fontSize: FONT_SIZE.xs, marginTop: 4 },

  strengthRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     6,
  },
  strengthBar: {
    flex:         1,
    height:       3,
    borderRadius: 2,
  },
  strengthLabel: { fontSize: FONT_SIZE.xs, marginLeft: 4, minWidth: 36 },

  submitBtn: {
    borderRadius:   RADIUS.lg,
    height:         54,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.lg,
  },
  btnInner:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  submitText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

  cgu: {
    fontSize:   FONT_SIZE.xs,
    textAlign:  'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  loginRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  loginPrompt: { fontSize: FONT_SIZE.sm },
  loginLink:   { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});
