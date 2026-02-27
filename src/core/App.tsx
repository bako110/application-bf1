/**
 * BF1 React Native App - Version organisée et simplifiée
 */

import React, { useState, useContext } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Orientation from 'react-native-orientation-locker';

// Contexts
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
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

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const Stack = createStackNavigator();

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
    // Verrouiller l'orientation en portrait par défaut
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

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ===== Composant de navigation principale (pour utilisateurs connectés) =====
function MainAppNavigation() {
  const [currentTab, setCurrentTab] = React.useState('Accueil');

  return (
    <NavigationWrapper onTabChange={setCurrentTab}>
      <FloatingMenuButton hideInProfile={currentTab === 'Mon compte'} />
    </NavigationWrapper>
  );
}

// ===== Composant de navigation d'authentification (pour utilisateurs non connectés) =====
function AuthNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        gestureEnabled: false, // Désactiver les gestes de retour
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ===== Composant qui gère la navigation selon l'état d'authentification =====
function RootNavigator() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigationRef = React.useRef<any>(null);
  const backPressCount = React.useRef<number>(0);
  const backPressTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Gérer les boutons retour au niveau de l'appareil
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Ne gérer les retours que si l'utilisateur est connecté
      if (!isAuthenticated) {
        return false; // Laisser le comportement par défaut
      }

      backPressCount.current += 1;

      // Remettre à zéro le compteur après 3 secondes
      if (backPressTimer.current) {
        clearTimeout(backPressTimer.current);
      }
      backPressTimer.current = setTimeout(() => {
        backPressCount.current = 0;
      }, 3000);

      // Au deuxième retour consécutif, aller à l'accueil
      if (backPressCount.current >= 2) {
        backPressCount.current = 0;
        // Naviguer vers l'onglet Accueil
        navigationRef.current?.navigate('Accueil');
        return true; // Empêcher le comportement par défaut
      }

      // Pour le premier retour, permettre la navigation arrière normale
      return false;
    });

    return () => {
      backHandler.remove();
      if (backPressTimer.current) {
        clearTimeout(backPressTimer.current);
      }
    };
  }, [isAuthenticated]);

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#E23E3E" />
      </View>
    );
  }

  // Afficher la navigation appropriée selon l'état d'authentification
  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainAppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  );
}

export default App;