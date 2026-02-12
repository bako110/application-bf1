import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Text,
} from 'react-native';
import { Video } from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import liveStreamService from '../services/liveStreamService';

const { width, height } = Dimensions.get('window');

function LiveScreen({ navigation }) {
  const { colors } = useTheme();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStream();
  }, []);

  // Rafraîchir le flux quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      loadStream();
    }, [])
  );

  const loadStream = async () => {
    try {
      const bf1Stream = await liveStreamService.getBF1Stream();
      setStream(bf1Stream);
    } catch (error) {
      console.error('Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreen = () => {
    navigation.navigate('LiveShowFullScreen', {
      stream: stream
    });
  };

  const styles = createStyles(colors);

  // Masquer le header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
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

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1}
      onPress={handleFullscreen}
    >
      <Video
        source={{ uri: stream?.url }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping
        useNativeControls={false}
        muted={false}
        playInBackground={false}
        playWhenInactive={false}
      />
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    width: width,
    height: height,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    marginTop: 10,
    fontSize: 16,
  },
});

export default LiveScreen;
