import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, Easing } from 'react-native';
import axios from 'axios';
import { API_ROOT_URL } from '../config/api';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';

const { width, height } = Dimensions.get('window');

interface SplashProps {
  onReady?: () => void;
}

const Splash: React.FC<SplashProps> = ({ onReady }) => {
  // Animations simplifiées juste pour le logo
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const [taglineText, setTaglineText] = useState('');
  const fullTagline = "La chaîne au cœur de nos défis";
  
  // État pour gérer le timing
  const [imageVisible, setImageVisible] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const imageDisplayTimeRef = useRef<number | null>(null);

  // Verrouiller l'orientation en portrait dès le début
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  // Animation simple du logo qui apparaît directement
  useEffect(() => {
    // Le logo apparaît directement
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
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

    // Effet de glow pulsant pour le logo
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
        {/* Logo uniquement - plus de serpent */}
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
    bottom: -50,  // Réduit de -150 à -50 pour rapprocher du logo
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