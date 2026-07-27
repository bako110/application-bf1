import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';

import { useLiveStore } from '../stores';
import { LIVE_STREAM_URL, FONT_SIZE, FONT_WEIGHT } from '../constants';
import * as api from '../services/api';

function buildPlayerUrl(data: any): string {
  let url = data?.live_dailymotion_url ?? data?.url ?? LIVE_STREAM_URL;
  if (url?.includes('dailymotion')) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0`;
  }
  return url;
}

// ─── Écran plein "regarder le direct" — lecteur seul, sans les listes de contenus ──
// Ouvert depuis le bouton accueil. Le passage en paysage/plein écran reste piloté
// par le bouton "expand" du GlobalLivePlayer (App.tsx), pas par cet écran.
export function LiveWatchScreen() {
  const navigation = useNavigation<any>();
  const insets      = useSafeAreaInsets();
  const { setLiveData, setOnLiveTab, setWatchScreenOpen, isFullscreen } = useLiveStore();

  const { data: liveData } = useQuery({
    queryKey:        ['live-status'],
    queryFn:         () => api.getLive(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const isOnAir   = !!liveData?.is_live;
    const viewers   = liveData?.viewers ?? 0;
    const playerUrl = buildPlayerUrl(liveData);
    setLiveData(playerUrl, isOnAir, viewers);
  }, [liveData]);

  // Fait apparaître GlobalLivePlayer et masque la TabBar tant que cet écran est monté
  useEffect(() => {
    setOnLiveTab(true);
    setWatchScreenOpen(true);
    return () => {
      setOnLiveTab(false);
      setWatchScreenOpen(false);
    };
  }, [setOnLiveTab, setWatchScreenOpen]);

  return (
    <View style={styles.root}>
      {!isFullscreen && (
        <TouchableOpacity
          style={[styles.exitBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="close" size={18} color="#fff" />
          <Text style={styles.exitBtnTxt}>Quitter le direct</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  exitBtn: {
    position:          'absolute',
    left:              12,
    zIndex:            20,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 12,
    height:            36,
    borderRadius:      18,
    backgroundColor:   'rgba(0,0,0,0.6)',
  },
  exitBtnTxt: {
    color:      '#fff',
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
