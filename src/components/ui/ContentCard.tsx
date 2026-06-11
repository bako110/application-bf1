/**
 * Card portrait réutilisable — identique au bf1-content-card web
 * Dimensions : 42vw / max 240px / min 160px × 320px
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, CARD_W, CARD_H } from '../../constants';
import { getSubBadge, subGradientColors } from '../../utils';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface ContentCardProps {
  title:          string;
  image?:         string | null;
  onPress?:       () => void;
  locked?:        boolean;
  isLocked?:      boolean;
  subCategory?:   string | null;
  subscription?:  string | null;
  duration?:      number | null;
  date?:          string | null;
  time?:          string | null;
  isFavorited?:   boolean;
  onToggleFav?:   () => void;
  index?:         number;
  showFavBtn?:    boolean;
  style?:         ViewStyle;
}

export function ContentCard({
  title, image, onPress,
  locked = false, isLocked,
  subCategory, subscription,
  duration, date, time,
  isFavorited = false, onToggleFav,
  index = 0, showFavBtn = true,
  style,
}: ContentCardProps) {
  const { theme } = useTheme();
  const effectiveLocked = isLocked ?? locked;
  const effectiveSub    = subscription ?? subCategory;
  const badge = effectiveSub ? getSubBadge(effectiveSub) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.wrapper, style]}
    >
      {/* Image wrapper */}
      <View style={[styles.imageWrapper, { backgroundColor: theme.cardBg }]}>
        <ImageWithSkeleton
          uri={image}
          style={[StyleSheet.absoluteFill, effectiveLocked && styles.imageLocked]}
          fallback={
            <View style={[StyleSheet.absoluteFill, styles.imageFallback, { backgroundColor: theme.bg3 }]}>
              <Icon name="tv-outline" size={40} color={COLORS.redAlpha50} />
            </View>
          }
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />

        {/* Badge abonnement */}
        {badge && (
          <LinearGradient
            colors={subGradientColors(effectiveSub!)}
            style={styles.subBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="diamond-outline" size={9} color={COLORS.white} />
            <Text style={styles.subBadgeText}>{badge.label.toUpperCase()}</Text>
          </LinearGradient>
        )}

        {/* Lock overlay */}
        {effectiveLocked && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockCircle}>
              <Icon name="lock-closed" size={20} color={COLORS.white} />
            </View>
          </View>
        )}

        {/* Bouton favori */}
        {showFavBtn && !effectiveLocked && onToggleFav && (
          <TouchableOpacity
            style={[styles.favBtn, isFavorited && styles.favBtnActive]}
            onPress={onToggleFav}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon
              name={isFavorited ? 'checkmark' : 'add'}
              size={16}
              color={COLORS.white}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenu texte */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {(duration || time || date) && (
          <View style={styles.meta}>
            {duration && (
              <View style={[styles.metaItem, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Icon name="time-outline" size={10} color={theme.text3} />
                <Text style={[styles.metaText, { color: theme.text3 }]}>{duration} min</Text>
              </View>
            )}
            {time && (
              <View style={[styles.metaItem, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Icon name="calendar-outline" size={10} color={theme.text3} />
                <Text style={[styles.metaText, { color: theme.text3 }]}>{time}</Text>
              </View>
            )}
            {date && !time && (
              <View style={[styles.metaItem, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
                <Icon name="calendar-outline" size={10} color={theme.text3} />
                <Text style={[styles.metaText, { color: theme.text3 }]}>{date.slice(0,10)}</Text>
              </View>
            )}
          </View>
        )}
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
    width:        '100%',
    aspectRatio:  CARD_W / CARD_H,
    borderRadius: RADIUS.xl,
    overflow:     'hidden',
    position:     'relative',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius:  8,
    elevation:    6,
  },
  imageLocked: {
    opacity: 0.5,
  },
  imageFallback: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  subBadge: {
    position:     'absolute',
    top:          10,
    left:         10,
    flexDirection: 'row',
    alignItems:   'center',
    gap:          4,
    paddingHorizontal: 10,
    paddingVertical:    5,
    borderRadius:  RADIUS.md,
  },
  subBadgeText: {
    color:       COLORS.white,
    fontSize:    9,
    fontWeight:  FONT_WEIGHT.extrabold,
    letterSpacing: 0.5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lockCircle: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     'rgba(255,255,255,0.25)',
  },
  favBtn: {
    position:        'absolute',
    bottom:          10,
    right:           10,
    width:           36,
    height:          36,
    borderRadius:    RADIUS.md,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.2)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(14,122,254,0.9)',
  },
  content: {
    paddingTop: 12,
  },
  title: {
    fontSize:     FONT_SIZE.base,
    fontWeight:   FONT_WEIGHT.bold,
    lineHeight:   22,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  meta: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:  RADIUS.sm,
    borderWidth:   1,
  },
  metaText: {
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
});
