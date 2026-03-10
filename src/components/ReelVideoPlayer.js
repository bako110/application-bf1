import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import { getVideoType } from '../utils/videoUtils';

const { height } = Dimensions.get('window');

/**
 * Composant vidéo spécifique pour les Reels
 * Supporte YouTube et vidéos normales avec lecture automatique style TikTok
 */
export default function ReelVideoPlayer({ 
  videoUrl, 
  isActive, 
  paused,
  onError,
  onBuffer,
}) {
  // Validation stricte de l'URL
  if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '' || videoUrl === 'undefined' || videoUrl === 'null') {
    console.warn('⚠️ [ReelVideoPlayer] URL vidéo invalide ou vide:', videoUrl);
    return <View style={styles.container} />;
  }

  const videoType = getVideoType(videoUrl);
  console.log('🎥 [ReelVideoPlayer] URL:', videoUrl);
  console.log('🎥 [ReelVideoPlayer] Type détecté:', videoType);
  
  const [playing, setPlaying] = useState(true);  // Démarrer en lecture automatique

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(true); // Recommencer automatiquement
    }
  }, []);

  // Si c'est une vidéo YouTube
  if (videoType.type === 'youtube') {
    console.log('▶️ [ReelVideoPlayer] Lecture YouTube - ID:', videoType.videoId, 'isActive:', isActive, 'paused:', paused);
    
    // HTML pour lecture automatique YouTube
    const youtubeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; }
            html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe
            src="https://www.youtube.com/embed/${videoType.videoId}?autoplay=1&mute=0&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoType.videoId}&playsinline=1&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&disablekb=1"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            frameborder="0"
          ></iframe>
        </body>
      </html>
    `;
    
    return (
      <View style={styles.container}>
        <WebView
          source={{ html: youtubeHtml }}
          style={styles.webView}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          scrollEnabled={false}
          onError={(error) => {
            console.error('❌ WebView YouTube error:', error);
            if (onError) onError(error);
          }}
          onLoad={() => {
            console.log('✅ WebView YouTube loaded - ID:', videoType.videoId);
          }}
        />
      </View>
    );
  }

  // Vidéo normale
  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode="cover"
        repeat={true}
        paused={!isActive || paused}
        volume={1.0}
        muted={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        bufferConfig={{
          minBufferMs: 2000,
          maxBufferMs: 5000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 1500,
        }}
        maxBitRate={2000000}
        posterResizeMode="cover"
        progressUpdateInterval={250}
        onError={(error) => {
          // Erreur vidéo silencieuse - ne pas logger pour éviter le spam
          if (onError) onError(error);
        }}
        onBuffer={onBuffer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  webView: {
    backgroundColor: '#000',
    flex: 1,
  },
});
