import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { CARD_W, CARD_H, LAND_W, LAND_H, RADIUS } from '../../constants';

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

interface Props {
  landscape?: boolean;
}

export function SkeletonCard({ landscape = false }: Props) {
  const { theme } = useTheme();
  const opacity   = useShimmer();

  const w = landscape ? LAND_W : CARD_W;
  const h = landscape ? LAND_H : CARD_H;
  const r = landscape ? 12 : 16;

  return (
    <Animated.View
      style={[styles.card, { width: w, height: h, borderRadius: r, backgroundColor: theme.skeletonBg, opacity }]}
    />
  );
}

// Skeleton EmissionCard : image portrait + 2 barres texte en dessous
export function SkeletonEmissionCard() {
  const { theme } = useTheme();
  const opacity   = useShimmer();
  return (
    <View style={{ width: CARD_W, flexShrink: 0 }}>
      <Animated.View style={[styles.emissionImg, { backgroundColor: theme.skeletonBg, opacity }]} />
      <Animated.View style={[styles.labelWide,   { backgroundColor: theme.skeletonBg, opacity }]} />
      <Animated.View style={[styles.labelShort,  { backgroundColor: theme.skeletonBg, opacity }]} />
    </View>
  );
}

// Skeleton MissedCard : image 16/9 + meta + 2 barres texte en dessous
export function SkeletonMissedCard() {
  const { theme } = useTheme();
  const opacity   = useShimmer();
  return (
    <View style={{ width: LAND_W, flexShrink: 0, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: theme.cardBg }}>
      <Animated.View style={[styles.missedImg, { backgroundColor: theme.skeletonBg, opacity }]} />
      <View style={{ padding: 10, gap: 6 }}>
        <Animated.View style={[styles.labelMeta,  { backgroundColor: theme.skeletonBg, opacity }]} />
        <Animated.View style={[styles.labelWide,  { backgroundColor: theme.skeletonBg, opacity }]} />
        <Animated.View style={[styles.labelShort, { backgroundColor: theme.skeletonBg, opacity }]} />
      </View>
    </View>
  );
}

// Skeleton ContentCard : image portrait + 2 barres texte en dessous
export function SkeletonContentCard() {
  const { theme } = useTheme();
  const opacity   = useShimmer();
  return (
    <View style={{ width: CARD_W, flexShrink: 0 }}>
      <Animated.View style={[styles.emissionImg, { backgroundColor: theme.skeletonBg, opacity }]} />
      <Animated.View style={[styles.labelWide,   { backgroundColor: theme.skeletonBg, opacity }]} />
      <Animated.View style={[styles.labelShort,  { backgroundColor: theme.skeletonBg, opacity }]} />
    </View>
  );
}

type RowVariant = 'default' | 'emission' | 'missed' | 'content';

export function SkeletonRow({
  count = 5,
  landscape = false,
  variant = 'default',
}: {
  count?: number;
  landscape?: boolean;
  variant?: RowVariant;
  emission?: boolean; // rétrocompat
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === 'emission') return <SkeletonEmissionCard key={i} />;
        if (variant === 'missed')   return <SkeletonMissedCard   key={i} />;
        if (variant === 'content')  return <SkeletonContentCard  key={i} />;
        return <SkeletonCard key={i} landscape={landscape} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { flexShrink: 0, marginRight: 12 },
  row:        { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  emissionImg: { width: '100%', aspectRatio: CARD_W / CARD_H, borderRadius: RADIUS.xl },
  missedImg:   { width: '100%', aspectRatio: 16 / 9 },
  labelWide:  { marginTop: 8,  height: 13, borderRadius: 6, width: '80%' },
  labelShort: { marginTop: 5,  height: 11, borderRadius: 6, width: '55%' },
  labelMeta:  { height: 10,    borderRadius: 5, width: '45%' },
});
