import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { BF1Logo } from './ui/BF1Logo';
import { useTheme } from '../hooks/useTheme';
import { FONT_WEIGHT } from '../constants';

const TAGLINE = 'La chaîne au cœur de nos défis';
const HOLD_MS = 1600;
const FADE_MS = 600;

interface Props { onDone: () => void }

export function SplashScreen({ onDone }: Props) {
  const { theme, isDark } = useTheme();

  const screenOpacity = useRef(new Animated.Value(1)).current;
  const clipWidth     = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth === 0) return;

    const duration = TAGLINE.length * 55; // ~55ms par caractère

    Animated.timing(clipWidth, {
      toValue:         textWidth,
      duration,
      easing:          Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      const t = setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue:         0,
          duration:        FADE_MS,
          useNativeDriver: true,
        }).start(() => onDone());
      }, HOLD_MS);
      return () => clearTimeout(t);
    });
  }, [textWidth]);

  const textColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity, backgroundColor: theme.bg }]}>
      <BF1Logo size="xxl" />

      {/* Texte fantôme hors écran : mesure la largeur réelle sans être visible */}
      <Text
        numberOfLines={1}
        style={[styles.tagline, styles.ghost, { color: textColor }]}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && textWidth === 0) setTextWidth(w);
        }}
      >
        {TAGLINE}
      </Text>

      {/* Clip animé : révèle le texte de gauche à droite */}
      <Animated.View style={{ width: clipWidth, overflow: 'hidden' }}>
        <Text numberOfLines={1} style={[styles.tagline, { color: textColor }]}>
          {TAGLINE}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            32,
  },
  tagline: {
    fontSize:      16,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.4,
    flexShrink:    0,
  },
  ghost: {
    position: 'absolute',
    opacity:  0,
  },
});
