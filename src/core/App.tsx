/**
 * BF1 React Native App - Version organisée et simplifiée
 */

import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Contexts
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Services
import reminderNotificationService from '../services/reminderNotificationService';
import notificationService from '../services/notificationService';
import websocketService from '../services/websocketService';
import pushNotificationService from '../services/pushNotificationService';

// Components
import Splash from '../components/Splash';
import FloatingMenuButton from '../components/FloatingMenuButton';
import { NavigationWrapper } from '../components/navigation/AppNavigation';

// ===== Main App Component =====
function App() {
  const [isReady, setIsReady] = useState(false);

  // Afficher le splash screen jusqu'à ce que le backend soit prêt
  if (!isReady) {
    return <Splash onReady={() => setIsReady(true)} />;
  }

  return <AppContent />;
}

// ===== Main App =====
function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';

  // Initialiser les services au démarrage
  React.useEffect(() => {
    reminderNotificationService.initialize();
    reminderNotificationService.syncAllReminders();
    
    // Initialiser les notifications push
    notificationService.initializePushNotifications();
    
    // Connecter au WebSocket pour les notifications en temps réel
    websocketService.connect();
    
    // Replanifier les notifications quotidiennes toutes les heures
    const rescheduleInterval = setInterval(() => {
      pushNotificationService.rescheduleDailyNotifications();
    }, 60 * 60 * 1000); // Toutes les heures
    
    return () => {
      clearInterval(rescheduleInterval);
      websocketService.disconnect();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <AppNavigationWrapper />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ===== Wrapper pour FloatingMenuButton avec navigation state =====
function AppNavigationWrapper() {
  const [currentTab, setCurrentTab] = React.useState('Accueil');

  return (
    <NavigationWrapper onTabChange={setCurrentTab}>
      <FloatingMenuButton hideInProfile={currentTab === 'Mon compte'} />
    </NavigationWrapper>
  );
}

export default App;