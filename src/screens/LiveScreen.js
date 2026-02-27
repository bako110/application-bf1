import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import liveStreamService from '../services/liveStreamService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 9 / 16; // Format 16:9

function LiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    loadStream();
  }, []);

  // Rafraîchir le flux quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      loadStream();
      setIsPlaying(true);
      
      // Masquer header et footer
      navigation.setOptions({
        headerShown: false,
        tabBarStyle: { display: 'none' },
      });
      
      return () => {
        setIsPlaying(false);
        // Restaurer le footer en quittant
        navigation.setOptions({
          tabBarStyle: { display: 'flex' },
        });
      };
    }, [])
  );

  const loadStream = async () => {
    try {
      console.log('📺 [LiveScreen] Chargement du flux BF1...');
      const bf1Stream = await liveStreamService.getBF1Stream();
      console.log('📺 [LiveScreen] Flux BF1 chargé:', bf1Stream);
      console.log('📺 [LiveScreen] URL du flux:', bf1Stream?.url);
      setStream(bf1Stream);
    } catch (error) {
      console.error('❌ [LiveScreen] Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreen = () => {
    navigation.navigate('LiveShowFullScreen', {
      stream: stream,
      url: stream?.url
    });
  };

  const styles = createStyles(colors);

  // Masquer le header et le footer natifs
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarStyle: { display: 'none' }, // Cache le footer
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de BF1 TV...</Text>
      </View>
    );
  }

  if (!stream || !stream.url) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Aucun flux disponible</Text>
        <Text style={styles.errorText}>URL: {stream?.url || 'Non définie'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vidéo en 16:9 bien centrée */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: stream.url }}
          style={styles.video}
          resizeMode="contain" // Garde le ratio 16:9
          paused={!isPlaying}
          repeat={true}
          controls={true} // Activer les contrôles natifs
          muted={false}
          playInBackground={false}
          playWhenInactive={false}
          onError={(error) => {
            console.error(' [LiveScreen] Erreur vidéo:', error);
            console.error(' [LiveScreen] URL problématique:', stream.url);
          }}
          onLoad={() => {
            console.log(' [LiveScreen] Vidéo chargée avec succès');
          }}
        />
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  videoContainer: {
    width: width,
    height: VIDEO_HEIGHT, // Format 16:9
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streamName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
  },
  fullscreenText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
  },
  infoTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  infoSubtitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default LiveScreen;