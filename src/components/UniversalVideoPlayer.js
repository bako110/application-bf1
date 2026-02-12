import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
import VideoPlayer from './VideoPlayer';
import YouTubePlayer from './YouTubePlayer';
import FullscreenVideoPlayer from './FullscreenVideoPlayer';
import FullscreenYouTubePlayer from './FullscreenYouTubePlayer';
import { getVideoType } from '../utils/videoUtils';

/**
 * Composant universel qui détecte automatiquement le type de vidéo
 * et utilise le bon lecteur (YouTube ou vidéo normale)
 */
export default function UniversalVideoPlayer({ 
  videoUrl, 
  posterUrl, 
  onPlayPress, 
  isPremium = false, 
  userHasPremium = false, 
  onPremiumRequired,
  style = {},
  height = width * 0.5625, // Ratio 16:9 par défaut
  autoPlay = false,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  
  // Détecter le type de vidéo
  const videoType = getVideoType(videoUrl);

  console.log('🎬 UniversalVideoPlayer - Type:', videoType.type, 'URL:', videoUrl);

  // Si c'est une vidéo YouTube
  if (videoType.type === 'youtube') {
    return (
      <View style={[styles.container, style]}>
        <YouTubePlayer
          ref={playerRef}
          videoId={videoType.videoId}
          height={height}
          autoPlay={autoPlay}
          playing={!isFullscreen && isPlaying}
          onReady={() => {
            console.log('✅ YouTube Player ready');
            if (onPlayPress) {
              onPlayPress();
            }
          }}
          onError={(error) => {
            console.error('❌ YouTube Player error:', error);
          }}
          onProgress={(time) => {
            setCurrentTime(time);
          }}
          onPlayingChange={(playing) => {
            setIsPlaying(playing);
          }}
        />
        
        {/* Bouton plein écran pour YouTube */}
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={() => {
            setIsFullscreen(true);
          }}
        >
          <Ionicons name="expand" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Modal plein écran YouTube */}
        {isFullscreen && (
          <FullscreenYouTubePlayer
            visible={isFullscreen}
            videoId={videoType.videoId}
            initialTime={currentTime}
            onClose={(time) => {
              setIsFullscreen(false);
              if (time && playerRef.current) {
                setCurrentTime(time);
              }
            }}
          />
        )}
      </View>
    );
  }

  // Sinon, utiliser le lecteur vidéo normal
  return (
    <VideoPlayer
      videoUrl={videoUrl}
      posterUrl={posterUrl}
      onPlayPress={onPlayPress}
      isPremium={isPremium}
      userHasPremium={userHasPremium}
      onPremiumRequired={onPremiumRequired}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    elevation: 5,
  },
});
