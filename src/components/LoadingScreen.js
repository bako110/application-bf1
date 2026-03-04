import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SnakeLoader({ size = 30 }) {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.centered}>
      <Animated.View style={[styles.loader, {
        width: size,
        height: size,
        transform: [{ rotate: spin }]
      }]}>
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          top: 0,
          left: size * 0.35,
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          top: size * 0.2,
          right: 0,
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          bottom: size * 0.2,
          right: 0,
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          bottom: 0,
          left: size * 0.35,
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          bottom: size * 0.2,
          left: 0,
        }]} />
        <View style={[styles.dot, { 
          backgroundColor: colors.primary,
          top: size * 0.2,
          left: 0,
        }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loader: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});