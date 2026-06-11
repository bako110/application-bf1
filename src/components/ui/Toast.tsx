import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUiStore } from '../../stores';
import { RADIUS, FONT_SIZE, FONT_WEIGHT, COLORS } from '../../constants';

export function Toast() {
  const { theme } = useTheme();
  const { toastMessage, toastVisible, toastAction, hideToast } = useUiStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue:         toastVisible ? 1 : 0,
      duration:        200,
      useNativeDriver: true,
    }).start();
  }, [toastVisible]);

  if (!toastMessage) return null;

  const handlePress = () => {
    if (toastAction) {
      hideToast();
      toastAction();
    }
  };

  if (toastAction) {
    return (
      <Animated.View style={[styles.toast, { backgroundColor: theme.surface, borderColor: COLORS.primary, opacity }]}>
        <TouchableOpacity style={styles.actionRow} onPress={handlePress} activeOpacity={0.8}>
          <Text style={[styles.text, { color: theme.text, flex: 1 }]}>{toastMessage}</Text>
          <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Se connecter →</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[styles.toast, { backgroundColor: theme.surface, borderColor: theme.border, opacity }]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: theme.text }]}>{toastMessage}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position:    'absolute',
    bottom:      90,
    alignSelf:   'center',
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius: RADIUS.full,
    borderWidth:  1,
    zIndex:       99999,
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius:  6,
    elevation:    10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  text: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  } as any,
  actionLabel: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    flexShrink: 0,
  },
});
