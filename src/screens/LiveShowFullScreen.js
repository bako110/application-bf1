import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ route, navigation }) {
  const { stream } = route.params;
  const videoRef = useRef(null);
  
  const [isLivePlaying, setIsLivePlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!stream || !stream.url) {
      setError('Stream introuvable');
      setIsLoading(false);
    }
  }, [stream]);

  const onLoad = () => {
    setIsLoading(false);
    setIsBuffering(false);
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

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="tv-outline" size={72} color={colors.error} />
        <Text style={styles.errorTitle}>Stream indisponible</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
          paused={isPaused}
          resizeMode="contain"
          onLoad={onLoad}
          onBuffer={onBuffer}
          onError={onError}
          repeat={false}
          volume={1.0}
          playInBackground={true}
          playWhenInactive={false}
        />
      )}

      <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.topGradient} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT</Text>
          </View>
          <Text style={styles.streamTitle} numberOfLines={1}>{stream?.title || 'Live'}</Text>
        </View>
      </View>

      {(isLoading || isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isBuffering ? 'Mise en mémoire tampon…' : 'Chargement…'}
          </Text>
        </View>
      )}

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={64} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayer: {
    position: 'absolute',
    width,
    height,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,20,60,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  streamTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 44,
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
