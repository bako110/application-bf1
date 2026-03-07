import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';

export default function LiveStreamScreen({ route, navigation }) {
  const { stream } = route.params;
  const videoRef = useRef(null);
  
  console.log('LiveShowFullScreen - Stream:', stream);
  console.log('LiveShowFullScreen - Stream URL:', stream?.url);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(false); // Masqué par défaut
  const [dimensions, setDimensions] = useState(Dimensions.get('screen'));
  const controlsTimer = useRef(null);

  useEffect(() => {
    if (!stream || !stream.url) {
      setError('Stream introuvable');
      setIsLoading(false);
      return;
    }
    
    // Masquer les tabs du TabNavigator parent (footer)
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
    // Autoriser toutes les orientations pour le live (portrait et paysage)
    Orientation.unlockAllOrientations();
    
    // Masquer complètement les barres système pour un vrai plein écran
    StatusBar.setHidden(true, 'fade');
    if (Platform.OS === 'android') {
      // Mode immersif sur Android (masque aussi la barre de navigation)
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }
    
    // Écouter les changements d'orientation pour recalculer les dimensions
    const dimensionListener = Dimensions.addEventListener('change', ({ screen }) => {
      setDimensions(screen);
    });
    
    // Timeout de sécurité : si après 15 secondes on est toujours en loading, forcer la lecture
    const loadingTimeout = setTimeout(() => {
      console.warn('Video loading timeout - forcing display');
      setIsLoading(false);
      setIsBuffering(false);
    }, 15000);
    
    return () => {
      clearTimeout(loadingTimeout);
      
      // Réafficher les tabs en quittant
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }
      });
      
      // Revenir en portrait en quittant
      Orientation.lockToPortrait();
      StatusBar.setHidden(false, 'fade');
      
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
      }
      
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      
      // Retirer le listener
      if (dimensionListener?.remove) {
        dimensionListener.remove();
      }
    };
  }, [stream, navigation]);
  
  useEffect(() => {
    // Démarrer le timer pour masquer les contrôles après 3 secondes
    resetControlsTimer();
  }, []);

  const onLoad = (data) => {
    console.log('Video loaded:', data);
    setIsLoading(false);
    setIsBuffering(false);
  };

  const onBuffer = (data) => {
    console.log('Buffering:', data.isBuffering);
    setIsBuffering(data.isBuffering);
  };

  const onLoadStart = () => {
    console.log('Video load started');
    setIsLoading(true);
  };

  const onReadyForDisplay = () => {
    console.log('Video ready for display');
    setIsLoading(false);
  };

  const onError = (error) => {
    setIsLoading(false);
    setIsBuffering(false);
    setError('Stream indisponible');
    Alert.alert('Erreur', 'Impossible de lire le stream');
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (!showControls) {
      resetControlsTimer();
    }
  };

  const resetControlsTimer = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="tv-outline" size={72} color="#FF0000" />
        <Text style={styles.errorTitle}>Stream indisponible</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <TouchableOpacity 
        style={styles.touchableVideo} 
        activeOpacity={1}
        onPress={toggleControls}
      >
        {stream?.url && (
          <Video
            ref={videoRef}
            source={{ uri: stream.url }}
            style={[styles.videoPlayer, { width: dimensions.width, height: dimensions.height }]}
            resizeMode="cover"
            posterResizeMode="cover"
            paused={false}
            controls={false}
            muted={false}
            volume={1.0}
            rate={1.0}
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
            repeat={false}
            onLoadStart={onLoadStart}
            onLoad={onLoad}
            onReadyForDisplay={onReadyForDisplay}
            onBuffer={onBuffer}
            onError={onError}
            bufferConfig={{
              minBufferMs: 1500,
              maxBufferMs: 5000,
              bufferForPlaybackMs: 500,
              bufferForPlaybackAfterRebufferMs: 1000,
            }}
            maxBitRate={2000000}
          />
        )}
      </TouchableOpacity>

      {(isLoading || isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E23E3E" />
          <Text style={styles.loadingText}>
            {isBuffering ? 'Mise en mémoire tampon…' : 'Chargement du direct…'}
          </Text>
          {__DEV__ && (
            <Text style={[styles.loadingText, { fontSize: 10, marginTop: 10 }]}>
              URL: {stream?.url ? stream.url.substring(0, 50) + '...' : 'N/A'}
            </Text>
          )}
        </View>
      )}

      {/* Contrôles vidéo - Seulement bouton retour */}
      {showControls && (
        <>
          {/* Bouton retour en haut à gauche */}
          <TouchableOpacity style={styles.backButtonOverlay} onPress={handleBack}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Badge LIVE discret en haut */}
          <View style={styles.liveBadgeOverlay}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>DIRECT</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20, // Padding top ajouté pour l'espace en haut
  },
  touchableVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  landscapeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 20, 60, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  landscapeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  videoPlayer: {
    width: '100%', // Toute la largeur
    height: '100%', // Toute la hauteur disponible
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  liveBadgeOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 62, 62, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streamTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 30,
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  centerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 15,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E23E3E',
    borderRadius: 2,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  viewerInfo: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});