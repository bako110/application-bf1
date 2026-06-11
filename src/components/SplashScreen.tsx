import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BF1Logo } from './ui/BF1Logo';
import { useTheme } from '../hooks/useTheme';
import { FONT_WEIGHT } from '../constants';

const TAGLINE  = 'La chaîne au cœur de nos défis';
const CHAR_MS  = 70;    // vitesse frappe
const HOLD_MS  = 1500;  // pause après texte complet avant fade out
const FADE_OUT = 600;   // écran fade out

interface Props { onDone: () => void }

export function SplashScreen({ onDone }: Props) {
  const { theme, isDark } = useTheme();
  const [text, setText]   = useState('');

  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let typeTimer: ReturnType<typeof setInterval>;
    let holdTimer: ReturnType<typeof setTimeout>;

    // 1. Typewriter
    let i = 0;
    typeTimer = setInterval(() => {
      i++;
      setText(TAGLINE.slice(0, i));
      if (i >= TAGLINE.length) {
        clearInterval(typeTimer);

        // 2. Pause pour lire
        holdTimer = setTimeout(() => {
          Animated.timing(screenOpacity, {
            toValue:        0,
            duration:       FADE_OUT,
            useNativeDriver: true,
          }).start(() => onDone());
        }, HOLD_MS);
      }
    }, CHAR_MS);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(holdTimer);
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity, backgroundColor: theme.bg }]}>
      <BF1Logo size="xxl" />

      <Text style={[styles.tagline, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }]}>
        {text}
      </Text>
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
    textAlign:     'center',
    minHeight:     22,
  },
});
