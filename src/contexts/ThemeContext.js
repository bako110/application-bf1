import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({});

export const colors = {
  primary: '#DC143C',      // Rouge crimson - couleur principale
  secondary: '#8B0000',    // Rouge foncé (dark red)
  background: '#000000',   // Noir
  surface: '#1A0000',      // Noir rougeâtre
  text: '#FFFFFF',         // Blanc
  textSecondary: '#B0B0B0', // Gris clair
  error: '#FF0000',        // Rouge vif
  success: '#34C759',      // Vert
  border: '#330000',       // Bordure rouge très foncé
  accent: '#FF4444',       // Rouge accent
  gradient: {
    start: '#DC143C',      // Rouge crimson
    middle: '#8B0000',     // Rouge foncé
    end: '#000000',        // Noir
  },
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
