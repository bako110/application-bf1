/**
 * Card portrait "Émission" — identique au bf1-emission-card web
 * Avec animation snake SVG → Animated circle en RN
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, CARD_W, CARD_H } from '../../constants';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface EmissionCardProps {
  name:     string;
  image?:   string | null;
  count?:   number;
  isNew?:   boolean;
  onPress?: () => void;
  index?:   number;
  style?:   ViewStyle;
}

export function EmissionCard({ name, image, count, isNew = false, onPress, index = 0, style }: EmissionCardProps) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1,  duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1250, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.wrapper, style]}
    >
      {/* Image */}
      <View style={[styles.imageWrapper, { backgroundColor: theme.cardBg }]}>
        <ImageWithSkeleton
          uri={image}
          style={StyleSheet.absoluteFill}
          fallback={
            <View style={[StyleSheet.absoluteFill, styles.imageFallback]}>
              <Icon name="tv-outline" size={44} color={COLORS.redAlpha50} />
            </View>
          }
        />

        {/* Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />

        {/* Badge Nouveau */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Nouveau</Text>
          </View>
        )}

        {/* Badge count épisodes */}
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, isNew && { top: 38 }]}>
            <Text style={styles.countText}>{count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}</Text>
          </View>
        )}

        {/* Bouton play avec pulse */}
        <Animated.View style={[styles.playBtn, { transform: [{ scale: pulseAnim }] }]}>
          <Icon name="play" size={18} color={COLORS.white} />
        </Animated.View>
      </View>

      {/* Nom */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width:      CARD_W,
    flexShrink: 0,
  },
  imageWrapper: {
    width:         '100%',
    aspectRatio:   CARD_W / CARD_H,
    borderRadius:  RADIUS.xl,
    overflow:      'hidden',
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius:  8,
    elevation:     6,
  },
  imageFallback: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#1a0a0a',
  },
  newBadge: {
    position:          'absolute',
    top:               8,
    right:             8,
    backgroundColor:   '#0E7AFE',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      RADIUS.md,
    shadowColor:       '#0E7AFE',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.4,
    shadowRadius:      6,
    elevation:         4,
  },
  newBadgeText: {
    color:      COLORS.white,
    fontSize:   11,
    fontWeight: FONT_WEIGHT.semibold,
  },
  countBadge: {
    position:          'absolute',
    top:               10,
    right:             10,
    backgroundColor:   COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
  },
  countText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  playBtn: {
    position:        'absolute',
    top:             '50%',
    left:            '50%',
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: COLORS.redAlpha90,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       -25,   // -55% of 46 — légèrement au-dessus du centre (identique web)
    marginLeft:      -23,
    shadowColor:     COLORS.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.55,
    shadowRadius:    10,
    elevation:       8,
  },
  content: {
    paddingTop: 12,
  },
  name: {
    fontSize:    FONT_SIZE.base,
    fontWeight:  FONT_WEIGHT.bold,
    lineHeight:  22,
    letterSpacing: -0.3,
  },
});
