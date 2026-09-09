import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../hooks/useTheme';
import { useLiveStore } from '../stores';
import * as api from '../services/api';
import { getImageUrl } from '../utils';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SCREEN } from '../constants';
import type { LiveStackParams } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';

type Nav   = StackNavigationProp<LiveStackParams>;
type Route = RouteProp<LiveStackParams, 'LiveHighlightDetail'>;

const SW      = SCREEN.W;
const HERO_H  = Math.round(SCREEN.H / 2);
const VIDEO_H = Math.round(SW * 9 / 16);

function formatEventDate(dt?: string | null): { day: string; time: string } | null {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return { day: `${day}/${month}/${year}`, time: `${hours}:${mins}` };
}

export function LiveHighlightDetailScreen() {
  const { theme, isDark } = useTheme();
  const navigation         = useNavigation<Nav>();
  const route              = useRoute<Route>();
  const insets             = useSafeAreaInsets();
  const { id }             = route.params;
  const { setPlayerHidden } = useLiveStore();

  const [isPaused, setIsPaused]         = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Le lecteur global du direct ne doit jamais recouvrir cet écran de détail
  useEffect(() => {
    setPlayerHidden(true);
    return () => setPlayerHidden(false);
  }, [setPlayerHidden]);

  const { data: item, isLoading } = useQuery({
    queryKey: ['live-highlight', id],
    queryFn:  () => api.getLiveHighlightById(id),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
        <TouchableOpacity style={[styles.backAbsolute, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Icon name="alert-circle-outline" size={40} color={theme.text3} />
        <Text style={[styles.notFoundText, { color: theme.text3 }]}>Contenu introuvable</Text>
      </View>
    );
  }

  const hasVideo = !!item.video_url;
  const dateInfo = formatEventDate(item.event_date);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HERO : vidéo si disponible, sinon affiche immersive ──────────── */}
        {hasVideo ? (
          <View style={{ backgroundColor: '#000' }}>
            <View style={{ height: insets.top + 12, backgroundColor: '#000', width: '100%' }} />
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowControls(v => !v)}
              style={{ width: SW, height: VIDEO_H }}
            >
              <Video
                source={{ uri: item.video_url! }}
                style={StyleSheet.absoluteFill}
                controls={showControls}
                resizeMode="contain"
                paused={isPaused}
                onEnd={() => setIsPaused(true)}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.glassBtn, { position: 'absolute', top: insets.top + 8, left: SPACING.lg, zIndex: 99 }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.hero}>
            {item.image_url ? (
              <Image source={{ uri: getImageUrl(item.image_url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d0008' }]} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.92)']}
              locations={[0, 0.25, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />

            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandLabel}>À NE PAS MANQUER</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={3}>{item.title}</Text>
              {dateInfo ? (
                <View style={styles.dateBadge}>
                  <Icon name="calendar-outline" size={12} color={COLORS.white} />
                  <Text style={styles.dateBadgeText}>{dateInfo.day}</Text>
                  <View style={styles.dateBadgeSep} />
                  <Icon name="time-outline" size={12} color={COLORS.white} />
                  <Text style={styles.dateBadgeText}>{dateInfo.time}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* ── Corps ─────────────────────────────────────────────────────────── */}
        <View style={[styles.body, { backgroundColor: theme.bg }]}>
          {hasVideo && (
            <>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>{item.title}</Text>
              {dateInfo ? (
                <View style={styles.dateRow}>
                  <View style={[styles.dateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Icon name="calendar-outline" size={13} color={COLORS.primary} />
                    <Text style={[styles.dateChipText, { color: theme.text2 }]}>{dateInfo.day}</Text>
                  </View>
                  <View style={[styles.dateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Icon name="time-outline" size={13} color={COLORS.primary} />
                    <Text style={[styles.dateChipText, { color: theme.text2 }]}>{dateInfo.time}</Text>
                  </View>
                </View>
              ) : null}
            </>
          )}

          {item.description ? (
            <View style={styles.descSection}>
              <View style={styles.descHeader}>
                <View style={styles.descIconWrap}>
                  <Icon name="document-text-outline" size={14} color={COLORS.primary} />
                </View>
                <Text style={[styles.descLabel, { color: theme.text }]}>À propos</Text>
              </View>
              <Text style={[styles.descText, { color: theme.text2 }]}>{item.description}</Text>
            </View>
          ) : null}

          <View style={{ height: insets.bottom + SPACING.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  notFoundText: { fontSize: FONT_SIZE.sm },
  backAbsolute: { position: 'absolute', left: SPACING.lg, zIndex: 10, padding: 6 },

  // Hero image (sans vidéo) — immersif, style éditorial
  hero: {
    width:           '100%',
    height:          HERO_H,
    backgroundColor: '#000',
    justifyContent:  'flex-end',
  },
  heroTopBar: {
    position:          'absolute',
    top: 0, left: 0, right: 0,
    flexDirection:      'row',
    justifyContent:     'space-between',
    paddingHorizontal:  SPACING.lg,
    zIndex:             10,
  },
  heroBottom: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.xl,
    gap:               12,
  },
  glassBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(20,20,20,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  brandLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: FONT_WEIGHT.extrabold,
    lineHeight: 32,
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,20,20,0.6)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: 4,
  },
  dateBadgeText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  dateBadgeSep: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 2 },

  // Corps
  body: { flex: 1, padding: SPACING.lg, gap: SPACING.lg },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, lineHeight: 29, letterSpacing: -0.4 },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: -8 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  dateChipText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },

  descSection: { gap: 10 },
  descHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  descIconWrap: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: COLORS.redAlpha12,
    alignItems: 'center', justifyContent: 'center',
  },
  descLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, letterSpacing: -0.2 },
  descText: { fontSize: FONT_SIZE.sm, lineHeight: 23 },
});
