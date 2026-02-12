import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Text,
  Modal,
  StatusBar,
  BackHandler,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Orientation from 'react-native-orientation-locker';

export default function FullscreenYouTubePlayer({ 
  visible,
  videoId, 
  onClose,
  initialTime = 0,
}) {
  const [playing, setPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = React.useRef(null);

  // Gérer l'orientation et le bouton retour
  useEffect(() => {
    if (visible) {
      // Passer en mode paysage
      Orientation.lockToLandscape();
      
      // Gérer le bouton retour Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });

      return () => {
        backHandler.remove();
        // Forcer le portrait puis déverrouiller
        Orientation.lockToPortrait();
        setTimeout(() => {
          Orientation.unlockAllOrientations();
        }, 300);
      };
    }
  }, [visible]);

  // Auto-masquer les contrôles
  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showControls]);

  const handleClose = () => {
    // Forcer le portrait pour que la vidéo reprenne sa taille normale
    Orientation.lockToPortrait();
    // Puis déverrouiller après un court délai pour suivre l'appareil
    setTimeout(() => {
      Orientation.unlockAllOrientations();
    }, 300);
    onClose(currentTime);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    } else if (state === 'playing') {
      setPlaying(true);
    } else if (state === 'paused') {
      setPlaying(false);
    }
  }, []);

  const onReady = useCallback(() => {
    if (initialTime > 0 && playerRef.current) {
      playerRef.current.seekTo(initialTime);
    }
  }, [initialTime]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      supportedOrientations={['landscape']}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* YouTube Player */}
        <YoutubePlayer
          ref={playerRef}
          height="100%"
          play={playing}
          videoId={videoId}
          onChangeState={onStateChange}
          onReady={onReady}
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

        {/* Bouton fermer */}
        {showControls && (
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.topGradient}
          >
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
});
