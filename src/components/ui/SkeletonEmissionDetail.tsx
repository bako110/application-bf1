import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { HERO_H, SPACING, RADIUS, GRID_CARD_W } from '../../constants';

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
}

export function SkeletonEmissionDetail() {
  const { theme } = useTheme();
  const opacity = useShimmer();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Hero */}
      <Animated.View
        style={{ width: '100%', height: HERO_H, backgroundColor: theme.skeletonBg, opacity }}
      />

      {/* Grid 2 colonnes */}
      <View
        style={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.lg,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.md,
          justifyContent: 'space-between',
        }}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ width: GRID_CARD_W }}>
            <Animated.View
              style={{
                width: '100%',
                aspectRatio: GRID_CARD_W / Math.round(GRID_CARD_W * 1.55),
                borderRadius: RADIUS.xl,
                backgroundColor: theme.skeletonBg,
                opacity,
              }}
            />
            <Animated.View
              style={{ marginTop: 8, height: 13, width: '80%', borderRadius: 6, backgroundColor: theme.skeletonBg, opacity }}
            />
            <Animated.View
              style={{ marginTop: 5, height: 11, width: '55%', borderRadius: 6, backgroundColor: theme.skeletonBg, opacity }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
