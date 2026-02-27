import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const Logo = ({ size = 'medium', showText = true }) => {
  // Définir les tailles en fonction du prop size
  const getImageSize = () => {
    switch(size) {
      case 'small':
        return { width: 80, height: 80 };
      case 'large':
        return { width: 180, height: 180 };
      case 'medium':
      default:
        return { width: 120, height: 120 };
    }
  };

  const imageSize = getImageSize();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/splash.png')} 
          style={[styles.logoImage, imageSize]}
          resizeMode="contain"
        />
      </View>
      {showText && <Text style={styles.tagline}>La chaîne au coeur de nos défis</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23E3E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  logoImage: {
    // Les dimensions exactes sont définies dynamiquement via getImageSize()
  },
  tagline: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default Logo;