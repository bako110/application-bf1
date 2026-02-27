import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Text,
  Modal,
  StatusBar,
  BackHandler,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FullscreenVideoPlayer({ 
  visible,
  videoUrl, 
  onClose,
  initialTime = 0,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  // Gérer l'orientation et le bouton retour
  useEffect(() => {
    if (visible) {
      // Passer en mode paysage
      Orientation.lockToLandscape();
      
      // Gérer le bouton retour Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });

      return () => {
        backHandler.remove();
        // Forcer le portrait puis déverrouiller
        Orientation.lockToPortrait();
        setTimeout(() => {
          Orientation.unlockAllOrientations();
        }, 300);
      };
    }
  }, [visible]);

  // Auto-masquer les contrôles
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [showControls, isPlaying]);

  const handleClose = () => {
    // Forcer le portrait pour que la vidéo reprenne sa taille normale
    Orientation.lockToPortrait();
    // Puis déverrouiller après un court délai pour suivre l'appareil
    setTimeout(() => {
      Orientation.unlockAllOrientations();
    }, 300);
    onClose(currentTime);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
  };

  const handleProgress = (data) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
    // Positionner la vidéo à initialTime si > 0
    if (initialTime > 0 && videoRef.current) {
      videoRef.current.seek(initialTime);
    }
  };

  const handleSeek = (value) => {
    setIsSeeking(true);
    setCurrentTime(value);
  };

  const handleSlidingComplete = (value) => {
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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      supportedOrientations={['landscape']}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Vidéo */}
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="contain"
          paused={!isPlaying}
          onProgress={handleProgress}
          onLoad={handleLoad}
          bufferConfig={{
            minBufferMs: 2000,
            maxBufferMs: 5000,
            bufferForPlaybackMs: 1000,
            bufferForPlaybackAfterRebufferMs: 1500,
          }}
          maxBitRate={2000000}
          progressUpdateInterval={250}
          playInBackground={false}
          playWhenInactive={false}
        />

        {/* Zone tactile pour afficher/masquer les contrôles */}
        <TouchableOpacity
          style={styles.touchArea}
          activeOpacity={1}
          onPress={handleVideoPress}
        />

        {/* Contrôles */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Header avec bouton fermer */}
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.topGradient}
            >
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Contrôles centraux */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
                <Ionicons name="play-back" size={40} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={56} 
                  color="#fff" 
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
                <Ionicons name="play-forward" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Barre de progression en bas */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.bottomGradient}
            >
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Slider
                  style={styles.progressBar}
                  value={currentTime}
                  minimumValue={0}
                  maximumValue={duration || 1}
                  minimumTrackTintColor="#E23E3E"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#E23E3E"
                  onValueChange={handleSeek}
                  onSlidingComplete={handleSlidingComplete}
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  touchArea: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220, 20, 60, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
});
