/**
 * LivePlayer — une seule WebView, deux modes visuels.
 *
 * Usage dans HomeScreen :
 *   - <LivePlaceholder ref={ref} isOnAir={...} />   ← dans le ScrollView (garde la place)
 *   - <LiveWebView placeholderRef={ref} ... />       ← dans le root View (position absolute)
 *
 * La WebView ne se démonte JAMAIS → stream continu sans rechargement.
 */
import React, {
  useRef, useEffect, useCallback, forwardRef,
} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_WEIGHT, RADIUS, LIVE_STREAM_URL, SCREEN, MINI_PLAYER_W, MINI_PLAYER_H } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';

const W        = SCREEN.W;
const SCREEN_H = SCREEN.H;

export const HERO_HEIGHT = W * (9 / 16);

const MINI_W   = MINI_PLAYER_W;
const MINI_H   = MINI_PLAYER_H;
const ANIM_MS  = 260;
const HEADER_H = 70; // doit correspondre à HomeScreen HEADER_H
const HERO_TOP_MARGIN = 12; // marginTop du placeholder

function buildUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? LIVE_STREAM_URL;
  if (url?.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0&autoplay=1`;
  }
  return url;
}

// ─── 1. Placeholder dans le ScrollView ───────────────────────────────────────

interface PlaceholderProps {
  isOnAir: boolean;
  onLayout?: () => void;
}

export const LivePlaceholder = forwardRef<View, PlaceholderProps>(
  ({ isOnAir, onLayout }, ref) => (
    <View
      ref={ref}
      onLayout={onLayout}
      style={[styles.placeholder, isOnAir && styles.placeholderOnAir]}
      collapsable={false}
    />
  ),
);

// ─── 2. WebView flottante dans le root View ───────────────────────────────────

interface WebViewProps {
  liveData:       any;
  isOnAir:        boolean;
  heroOut:        boolean;
  miniDismissed:  boolean;
  onDismiss:      () => void;
  onExpand:       () => void;
  placeholderRef: React.RefObject<View | null>;
}

export function LiveWebView({
  liveData, isOnAir, heroOut, miniDismissed,
  onDismiss, onExpand, placeholderRef,
}: WebViewProps) {
  const insets    = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { t }     = useTranslation();

  const BOTTOM_Y = SCREEN_H - (insets.bottom + 72) - MINI_H;
  const MINI_X   = W - MINI_W - 12;

  // Animated values — cachés hors écran jusqu'à la première mesure
  const animLeft   = useRef(new Animated.Value(0)).current;
  const animTop    = useRef(new Animated.Value(-SCREEN_H)).current;
  const animWidth  = useRef(new Animated.Value(W)).current;
  const animHeight = useRef(new Animated.Value(HERO_HEIGHT)).current;
  const animRadius = useRef(new Animated.Value(0)).current;

  const showMini = heroOut && !miniDismissed;

  // Position fixe du hero quand scroll = 0
  const heroTopY = insets.top + HEADER_H + HERO_TOP_MARGIN;

  // Mesure la position exacte du placeholder et cale la WebView dessus
  const measureAndSnap = useCallback(() => {
    if (showMini) return;
    placeholderRef.current?.measureInWindow((_x, y) => {
      animLeft.setValue(0);
      animTop.setValue(y > 0 ? y : heroTopY);
      animWidth.setValue(W);
      animHeight.setValue(HERO_HEIGHT);
      animRadius.setValue(0);
    });
  }, [showMini, heroTopY]);

  // Mesure dès le mount puis après chaque retour en mode hero
  useEffect(() => {
    if (!showMini) {
      // Tentatives successives pour couvrir les délais de layout Android
      const t1 = setTimeout(measureAndSnap, 0);
      const t2 = setTimeout(measureAndSnap, 150);
      const t3 = setTimeout(measureAndSnap, 400);
      const t4 = setTimeout(measureAndSnap, 700);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [showMini]);

  // Transition hero ↔ mini
  useEffect(() => {
    const cfg = { duration: ANIM_MS, useNativeDriver: false } as const;
    if (showMini) {
      Animated.parallel([
        Animated.timing(animLeft,   { toValue: MINI_X,    ...cfg }),
        Animated.timing(animTop,    { toValue: BOTTOM_Y,  ...cfg }),
        Animated.timing(animWidth,  { toValue: MINI_W,    ...cfg }),
        Animated.timing(animHeight, { toValue: MINI_H,    ...cfg }),
        Animated.timing(animRadius, { toValue: RADIUS.md, ...cfg }),
      ]).start();
    } else {
      // Snap immédiat à la bonne taille, puis anime vers la position du placeholder
      animWidth.setValue(W);
      animHeight.setValue(HERO_HEIGHT);
      animRadius.setValue(0);
      // Mesure après que le scroll soit stabilisé
      const snap = () => {
        placeholderRef.current?.measureInWindow((_x, y) => {
          const ty = y > 0 ? y : heroTopY;
          Animated.parallel([
            Animated.timing(animLeft, { toValue: 0,  ...cfg }),
            Animated.timing(animTop,  { toValue: ty, ...cfg }),
          ]).start();
        });
      };
      // Deux passes : immédiate + après scroll complet
      snap();
      const t = setTimeout(snap, 300);
      return () => clearTimeout(t);
    }
  }, [showMini]);

  // Badge pulse
  useEffect(() => {
    if (!isOnAir) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isOnAir]);

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          left:         animLeft,
          top:          animTop,
          width:        animWidth,
          height:       animHeight,
          borderRadius: animRadius,
        },
      ]}
      pointerEvents="box-none"
    >
      <WebView
        source={{ uri: buildUrl(liveData) }}
        style={StyleSheet.absoluteFill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      {/* Overlays MODE HERO */}
      {!showMini && (
        <>
          {isOnAir && (
            <View style={styles.liveBadge} pointerEvents="none">
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>{t.player.live}</Text>
            </View>
          )}
        </>
      )}

      {/* Overlays MODE MINI */}
      {showMini && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill]}
            activeOpacity={0.9}
            onPress={onExpand}
          />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon name="close" size={11} color="#fff" />
          </TouchableOpacity>
          {isOnAir && <View style={styles.miniDot} pointerEvents="none" />}
        </>
      )}
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  placeholder: {
    width:            '100%',
    aspectRatio:      16 / 9,
    backgroundColor:  '#000',
    marginTop:        15,
    marginBottom:     28,
  },
  placeholderOnAir: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  floatingContainer: {
    position:      'absolute',
    overflow:      'hidden',
    zIndex:        150,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius:  18,
    elevation:     18,
  },

  // Hero overlays
  liveBadge: {
    position:          'absolute',
    top:               10,
    left:              12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   'rgba(226,62,62,0.88)',
    borderRadius:      RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical:   4,
    zIndex:            10,
  },
  dot: {
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: '#fff',
  },
  liveText: {
    color:         '#fff',
    fontSize:      11,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom:   10,
    left:     12,
    right:    12,
    zIndex:   10,
    gap:      3,
  },
  channel: {
    color:            '#fff',
    fontSize:         14,
    fontWeight:       FONT_WEIGHT.bold,
    textShadowColor:  'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  program: {
    color:            'rgba(255,255,255,0.82)',
    fontSize:         12,
    textShadowColor:  'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Mini overlays
  closeBtn: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          20,
  },
  miniDot: {
    position:        'absolute',
    top:             6,
    left:            6,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.primary,
    zIndex:          10,
  },
});
