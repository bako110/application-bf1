import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar, LogBox, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrientationLib from 'react-native-orientation-locker';
const Orientation = (OrientationLib as any)?.default ?? OrientationLib;

import { useThemeStore } from './stores';
import { useAuthStore }  from './stores';
import { useUiStore }    from './stores';
import { useLiveStore }  from './stores';
import { RootNavigator }      from './navigation/RootNavigator';
import { navigationRef }      from './navigation/navigationRef';
import { SplashScreen }       from './components/SplashScreen';
import { LoginRequiredModal } from './components/ui/LoginRequiredModal';
import { useLoginNavigation } from './hooks/useLoginNavigation';
import { SCREEN } from './constants';
import { FORCE_PLAY_JS } from './utils/playerSource';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

export { navigationRef };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      staleTime:            5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── WebView live globale — au-dessus de tout, jamais détruite ────────────────
const HIDE_DELAY = 3000;

function GlobalLivePlayer() {
  const { playerUrl, isOnAir, isFullscreen, isOnLiveTab, isWatchScreenOpen, isPlayerHidden, webViewKey, closeFullscreen, openFullscreen, refreshPlayer, fullscreenOrigin } = useLiveStore();

  const handleClose = useCallback(() => {
    closeFullscreen();
    if (fullscreenOrigin === 'home' && navigationRef.isReady()) {
      navigationRef.navigate('HomeTab');
    }
  }, [closeFullscreen, fullscreenOrigin]);
  const insets          = useSafeAreaInsets();
  const webViewRef      = useRef<any>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [isMuted,      setIsMuted]      = useState(false);
  const hideTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // iOS : état réel de la vidéo remonté par FORCE_PLAY_JS → boutons toujours justes
  const onWebViewMessage = useCallback((e: any) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      setVideoPlaying(!!m.playing);
      if (m.playing) { setIsMuted(!!m.muted); setIsPaused(false); }
    } catch {}
  }, []);

  const showThenHide = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), HIDE_DELAY);
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) {
      webViewRef.current?.injectJavaScript(
        'try{document.querySelectorAll("video").forEach(function(v){v.play();});}catch(e){}true;'
      );
      setIsPaused(false);
    } else {
      webViewRef.current?.injectJavaScript(
        'try{document.querySelectorAll("video").forEach(function(v){v.pause();});}catch(e){}true;'
      );
      setIsPaused(true);
    }
  }, [isPaused]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    webViewRef.current?.injectJavaScript(
      `try{document.querySelectorAll("video,audio").forEach(function(m){m.muted=${next};});}catch(e){}true;`
    );
  }, [isMuted]);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  useEffect(() => {
    if (isFullscreen) {
      try { Orientation?.lockToLandscape?.(); } catch {}
    } else {
      try { Orientation?.lockToPortrait?.(); } catch {}
    }
  }, [isFullscreen]);

  if (!isOnAir || playerUrl === 'about:blank') return null;
  if (!isOnLiveTab && !isFullscreen) return null;
  if (isPlayerHidden && !isFullscreen) return null;

  // Écran "regarder le direct" seul (pas de TabBar, pas de contenu sous le player)
  // → centrer verticalement le bloc 16:9 dans l'espace disponible au lieu de le coller en haut
  const playerH = SCREEN.W * (9 / 16);
  const availableH = SCREEN.H - insets.top - insets.bottom;
  const centeredTop = insets.top + Math.max(0, (availableH - playerH) / 2);

  return (
    <View style={[
      glStyles.player,
      isFullscreen
        ? glStyles.fullscreen
        : { ...glStyles.normal, top: isWatchScreenOpen ? centeredTop : insets.top },
    ]}>
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: playerUrl }}
        style={StyleSheet.absoluteFill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        originWhitelist={['*']}
        scrollEnabled={false}
        onMessage={onWebViewMessage}
        injectedJavaScript={`
          (function() {
            var style = document.createElement('style');
            style.textContent = [
              '.dmp-player-controller','.dmp-controls','.dmp-fullscreen-btn',
              '.dmp-volume','.dmp-progress','.dmp-time','.dmp-settings','.dmp-overlay',
              '[class*="controls"]','[class*="toolbar"]',
              '[class*="playerUi"]','[class*="player-ui"]','[class*="player_ui"]',
            ].join(',') + '{ display:none !important; pointer-events:none !important; }';
            document.head.appendChild(style);
          })();
          true;
        ` + (Platform.OS === 'ios' ? FORCE_PLAY_JS : '')}
      />

      {/* Zone de tap — couvre toute la vidéo, affiche les contrôles au toucher */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => {
          showThenHide();
          if (Platform.OS === 'ios' && !isPaused) webViewRef.current?.injectJavaScript(FORCE_PLAY_JS);
        }}
        activeOpacity={1}
      />

      {/* iOS : gros bouton lecture tant que la vidéo ne tourne pas (et n'est pas en pause volontaire) */}
      {Platform.OS === 'ios' && !videoPlaying && !isPaused && (
        <TouchableOpacity
          style={glStyles.bigPlay}
          activeOpacity={0.8}
          onPress={() => webViewRef.current?.injectJavaScript(FORCE_PLAY_JS)}
        >
          <View style={glStyles.bigPlayCircle}>
            <Icon name="play" size={34} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>
      )}

      {/* Contrôles — visibles seulement après un tap, disparaissent après 3s */}
      {showControls && (
        <View style={isFullscreen ? glStyles.controlBarFs : glStyles.controlBar}>
          <TouchableOpacity style={glStyles.ctrlBtn} onPress={togglePause} activeOpacity={0.8}>
            <Icon name={isPaused ? 'play' : 'pause'} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={glStyles.ctrlBtn} onPress={toggleMute} activeOpacity={0.8}>
            <Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={glStyles.ctrlBtn} onPress={refreshPlayer} activeOpacity={0.8}>
            <Icon name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={glStyles.ctrlSpacer} />
          {isFullscreen ? (
            <TouchableOpacity style={glStyles.ctrlBtn} onPress={handleClose} activeOpacity={0.8}>
              <Icon name="contract-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={glStyles.ctrlBtn} onPress={openFullscreen} activeOpacity={0.8}>
              <Icon name="expand-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const glStyles = StyleSheet.create({
  player: { backgroundColor: '#000', overflow: 'hidden' },
  bigPlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bigPlayCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  normal: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    aspectRatio: 16 / 9,
    zIndex: 1,
  },
  fullscreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },
  controlBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  controlBarFs: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  ctrlBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 6,
  },
  ctrlSpacer: { flex: 1 },
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
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
          <GlobalModals />
        </NavigationContainer>
      )}
      <GlobalLivePlayer />
      {(!splashDone || !ready) && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
    </View>
  );
}

// Verrouiller le portrait au démarrage — seul le fullscreen live peut passer en landscape
try { Orientation?.lockToPortrait?.(); } catch {}

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
