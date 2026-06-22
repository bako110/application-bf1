import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar, StyleSheet,
  FlatList, RefreshControl, ActivityIndicator, TextInput,
  Animated, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';

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
  searchPlaceholder?: string;
}

export function PageScreen({
  title, onBack,
  isLoading = false, isEmpty = false,
  refreshing = false, onRefresh,
  onEndReached, isFetchingMore = false,
  numColumns = 2, data, renderItem, keyExtractor,
  columnWrapperStyle, searchPlaceholder,
}: PageScreenProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setSearchOpen(false);
    setQuery('');
  };

  const filteredData = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter(item =>
      (item.title ?? '').toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q)
    );
  }, [data, query]);

  const showEmpty = isEmpty || (!isLoading && query.trim().length > 0 && filteredData.length === 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary },
      ]}>
        {!searchOpen ? (
          <>
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
            <TouchableOpacity onPress={openSearch} style={styles.searchBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Icon name="search-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={closeSearch} style={styles.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Icon name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={[
              styles.searchInput,
              { backgroundColor: theme.surface, borderColor: query.length > 0 ? COLORS.primary : theme.border },
            ]}>
              <Icon name="search" size={15} color={theme.text3} />
              <TextInput
                ref={inputRef}
                style={[styles.searchText, { color: theme.text }]}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder ?? 'Rechercher…'}
                placeholderTextColor={theme.text3}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Icon name="close-circle" size={16} color={theme.text3} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : showEmpty ? (
        <View style={styles.center}>
          <Icon name={query.trim() ? 'search-outline' : 'film-outline'} size={48} color={theme.text3} />
          <Text style={[styles.emptyText, { color: theme.text3 }]}>
            {query.trim() ? 'Aucun résultat' : t.common.noContent}
          </Text>
          {query.trim().length > 0 && (
            <Text style={[styles.emptyHint, { color: theme.text3 }]}>Essayez avec d'autres mots</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
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
          keyboardShouldPersistTaps="handled"
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
  backBtn:   { padding: 4, flexShrink: 0 },
  searchBtn: { padding: 4, flexShrink: 0 },
  titleRow:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleAccent: { width: 3, height: 18, borderRadius: 2, backgroundColor: COLORS.primary },
  title: {
    flex:       1,
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  searchInput: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               SPACING.sm,
    borderWidth:       1.5,
    borderRadius:      RADIUS.lg,
    height:            38,
    paddingHorizontal: SPACING.md,
  },
  searchText: {
    flex:     1,
    fontSize: FONT_SIZE.sm,
    height:   '100%',
  },
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
    gap:            SPACING.sm,
  },
  emptyText: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  emptyHint: {
    fontSize: FONT_SIZE.sm,
  },
});
