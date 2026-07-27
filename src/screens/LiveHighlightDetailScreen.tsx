import React, { useState } from 'react';
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
import * as api from '../services/api';
import { getImageUrl } from '../utils';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SCREEN } from '../constants';
import type { LiveStackParams } from '../navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';

type Nav   = StackNavigationProp<LiveStackParams>;
type Route = RouteProp<LiveStackParams, 'LiveHighlightDetail'>;

const SW = SCREEN.W;
const HERO_H = SW * 9 / 16;

function formatEventDate(dt?: string | null): string | null {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return null;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins  = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} à ${hours}:${mins}`;
}

export function LiveHighlightDetailScreen() {
  const { theme, isDark } = useTheme();
  const navigation        = useNavigation<Nav>();
  const route              = useRoute<Route>();
  const insets             = useSafeAreaInsets();
  const { id }             = route.params;

  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── HERO : vidéo si disponible, sinon affiche ────────────────────── */}
        {hasVideo ? (
          <View style={{ backgroundColor: '#000' }}>
            <View style={{ height: insets.top + 12, backgroundColor: '#000', width: '100%' }} />
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowControls(v => !v)}
              style={{ width: SW, height: HERO_H }}
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
              style={[styles.iconBtn, { position: 'absolute', top: insets.top + 8, left: SPACING.lg, zIndex: 99 }]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={22} color="#fff" />
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
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />
            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroBottom}>
              {formatEventDate(item.event_date) ? (
                <View style={styles.dateBadge}>
                  <Icon name="calendar-outline" size={11} color="#fff" />
                  <Text style={styles.dateBadgeText}>{formatEventDate(item.event_date)}</Text>
                </View>
              ) : null}
              <Text style={styles.heroTitle} numberOfLines={3}>{item.title}</Text>
            </View>
          </View>
        )}

        {/* ── Corps ─────────────────────────────────────────────────────────── */}
        <View style={[styles.body, { backgroundColor: theme.bg }]}>
          {hasVideo && (
            <>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>{item.title}</Text>
              {formatEventDate(item.event_date) ? (
                <View style={styles.dateRow}>
                  <Icon name="calendar-outline" size={14} color={theme.text3} />
                  <Text style={[styles.dateRowText, { color: theme.text3 }]}>{formatEventDate(item.event_date)}</Text>
                </View>
              ) : null}
            </>
          )}

          {item.description ? (
            <View style={[styles.descCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.descLabel, { color: COLORS.primary }]}>Description</Text>
              <Text style={[styles.descText, { color: theme.text2 }]}>{item.description}</Text>
            </View>
          ) : null}
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

  // Hero image (sans vidéo)
  hero: {
    width:           '100%',
    height:          HERO_H + 70,
    backgroundColor: '#000',
    justifyContent:  'flex-end',
  },
  heroTopBar: {
    position:          'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal:  SPACING.lg,
    zIndex:             10,
  },
  heroBottom: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     SPACING.xl,
    gap:               10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(226,62,62,0.9)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dateBadgeText: { color: '#fff', fontSize: FONT_SIZE.xxs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.3 },
  heroTitle: {
    color: '#fff',
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    lineHeight: 28,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // Corps
  body: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, lineHeight: 25 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  dateRowText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  descCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 6,
  },
  descLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5, textTransform: 'uppercase' },
  descText: { fontSize: FONT_SIZE.sm, lineHeight: 21 },
});
