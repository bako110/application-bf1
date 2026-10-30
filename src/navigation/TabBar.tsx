import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StackActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useLiveStore } from '../stores';
import { COLORS, FONT_WEIGHT } from '../constants';

type TabConfig = {
  key:        string;
  icon:       string;
  iconActive: string;
  label:      (t: any) => string;
};

const TABS: TabConfig[] = [
  { key: 'HomeTab',      icon: 'home-outline',         iconActive: 'home',          label: t => t.nav.home      },
  { key: 'EmissionsTab', icon: 'tv-outline',            iconActive: 'tv',            label: t => t.nav.emissions },
  { key: 'LiveTab',      icon: 'radio-outline',         iconActive: 'radio-outline', label: t => t.nav.live      },
  // { key: 'ReelsTab',     icon: 'play-circle-outline',   iconActive: 'play-circle',   label: t => t.nav.reels     },
  { key: 'ProfileTab',   icon: 'person-circle-outline', iconActive: 'person-circle', label: t => t.nav.profile   },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, isDark }            = useTheme();
  const { t }                        = useTranslation();
  const insets                       = useSafeAreaInsets();
  const { isFullscreen, isWatchScreenOpen, setOnLiveTab } = useLiveStore();

  const activeTabName = state.routes[state.index]?.name;

  React.useEffect(() => {
    setOnLiveTab(activeTabName === 'LiveTab');
  }, [activeTabName, setOnLiveTab]);

  if (isFullscreen || isWatchScreenOpen) return null;

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none"
    >
      <View style={[
        styles.tabs,
        {
          backgroundColor: isDark ? 'rgba(18,18,18,0.90)' : 'rgba(255,255,255,0.92)',
          borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
        },
      ]}>
        {TABS.map(tab => {
          const route     = state.routes.find(r => r.name === tab.key);
          if (!route) return null;
          const isFocused = state.routes[state.index]?.name === tab.key;
          const color     = isFocused ? COLORS.primary : theme.tabBar.inactive;

          const onPress = () => {
            const event = navigation.emit({
              type:              'tabPress',
              target:            route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;

            if (isFocused) {
              // Re-tap sur l'onglet déjà actif → ramener son stack à la racine
              // (sinon on reste coincé sur Login / Notifications / Settings…).
              const nested: any = route.state;
              if (nested && Array.isArray(nested.routes) && nested.routes.length > 1) {
                navigation.dispatch({
                  ...StackActions.popToTop(),
                  target: nested.key,
                });
              }
              return;
            }

            navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <View style={[styles.tabPill, isFocused && styles.tabPillActive]}>
                <Icon
                  name={isFocused ? tab.iconActive : tab.icon}
                  size={22}
                  color={color}
                />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {tab.label(t)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Zone transparente autour de la barre flottante
  container: {
    backgroundColor:   'transparent',
    paddingHorizontal: 16,
    paddingTop:        6,
  },
  // Barre « pilule » arrondie, semi-transparente
  tabs: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
    borderRadius:   30,
    borderWidth:    1,
    paddingVertical:   6,
    paddingHorizontal: 6,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.25,
    shadowRadius:   14,
    elevation:      14,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  tabPill: {
    alignItems:        'center',
    justifyContent:    'center',
    gap:               2,
    paddingVertical:   6,
    paddingHorizontal: 14,
    borderRadius:      22,
  },
  tabPillActive: {
    backgroundColor: 'rgba(226,62,62,0.16)',
  },
  label: {
    fontSize:   10,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 14,
  },
});
