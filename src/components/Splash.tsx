import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, Easing } from 'react-native';
import axios from 'axios';
import { API_ROOT_URL } from '../config/api';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onReady?: () => void;
}

const Splash: React.FC<SplashProps> = ({ onReady }) => {
  // Animations pour le SERPENT
  const snakeProgress = useRef(new Animated.Value(0)).current;
  const snakeOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const [taglineText, setTaglineText] = useState('');
  const fullTagline = "La chaîne au cœur de nos défis";
  
  // État pour gérer le timing
  const [imageVisible, setImageVisible] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const imageDisplayTimeRef = useRef<number | null>(null);

  // Effet SERPENT - Le logo se construit comme un serpent qui s'enroule
  useEffect(() => {
    // Animation du serpent qui s'enroule
    Animated.timing(snakeProgress, {
      toValue: 1,
      duration: 2500,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
      useNativeDriver: true,
    }).start(() => {
      // Une fois le serpent terminé, le logo apparaît
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(snakeOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // L'image est maintenant visible, on note le moment
        setImageVisible(true);
        imageDisplayTimeRef.current = Date.now();
        
        // Vérifier si le serveur est déjà prêt
        if (serverReady) {
          checkAndRedirect();
        }
      });

      // Effet de glow pulsant pour le logo final
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Fonction pour vérifier si on peut rediriger
  const checkAndRedirect = () => {
    if (!imageVisible || !imageDisplayTimeRef.current) return;
    
    const elapsedTime = Date.now() - imageDisplayTimeRef.current;
    const remainingTime = Math.max(0, 3000 - elapsedTime);
    
    setTimeout(() => {
      if (onReady) onReady();
    }, remainingTime);
  };

  // Vérification backend en arrière-plan (sans affichage)
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await axios.get(`${API_ROOT_URL}/health`, {
          timeout: 5000,
        });
        
        if (response.data && response.data.status === 'healthy') {
          setServerReady(true);
          
          // Si l'image est déjà visible, vérifier le timing
          if (imageVisible) {
            checkAndRedirect();
          }
        }
      } catch (error) {
        console.log('Backend health check failed (silent):', error);
        // On ne fait rien, pas d'affichage d'erreur
      }
    };

    checkBackendHealth();
  }, [imageVisible]);

  // Composant du serpent SVG
  const SnakePath = () => {
    // Points de contrôle pour une spirale parfaite
    const radius = 60;
    const centerX = 90;
    const centerY = 90;
    
    // Génération du chemin en spirale complet (une seule fois)
    const getFullSpiralPath = () => {
      const steps = 100;
      const maxTurns = 3;
      const points = [];
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * maxTurns * Math.PI * 2;
        const currentRadius = radius * t;
        const springEffect = Math.sin(t * Math.PI) * 0.2;
        
        const x = centerX + Math.cos(angle) * (currentRadius + springEffect * 20);
        const y = centerY + Math.sin(angle) * (currentRadius + springEffect * 20);
        
        if (i === 0) {
          points.push(`M${x.toFixed(2)},${y.toFixed(2)}`);
        } else {
          points.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
        }
      }
      
      return points.join(' ');
    };
    
    const fullPath = getFullSpiralPath();

    return (
      <Svg width={180} height={180} viewBox="0 0 180 180">
        {/* Traînée lumineuse du serpent */}
        <Circle
          cx={90}
          cy={90}
          r={65}
          fill="none"
          stroke="rgba(220, 20, 60, 0.1)"
          strokeWidth="2"
        />
        
        {/* Le serpent principal - animé avec strokeDashoffset */}
        <AnimatedPath
          d={fullPath}
          stroke="#DC143C"
          strokeWidth={snakeProgress.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [2, 4, 6, 8],
          })}
          strokeLinecap="round"
          fill="none"
          opacity={snakeOpacity}
          strokeDasharray={1000}
          strokeDashoffset={snakeProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1000, 0],
          })}
        />
        
        {/* Tête du serpent (un point plus lumineux) */}
        <AnimatedCircle
          cx={90 + radius * Math.cos(3 * 2 * Math.PI)}
          cy={90 + radius * Math.sin(3 * 2 * Math.PI)}
          r={snakeProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 6, 4],
          })}
          fill="#DC143C"
          opacity={snakeOpacity}
        />
        
        {/* Particules lumineuses qui suivent le serpent */}
        {[0, 1, 2].map((i) => (
          <Circle
            key={`particle-${i}`}
            cx={90 + radius * 0.8 * Math.cos((3 - i * 0.5) * 2 * Math.PI)}
            cy={90 + radius * 0.8 * Math.sin((3 - i * 0.5) * 2 * Math.PI)}
            r={2}
            fill="#FF69B4"
            opacity={0.6}
          />
        ))}
      </Svg>
    );
  };

  // Typewriter effect pour la tagline
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTagline.length) {
        setTaglineText(fullTagline.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Style pour l'effet de glow
  const glowStyle = {
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 30],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [5, 15],
    }),
  };

  return (
    <LinearGradient
      colors={['#000000', '#1a1a1a', '#000000']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Le serpent qui s'enroule */}
        <Animated.View style={[
          styles.snakeContainer,
          { opacity: snakeOpacity }
        ]}>
          <SnakePath />
        </Animated.View>

        {/* Logo final qui apparaît après le serpent */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
              ...glowStyle,
            },
          ]}
        >
          <Image
            source={require('../../assets/splash.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline avec effet machine à écrire */}
        <View style={styles.bottomContainer}>
          <View style={styles.taglineWrapper}>
            <Text style={styles.tagline}>{taglineText}</Text>
            <Animated.View 
              style={[
                styles.cursor,
                { opacity: taglineText.length === fullTagline.length ? 0 : 1 }
              ]} 
            />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

// Composants SVG animés
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  snakeContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: -150,
    alignItems: 'center',
    width: width - 40,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(220, 20, 60, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  cursor: {
    width: 3,
    height: 20,
    backgroundColor: '#DC143C',
    marginLeft: 4,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

export default Splash;