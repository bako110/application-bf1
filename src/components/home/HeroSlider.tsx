import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Image, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants';
import { useLiveStore } from '../../stores';
import { useTheme } from '../../hooks/useTheme';
import type { EmissionEntry } from '../../hooks/useEmissionSection';
import type { HomeStackParams } from '../../navigation/types';

type Nav = StackNavigationProp<HomeStackParams, 'Home'>;

const { width: W } = Dimensions.get('window');

const H_MARGIN    = SPACING.md;
const IMG_W       = W - H_MARGIN * 2;
const DEFAULT_H   = Math.round(IMG_W * (9 / 16)); // fallback avant chargement
const BR          = RADIUS.xl;
const TEXT_ZONE   = 52;
export const HERO_SLIDER_H = DEFAULT_H + TEXT_ZONE; // export statique pour la ScrollView


const AUTO_DELAY  = 4500;
const MAX_SLIDES  = 12; // taille fixe du tableau d'animations — jamais recréé

interface Props {
  entries:    EmissionEntry[];
  isOnAir:    boolean;
  isLoading?: boolean;
}

export function HeroSlider({ entries, isOnAir, isLoading }: Props) {
  const navigation                        = useNavigation<Nav>();
  const { isOnAir: storeOnAir } = useLiveStore();
  const { theme } = useTheme();

  // Ouvre l'écran dédié "regarder le direct" en portrait — le paysage reste
  // déclenché par le bouton plein écran du player (pas par cette navigation)
  const goLive = useCallback(() => {
    navigation.navigate('LiveWatch');
  }, [navigation]);
  const flatRef                         = useRef<FlatList>(null);
  const timerRef                        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIdx, setActiveIdx]       = useState(0);
  // Tableau fixe de MAX_SLIDES valeurs — jamais recréé entre renders
  const dotScale = useRef(
    Array.from({ length: MAX_SLIDES }, () => new Animated.Value(1)),
  ).current;

  const live = isOnAir || storeOnAir;

  // ── Animation dots ────────────────────────────────────────────────────────────
  useEffect(() => {
    entries.forEach((_, i) => {
      Animated.spring(dotScale[i], {
        toValue:         i === activeIdx ? 1.4 : 1,
        useNativeDriver: true,
        tension:         140,
        friction:        8,
      }).start();
    });
  }, [activeIdx, entries.length]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  const goTo = useCallback((idx: number) => {
    const next = idx % Math.max(entries.length, 1);
    setActiveIdx(next);
    flatRef.current?.scrollToIndex({ index: next, animated: true });
  }, [entries.length]);

  useEffect(() => {
    if (entries.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => goTo(activeIdx + 1), AUTO_DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, entries.length, goTo]);

  // ── Navigation émission ───────────────────────────────────────────────────────
  const openEmission = useCallback((entry: EmissionEntry) => {
    if (!entry.filter_path) return;
    navigation.navigate('EmissionCategory', {
      name:       entry.label,
      filterPath: entry.filter_path,
      heroImage:  entry.image_background || entry.image,
    });
  }, [navigation]);

  // Tous les hooks sont déclarés — le return anticipé peut venir ici
  const activeEntry = entries[activeIdx];

  if (isLoading || !entries.length) {
    return <View style={styles.skeleton} />;
  }

  return (
    <View style={styles.root}>

      {/* ── Carrousel images ──────────────────────────────────────────────────── */}
      <FlatList
        ref={flatRef}
        data={entries}
        keyExtractor={item => item.apiName}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setActiveIdx(idx);
        }}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
        renderItem={({ item }) => (
          <View style={styles.slideOuter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => openEmission(item)}
              style={styles.imageCard}
            >
              {item.image_background || item.image ? (
                <Image
                  source={{ uri: item.image_background || item.image }}
                  style={styles.slideImg}
                  resizeMode="cover"
                  resizeMethod="resize"
                />
              ) : (
                <View style={[styles.slideImg, { backgroundColor: '#1a1a1a' }]} />
              )}

              {/* Bouton "Suivre le direct" — bas droite sur l'image */}
              <TouchableOpacity
                style={styles.liveBtn}
                onPress={goLive}
                activeOpacity={0.82}
              >
                <Icon name="radio-outline" size={13} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.liveBtnTxt}>Suivre le direct</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* ── Zone texte + dots sous l'image ───────────────────────────────────── */}
      <View style={styles.bottomZone} pointerEvents="none">
        {/* Titre émission active */}
        {activeEntry && (
          <View style={styles.titleRow}>
            <Text style={[styles.titleTxt, { color: theme.text }]} numberOfLines={1}>
              {activeEntry.label}
            </Text>
            {activeEntry.count > 0 && (
              <Text style={[styles.countTxt, { color: theme.text3 }]}>
                {activeEntry.count} ép.
              </Text>
            )}
          </View>
        )}

        {/* Dots */}
        <View style={styles.dots}>
          {entries.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                i === activeIdx ? styles.dotActive : styles.dotInactive,
                { transform: [{ scale: dotScale[i] ?? new Animated.Value(1) }] },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width:  W,
    height: HERO_SLIDER_H,
  },
  skeleton: {
    width:             W,
    height:            HERO_SLIDER_H,
    paddingHorizontal: H_MARGIN,
  },

  // ── Slide ────────────────────────────────────────────────────────────────────
  slideOuter: {
    width:           W,
    paddingHorizontal: H_MARGIN,
  },
  imageCard: {
    width:           IMG_W,
    height:          DEFAULT_H,
    borderRadius:    BR,
    overflow:        'hidden',
    backgroundColor: '#111',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    12,
    elevation:       10,
  },
  slideImg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BR,
  },

  // ── Bouton Suivre le direct ───────────────────────────────────────────────────
  liveBtn: {
    position:          'absolute',
    bottom:            14,
    right:             14,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   COLORS.redAlpha90,
    borderRadius:      RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  liveBtnTxt: {
    color:         '#fff',
    fontSize:      FONT_SIZE.xs,
    fontWeight:    FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
  },

  // ── Zone texte sous l'image ───────────────────────────────────────────────────
  bottomZone: {
    paddingHorizontal: H_MARGIN + 4,
    paddingTop:        7,
    height:            TEXT_ZONE,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:            8,
    marginBottom:   8,
  },
  titleTxt: {
    flex:          1,
    fontSize:      FONT_SIZE.base,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 0.1,
  },
  countTxt: {
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },

  // ── Dots ─────────────────────────────────────────────────────────────────────
  dots: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
  },
  dot: {
    height:       4,
    borderRadius: 4,
  },
  dotActive: {
    width:           24,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width:           6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
