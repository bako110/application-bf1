/**
 * LiveMiniPlayer — mini player fixé en bas-droite (position:fixed bottom:80 right:12 width:210).
 * Réplique exacte du comportement bf1_tv_mobile : live--mini style.
 * - Clic sur la vidéo → scrolle vers le haut (hero visible) + ferme mini
 * - Bouton × → ferme et ne remontre pas jusqu'à scroll retour
 */
import React, { useRef, useEffect } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, RADIUS, LIVE_STREAM_URL, MINI_PLAYER_W, MINI_PLAYER_H } from '../../constants';

const MINI_W = MINI_PLAYER_W;
const MINI_H = MINI_PLAYER_H;

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
  visible:  boolean;
  onClose:  () => void;  // × button → dismiss permanently
  onExpand: () => void;  // tap video → scroll back to hero
}

export function LiveMiniPlayer({ liveData, isOnAir, visible, onClose, onExpand }: Props) {
  const insets    = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(MINI_H + 120)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue:         visible ? 0 : MINI_H + 120,
      useNativeDriver: true,
      tension:         80,
      friction:        14,
    }).start();
  }, [visible]);

  // Above tab bar (72) + safe area
  const BOTTOM = insets.bottom + 72;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: BOTTOM, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      {/* Video — tap to go back to hero */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onExpand}
        style={styles.videoWrap}
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
      </TouchableOpacity>

      {/* × close button — top-right, stops propagation */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
      >
        <Icon name="close" size={12} color="#fff" />
      </TouchableOpacity>

      {/* EN DIRECT dot — top-left */}
      {isOnAir && <View style={styles.liveDot} pointerEvents="none" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:     'absolute',
    right:        12,
    width:        MINI_W,
    height:       MINI_H,
    borderRadius: RADIUS.md,
    overflow:     'hidden',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius:  32,
    elevation:    24,
    zIndex:       200,
  },
  videoWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
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
  liveDot: {
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
