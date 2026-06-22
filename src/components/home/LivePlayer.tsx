/**
 * LivePlayer — WebView unique, transition hero ↔ mini 100% interpolée.
 * Zéro setState pour la transition — tout via Animated.interpolate sur scrollY.
 * La WebView ne se démonte JAMAIS → stream continu sans rechargement.
 */
import React, {
  useRef, useEffect, useCallback, useState, forwardRef,
} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  COLORS, FONT_WEIGHT, RADIUS, LIVE_STREAM_URL,
  SCREEN, MINI_PLAYER_W, MINI_PLAYER_H,
} from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';

const W        = SCREEN.W;
const SCREEN_H = SCREEN.H;

export const HERO_HEIGHT = W * (9 / 16);

const MINI_W      = MINI_PLAYER_W;
const MINI_H      = MINI_PLAYER_H;
const HEADER_H    = 70;
const HERO_MARGIN = 15;

// Plage de scroll pendant laquelle la transition se produit
const SCROLL_START = HERO_HEIGHT * 0.4;
const SCROLL_END   = HERO_HEIGHT * 0.82;

function buildUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? LIVE_STREAM_URL;
  if (url?.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0&autoplay=1`;
  }
  return url;
}

// ─── Placeholder ─────────────────────────────────────────────────────────────

interface PlaceholderProps { isOnAir: boolean }

export const LivePlaceholder = forwardRef<View, PlaceholderProps>(
  ({ isOnAir }, ref) => (
    <View
      ref={ref}
      style={[styles.placeholder, isOnAir && styles.placeholderOnAir]}
      collapsable={false}
    />
  ),
);

// ─── WebView flottante ────────────────────────────────────────────────────────

interface WebViewProps {
  liveData:        any;
  isOnAir:         boolean;
  scrollY:         Animated.Value;
  miniDismissed:   boolean;
  onDismiss:       () => void;
  onExpand:        () => void;
  placeholderRef:  React.RefObject<View | null>;
  isScreenFocused: boolean;
}

export function LiveWebView({
  liveData, isOnAir, scrollY,
  miniDismissed, onDismiss, onExpand, placeholderRef,
  isScreenFocused,
}: WebViewProps) {
  const insets      = useSafeAreaInsets();
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const { t }       = useTranslation();
  const webViewRef  = useRef<any>(null);
  const isMutedRef  = useRef(false);

  // Positions cibles (constantes après calcul)
  const BOTTOM_Y = SCREEN_H - (insets.bottom + 72) - MINI_H;
  const MINI_X   = W - MINI_W - 12;
  const HERO_TOP = insets.top + HEADER_H + HERO_MARGIN;

  // ── Animated values stables (créées une seule fois dans useRef) ──────────────

  // dismissedAnim : 0 = visible, 1 = dismissed
  const dismissedAnim = useRef(new Animated.Value(0)).current;

  // heroTop : initialisé à la valeur calculée, mis à jour après mesure du placeholder
  const heroTopAnim = useRef(new Animated.Value(HERO_TOP)).current;

  // progress brut (0→1) basé sur scrollY
  const rawProgress = useRef(
    scrollY.interpolate({
      inputRange:  [SCROLL_START, SCROLL_END],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  ).current;

  // effectiveProgress = rawProgress × (1 - dismissedAnim)
  // quand dismissed=1 → effectiveProgress=0 → retour position hero
  const effectiveProgress = useRef(
    Animated.multiply(
      rawProgress,
      Animated.subtract(new Animated.Value(1), dismissedAnim),
    ),
  ).current;

  // Toutes les interpolations dans des useRef — créées une seule fois
  const animWidth = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: [W, MINI_W],
      extrapolate: 'clamp',
    }),
  ).current;

  const animHeight = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: [HERO_HEIGHT, MINI_H],
      extrapolate: 'clamp',
    }),
  ).current;

  const animLeft = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: [0, MINI_X],
      extrapolate: 'clamp',
    }),
  ).current;

  const animRadius = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: [0, RADIUS.xl],
      extrapolate: 'clamp',
    }),
  ).current;

  // animTop : on interpole entre heroTopAnim (dynamique) et BOTTOM_Y
  // On utilise une value séparée pilotée par effectiveProgress
  const animTopProgress = useRef(new Animated.Value(0)).current;
  const animTop = useRef(
    Animated.add(
      heroTopAnim,
      Animated.multiply(
        animTopProgress,
        new Animated.Value(BOTTOM_Y - HERO_TOP),
      ),
    ),
  ).current;

  // Sync animTopProgress sur effectiveProgress via listener
  // (Animated.add/multiply ne supporte pas interpolate chaîné avec des valeurs dynamiques)
  useEffect(() => {
    const id = effectiveProgress.addListener(({ value }) => {
      animTopProgress.setValue(value);
    });
    return () => effectiveProgress.removeListener(id);
  }, []);

  // Opacités overlays
  const miniOpacity = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0.75, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  ).current;

  const heroOpacity = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 0.25],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
  ).current;

  // Shadow opacity (plus d'ombre en mode mini)
  const shadowOpacity = useRef(
    effectiveProgress.interpolate({
      inputRange:  [0, 1],
      outputRange: [0, 0.55],
      extrapolate: 'clamp',
    }),
  ).current;

  // ── Dismiss ───────────────────────────────────────────────────────────────────

  // ── Mute / unmute sans rechargement ──────────────────────────────────────────
  const mute = useCallback(() => {
    if (isMutedRef.current) return;
    isMutedRef.current = true;
    webViewRef.current?.injectJavaScript(
      'try{document.querySelectorAll("video,audio").forEach(function(m){m.muted=true});}catch(e){}true;'
    );
  }, []);

  const unmute = useCallback(() => {
    if (!isMutedRef.current) return;
    isMutedRef.current = false;
    webViewRef.current?.injectJavaScript(
      'try{document.querySelectorAll("video,audio").forEach(function(m){m.muted=false});}catch(e){}true;'
    );
  }, []);

  // ── Dismiss ───────────────────────────────────────────────────────────────────
  // offscreenX : déplace hors écran sans opacity=0 → WebView continue de jouer
  const offscreenX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (miniDismissed) {
      mute();
      // Petit délai pour que l'animation de fermeture soit visible
      setTimeout(() => {
        offscreenX.setValue(W * 2);
        dismissedAnim.setValue(1);
      }, 160);
    } else {
      offscreenX.setValue(0);
      dismissedAnim.setValue(0);
    }
  }, [miniDismissed, mute]);

  // Quand le scroll revient en haut → unmute + reset dismiss
  useEffect(() => {
    const id = rawProgress.addListener(({ value }) => {
      if (value < 0.05) {
        dismissedAnim.setValue(0);
        unmute();
      }
    });
    return () => rawProgress.removeListener(id);
  }, [unmute]);

  // Quand l'écran perd le focus (navigation vers un autre tab/screen) → mute
  // Quand il revient → unmute si pas dismissed
  useEffect(() => {
    if (!isScreenFocused) {
      mute();
    } else if (!miniDismissed) {
      unmute();
    }
  }, [isScreenFocused, miniDismissed, mute, unmute]);

  // ── Mesure du placeholder ─────────────────────────────────────────────────────

  const measure = useCallback(() => {
    placeholderRef.current?.measureInWindow((_x, y) => {
      if (y > 0) heroTopAnim.setValue(y);
    });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 300);
    const t3 = setTimeout(measure, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // ── État isMini (léger, juste pour pointerEvents) ─────────────────────────────

  const [isMini, setIsMini] = useState(false);
  useEffect(() => {
    const id = rawProgress.addListener(({ value }) => {
      setIsMini(value > 0.88 && !miniDismissed);
    });
    return () => rawProgress.removeListener(id);
  }, [miniDismissed]);

  // ── Badge pulsé EN DIRECT ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOnAir) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isOnAir]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Animated.View
      style={{ position: 'absolute', zIndex: 150, transform: [{ translateX: offscreenX }] }}
      pointerEvents={isMini && !miniDismissed ? 'auto' : 'none'}
    >
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          left:         animLeft,
          top:          animTop,
          width:        animWidth,
          height:       animHeight,
          borderRadius: animRadius,
          shadowOpacity,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Bordure rouge subtile en mode mini */}
      <Animated.View
        style={[styles.miniBorder, { opacity: miniOpacity }]}
        pointerEvents="none"
      />

      <WebView
        ref={webViewRef}
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

      {/* Gradient bas en mode hero */}
      <Animated.View style={[styles.heroGradient, { opacity: heroOpacity }]} pointerEvents="none" />

      {/* Badge EN DIRECT */}
      {isOnAir && (
        <Animated.View style={[styles.liveBadge, { opacity: heroOpacity }]} pointerEvents="none">
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>{t.player.live}</Text>
        </Animated.View>
      )}

      {/* Overlays mini */}
      <Animated.View
        style={[styles.miniOverlay, { opacity: miniOpacity }]}
        pointerEvents={isMini ? 'box-none' : 'none'}
      >
        {/* Tap zone expand */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.85}
          onPress={onExpand}
        />
        {/* Bouton fermer */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Icon name="close" size={10} color="#fff" />
        </TouchableOpacity>
        {/* Point EN DIRECT mini */}
        {isOnAir && (
          <View style={styles.miniLiveBadge} pointerEvents="none">
            <View style={styles.miniDot} />
            <Text style={styles.miniLiveText}>LIVE</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  placeholder: {
    width:           '100%',
    aspectRatio:     16 / 9,
    backgroundColor: '#000',
    marginTop:       HERO_MARGIN,
    marginBottom:    28,
  },
  placeholderOnAir: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  floatingContainer: {
    position:     'absolute',
    overflow:     'hidden',
    zIndex:       150,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation:    20,
  },
  miniBorder: {
    position:      'absolute',
    inset:         0,
    borderRadius:  RADIUS.xl,
    borderWidth:   1.5,
    borderColor:   COLORS.primary,
    zIndex:        30,
    pointerEvents: 'none',
  } as any,
  heroGradient: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   60,
    zIndex:   5,
  },

  // Badge hero
  liveBadge: {
    position:          'absolute',
    top:               12,
    left:              14,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   COLORS.redAlpha90,
    borderRadius:      RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical:   5,
    zIndex:            10,
  },
  liveDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: '#fff',
  },
  liveText: {
    color:         '#fff',
    fontSize:      11,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 1,
  },

  // Overlay mini
  miniOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  closeBtn: {
    position:        'absolute',
    top:             7,
    right:           7,
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          20,
  },
  miniLiveBadge: {
    position:        'absolute',
    bottom:          7,
    left:            8,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius:    RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical:   3,
  },
  miniDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: COLORS.primary,
  },
  miniLiveText: {
    color:         '#fff',
    fontSize:      9,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.8,
  },
});
