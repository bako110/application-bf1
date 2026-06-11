import React from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, StyleSheet,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants';

interface PageScreenProps {
  title:       string;
  onBack?:     () => void;
  isLoading?:  boolean;
  isEmpty?:    boolean;
  refreshing?: boolean;
  onRefresh?:  () => void;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  numColumns?: number;
  data:        any[];
  renderItem:  ({ item }: { item: any }) => React.ReactElement;
  keyExtractor?: (item: any) => string;
  columnWrapperStyle?: any;
}

export function PageScreen({
  title, onBack,
  isLoading = false, isEmpty = false,
  refreshing = false, onRefresh,
  onEndReached, isFetchingMore = false,
  numColumns = 2, data, renderItem, keyExtractor,
  columnWrapperStyle,
}: PageScreenProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Icon name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          <View style={styles.titleAccent} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Icon name="film-outline" size={48} color={theme.text3} />
          <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.common.noContent}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor ?? (item => String(item.id))}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? (columnWrapperStyle ?? styles.columnWrapper) : undefined}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            ) : undefined
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom:     12,
    borderBottomWidth: 1,
    minHeight:         56,
    gap:               SPACING.sm,
  },
  backBtn: { padding: 4, flexShrink: 0 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleAccent: { width: 3, height: 18, borderRadius: 2, backgroundColor: COLORS.primary },
  title: {
    flex:       1,
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  spacer: { width: 30 },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop:        SPACING.md,
  },
  columnWrapper: {
    gap:          SPACING.lg,
    marginBottom: SPACING.lg,
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
