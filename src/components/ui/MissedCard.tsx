/**
 * Card landscape "Vous l'avez raté" — identique au missed-card web
 * 260×146 avec catégorie + durée + titre
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING, LAND_W, LAND_H } from '../../constants';
import { formatFullDate } from '../../utils';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface MissedCardProps {
  title:     string;
  image?:    string | null;
  category?: string;
  duration?: number | null;
  views?:    number;
  date?:     string | null;
  onPress?:  () => void;
  isFavorited?: boolean;
  onToggleFav?: () => void;
}

export function MissedCard({
  title, image, category = 'BF1', duration,
  views = 0, date, onPress,
  isFavorited = false, onToggleFav,
}: MissedCardProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.wrapper, { backgroundColor: theme.cardBg }]}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <ImageWithSkeleton
          uri={image}
          style={StyleSheet.absoluteFill}
          fallback={
            <View style={[StyleSheet.absoluteFill, styles.imageFallback, { backgroundColor: theme.bg3 }]}>
              <Icon name="tv-outline" size={28} color={COLORS.redAlpha50} />
            </View>
          }
        />

        {/* Catégorie */}
        <View style={styles.catBadge}>
          <View style={styles.catBar} />
          <Text style={styles.catText}>{category.toUpperCase()}</Text>
        </View>

        {/* Durée */}
        {duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}m</Text>
          </View>
        ) : null}
      </View>

      {/* Bas */}
      <View style={styles.bottom}>
        <View style={styles.info}>
          <Text style={[styles.meta, { color: theme.text3 }]} numberOfLines={1}>
            {views} vue{views !== 1 ? 's' : ''}{date ? ` · ${formatFullDate(date)}` : ''}
          </Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        {onToggleFav && (
          <TouchableOpacity
            style={[styles.favBtn, { backgroundColor: theme.bg3, borderColor: theme.border }]}
            onPress={onToggleFav}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Icon
              name={isFavorited ? 'checkmark' : 'add'}
              size={14}
              color={isFavorited ? COLORS.info : theme.text}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width:        LAND_W,
    flexShrink:   0,
    borderRadius: RADIUS.lg,
    overflow:     'hidden',
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius:  6,
    elevation:    4,
  },
  imageWrapper: {
    width:       '100%',
    aspectRatio: 16 / 9,
    position:    'relative',
  },
  imageFallback: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  catBadge: {
    position:      'absolute',
    bottom:        8,
    left:          8,
    flexDirection: 'row',
    alignItems:    'center',
  },
  catBar: {
    width:        3,
    height:       18,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  catText: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    color:           COLORS.white,
    fontSize:        FONT_SIZE.xs,
    fontWeight:      FONT_WEIGHT.bold,
    paddingHorizontal: 7,
    paddingVertical:   3,
    letterSpacing:   0.5,
  },
  durationBadge: {
    position:          'absolute',
    bottom:            8,
    right:             8,
    backgroundColor:   'rgba(0,0,0,0.75)',
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      4,
  },
  durationText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  bottom: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       SPACING.md,
    gap:           SPACING.sm,
  },
  info: {
    flex: 1,
  },
  meta: {
    fontSize:     FONT_SIZE.xs,
    marginBottom: 3,
  },
  title: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 18,
  },
  favBtn: {
    width:          30,
    height:         30,
    borderRadius:   RADIUS.sm,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
});
