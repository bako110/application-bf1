import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const Splash = () => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(30)).current;
  
  const [taglineText, setTaglineText] = useState('');
  const fullTagline = "La chaine au coeur de nos défis";

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTagline.length) {
        setTaglineText(fullTagline.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Main animation sequence
  useEffect(() => {
    // Logo entrance with bounce
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotation effect
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Tagline animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(taglineSlide, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolate glow
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Animated background */}
      <Animated.View style={[styles.particle, { opacity: glowOpacity, transform: [{ scale: pulseAnim }] }]} />
      
      <View style={styles.content}>
        {/* Logo container with animations */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Outer rotating ring */}
          <Animated.View
            style={[
              styles.outerRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.ringSegment} />
            <View style={[styles.ringSegment, styles.ringSegment2]} />
            <View style={[styles.ringSegment, styles.ringSegment3]} />
            <View style={[styles.ringSegment, styles.ringSegment4]} />
          </Animated.View>
          
          {/* Main circle with BF1 */}
          <View style={styles.mainCircle}>
            <Text style={styles.logoText}>BF1</Text>
          </View>
          
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </Animated.View>

        {/* Tagline with typewriter effect */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineSlide }],
            },
          ]}
        >
          <Text style={styles.tagline}>{taglineText}</Text>
          <View style={styles.cursor} />
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[styles.loadingContainer, { opacity: taglineOpacity }]}>
          <LoadingDots />
        </Animated.View>
      </View>
    </View>
  );
};

// Loading dots component
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const getDotStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#DC143C',
    opacity: 0.1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSegment: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC143C',
    top: 0,
  },
  ringSegment2: {
    right: 0,
    top: 'auto',
    left: 'auto',
  },
  ringSegment3: {
    bottom: 0,
    top: 'auto',
  },
  ringSegment4: {
    left: 0,
    top: 'auto',
    right: 'auto',
  },
  mainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DC143C',
    opacity: 0.3,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 1,
  },
  cursor: {
    width: 3,
    height: 20,
    backgroundColor: '#DC143C',
    marginLeft: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    marginTop: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC143C',
  },
});

export default Splash;
