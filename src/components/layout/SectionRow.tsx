import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';
import { SkeletonRow } from '../ui/SkeletonCard';
import { VoirPlusCard } from '../ui/VoirPlusCard';

interface SectionRowProps {
  title:      string;
  onSeeMore?: () => void;
  isLoading?: boolean;
  isEmpty?:   boolean;
  emptyText?: string;
  landscape?: boolean;
  children:   React.ReactNode;
}

export function SectionRow({
  title, onSeeMore, isLoading = false,
  isEmpty = false, landscape = false, children,
}: SectionRowProps) {
  const { theme } = useTheme();

  if (!isLoading && isEmpty) return null;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <View style={[styles.titleUnderline, { backgroundColor: COLORS.primary }]} />
        </View>
        {onSeeMore && (
          <TouchableOpacity
            onPress={onSeeMore}
            style={[styles.arrowBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            activeOpacity={0.7}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12H19" stroke={theme.text} strokeWidth="2" strokeLinecap="round" />
              <Path d="M12 5L19 12L12 19" stroke={theme.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenu */}
      {isLoading ? (
        <SkeletonRow count={5} landscape={landscape} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          decelerationRate="fast"
        >
          {children}
          {onSeeMore && (
            <VoirPlusCard onPress={onSeeMore} landscape={landscape} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom:      SPACING.md,
    gap:               SPACING.md,
  },
  titleWrap: {
    flex: 1,
    gap:  6,
  },
  title: {
    fontSize:      24,
    fontWeight:    FONT_WEIGHT.extrabold,
    letterSpacing: -0.6,
  },
  titleUnderline: {
    width:        40,
    height:       3,
    borderRadius: 2,
  },
  arrowBtn: {
    width:          44,
    height:         44,
    borderRadius:   RADIUS.lg,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingRight:      SPACING.xxxl,
    paddingTop:        4,
    paddingBottom:     8,
    gap:               12,
  },
});
