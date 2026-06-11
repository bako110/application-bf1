import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import * as api from '../services/api';

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Comment créer un compte ?',
    a: 'Appuyez sur "Mon Profil" puis "Créer un compte". Renseignez votre email et choisissez un mot de passe.',
  },
  {
    q: 'Comment accéder au contenu premium ?',
    a: "Souscrivez à l'un de nos plans (Basic, Standard ou Premium) depuis la section \"Mon Abonnement\" dans votre profil.",
  },
  {
    q: 'Ma vidéo ne charge pas, que faire ?',
    a: 'Vérifiez votre connexion internet. Si le problème persiste, redémarrez l\'application ou contactez-nous via le formulaire ci-dessous.',
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: 'Contactez notre service client via le formulaire de support ou par email à support@bf1tv.bf pour toute demande d\'annulation.',
  },
  {
    q: 'L\'application est lente, comment l\'optimiser ?',
    a: 'Fermez les autres applications en arrière-plan. Assurez-vous d\'avoir une bonne connexion Wi-Fi ou 4G.',
  },
];

// ─── Accordéon FAQ ────────────────────────────────────────────────────────────

function FaqItem({ q, a, theme }: { q: string; a: string; theme: any }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.faqItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        style={styles.faqHeader}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQ, { color: theme.text }]}>{q}</Text>
        <Icon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={COLORS.primary}
        />
      </TouchableOpacity>
      {open && (
        <View style={[styles.faqBody, { borderTopColor: theme.divider }]}>
          <Text style={[styles.faqA, { color: theme.text2 }]}>{a}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function SupportScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [name, setName]       = useState(isAuthenticated && user ? (user.username ?? '') : '');
  const [email, setEmail]     = useState(isAuthenticated && user ? (user.email ?? '') : '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Sujet et message requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.submitSupport({ name, email, subject, message });
      setSent(true);
    } catch {
      setError(t.errors.unknown);
    } finally {
      setLoading(false);
    }
  }, [name, email, subject, message, t]);

  const quickContacts = [
    { icon: 'mail',      color: COLORS.primary,  label: 'Email',     url: 'mailto:support@bf1tv.bf' },
    { icon: 'logo-whatsapp', color: '#25D366',   label: 'WhatsApp',  url: 'https://wa.me/22605606410' },
    { icon: 'logo-facebook', color: '#1877F2',   label: 'Facebook',  url: 'https://www.facebook.com/BF1TV' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{t.profile.support}</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        >
          {/* Hero */}
          <LinearGradient
            colors={[COLORS.redAlpha12, theme.bg]}
            style={styles.hero}
          >
            <View style={[styles.heroIcon, { borderColor: COLORS.primary }]}>
              <Icon name="headset" size={30} color={COLORS.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Aide &amp; Support</Text>
            <Text style={[styles.heroSub, { color: theme.text3 }]}>Nous sommes là pour vous aider</Text>
          </LinearGradient>

          <View style={{ paddingHorizontal: SPACING.lg }}>

            {/* Contacts rapides */}
            <View style={styles.quickRow}>
              {quickContacts.map(c => (
                <TouchableOpacity
                  key={c.label}
                  style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => Linking.openURL(c.url).catch(() => {})}
                  activeOpacity={0.7}
                >
                  <Icon name={c.icon} size={22} color={c.color} />
                  <Text style={[styles.quickLabel, { color: theme.text }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* FAQ */}
            <Text style={[styles.sectionLabel, { color: COLORS.primary }]}>
              Questions fréquentes
            </Text>
            <View style={{ gap: 8, marginBottom: SPACING.xl }}>
              {FAQ.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} theme={theme} />
              ))}
            </View>

            {/* Formulaire */}
            <Text style={[styles.sectionLabel, { color: COLORS.primary }]}>
              Nous écrire
            </Text>

            {sent ? (
              <View style={[styles.successCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icon name="checkmark-circle" size={48} color={COLORS.success} />
                <Text style={[styles.successTitle, { color: theme.text }]}>Message envoyé !</Text>
                <Text style={[styles.successSub, { color: theme.text3 }]}>
                  Nous vous répondrons dans les plus brefs délais.
                </Text>
              </View>
            ) : (
              <>
                {error ? (
                  <Text style={[styles.errorText, { marginBottom: SPACING.md }]}>{error}</Text>
                ) : null}

                {[
                  { label: 'Nom',    value: name,    set: setName,    placeholder: 'Votre nom', editable: !isAuthenticated },
                  { label: 'Email',  value: email,   set: setEmail,   placeholder: 'votre@email.com', editable: !isAuthenticated },
                  { label: 'Sujet', value: subject, set: setSubject, placeholder: 'Sujet de votre message', editable: true },
                ].map(f => (
                  <View key={f.label} style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.text2 }]}>{f.label}</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                        !f.editable && { opacity: 0.6 },
                      ]}
                      value={f.value}
                      onChangeText={v => { f.set(v); setError(''); }}
                      placeholder={f.placeholder}
                      placeholderTextColor={theme.text3}
                      editable={f.editable}
                    />
                  </View>
                ))}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text2 }]}>Message</Text>
                  <TextInput
                    style={[
                      styles.textarea,
                      { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                    ]}
                    value={message}
                    onChangeText={v => { setMessage(v); setError(''); }}
                    placeholder="Décrivez votre problème…"
                    placeholderTextColor={theme.text3}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity onPress={handleSend} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.submitBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color={COLORS.white} />
                      : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon name="send" size={16} color={COLORS.white} />
                          <Text style={styles.submitText}>Envoyer</Text>
                        </View>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     12,
    borderBottomWidth: 1,
    minHeight:         56,
    gap:               SPACING.sm,
  },
  backBtn:   { padding: 4 },
  pageTitle: { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

  hero: {
    alignItems:     'center',
    paddingVertical: SPACING.xxxl,
    gap:             SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  heroIcon: {
    width:          64,
    height:         64,
    borderRadius:   32,
    backgroundColor: COLORS.redAlpha12,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.sm,
  },
  heroTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  heroSub:   { fontSize: FONT_SIZE.sm },

  quickRow: {
    flexDirection: 'row',
    gap:           SPACING.sm,
    marginVertical: SPACING.lg,
  },
  quickCard: {
    flex:           1,
    alignItems:     'center',
    gap:            SPACING.xs,
    padding:        SPACING.md,
    borderRadius:   RADIUS.lg,
    borderWidth:    1,
  },
  quickLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },

  sectionLabel: {
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },

  faqItem: {
    borderRadius: RADIUS.md,
    borderWidth:  1,
    overflow:     'hidden',
  },
  faqHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    padding:           SPACING.md,
    gap:               SPACING.sm,
  },
  faqQ:    { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  faqBody: { padding: SPACING.md, borderTopWidth: 0.5 },
  faqA:    { fontSize: FONT_SIZE.sm, lineHeight: 20 },

  inputGroup:  { marginBottom: SPACING.md },
  inputLabel:  { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, marginBottom: 6 },
  input:       { borderWidth: 1, borderRadius: RADIUS.lg, height: 52, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base },
  textarea:    { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZE.base, minHeight: 130 },

  submitBtn:   { borderRadius: RADIUS.lg, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  submitText:  { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  errorText:   { color: COLORS.error, fontSize: FONT_SIZE.sm },

  successCard: {
    alignItems:    'center',
    gap:           SPACING.md,
    padding:       SPACING.xxl,
    borderRadius:  RADIUS.xl,
    borderWidth:   1,
    marginBottom:  SPACING.xl,
  },
  successTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  successSub:   { fontSize: FONT_SIZE.base, textAlign: 'center', lineHeight: 22 },
});
