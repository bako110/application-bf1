import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SCREEN, PLAY_BTN_SIZE } from '../../constants';
import * as api from '../../services/api';

interface Props {
  onPress: () => void;
}

const SCREEN_W    = SCREEN.W;
const HERO_HEIGHT = SCREEN_W * (9 / 16);

function formatViewers(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

export function LiveBanner({ onPress }: Props) {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: liveData } = useQuery({
    queryKey:        ['live-status'],
    queryFn:         () => api.getLive(),
    refetchInterval: 30_000,
    staleTime:       20_000,
  });

  const isOnAir  = !!liveData?.is_live;
  const viewers  = liveData?.viewers ?? 0;
  const thumbUrl = liveData?.thumbnail_url ?? liveData?.preview_url ?? liveData?.thumbnail ?? null;
  // current_program peut être un objet {title,description,...} ou une string
  const rawProgram = liveData?.current_program ?? liveData?.program_title ?? null;
  const program = rawProgram
    ? (typeof rawProgram === 'object' ? rawProgram.title : rawProgram)
    : null;

  useEffect(() => {
    if (!isOnAir) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isOnAir]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.hero, isOnAir && styles.heroOnAir]}
    >
      {/* Image de fond 16:9 */}
      <View style={styles.thumbArea}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['#1a0000', '#2d0505', '#0d0000']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Overlay dégradé bas pour lisibilité */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={[StyleSheet.absoluteFill, { top: '40%' }]}
          pointerEvents="none"
        />

        {/* Badge EN DIRECT — haut gauche */}
        {isOnAir && (
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>{t.player.live}</Text>
          </View>
        )}

        {/* Badge viewers — haut droite */}
        {viewers > 0 && (
          <View style={styles.viewersBadge}>
            <Icon name="eye-outline" size={11} color="#fff" />
            <Text style={styles.viewersText}>{formatViewers(viewers)}</Text>
          </View>
        )}

        {/* Icône play centrale si pas de thumbnail */}
        {!thumbUrl && (
          <View style={styles.playCenter}>
            <View style={styles.playCircleLarge}>
              <Icon name="play" size={32} color={COLORS.white} />
            </View>
          </View>
        )}

        {/* Infos bas de l'image */}
        {program ? (
          <View style={styles.bottomInfo}>
            <Text style={styles.programName} numberOfLines={1}>{program}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    width:         SCREEN_W,
    marginBottom:  28,
    position:      'relative',
  },
  heroOnAir: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  thumbArea: {
    width:           SCREEN_W,
    height:          HERO_HEIGHT,
    backgroundColor: '#000',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },

  // Badge EN DIRECT haut-gauche
  liveBadge: {
    position:        'absolute',
    top:             10,
    left:            12,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    backgroundColor: 'rgba(226,62,62,0.85)',
    borderRadius:    RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    zIndex:          10,
  },
  liveDot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color:         '#fff',
    fontSize:      11,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.5,
  },

  // Viewers haut-droite
  viewersBadge: {
    position:        'absolute',
    top:             10,
    right:           12,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius:    RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical:   4,
    zIndex:          10,
  },
  viewersText: {
    color:      '#fff',
    fontSize:   11,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Icône play si pas de thumb
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         5,
  },
  playCircleLarge: {
    width:           PLAY_BTN_SIZE,
    height:          PLAY_BTN_SIZE,
    borderRadius:    PLAY_BTN_SIZE / 2,
    backgroundColor: 'rgba(226,62,62,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.5,
    shadowRadius:    12,
    elevation:       8,
  },

  // Infos texte bas de l'image
  bottomInfo: {
    position: 'absolute',
    bottom:   12,
    left:     12,
    right:    12,
    zIndex:   10,
    gap:      3,
  },
  channelName: {
    color:      '#fff',
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  programName: {
    color:    'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.sm,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
