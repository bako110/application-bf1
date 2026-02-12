import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions, Image, Text, Modal, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';

const { width, height } = Dimensions.get('window');

export default function VideoPlayer({ videoUrl, posterUrl, onPlayPress, isPremium = false, userHasPremium = false, onPremiumRequired, style = {} }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  
  // Animations
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const playButtonOpacity = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTranslateY = useRef(new Animated.Value(0)).current;

  const handlePlayPress = () => {
    // Vérifier si le contenu est premium et si l'utilisateur a un abonnement
    if (isPremium && !userHasPremium) {
      console.log('🔒 Contenu premium - Abonnement requis');
      if (onPremiumRequired) {
        onPremiumRequired();
      }
      return;
    }

    // Animation du bouton au clic
    Animated.sequence([
      Animated.parallel([
        Animated.spring(playButtonScale, {
          toValue: 0.8,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonOpacity, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(playButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(playButtonOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (!isPlaying) {
      setIsPlaying(true);
      if (onPlayPress) {
        onPlayPress();
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleVideoPress = () => {
    const newShowControls = !showControls;
    
    if (newShowControls) {
      // Animation d'apparition
      setShowControls(true);
      Animated.parallel([
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(controlsTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation de disparition
      Animated.parallel([
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(controlsTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowControls(false));
    }
  };

  const handleProgress = (data) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
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

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = (time) => {
    setIsFullscreen(false);
    if (time && videoRef.current) {
      videoRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="cover"
          paused={!isPlaying}
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={() => {}}
          bufferConfig={{
            minBufferMs: 2000,
            maxBufferMs: 5000,
            bufferForPlaybackMs: 1000,
            bufferForPlaybackAfterRebufferMs: 1500,
          }}
          maxBitRate={2000000}
          posterResizeMode="cover"
          progressUpdateInterval={250}
          playInBackground={false}
          playWhenInactive={false}
          onError={(error) => console.error('VideoPlayer error:', error)}
          onBuffer={({ isBuffering }) => {
            if (isBuffering) {
              console.log('VideoPlayer buffering...');
            }
          }}
        />
      ) : (
        <View style={styles.noVideoContainer}>
          <Ionicons name="videocam-off" size={48} color="#666" />
          <Text style={styles.noVideoText}>Aucune vidéo disponible</Text>
        </View>
      )}

      {/* Zone cliquable pour afficher/masquer les contrôles */}
      <TouchableOpacity
        style={styles.videoTouchArea}
        activeOpacity={1}
        onPress={handleVideoPress}
      />

      {/* Contrôles vidéo avec animations */}
      {showControls && (
        <Animated.View 
          style={[
            styles.controlsContainer,
            {
              opacity: controlsOpacity,
              transform: [{ translateY: controlsTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsGradient}
          >
            {/* Barre de progression */}
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Slider
                style={styles.progressBar}
                value={currentTime}
                minimumValue={0}
                maximumValue={duration || 1}
                minimumTrackTintColor="#FF0000"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FF0000"
                onValueChange={handleSeek}
                onSlidingComplete={handleSlidingComplete}
              />
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>

            {/* Boutons de contrôle */}
            <View style={styles.controlButtons}>
              <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
                <Ionicons name="play-back" size={32} color="#fff" />
              </TouchableOpacity>

              <Animated.View
                style={{
                  transform: [{ scale: playButtonScale }],
                  opacity: playButtonOpacity,
                }}
              >
                <TouchableOpacity onPress={handlePlayPress} style={styles.playButtonLarge}>
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={48} 
                    color="#fff" 
                  />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
                <Ionicons name="play-forward" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFullscreen} style={styles.fullscreenButton}>
                <Ionicons name="expand" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Modal Plein Écran */}
      {isFullscreen && (
        <FullscreenVideoPlayer
          visible={isFullscreen}
          videoUrl={videoUrl}
          onClose={handleCloseFullscreen}
          initialTime={currentTime}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9, // Ratio 16:9 standard
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  posterContainer: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 8,
    height: 40,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    padding: 8,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  noVideoText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
});
