import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ImageBackground,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../contexts/ThemeContext';
import liveStreamService from '../services/liveStreamService';

const { width, height } = Dimensions.get('window');

const BF1LivePlayer = ({ isVisible = true }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stream, setStream] = useState(null);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [controlsOpacity] = useState(new Animated.Value(0));
  
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  useEffect(() => {
    if (isVisible) {
      loadStream();
    }
  }, [isVisible]);

  useEffect(() => {
    // Mettre à jour le programme actuel toutes les minutes
    const interval = setInterval(() => {
      if (isVisible) {
        setCurrentProgram(liveStreamService.getCurrentProgram());
      }
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [isVisible]);

  const loadStream = async () => {
    try {
      setIsLoading(true);
      const bf1Stream = await liveStreamService.getBF1Stream();
      setStream(bf1Stream);
      setCurrentProgram(liveStreamService.getCurrentProgram());
    } catch (error) {
      console.error('Erreur chargement flux BF1:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Animation pour afficher/masquer les contrôles
    Animated.timing(controlsOpacity, {
      toValue: showControls ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showControls]);

  const toggleControls = () => {
    setShowControls(!showControls);
    
    // Masquer les contrôles après 3 secondes
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
    toggleControls();
  };

  const onVideoLoad = () => {
    setIsLoading(false);
  };

  const onVideoError = (error) => {
    console.error('Erreur de chargement de la vidéo:', error);
    setIsLoading(false);
  };

  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Lecteur vidéo */}
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{ uri: stream?.url }}
          style={styles.video}
          resizeMode="cover"
          repeat
          paused={isPaused}
          onLoad={onVideoLoad}
          onError={onVideoError}
          volume={1.0}
          muted={false}
        />

        {/* Overlay avec contrôles */}
        <View style={styles.overlay}>
          {/* En-tête avec informations de la chaîne */}
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'transparent']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.channelInfo}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN DIRECT</Text>
                </View>
                <Text style={styles.channelName}>{stream?.name}</Text>
                <Text style={styles.channelDescription}>{stream?.description}</Text>
              </View>
              
              <View style={styles.viewerCount}>
                <Ionicons name="eye" size={16} color="#fff" />
                <Text style={styles.viewerText}>{formatViewers(stream?.viewers || 0)}</Text>
              </View>
            </View>

            {/* Programme actuel */}
            {currentProgram && (
              <View style={styles.programInfo}>
                <View style={styles.programBadge}>
                  <Ionicons name="tv" size={14} color="#fff" />
                  <Text style={styles.programText}>PROGRAMME ACTUEL</Text>
                </View>
                <Text style={styles.programTitle}>{currentProgram.title}</Text>
                <Text style={styles.programDescription}>{currentProgram.description}</Text>
                <Text style={styles.programTime}>
                  {currentProgram.startTime} - {currentProgram.endTime}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Contrôles centraux */}
          {showControls && (
            <Animated.View style={[styles.controls, { opacity: controlsOpacity }]}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={50} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Pied de page */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.footerGradient}
          >
            <View style={styles.footer}>
              <View style={styles.timeInfo}>
                <Ionicons name="time" size={16} color="#fff" />
                <Text style={styles.timeText}>
                  {new Date().toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
              
              <View style={styles.scheduleInfo}>
                <Ionicons name="calendar" size={16} color="#fff" />
                <Text style={styles.scheduleText}>{stream?.schedule}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Loader */}
          {isLoading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loaderText}>Chargement de BF1 TV...</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  channelInfo: {
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
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
    textTransform: 'uppercase',
  },
  channelName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  channelDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewerText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  programInfo: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 12,
  },
  programBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  programText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  programTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  programDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  programTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
  },
  controls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerGradient: {
    paddingBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BF1LivePlayer;
