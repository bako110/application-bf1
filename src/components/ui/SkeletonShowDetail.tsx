import React, { useRef, useEffect } from 'react';
import { View, Animated, StatusBar } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { HERO_H, SPACING, RADIUS } from '../../constants';

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

export function SkeletonShowDetail() {
  const { theme } = useTheme();
  const opacity = useShimmer();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero shimmer */}
      <Animated.View
        style={{ width: '100%', height: HERO_H + 60, backgroundColor: theme.skeletonBg, opacity }}
      />

      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.lg }}>
        {/* Stats bar : 3 petites barres en ligne */}
        <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
          {[70, 90, 60].map((w, i) => (
            <Animated.View
              key={i}
              style={{ height: 12, width: w, borderRadius: 6, backgroundColor: theme.skeletonBg, opacity }}
            />
          ))}
        </View>

        {/* Actions pills : 3 pills */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {[90, 110, 100].map((w, i) => (
            <Animated.View
              key={i}
              style={{ height: 38, width: w, borderRadius: RADIUS.full, backgroundColor: theme.skeletonBg, opacity }}
            />
          ))}
        </View>

        {/* Description : 4 lignes */}
        <View style={{ gap: 8 }}>
          {['100%', '90%', '95%', '60%'].map((w, i) => (
            <Animated.View
              key={i}
              style={{ height: 13, width: w, borderRadius: 6, backgroundColor: theme.skeletonBg, opacity }}
            />
          ))}
        </View>

        {/* Section similar : titre + 3 cartes */}
        <Animated.View
          style={{ height: 18, width: '45%', borderRadius: 6, backgroundColor: theme.skeletonBg, opacity }}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={{ width: 140, height: 88, borderRadius: RADIUS.md, backgroundColor: theme.skeletonBg, opacity }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
