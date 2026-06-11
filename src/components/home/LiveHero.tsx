/**
 * LiveHero — player live 16:9 dans le scroll (comme YouTube).
 * Rendu directement dans le flux du ScrollView, pas de position:absolute.
 * Émet onVisibilityChange(false) quand il sort complètement de l'écran.
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_WEIGHT, RADIUS, LIVE_STREAM_URL, SCREEN } from '../../constants';

export const HERO_HEIGHT = SCREEN.W * (9 / 16);

function buildUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? LIVE_STREAM_URL;
  if (url?.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0&autoplay=1`;
  }
  return url;
}

interface Props {
  liveData: any;
  isOnAir:  boolean;
}

export function LiveHero({ liveData, isOnAir }: Props) {
  const { t }     = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const raw     = liveData?.current_program ?? liveData?.program_title ?? null;
  const program = raw ? (typeof raw === 'object' ? raw.title : raw) : null;
  const url     = buildUrl(liveData);

  return (
    <View style={[styles.hero, isOnAir && styles.heroOnAir]}>
      {/* ── WebView player ── */}
      <WebView
        source={{ uri: url }}
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

      {/* ── Badge EN DIRECT ── */}
      {isOnAir && (
        <View style={styles.liveBadge} pointerEvents="none">
          <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>{t.player.live}</Text>
        </View>
      )}

      {/* ── Infos bas ── */}
      <View style={styles.bottomBar} pointerEvents="none">
        <Text style={styles.channel}>{t.live.channelName}</Text>
        {program ? <Text style={styles.program} numberOfLines={1}>{program}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width:           SCREEN.W,
    height:          HERO_HEIGHT,
    backgroundColor: '#000',
    marginBottom:    28,
  },
  heroOnAir: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
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
});
