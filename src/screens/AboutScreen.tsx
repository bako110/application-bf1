import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { BF1Logo } from '../components/ui/BF1Logo';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';

// ─── Data ─────────────────────────────────────────────────────────────────────

const APP_FEATURES = [
  { icon: 'play-circle',     label: 'VOD & Replay',  desc: 'Regardez vos émissions en différé à tout moment' },
  { icon: 'wifi',            label: 'Live Stream',   desc: 'Suivez BF1 en direct où que vous soyez' },
  { icon: 'newspaper',       label: 'Actualités',    desc: 'Restez informé des dernières nouvelles' },
  { icon: 'trophy',          label: 'Sport',         desc: 'Retrouvez toutes les actualités sportives' },
  { icon: 'star',            label: 'Premium',       desc: 'Accédez à du contenu exclusif en qualité HD' },
];

const SOCIALS = [
  { icon: 'globe',        color: COLORS.primary, label: 'Site Web',   value: 'bf1.tv',          url: 'https://bf1.tv' },
  { icon: 'logo-facebook',color: '#1877F2',      label: 'Facebook',   value: 'Bf1TV',           url: 'https://facebook.com/Bf1TV' },
  { icon: 'logo-twitter', color: '#fff',          label: 'Twitter',    value: '@bf1tv',          url: 'https://twitter.com/bf1tv' },
  { icon: 'logo-instagram',color: '#E1306C',     label: 'Instagram',  value: '@bf1_tv',         url: 'https://instagram.com/bf1_tv' },
];

const CONTACT_ROWS = [
  { icon: 'mail',         label: 'Email',      value: 'redaction@bf1news.com' },
  { icon: 'call',         label: 'Téléphone',  value: '+226 05 60 64 10' },
  { icon: 'location',     label: 'Adresse',    value: 'Ouagadougou, Burkina Faso' },
];

// ─── Composants locaux ────────────────────────────────────────────────────────

function FeatureRow({ icon, label, desc, theme }: any) {
  return (
    <View style={[styles.featureRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.featureIcon, { backgroundColor: COLORS.redAlpha12 }]}>
        <Icon name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.featureLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.featureDesc, { color: theme.text3 }]}>{desc}</Text>
      </View>
    </View>
  );
}

function SocialRow({ icon, color, label, value, url, theme }: any) {
  return (
    <TouchableOpacity
      style={[styles.socialRow, { borderBottomColor: theme.divider }]}
      onPress={() => Linking.openURL(url).catch(() => {})}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={20} color={color} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={[styles.socialLabel, { color: theme.text3 }]}>{label}</Text>
        <Text style={[styles.socialValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Icon name="open-outline" size={14} color={theme.text3} />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, theme, last }: any) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomColor: theme.divider, borderBottomWidth: 0.5 }]}>
      <Icon name={icon} size={16} color={COLORS.primary} />
      <View style={{ flex: 1, marginLeft: SPACING.md }}>
        <Text style={[styles.infoLabel, { color: theme.text3 }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function LegalRow({ label, theme, last }: any) {
  return (
    <TouchableOpacity
      style={[styles.legalRow, !last && { borderBottomColor: theme.divider, borderBottomWidth: 0.5 }]}
      activeOpacity={0.6}
    >
      <Text style={[styles.legalText, { color: theme.text2 }]}>{label}</Text>
      <Icon name="chevron-forward" size={14} color={theme.text3} />
    </TouchableOpacity>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function AboutScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{t.profile.about}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>

        {/* Hero brand */}
        <LinearGradient colors={[COLORS.redAlpha20, theme.bg]} style={styles.hero}>
          <BF1Logo size="xxl" />
          <Text style={[styles.appName, { color: theme.text }]}>BF1 TV</Text>
          <Text style={[styles.tagline, { color: theme.text3 }]}>La chaîne au cœur de nos défis</Text>
          <View style={[styles.versionBadge, { backgroundColor: COLORS.redAlpha12, borderColor: 'rgba(226,62,62,0.27)' }]}>
            <Text style={{ color: COLORS.primary, fontSize: FONT_SIZE.sm, letterSpacing: 0.5 }}>Version 1.0.0</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: SPACING.lg }}>

          {/* Mission */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Icon name="radio" size={18} color={COLORS.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Notre Mission</Text>
            </View>
            <Text style={[styles.cardBody, { color: theme.text2 }]}>
              BF1 est la première chaîne de télévision privée du Burkina Faso. Fondée pour informer,
              divertir et éduquer les Burkinabè, BF1 offre une programmation variée : journaux télévisés,
              émissions culturelles, sportives et un accompagnement de l'actualité nationale et internationale.
            </Text>
          </View>

          {/* Fonctionnalités app */}
          <Text style={[styles.sectionLabel, { color: COLORS.primary }]}>L'Application BF1</Text>
          <View style={{ gap: 8, marginBottom: SPACING.xl }}>
            {APP_FEATURES.map(f => (
              <FeatureRow key={f.label} {...f} theme={theme} />
            ))}
          </View>

          {/* Réseaux sociaux */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: SPACING.lg }]}>
            <View style={styles.cardHeader}>
              <Icon name="share-social" size={18} color={COLORS.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Suivez-nous</Text>
            </View>
            {SOCIALS.map((s, i) => (
              <SocialRow key={s.label} {...s} theme={theme} last={i === SOCIALS.length - 1} />
            ))}
          </View>

          {/* Contact */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: SPACING.lg }]}>
            <View style={styles.cardHeader}>
              <Icon name="location" size={18} color={COLORS.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Nous contacter</Text>
            </View>
            {CONTACT_ROWS.map((r, i) => (
              <InfoRow key={r.label} {...r} theme={theme} last={i === CONTACT_ROWS.length - 1} />
            ))}
          </View>

          {/* Légal */}
          <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: SPACING.md }]}>
            {['Mentions légales', 'Politique de confidentialité', "Conditions d'utilisation"].map((l, i, arr) => (
              <LegalRow key={l} label={l} theme={theme} last={i === arr.length - 1} />
            ))}
          </View>

          <Text style={[styles.copyright, { color: theme.text3 }]}>
            BF1 TV © 2026 · Tous droits réservés
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg, paddingBottom: 12,
    borderBottomWidth: 1, minHeight: 56, gap: SPACING.sm,
  },
  backBtn:   { padding: 4 },
  pageTitle: { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

  hero: {
    alignItems:     'center',
    paddingVertical: SPACING.xxxl,
    gap:             SPACING.sm,
  },
  logoWrap: {
    width:          100,
    height:         100,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    COLORS.primary,
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.4,
    shadowRadius:   16,
    elevation:      8,
  },
  logoText:  { fontSize: 36, fontWeight: FONT_WEIGHT.black, color: '#fff', letterSpacing: -1 },
  appName:   { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  tagline:   { fontSize: FONT_SIZE.sm, fontStyle: 'italic' },
  versionBadge: {
    marginTop:         SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical:   4,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },

  sectionLabel: {
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
    marginTop:    SPACING.sm,
  },
  card: {
    borderRadius:  RADIUS.xl,
    borderWidth:   1,
    padding:       SPACING.lg,
    marginBottom:  SPACING.lg,
    overflow:      'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  cardTitle:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  cardBody:   { fontSize: FONT_SIZE.sm, lineHeight: 22 },

  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.md,
    padding:       SPACING.md,
    borderRadius:  RADIUS.lg,
    borderWidth:   1,
  },
  featureIcon: {
    width:          38,
    height:         38,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  featureLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 },
  featureDesc:  { fontSize: FONT_SIZE.xs },

  socialRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
  },
  socialLabel: { fontSize: FONT_SIZE.xs, marginBottom: 2 },
  socialValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  infoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: SPACING.md,
  },
  infoLabel: { fontSize: FONT_SIZE.xs, marginBottom: 2 },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  legalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: SPACING.md,
  },
  legalText: { fontSize: FONT_SIZE.sm },

  copyright: { textAlign: 'center', fontSize: FONT_SIZE.xs, marginTop: SPACING.sm },
});
