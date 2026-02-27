import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
    if (onReady) onReady();
  }, [onReady]);

  const handleError = useCallback((error) => {
    console.error('YouTube Player Error:', error);
    setError(true);
    setLoading(false);
    if (onError) onError(error);
  }, [onError]);

  if (error) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#E23E3E" />
          <Text style={styles.errorText}>Impossible de charger la vidéo</Text>
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
          controls: 0,          // masque tout contrôle
          modestbranding: true, // masque logo YouTube
          rel: 0,               // pas de suggestions
          showinfo: 0,          // masque titre
          playsinline: 1,       
          iv_load_policy: 3,    // masque annotations
          fs: 0,                // masque bouton plein écran intégré
          cc_load_policy: 0,    // désactive sous-titres
          disablekb: 1,         // désactive clavier
          origin: '',           // réduit la trace
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