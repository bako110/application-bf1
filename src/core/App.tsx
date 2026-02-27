/**
 * BF1 React Native App - Version organisée et simplifiée
 */

import React, { useState, useContext } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

// Contexts
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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

// ===== Wrapper pour gérer la navigation et les retours =====
function NavigationWrapperWithBackHandling() {
  const [currentTab, setCurrentTab] = React.useState('Accueil');
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <NavigationWrapper onTabChange={setCurrentTab}>
        <FloatingMenuButton hideInProfile={currentTab === 'Mon compte'} />
      </NavigationWrapper>
    </NavigationContainer>
  );
}

// ===== Main App =====
function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const auth = useAuth();
  const { isAuthenticated, loading } = auth as { isAuthenticated: boolean; loading: boolean; user: any; isPremium: boolean; login: Function; register: Function; logout: Function; refreshUser: Function };

  console.log('[APPCONTENT] État d\'authentification:', { isAuthenticated, loading });

  // Initialiser les services au démarrage
  React.useEffect(() => {
    // Verrouiller l'orientation en portrait par défaut pour toute l'app
    Orientation.lockToPortrait();
    
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

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#E23E3E" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationWrapperWithBackHandling />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;