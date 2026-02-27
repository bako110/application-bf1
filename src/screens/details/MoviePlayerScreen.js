import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { colors } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function MoviePlayerScreen({ route, navigation }) {
  const movie = route?.params?.movie;
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const url = movie?.video_url;
  const title = useMemo(() => movie?.title || 'Lecture', [movie]);

  useEffect(() => {
    if (!movie) {
      setError('Film introuvable');
      setIsLoading(false);
      return;
    }
    if (!url) {
      setError("Aucune URL vidéo n'est définie pour ce film");
      setIsLoading(false);
      return;
    }
  }, [movie, url]);

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
    setError('Vidéo indisponible');
    Alert.alert('Erreur', 'Impossible de lire la vidéo');
  };

  const onEnd = () => {
    navigation.goBack();
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="film-outline" size={72} color={'#FF0000'} />
        <Text style={styles.errorTitle}>Lecture impossible</Text>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {url && (
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={styles.video}
          paused={isPaused}
          resizeMode="contain"
          onLoad={onLoad}
          onBuffer={onBuffer}
          onError={onError}
          onEnd={onEnd}
          repeat={false}
          volume={1.0}
          playInBackground={false}
          playWhenInactive={false}
        />
      )}

      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topOverlay} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>

        <TouchableOpacity style={styles.headerButton} onPress={togglePlayPause}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {(isLoading || isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={'#DC143C'} />
          <Text style={styles.loadingText}>{isBuffering ? 'Mise en mémoire tampon…' : 'Chargement…'}</Text>
        </View>
      )}

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
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
  video: {
    position: 'absolute',
    width,
    height,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 35,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  debugBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 90,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  debugText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
  reloadBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  reloadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 44,
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
