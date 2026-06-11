import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useThemeStore } from './stores';
import { useAuthStore }  from './stores';
import { useUiStore }    from './stores';
import { RootNavigator }      from './navigation/RootNavigator';
import { SplashScreen }       from './components/SplashScreen';
import { LoginRequiredModal } from './components/ui/LoginRequiredModal';
import { useLoginNavigation } from './hooks/useLoginNavigation';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      staleTime:            5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function GlobalModals() {
  const { loginModalVisible, loginModalMessage, hideLoginModal } = useUiStore();
  const navigateToLogin = useLoginNavigation();
  return (
    <LoginRequiredModal
      visible={loginModalVisible}
      message={loginModalMessage}
      onLogin={() => { hideLoginModal(); navigateToLogin(); }}
      onDismiss={hideLoginModal}
    />
  );
}

function AppInit() {
  const { loadSavedMode, mode, theme } = useThemeStore();
  const { initialize } = useAuthStore();
  const { loadLanguage } = useUiStore();

  const [splashDone, setSplashDone] = useState(false);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    Promise.all([loadSavedMode(), loadLanguage(), initialize()]).then(() => {
      setReady(true);
    });
  }, []);


  // Tant que les prefs ne sont pas chargées, on n'affiche rien
  // (la SplashScreen masque tout pendant ce temps)
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      {ready && (
        <NavigationContainer>
          <RootNavigator />
          <GlobalModals />
        </NavigationContainer>
      )}
      {(!splashDone || !ready) && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppInit />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
