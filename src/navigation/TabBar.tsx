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
  const { theme }                    = useTheme();
  const { t }                        = useTranslation();
  const insets                       = useSafeAreaInsets();
  const { isFullscreen, isWatchScreenOpen, setOnLiveTab } = useLiveStore();

  const activeTabName = state.routes[state.index]?.name;

  React.useEffect(() => {
    setOnLiveTab(activeTabName === 'LiveTab');
  }, [activeTabName, setOnLiveTab]);

  if (isFullscreen || isWatchScreenOpen) return null;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.tabBar.bg,
        paddingBottom:   Math.max(insets.bottom, 0),
        borderTopColor:  COLORS.primary,
      },
    ]}>
      <View style={styles.tabs}>
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
              <Icon
                name={isFocused ? tab.iconActive : tab.icon}
                size={22}
                color={color}
              />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {tab.label(t)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1.5,
    shadowColor:    COLORS.primary,
    shadowOffset:   { width: 0, height: -4 },
    shadowOpacity:  0.2,
    shadowRadius:   15,
    elevation:      12,
  },
  tabs: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-around',
    paddingTop:     6,
    paddingBottom:  4,
  },
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-start',
    gap:            2,
    paddingTop:     2,
  },
  label: {
    fontSize:   10,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 14,
  },
});
