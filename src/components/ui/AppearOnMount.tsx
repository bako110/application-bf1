import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Rang dans la cascade — chaque unité ajoute `stagger` ms de délai. */
  index?: number;
  /** Délai entre deux éléments consécutifs (ms). */
  stagger?: number;
  /** Distance de la glissade verticale au départ (px, positif = vient du bas). */
  offsetY?: number;
  /** Durée de l'animation (ms). */
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Fait apparaître son contenu en glissant du bas + fondu + léger rebond d'échelle.
 * Utilisé en cascade sur les sections de l'accueil (elles « tombent » une à une).
 */
export function AppearOnMount({
  children,
  index = 0,
  stagger = 90,
  offsetY = 28,
  duration = 460,
  style,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * stagger;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo-like : arrivée nette puis pose douce
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [index, stagger, duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offsetY, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.96, 1.01, 1],
  });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}
