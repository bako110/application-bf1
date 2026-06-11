import React, { useEffect, useRef, useState } from 'react';
import {
  Text, Animated, StyleSheet,
} from 'react-native';
import { COLORS, FONT_WEIGHT } from '../constants';
import { BF1Logo } from './ui/BF1Logo';
import { useTheme } from '../hooks/useTheme';

const CHAR_MS = 60;
const FADE_MS = 500;

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const { theme, isDark } = useTheme();

  const TAGLINE = 'La chaîne au cœur de nos défis';

  const [text, setText] = useState('');

  const fadeAnim    = useRef(new Animated.Value(1)).current;
  const glowAnim    = useRef(new Animated.Value(0.2)).current;
  const logoScale   = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.55, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    let typeTimer: ReturnType<typeof setInterval>;

    Animated.parallel([
      Animated.timing(logoScale,   { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      let i = 0;
      typeTimer = setInterval(() => {
        i++;
        setText(TAGLINE.slice(0, i));
        if (i >= TAGLINE.length) {
          clearInterval(typeTimer);
          glowLoop.stop();
          Animated.timing(fadeAnim, {
            toValue:  0,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => onDone());
        }
      }, CHAR_MS);
    });

    return () => {
      clearInterval(typeTimer);
      glowLoop.stop();
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.bg }]}>
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
        <BF1Logo size="xxl" />
      </Animated.View>

      <Text style={[styles.tagline, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)' }]}>
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
  },
  glow: {
    position:        'absolute',
    width:           220,
    height:          220,
    borderRadius:    110,
    backgroundColor: 'transparent',
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    80,
    elevation:       0,
  },
  tagline: {
    fontSize:      16,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
    marginTop:     40,
  },
});
