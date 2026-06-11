import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  uri?:         string | null;
  style?:       any;
  resizeMode?:  'cover' | 'contain' | 'stretch' | 'center';
  fallback?:    React.ReactNode;
}

export function ImageWithSkeleton({ uri, style, resizeMode = 'cover', fallback }: Props) {
  const { theme }   = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shimAnim  = useRef(new Animated.Value(0)).current;

  // Relancer si l'URI change
  useEffect(() => {
    setLoaded(false);
    setError(false);
    fadeAnim.setValue(0);
  }, [uri]);

  // Shimmer en boucle tant que non chargé
  useEffect(() => {
    if (loaded || error) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loaded, error]);

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        280,
      useNativeDriver: true,
    }).start();
  };

  const shimmerOpacity = shimAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.35, 0.75],
  });

  const showSkeleton = !loaded && !error;
  const showFallback = error || !uri;

  return (
    <View style={[styles.root, style]}>
      {/* Skeleton shimmer — visible tant que l'image n'est pas prête */}
      {showSkeleton && !showFallback && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.shimmer,
            { backgroundColor: theme.skeletonBg, opacity: shimmerOpacity },
          ]}
        />
      )}

      {/* Fallback (icône) si pas d'URI ou erreur */}
      {showFallback && fallback && (
        <View style={[StyleSheet.absoluteFill, styles.fallbackWrap]}>
          {fallback}
        </View>
      )}

      {/* Image réelle — fade-in à l'arrivée */}
      {uri && !error && (
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
          resizeMode={resizeMode}
          onLoad={onLoad}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { overflow: 'hidden', backgroundColor: 'transparent' },
  shimmer:      { borderRadius: 0 },
  fallbackWrap: { alignItems: 'center', justifyContent: 'center' },
});
