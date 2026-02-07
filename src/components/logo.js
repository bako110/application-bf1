import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Logo = ({ size = 'medium', showText = true }) => {
  const fontSize = size === 'small' ? 28 : size === 'large' ? 56 : 42;

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Text style={[styles.letterB, { fontSize }]}>B</Text>
        <Text style={[styles.letterF, { fontSize }]}>F</Text>
        <View style={styles.numberContainer}>
          <Text style={[styles.letter1, { fontSize }]}>1</Text>
        </View>
      </View>
      {showText && <Text style={styles.tagline}>La chaîne au coeur de nos défis</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterB: {
    fontWeight: '900',
    color: '#DC143C',
    textShadowColor: 'rgba(220, 20, 60, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  letterF: {
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  numberContainer: {
    backgroundColor: '#DC143C',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 2,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  letter1: {
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});

export default Logo;
