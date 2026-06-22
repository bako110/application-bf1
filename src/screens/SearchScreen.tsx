import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';
import { getImageUrl } from '../utils';
import type { HomeStackParams } from '../navigation/types';

type Nav = StackNavigationProp<HomeStackParams>;

// ─── Config type ──────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { label: string; color: string; icon: string; navPage?: string }> = {
  news:          { label: 'Flash Info',    color: COLORS.primary, icon: 'flash',         navPage: 'NewsPage'            },
  sport:         { label: 'Sport',          color: '#1DA1F2',      icon: 'trophy',        navPage: 'SportsPage'          },
  jtandmag:      { label: 'Journal',       color: COLORS.primary, icon: 'videocam',      navPage: 'JTandMagPage'        },
  magazine:      { label: 'Magazine',       color: '#8B5CF6',      icon: 'journal',       navPage: 'MagazinePage'        },
  divertissement:{ label: 'Divertissement', color: '#A855F7',      icon: 'musical-notes', navPage: 'DivertissementPage'  },
  reportage:     { label: 'Reportage',      color: '#F59E0B',      icon: 'film',          navPage: 'ReportagesPage'      },
  tele_realite:  { label: 'Télé Réalité',  color: '#EC4899',      icon: 'camera',        navPage: 'TeleRealitePage'     },
  show:          { label: 'Émission',       color: '#10B981',      icon: 'tv'                                            },
  archive:       { label: 'Archive',        color: '#6B7280',      icon: 'archive',       navPage: 'ArchivePage'         },
  missed:        { label: 'Rattrapage',     color: '#FF9500',      icon: 'time',          navPage: 'MissedPage'          },
};

const TYPE_ORDER = ['news','sport','jtandmag','magazine','divertissement','reportage','tele_realite','show','archive','missed'];

// Suggestions affichées avant toute saisie (inspiré bf1_tv_mobile)
const SUGGESTIONS = [
  { label: 'Sport',          icon: 'trophy',        color: '#1DA1F2', page: 'SportsPage'         },
  { label: 'Journaux',       icon: 'videocam',      color: COLORS.primary, page: 'JTandMagPage'   },
  { label: 'Magazines',      icon: 'journal',       color: '#8B5CF6', page: 'MagazinePage'        },
  { label: 'Divertissement', icon: 'musical-notes', color: '#A855F7', page: 'DivertissementPage'  },
  { label: 'Reportages',     icon: 'film',          color: '#F59E0B', page: 'ReportagesPage'      },
  { label: 'Flash Info',     icon: 'flash',         color: COLORS.primary, page: 'NewsPage'        },
  { label: 'Archives',       icon: 'archive',       color: '#6B7280', page: 'ArchivePage'         },
  { label: 'Télé Réalité',   icon: 'camera',        color: '#EC4899', page: 'TeleRealitePage'     },
  { label: 'Rattrapage',     icon: 'time',          color: '#FF9500', page: 'MissedPage'          },
];

function getCfg(type: string) {
  return TYPE_CFG[type] ?? { label: type, color: '#888', icon: 'layers-outline' };
}

// ─── Ligne résultat ───────────────────────────────────────────────────────────

function ResultRow({ item, onPress, theme }: { item: any; onPress: () => void; theme: any }) {
  const img = item.image_url ?? item.thumbnail ?? item.image ?? null;
  const cfg = getCfg(item.type ?? 'show');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.resultRow, { borderBottomColor: theme.divider }]}
      activeOpacity={0.7}
    >
      <View style={[styles.resultThumb, { backgroundColor: theme.bg3 ?? theme.surface }]}>
        {img
          ? <Image source={{ uri: getImageUrl(img) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Icon name={cfg.icon as any} size={20} color={theme.text3} />
        }
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title ?? 'Sans titre'}
        </Text>
        {item.description ? (
          <Text style={[styles.resultDesc, { color: theme.text3 }]} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={16} color={theme.text3} />
    </TouchableOpacity>
  );
}

// ─── Écran ────────────────────────────────────────────────────────────────────

export function SearchScreen() {
  const { theme, isDark } = useTheme();
  const navigation        = useNavigation<Nav>();
  const insets            = useSafeAreaInsets();
  const inputRef          = useRef<TextInput>(null);
  const debounceRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,     setQuery]     = useState('');
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [lastQ,     setLastQ]     = useState('');
  const [error,     setError]     = useState(false);

  const active = query.trim().length >= 2;

  // Lancer la recherche avec debounce 350ms
  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]); setTotal(0); setLastQ(''); setError(false);
      return;
    }
    if (trimmed === lastQ) return;
    setLastQ(trimmed);
    setSearching(true);
    setError(false);
    try {
      const res = await api.searchContent(trimmed, 50);
      setResults(res?.items ?? []);
      setTotal(res?.totalFound ?? res?.items?.length ?? 0);
    } catch {
      setError(true);
    } finally {
      setSearching(false);
    }
  }, [lastQ]);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 350);
  }, [doSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]); setTotal(0); setLastQ('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Grouper par type dans l'ordre défini
  const grouped = useMemo(() => {
    if (!results.length) return [];
    const map: Record<string, any[]> = {};
    for (const item of results) {
      const k = item.type ?? 'show';
      if (!map[k]) map[k] = [];
      map[k].push(item);
    }
    const ordered = TYPE_ORDER.filter(k => map[k]);
    const rest    = Object.keys(map).filter(k => !TYPE_ORDER.includes(k));
    return [...ordered, ...rest].map(k => ({ type: k, cfg: getCfg(k), items: map[k] }));
  }, [results]);

  // Navigation vers le contenu
  const navigateTo = useCallback((item: any) => {
    if (item.type === 'news') {
      navigation.navigate('NewsDetail', { id: item.id });
    } else {
      navigation.navigate('ShowDetail', { id: item.id, type: item.type });
    }
  }, [navigation]);

  // FlatList aplatie : header de groupe + lignes
  type ListItem =
    | { _t: 'header'; type: string; cfg: any; count: number }
    | { _t: 'row';    item: any };

  const flatData = useMemo((): ListItem[] => {
    const out: ListItem[] = [];
    for (const g of grouped) {
      out.push({ _t: 'header', type: g.type, cfg: g.cfg, count: g.items.length });
      for (const it of g.items) out.push({ _t: 'row', item: it });
    }
    return out;
  }, [grouped]);

  const showEmpty = active && !searching && !error && !results.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Barre de recherche ── */}
      <View style={[styles.searchBar, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: active ? COLORS.primary : theme.border }]}>
          <Icon name="search" size={17} color={theme.text3} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.text }]}
            value={query}
            onChangeText={handleChange}
            placeholder="Rechercher un titre, sujet…"
            placeholderTextColor={theme.text3}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            onSubmitEditing={() => { if (debounceRef.current) clearTimeout(debounceRef.current); doSearch(query); }}
          />
          {searching
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : query.length > 0
              ? <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Icon name="close-circle" size={18} color={theme.text3} />
                </TouchableOpacity>
              : null
          }
        </View>
      </View>

      {/* Compteur */}
      {results.length > 0 && (
        <View style={[styles.countBar, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.countText, { color: theme.text3 }]}>
            {total} résultat{total > 1 ? 's' : ''} pour «&nbsp;{query}&nbsp;»
          </Text>
        </View>
      )}

      {/* ── Contenu ── */}
      {!active ? (
        /* Suggestions catégories avant toute saisie */
        <FlatList
          data={SUGGESTIONS}
          keyExtractor={s => s.page}
          numColumns={3}
          columnWrapperStyle={styles.suggestRow}
          contentContainerStyle={[styles.suggestContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.suggestTitle, { color: theme.text3 }]}>Parcourir par catégorie</Text>
          }
          renderItem={({ item: s }) => (
            <TouchableOpacity
              style={[styles.suggestCard, { backgroundColor: theme.surface }]}
              onPress={() => navigation.navigate(s.page as any)}
              activeOpacity={0.75}
            >
              <Icon name={s.icon as any} size={26} color={s.color} />
              <Text style={[styles.suggestLabel, { color: theme.text2 }]} numberOfLines={2}>
                {s.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : error ? (
        <View style={styles.state}>
          <Icon name="alert-circle-outline" size={44} color={theme.text3} />
          <Text style={[styles.stateTitle, { color: theme.text3 }]}>Erreur de recherche</Text>
          <TouchableOpacity onPress={() => doSearch(query)} style={[styles.retryBtn, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : showEmpty ? (
        <View style={styles.state}>
          <Icon name="search-outline" size={44} color={theme.text3} />
          <Text style={[styles.stateTitle, { color: theme.text3 }]}>Aucun résultat</Text>
          <Text style={[styles.stateSub, { color: theme.text3 }]}>Essayez avec d'autres mots</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(it, i) => it._t === 'header' ? `h_${it.type}` : `r_${(it as any).item?.id}_${i}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item: it }) => {
            if (it._t === 'header') {
              return (
                <View style={[styles.groupHeader, { backgroundColor: theme.bg }]}>
                  <Icon name={it.cfg.icon as any} size={14} color={it.cfg.color} />
                  <Text style={[styles.groupLabel, { color: theme.text }]}>
                    {it.cfg.label.toUpperCase()}
                  </Text>
                  <Text style={[styles.groupCount, { color: theme.text3 }]}>({it.count})</Text>
                </View>
              );
            }
            return (
              <ResultRow
                item={(it as any).item}
                onPress={() => navigateTo((it as any).item)}
                theme={theme}
              />
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg, paddingBottom: 10,
    borderBottomWidth: 0.5, gap: SPACING.sm,
  },
  backBtn:     { padding: 4, flexShrink: 0 },
  inputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1.5, borderRadius: RADIUS.lg, height: 44, paddingHorizontal: SPACING.md,
  },
  input: { flex: 1, fontSize: FONT_SIZE.base, height: '100%' },

  countBar: {
    paddingHorizontal: SPACING.lg, paddingVertical: 8, borderBottomWidth: 0.5,
  },
  countText: { fontSize: FONT_SIZE.sm },

  // Suggestions
  suggestContainer: { padding: SPACING.lg },
  suggestTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: SPACING.md,
  },
  suggestRow:  { gap: SPACING.sm, marginBottom: SPACING.sm },
  suggestCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.lg, minHeight: 80,
  },
  suggestLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },

  // Groupes résultats
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.sm,
  },
  groupLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.6 },
  groupCount: { fontSize: FONT_SIZE.xs },

  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    gap: SPACING.md, borderBottomWidth: 0.5,
  },
  resultThumb: {
    width: 72, height: 52, borderRadius: RADIUS.md, overflow: 'hidden',
    flexShrink: 0, alignItems: 'center', justifyContent: 'center',
  },
  resultInfo:  { flex: 1, minWidth: 0 },
  resultTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, lineHeight: 18, marginBottom: 3 },
  resultDesc:  { fontSize: FONT_SIZE.xs },

  // États vides/erreur
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  stateTitle: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  stateSub:   { fontSize: FONT_SIZE.sm },
  retryBtn:   { borderRadius: RADIUS.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, marginTop: SPACING.sm },
  retryText:  { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});
