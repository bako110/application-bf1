import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BF1_RED, BF1_RED_DARK, BF1_BLACK, BF1_WHITE, BF1_GRAY_LIGHT, SUCCESS, ERROR } from '../constants/colors';

const ThemeContext = createContext({});

// Thème sombre (par défaut)
const darkColors = {
  primary: BF1_RED,
  secondary: BF1_RED_DARK,
  background: BF1_BLACK,
  surface: '#1A0000',
  text: BF1_WHITE,
  textSecondary: BF1_GRAY_LIGHT,
  error: ERROR,
  success: SUCCESS,
  border: '#330000',
  accent: '#FF4444',
  gradient: {
    start: BF1_RED,
    middle: BF1_RED_DARK,
    end: BF1_BLACK,
  },
};

// Thème clair
const lightColors = {
  primary: BF1_RED,
  secondary: BF1_RED_DARK,
  background: BF1_WHITE,
  surface: '#F5F5F5',
  text: BF1_BLACK,
  textSecondary: '#666666',
  error: ERROR,
  success: SUCCESS,
  border: '#E0E0E0',
  accent: '#FF4444',
  gradient: {
    start: BF1_RED,
    middle: '#FF6B6B',
    end: BF1_WHITE,
  },
};

// Export des couleurs pour compatibilité
export const colors = darkColors;

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [currentColors, setCurrentColors] = useState(darkColors);

  // Charger le thème depuis les paramètres utilisateur
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const userSettings = await AsyncStorage.getItem('userSettings');
      if (userSettings) {
        const settings = JSON.parse(userSettings);
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const applyTheme = (newTheme) => {
    let selectedTheme = newTheme;
    
    // Si mode auto, utiliser le thème du système
    if (newTheme === 'auto') {
      const systemTheme = Appearance.getColorScheme();
      selectedTheme = systemTheme === 'dark' ? 'dark' : 'light';
    }
    
    setTheme(selectedTheme);
    setCurrentColors(selectedTheme === 'dark' ? darkColors : lightColors);
  };

  // Écouter les changements de thème système en mode auto
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'auto') {
        setCurrentColors(colorScheme === 'dark' ? darkColors : lightColors);
      }
    });

    return () => subscription.remove();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ colors: currentColors, theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
