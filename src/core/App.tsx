/**
 * BF1 React Native App - Version organisée et simplifiée
 */

import React, { useState, useContext } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, BackHandler, ToastAndroid, Platform } from 'react-native';
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
  const backPressCount = React.useRef(0);
  const backPressTimer = React.useRef<any>(null);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const navigation = navigationRef.current;
      if (!navigation) return false;

      const state = navigation.getState();
      const currentRoute = state?.routes[state.index];
      const currentRouteName = currentRoute?.name;

      console.log('🔙 Back press - Tab actuel:', currentRouteName, 'Count:', backPressCount.current);

      // Si on est sur l'onglet Accueil
      if (currentRouteName === 'Accueil') {
        const homeState = currentRoute?.state;
        const homeIndex = homeState?.index ?? 0;
        const homeRoute = homeState?.routes?.[homeIndex];
        
        // Si on est sur l'écran principal de l'accueil (Movies)
        if (!homeState || homeRoute?.name === 'Movies') {
          // Double back press pour quitter
          backPressCount.current += 1;

          if (backPressCount.current === 1) {
            // Premier back press - afficher le toast
            if (Platform.OS === 'android') {
              ToastAndroid.show('Appuyez encore une fois pour quitter', ToastAndroid.SHORT);
            }
            
            // Réinitialiser après 2 secondes
            if (backPressTimer.current) clearTimeout(backPressTimer.current);
            backPressTimer.current = setTimeout(() => {
              backPressCount.current = 0;
            }, 2000);
            
            return true; // Empêcher la sortie
          } else {
            // Deuxième back press - quitter l'app
            BackHandler.exitApp();
            return true;
          }
        } else {
          // On est dans un sous-écran de l'accueil - retour normal
          backPressCount.current = 0;
          return false;
        }
      } else {
        // On n'est pas sur l'onglet Accueil
        const routeState = currentRoute?.state;
        const routeIndex = routeState?.index ?? 0;
        
        // Si on a navigué dans plusieurs écrans dans cet onglet
        if (routeState && routeIndex > 0) {
          // Laisser le retour normal fonctionner
          backPressCount.current = 0;
          return false;
        } else {
          // On est sur l'écran principal d'un autre onglet
          // Retourner directement à l'accueil
          console.log('✅ Retour direct vers Accueil');
          navigation.navigate('Accueil');
          backPressCount.current = 0;
          return true;
        }
      }
    });

    return () => {
      backHandler.remove();
      if (backPressTimer.current) clearTimeout(backPressTimer.current);
    };
  }, []);

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