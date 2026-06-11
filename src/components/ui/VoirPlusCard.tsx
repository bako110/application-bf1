import React, { useRef } from 'react';
import {
  TouchableOpacity, View, Text, StyleSheet, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, CARD_H, LAND_H } from '../../constants';

interface Props {
  onPress: () => void;
  landscape?: boolean; // true → hauteur 216 (missed/reportages), false → 320 (portrait)
}

export function VoirPlusCard({ onPress, landscape = false }: Props) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  }
  function onPressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }

  // +60 = zone texte en bas de la MissedCard (bottom padding + title)
  const H = landscape ? LAND_H + 60 : CARD_H;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.card,
          {
            height:           H,
            backgroundColor:  theme.surface,
            borderColor:      theme.border,
          },
        ]}
      >
        {/* Shimmer sweep — static gradient since RN has no CSS animation */}
        <View style={[styles.shimmer, { backgroundColor: 'rgba(255,255,255,0.04)' }]} pointerEvents="none" />

        <View style={styles.inner}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(226,62,62,0.12)', borderColor: 'rgba(226,62,62,0.25)' }]}>
            <Icon name="grid-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={[styles.label, { color: theme.text }]}>Voir plus</Text>
          <Icon name="chevron-forward" size={16} color={theme.text3} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width:         100,
    flexShrink:    0,
    borderRadius:  RADIUS.xl,
    borderWidth:   1.5,
    alignItems:    'center',
    justifyContent: 'center',
    overflow:      'hidden',
    position:      'relative',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    alignItems:  'center',
    gap:         10,
    paddingHorizontal: 12,
    position:    'relative',
    zIndex:      1,
  },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   RADIUS.lg,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.3,
    textAlign:     'center',
  },
});
