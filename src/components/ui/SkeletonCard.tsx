import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CARD_W, CARD_H, LAND_W, LAND_H } from '../../constants';

interface Props {
  landscape?: boolean;
}

export function SkeletonCard({ landscape = false }: Props) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  const w = landscape ? LAND_W : CARD_W;
  const h = landscape ? LAND_H : CARD_H;
  const r = landscape ? 12 : 16;

  return (
    <Animated.View
      style={[
        styles.card,
        { width: w, height: h, borderRadius: r, backgroundColor: theme.skeletonBg, opacity },
      ]}
    />
  );
}

export function SkeletonRow({ count = 5, landscape = false }: { count?: number; landscape?: boolean }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} landscape={landscape} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexShrink: 0, marginRight: 12 },
  row:  { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
});
