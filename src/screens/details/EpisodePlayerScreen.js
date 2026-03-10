import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import Slider from '@react-native-community/slider';
import viewService from '../../services/viewService';

const { width, height } = Dimensions.get('window');

export default function EpisodePlayerScreen({ route, navigation }) {
  const { episodeId, episodeTitle, videoUrl, seriesTitle } = route.params;
  const videoRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    // Mode paysage au démarrage
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);

    // Incrémenter les vues
    if (episodeId) {
      viewService.incrementView(episodeId, 'episode').catch(err => 
        console.error('Erreur incrémentation vue:', err)
      );
    }

    // Gérer le bouton retour Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);

    // Cleanup au démontage
    return () => {
      Orientation.lockToPortrait();
      StatusBar.setHidden(false);
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    if (!videoUrl) {
      setError("Aucune URL vidéo n'est définie pour cet épisode");
      setIsLoading(false);
      return;
    }
  }, [videoUrl]);

  // Auto-hide controls après 3 secondes
  useEffect(() => {
    let timer;
    if (showControls && !isPaused) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showControls, isPaused]);

  const handleBack = () => {
    navigation.goBack();
    return true;
  };

  const onLoad = (data) => {
    setIsLoading(false);
    setIsBuffering(false);
    setDuration(data.duration);
  };

  const onBuffer = ({ isBuffering }) => {
    setIsBuffering(isBuffering);
  };

  const onProgress = (data) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const onError = (error) => {
    console.error('Erreur vidéo:', error);
    setIsLoading(false);
    setIsBuffering(false);
    setError('Vidéo indisponible');
    Alert.alert('Erreur', 'Impossible de lire la vidéo');
  };

  const onEnd = () => {
    setIsPaused(true);
    setShowControls(true);
    // Vous pouvez ajouter ici la logique pour passer à l'épisode suivant
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
    setShowControls(true);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleSeek = (value) => {
    setCurrentTime(value);
    setIsSeeking(true);
  };

  const handleSeeking = (value) => {
    videoRef.current?.seek(value);
    setIsSeeking(false);
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={72} color="#FF0000" />
        <Text style={styles.errorTitle}>Lecture impossible</Text>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={toggleControls}
    >
      {videoUrl && (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          paused={isPaused}
          resizeMode="contain"
          onLoad={onLoad}
          onBuffer={onBuffer}
          onProgress={onProgress}
          onError={onError}
          onEnd={onEnd}
          repeat={false}
          volume={1.0}
          playInBackground={false}
          playWhenInactive={false}
          progressUpdateInterval={1000}
        />
      )}

      {/* Loading / Buffering */}
      {(isLoading || isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E23E3E" />
          <Text style={styles.loadingText}>
            {isLoading ? 'Chargement...' : 'Mise en mémoire tampon...'}
          </Text>
        </View>
      )}

      {/* Controls */}
      {showControls && (
        <>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backIconButton}>
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.episodeTitle} numberOfLines={1}>
                {episodeTitle || 'Lecture en cours'}
              </Text>
              {seriesTitle && (
                <Text style={styles.seriesTitle} numberOfLines={1}>
                  {seriesTitle}
                </Text>
              )}
            </View>
          </View>

          {/* Center play/pause */}
          <View style={styles.centerControls}>
            <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
              <Ionicons name="play-back" size={36} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
              <Ionicons 
                name={isPaused ? 'play' : 'pause'} 
                size={48} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
              <Ionicons name="play-forward" size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={currentTime}
                onValueChange={handleSeek}
                onSlidingComplete={handleSeeking}
                minimumTrackTintColor="#E23E3E"
                maximumTrackTintColor="#FFFFFF33"
                thumbTintColor="#E23E3E"
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity style={styles.bottomButton}>
                <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.bottomButton}>
                <Ionicons name="expand" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backIconButton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seriesTitle: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 2,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(226, 62, 62, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    minWidth: 45,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  bottomButton: {
    padding: 8,
  },
});
