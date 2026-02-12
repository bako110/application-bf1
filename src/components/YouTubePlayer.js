import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function YouTubePlayer({ 
  videoId, 
  height = 250, 
  autoPlay = false, 
  playing: externalPlaying,
  onReady, 
  onError,
  onPlayingChange,
}) {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Utiliser la prop externe si fournie, sinon l'état interne
  const playing = externalPlaying !== undefined ? externalPlaying : internalPlaying;

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setInternalPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
    }
    if (state === 'playing') {
      setLoading(false);
      setInternalPlaying(true);
      if (onPlayingChange) onPlayingChange(true);
    }
    if (state === 'paused') {
      setInternalPlaying(false);
      if (onPlayingChange) onPlayingChange(false);
    }
  }, [onPlayingChange]);

  const handleReady = useCallback(() => {
    setLoading(false);
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  const handleError = useCallback((error) => {
    console.error('YouTube Player Error:', error);
    setError(true);
    setLoading(false);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  if (error) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC143C" />
          <Text style={styles.errorText}>Impossible de charger la vidéo YouTube</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <YoutubePlayer
        height={height}
        play={playing}
        videoId={videoId}
        onChangeState={onStateChange}
        onReady={handleReady}
        onError={handleError}
        webViewStyle={styles.webView}
        webViewProps={{
          androidLayerType: 'hardware',
          allowsFullscreenVideo: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          javaScriptEnabled: true,
          domStorageEnabled: true,
          scrollEnabled: false,
        }}
        initialPlayerParams={{
          controls: true,
          modestbranding: true,
          rel: false,
          showinfo: false,
          playsinline: 1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    width: '100%',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  webView: {
    backgroundColor: 'transparent',
  },
});
