import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore, useUiStore } from '../stores';
import type { ThemeMode } from '../theme';
import type { Language } from '../i18n';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';

// ─── Composants locaux ────────────────────────────────────────────────────────

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.text3 }]}>
      {label.toUpperCase()}
    </Text>
  );
}

/** Ligne avec sélection radio (checkmark) */
function RadioRow({
  icon, label, selected, onPress, theme, iconColor, last,
}: {
  icon:      string;
  label:     string;
  selected:  boolean;
  onPress:   () => void;
  theme:     any;
  iconColor?: string;
  last?:     boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.optionRow,
        { borderBottomColor: theme.divider },
        last && { borderBottomWidth: 0 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: COLORS.redAlpha12 }]}>
        <Icon name={icon as any} size={18} color={iconColor ?? (selected ? COLORS.primary : theme.text2)} />
      </View>
      <Text style={[styles.optionLabel, { color: selected ? COLORS.primary : theme.text }]}>
        {label}
      </Text>
      {selected
        ? <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
        : <View style={[styles.radioEmpty, { borderColor: theme.border }]} />
      }
    </TouchableOpacity>
  );
}


// ─── Écran principal ──────────────────────────────────────────────────────────

export function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { preference: themeMode, setMode } = useThemeStore();
  const { language, setLanguage } = useUiStore();

  type ThemeOption = { label: string; icon: string; value: ThemeMode | 'auto' };
  const themeOptions: ThemeOption[] = [
    { label: t.settings.darkMode,  icon: 'moon',          value: 'dark'  },
    { label: t.settings.lightMode, icon: 'sunny',         value: 'light' },
    { label: t.settings.autoMode,  icon: 'phone-portrait',value: 'auto'  },
  ];

  const langOptions: { label: string; value: Language; flag: string }[] = [
    { label: t.settings.french,  value: 'fr', flag: '🇫🇷' },
    { label: t.settings.english, value: 'en', flag: '🇬🇧' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{t.settings.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >

        {/* ── Thème ── */}
        <SectionLabel label={t.settings.theme} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {themeOptions.map((opt, i) => (
            <RadioRow
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={themeMode === opt.value}
              onPress={() => setMode(opt.value)}
              theme={theme}
              last={i === themeOptions.length - 1}
            />
          ))}
        </View>

        {/* ── Langue ── */}
        <SectionLabel label={t.settings.language} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {langOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                { borderBottomColor: theme.divider },
                i === langOptions.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => setLanguage(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: COLORS.redAlpha12 }]}>
                <Text style={{ fontSize: 18 }}>{opt.flag}</Text>
              </View>
              <Text style={[styles.optionLabel, { color: language === opt.value ? COLORS.primary : theme.text }]}>
                {opt.label}
              </Text>
              {language === opt.value
                ? <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
                : <View style={[styles.radioEmpty, { borderColor: theme.border }]} />
              }
            </TouchableOpacity>
          ))}
        </View>

        {/* ── À propos ── */}
        <SectionLabel label={t.settings.appSection} theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={[styles.infoRow, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.infoLabel, { color: theme.text3 }]}>{t.settings.version}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text3 }]}>{t.settings.platform}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>React Native 0.83</Text>
          </View>
        </View>

      </ScrollView>
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
  backBtn:   { padding: 4 },
  pageTitle: { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },

  sectionLabel: {
    fontSize:          FONT_SIZE.xs,
    fontWeight:        FONT_WEIGHT.semibold,
    letterSpacing:     0.5,
    marginHorizontal:  SPACING.lg,
    marginTop:         SPACING.xl,
    marginBottom:      SPACING.sm,
  },
  card: {
    marginHorizontal: SPACING.lg,
    borderRadius:     RADIUS.xl,
    overflow:         'hidden',
  },
  optionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.md,
    borderBottomWidth: 0.5,
    minHeight:         60,
  },
  iconWrap: {
    width:          38,
    height:         38,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  optionLabel: {
    flex:       1,
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
  },
  optionDesc: {
    fontSize:  FONT_SIZE.xs,
    marginTop: 2,
  },
  radioEmpty: {
    width:        20,
    height:       20,
    borderRadius: 10,
    borderWidth:  1.5,
  },

  infoRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   SPACING.lg,
    borderBottomWidth: 0.5,
  },
  infoLabel: { fontSize: FONT_SIZE.sm },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
});
