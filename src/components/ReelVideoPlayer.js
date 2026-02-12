import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
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
  const videoType = getVideoType(videoUrl);
  const [playing, setPlaying] = useState(false);

  // Gérer l'état de lecture pour YouTube
  React.useEffect(() => {
    if (videoType.type === 'youtube') {
      setPlaying(isActive && !paused);
    }
  }, [isActive, paused, videoType.type]);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(true); // Recommencer automatiquement
    }
  }, []);

  // Si c'est une vidéo YouTube
  if (videoType.type === 'youtube') {
    return (
      <View style={styles.container}>
        <YoutubePlayer
          height={height}
          play={playing}
          videoId={videoType.videoId}
          onChangeState={onStateChange}
          onError={(error) => {
            console.error('YouTube Reel error:', error);
            if (onError) onError(error);
          }}
          webViewStyle={styles.webView}
          webViewProps={{
            androidLayerType: 'hardware',
          }}
          initialPlayerParams={{
            loop: true,
            controls: false,
            modestbranding: true,
          }}
        />
      </View>
    );
  }

  // Sinon, vidéo normale
  return (
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
      onError={onError}
      onBuffer={onBuffer}
    />
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
  webView: {
    backgroundColor: '#000',
  },
});
