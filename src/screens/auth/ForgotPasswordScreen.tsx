import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';
import * as api from '../../services/api';

export function ForgotPasswordScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('E-mail requis'); return; }
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError(t.errors.unknown);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.redAlpha12 }]}>
            <Icon name="key-outline" size={32} color={COLORS.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{t.auth.forgotPassword}</Text>
          <Text style={[styles.subtitle, { color: theme.text3 }]}>
            Entrez votre e-mail pour recevoir un lien de réinitialisation.
          </Text>

          {sent ? (
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.successText}>
                Email envoyé ! Vérifiez votre boîte mail.
              </Text>
            </View>
          ) : (
            <>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icon name="mail-outline" size={18} color={theme.text3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  placeholder={t.auth.email}
                  placeholderTextColor={theme.text3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.submitText}>Envoyer</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  backBtn:   { padding: 4 },
  content: {
    flex:              1,
    paddingHorizontal: SPACING.xl,
    paddingTop:        SPACING.xxxl,
    alignItems:        'center',
  },
  iconWrap: {
    width:          72,
    height:         72,
    borderRadius:   36,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.xl,
  },
  title:    { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.sm, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.md, lineHeight: 22, textAlign: 'center', marginBottom: SPACING.xxl },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  inputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1,
    borderRadius:      RADIUS.lg,
    height:            52,
    paddingHorizontal: SPACING.md,
    width:             '100%',
    marginBottom:      SPACING.xl,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: FONT_SIZE.base, height: '100%' },
  submitBtn: {
    borderRadius:   RADIUS.lg,
    height:         54,
    width:          '100%',
    alignItems:     'center',
    justifyContent: 'center',
  },
  submitText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  successBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.sm,
    backgroundColor:   'rgba(52,199,89,0.12)',
    borderRadius:      RADIUS.lg,
    padding:           SPACING.lg,
    width:             '100%',
  },
  successText: { color: COLORS.success, fontSize: FONT_SIZE.sm, flex: 1 },
});
