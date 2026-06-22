import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, StatusBar,
  TouchableOpacity, Image, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { ContentCard } from '../components/ui/ContentCard';
import { SkeletonEmissionDetail } from '../components/ui/SkeletonEmissionDetail';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRID_CARD_W, HERO_H } from '../constants';
import { getImageUrl } from '../utils';
import type { EmissionsStackParams } from '../navigation/types';

type Nav = StackNavigationProp<EmissionsStackParams>;
type Route = RouteProp<EmissionsStackParams, 'EmissionDetail'>;

export function EmissionDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { canAccess } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { id, name } = route.params;

  const { data: emission, isLoading, refetch } = useQuery({
    queryKey: ['emission-detail', id],
    queryFn:  () => api.getEmissionById(id as number),
  });

  const { data: shows, isLoading: loadingShows, refetch: refetchShows } = useQuery({
    queryKey: ['emission-shows', id],
    queryFn:  () => api.getShowsByEmission(id as number),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchShows()]);
    setRefreshing(false);
  };

  const emissionName = name ?? emission?.name ?? '';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero header */}
      <View style={styles.heroWrapper}>
        {emission?.image ? (
          <Image source={{ uri: getImageUrl(emission.image) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[theme.bg3, theme.bg2]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Back btn */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { marginTop: Math.max(insets.top, 10) }]}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.heroContent}>
          {emission?.shows_count ? (
            <Text style={styles.countText}>{emission.shows_count} contenu{emission.shows_count > 1 ? 's' : ''}</Text>
          ) : null}
          <Text style={styles.heroTitle} numberOfLines={2}>{emissionName}</Text>
        </View>
      </View>

      {/* Shows grid */}
      {loadingShows ? (
        <SkeletonEmissionDetail />
      ) : (
        <FlatList
          data={shows ?? []}
          numColumns={2}
          keyExtractor={item => String(item.id)}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="film-outline" size={48} color={theme.text3} />
              <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.common.noContent}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ContentCard
              title={item.title}
              image={item.thumbnail}
              duration={item.duration}
              date={item.created_at}
              subscription={item.subscription}
              isLocked={!canAccess(item.subscription)}
              onPress={() => navigation.navigate('ShowDetail', { id: item.id })}
              style={{ width: GRID_CARD_W }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  heroWrapper: {
    width:           '100%',
    height:          HERO_H,
    justifyContent:  'flex-end',
    backgroundColor: '#000',
  },
  backBtn: {
    position:        'absolute',
    left:            SPACING.lg,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  heroContent: {
    padding: SPACING.lg,
  },
  countText: {
    color:       COLORS.primary,
    fontSize:    FONT_SIZE.sm,
    fontWeight:  FONT_WEIGHT.medium,
    marginBottom: 4,
  },
  heroTitle: {
    color:      '#fff',
    fontSize:   FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 30,
  },
  columnWrapper: {
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom:      SPACING.md,
  },
  list: {
    paddingTop: SPACING.lg,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.md,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
  },
});
