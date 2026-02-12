import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({});

// Thème sombre (par défaut)
const darkColors = {
  primary: '#DC143C',
  secondary: '#8B0000',
  background: '#000000',
  surface: '#1A0000',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  error: '#FF0000',
  success: '#34C759',
  border: '#330000',
  accent: '#FF4444',
  gradient: {
    start: '#DC143C',
    middle: '#8B0000',
    end: '#000000',
  },
};

// Thème clair
const lightColors = {
  primary: '#DC143C',
  secondary: '#8B0000',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  error: '#FF0000',
  success: '#34C759',
  border: '#E0E0E0',
  accent: '#FF4444',
  gradient: {
    start: '#DC143C',
    middle: '#FF6B6B',
    end: '#FFFFFF',
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
