import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import axios from 'axios';
import { API_ROOT_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onReady?: () => void;
}

const Splash: React.FC<SplashProps> = ({ onReady }) => {
  // Animations principales - Agrandissement progressif + mouvement continu
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(30)).current;
  
  const [taglineText, setTaglineText] = useState('');
  const fullTagline = "La chaine au coeur de nos défis";
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState('Connexion au serveur...');
  const startTimeRef = useRef(Date.now());

  // Vérifier la connexion au backend
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    let retries = 0;
    const maxRetries = 10;
    const retryDelay = 2000; // 2 secondes entre chaque tentative
    const minDisplayTime = 3000; // 3 secondes minimum d'affichage

    const attemptConnection = async (): Promise<boolean> => {
      try {
        setStatusMessage(`Connexion au serveur... (${retries + 1}/${maxRetries})`);
        const response = await axios.get(`${API_ROOT_URL}/health`, {
          timeout: 5000,
        });
        
        if (response.data && response.data.status === 'healthy') {
          setBackendStatus('connected');
          setStatusMessage('Serveur connecté ✓');
          
          // Calculer le temps écoulé depuis le début
          const elapsedTime = Date.now() - startTimeRef.current;
          const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
          
          // Attendre le temps restant pour garantir 3 secondes minimum
          setTimeout(() => {
            if (onReady) onReady();
          }, remainingTime);
          
          return true;
        }
        return false;
      } catch (error) {
        console.log('Backend health check failed:', error);
        retries++;
        
        if (retries < maxRetries) {
          setStatusMessage(`Reconnexion... (${retries}/${maxRetries})`);
          await new Promise<void>(resolve => setTimeout(() => resolve(), retryDelay));
          return attemptConnection();
        } else {
          setBackendStatus('error');
          setStatusMessage('Impossible de se connecter au serveur');
          return false;
        }
      }
    };

    await attemptConnection();
  };

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

  // Main animation sequence - AGRANDISSEMENT + MOUVEMENT CONTINU
  useEffect(() => {
    // 1. Agrandissement progressif de l'image (de 0 à 1)
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulsation continue (mouvement constant)
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

    // 3. Tagline animation
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


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo container avec agrandissement progressif */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          {/* Image du logo BF1 */}
          <Image
            source={require('../../assets/splash.png')}
            style={styles.logoImage}
            resizeMode="contain"
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

        {/* Status message */}
        <Animated.View style={[styles.statusContainer, { opacity: taglineOpacity }]}>
          <Text style={[
            styles.statusText,
            backendStatus === 'connected' && styles.statusSuccess,
            backendStatus === 'error' && styles.statusError,
          ]}>
            {statusMessage}
          </Text>
        </Animated.View>

        {/* Loading dots */}
        {backendStatus === 'checking' && (
          <Animated.View style={[styles.loadingContainer, { opacity: taglineOpacity }]}>
            <LoadingDots />
          </Animated.View>
        )}
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
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
  statusContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  statusSuccess: {
    color: '#4CAF50',
  },
  statusError: {
    color: '#DC143C',
  },
});

export default Splash;
