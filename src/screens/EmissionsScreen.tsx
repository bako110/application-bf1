import React, { useState } from 'react';
import {
  View, FlatList, StatusBar, StyleSheet, Text, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { EmissionCard } from '../components/ui/EmissionCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, GRID_CARD_W } from '../constants';
import * as api from '../services/api';
import type { EmissionsStackParams } from '../navigation/types';

type Nav = StackNavigationProp<EmissionsStackParams, 'Emissions'>;

export function EmissionsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const { data: emissions, isLoading } = useQuery({
    queryKey: ['emissions'],
    queryFn:  () => api.getEmissions(),
    staleTime: 5 * 60_000,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleAccent} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t.nav.emissions}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !emissions?.length ? (
        <View style={styles.center}>
          <Icon name="tv-outline" size={48} color={theme.text3} />
          <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.common.noContent}</Text>
        </View>
      ) : (
        <FlatList
          data={emissions}
          numColumns={2}
          keyExtractor={item => String(item.id ?? item.name)}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <EmissionCard
              name={item.name}
              image={item.image_main || item.image_url || item.image || item.thumbnail || null}
              count={item.shows_count ?? item.count}
              isNew={index < 2 || !!item.is_new}
              index={index}
              style={{ width: GRID_CARD_W }}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       item.name,
                filterPath: item.filter_path,
                categoryId: item.id,
              })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom:     12,
    borderBottomWidth: 1,
    minHeight:         56,
    justifyContent:    'flex-end',
  },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleAccent:{ width: 3, height: 20, borderRadius: 2, backgroundColor: COLORS.primary },
  headerTitle: {
    fontSize:   FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom:   SPACING.md,
  },
  list: {
    paddingTop: SPACING.lg,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
  },
});
