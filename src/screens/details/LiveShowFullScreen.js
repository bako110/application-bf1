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

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ route, navigation }) {
  const { stream } = route.params;
  const videoRef = useRef(null);
  
  const [isLivePlaying, setIsLivePlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false); // Masqué par défaut
  const [playbackRate, setPlaybackRate] = useState(1.0); // Vitesse de lecture (non supportée)
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const controlsTimer = useRef(null);

  useEffect(() => {
    if (!stream || !stream.url) {
      setError('Stream introuvable');
      setIsLoading(false);
    }
    
    // Forcer le mode paysage pour le live
    Orientation.lockToLandscape();
    
    // Cacher la StatusBar
    StatusBar.setHidden(true);
    
    return () => {
      // Revenir en portrait en quittant
      Orientation.lockToPortrait();
      StatusBar.setHidden(false);
      
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
    
    // Démarrer le timer pour masquer les contrôles après 3 secondes
    resetControlsTimer();
  }, [stream]);

  const onLoad = (data) => {
    setIsLoading(false);
    setIsBuffering(false);
    setDuration(data.duration);
  };

  const onBuffer = ({ isBuffering }) => {
    setIsBuffering(isBuffering);
  };

  const onError = (error) => {
    setIsLoading(false);
    setIsBuffering(false);
    setError('Stream indisponible');
    Alert.alert('Erreur', 'Impossible de lire le stream');
  };

  const onProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
    resetControlsTimer();
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

  const activateLandscape = () => {
    // Activer le mode paysage au clic
    Orientation.lockToLandscape();
    setShowControls(false); // Masquer les contrôles en paysage
  };

  const toggleVolume = () => {
    const volumes = [0.0, 0.25, 0.5, 0.75, 1.0];
    const currentIndex = volumes.indexOf(volume);
    const nextIndex = (currentIndex + 1) % volumes.length;
    setVolume(volumes[nextIndex]);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    <View style={styles.container}>
      {stream?.url && (
        <Video
          ref={videoRef}
          source={{ uri: stream.url }}
          style={styles.videoPlayer}
          resizeMode="cover" // Couvre tout l'écran en paysage
          paused={isPaused}
          volume={volume} // Volume
          onLoad={onLoad}
          onBuffer={onBuffer}
          onError={onError}
          onProgress={onProgress}
          repeat={true}
          playInBackground={false}
          playWhenInactive={true}
        />
      )}

      {(isLoading || isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={styles.loadingText}>
            {isBuffering ? 'Mise en mémoire tampon…' : 'Chargement du direct…'}
          </Text>
        </View>
      )}

      {/* Contrôles vidéo */}
      {showControls && (
        <>
          {/* Bouton retour */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Header avec infos */}
          <View style={styles.header}>
            <View style={styles.streamInfo}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>DIRECT</Text>
              </View>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream?.title || stream?.name || 'BF1 TV'}
              </Text>
            </View>
          </View>

          {/* Contrôles centraux */}
          <View style={styles.centerControls}>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
              <Ionicons 
                name={isPaused ? 'play-circle' : 'pause-circle'} 
                size={72} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentTime / duration) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Contrôles supplémentaires */}
          <View style={styles.extraControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleVolume}>
              <Ionicons name={volume === 0 ? "volume-mute-outline" : "volume-high-outline"} size={20} color="#fff" />
              <Text style={styles.controlText}>{Math.round(volume * 100)}%</Text>
            </TouchableOpacity>
          </View>

          {/* Info spectateurs */}
          <View style={styles.viewerInfo}>
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.viewerText}>
              {stream?.viewers || '1.2k'} spectateurs
            </Text>
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
    width: '100%',
    height: '100%',
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
  headerInfo: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
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
    backgroundColor: '#DC143C',
    borderRadius: 2,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#DC143C',
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