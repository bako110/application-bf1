import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_WEIGHT, RADIUS, LIVE_STREAM_URL, SCREEN, MINI_PLAYER_W, MINI_PLAYER_H } from '../../constants';

const SCREEN_W  = SCREEN.W;
const SCREEN_H  = SCREEN.H;
const HERO_H    = SCREEN_W * (9 / 16);
const MINI_W    = MINI_PLAYER_W;
const MINI_H    = MINI_PLAYER_H;
const MINI_RIGHT = 12;

function buildPlayerUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? LIVE_STREAM_URL;
  if (url?.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0`;
  }
  return url;
}

interface Props {
  liveData:  any;
  isOnAir:   boolean;
  /** Position Y du placeholder hero dans la fenêtre (depuis measureInWindow) */
  heroY:     number;
  /** true → mode mini-player */
  isMini:    boolean;
  onClose:   () => void;
  onGoLive:  () => void;
}

export function LivePlayerOverlay({ liveData, isOnAir, heroY, isMini, onClose, onGoLive }: Props) {
  const { t }  = useTranslation();
  const insets = useSafeAreaInsets();

  // ── Animated values (toutes en top/left pour cohérence) ──────────────────
  const animLeft   = useRef(new Animated.Value(0)).current;
  const animTop    = useRef(new Animated.Value(heroY)).current;
  const animWidth  = useRef(new Animated.Value(SCREEN_W)).current;
  const animHeight = useRef(new Animated.Value(HERO_H)).current;
  const animRadius = useRef(new Animated.Value(0)).current;

  // ── Pulse badge EN DIRECT ─────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isOnAir) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isOnAir]);

  // ── Transition hero ↔ mini ────────────────────────────────────────────────
  useEffect(() => {
    const cfg = { useNativeDriver: false as const, tension: 80, friction: 12 };
    // Position mini : bas-droite
    const miniLeft = SCREEN_W - MINI_W - MINI_RIGHT;
    const miniTop  = SCREEN_H - MINI_H - (insets.bottom + 70);

    if (isMini) {
      Animated.parallel([
        Animated.spring(animLeft,   { ...cfg, toValue: miniLeft }),
        Animated.spring(animTop,    { ...cfg, toValue: miniTop  }),
        Animated.spring(animWidth,  { ...cfg, toValue: MINI_W   }),
        Animated.spring(animHeight, { ...cfg, toValue: MINI_H   }),
        Animated.spring(animRadius, { ...cfg, toValue: RADIUS.lg }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(animLeft,   { ...cfg, toValue: 0        }),
        Animated.spring(animTop,    { ...cfg, toValue: heroY    }),
        Animated.spring(animWidth,  { ...cfg, toValue: SCREEN_W }),
        Animated.spring(animHeight, { ...cfg, toValue: HERO_H   }),
        Animated.spring(animRadius, { ...cfg, toValue: 0        }),
      ]).start();
    }
  }, [isMini, heroY, insets.bottom]);

  // ── Programme en cours ────────────────────────────────────────────────────
  const raw     = liveData?.current_program ?? liveData?.program_title ?? null;
  const program = raw ? (typeof raw === 'object' ? raw.title : raw) : t.live.channelName;

  return (
    /*
      Un seul Animated.View — WebView toujours monté.
      Position top/left calculée pour couvrir le placeholder (hero)
      ou se fixer en bas-droite (mini). Le stream ne se coupe jamais.
    */
    <Animated.View
      style={[
        styles.base,
        {
          left:         animLeft,
          top:          animTop,
          width:        animWidth,
          height:       animHeight,
          borderRadius: animRadius,
        },
        isOnAir && !isMini && styles.heroOnAir,
        isMini        && styles.miniBorder,
      ]}
    >
      {/* WebView — unique instance, ne se recharge jamais */}
      <WebView
        source={{ uri: buildPlayerUrl(liveData) }}
        style={StyleSheet.absoluteFill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
      />

      {/* ── Overlays hero ────────────────────────────────────────────── */}
      {!isMini && (
        <>
          {isOnAir && (
            <View style={styles.liveBadge} pointerEvents="none">
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveBadgeText}>{t.player.live}</Text>
            </View>
          )}
          <View style={styles.bottomInfo} pointerEvents="none">
            <Text style={styles.channelName}>BF1 Télévision</Text>
            {program ? <Text style={styles.programName} numberOfLines={1}>{program}</Text> : null}
          </View>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onGoLive} activeOpacity={0.0} />
        </>
      )}

      {/* ── Overlays mini ────────────────────────────────────────────── */}
      {isMini && (
        <>
          {isOnAir && (
            <View style={styles.miniBadge} pointerEvents="none">
              <View style={styles.miniDot} />
            </View>
          )}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onGoLive} activeOpacity={0.85} />
          <TouchableOpacity
            onPress={onClose}
            style={styles.miniClose}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon name="close" size={12} color={COLORS.white} />
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    position:      'absolute',
    overflow:      'hidden',
    zIndex:        100,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius:  16,
    elevation:     20,
  },
  heroOnAir: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  miniBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  // Badge EN DIRECT hero
  liveBadge: {
    position:          'absolute',
    top:               10,
    left:              12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   'rgba(226,62,62,0.85)',
    borderRadius:      RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    zIndex:            10,
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

  // Texte bas hero
  bottomInfo: {
    position: 'absolute',
    bottom:   12,
    left:     12,
    right:    12,
    zIndex:   10,
    gap:      3,
  },
  channelName: {
    color:            '#fff',
    fontSize:         15,
    fontWeight:       FONT_WEIGHT.bold,
    textShadowColor:  'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  programName: {
    color:            'rgba(255,255,255,0.8)',
    fontSize:         12,
    textShadowColor:  'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Mini
  miniBadge: { position: 'absolute', top: 5, left: 5, zIndex: 10 },
  miniDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.primary,
  },
  miniClose: {
    position:        'absolute',
    top:             4,
    right:           4,
    zIndex:          20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius:    RADIUS.full,
    width:           20,
    height:          20,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
