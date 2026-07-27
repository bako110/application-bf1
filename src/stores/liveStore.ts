import { create } from 'zustand';

interface LiveStore {
  playerUrl:         string;
  isOnAir:           boolean;
  viewers:           number;
  isFullscreen:      boolean;
  isOnLiveTab:       boolean;
  isWatchScreenOpen: boolean;
  webViewKey:        number;
  pendingFullscreen: boolean;
  fullscreenOrigin:  'home' | 'live' | null;

  setLiveData:       (url: string, isOnAir: boolean, viewers: number) => void;
  setOnLiveTab:      (val: boolean) => void;
  setWatchScreenOpen: (val: boolean) => void;
  openFullscreen:    () => void;
  closeFullscreen:   () => void;
  refreshPlayer:     () => void;
  requestFullscreen: () => void;
  consumeFullscreen: () => void;
}

export const useLiveStore = create<LiveStore>((set) => ({
  playerUrl:         'about:blank',
  isOnAir:           false,
  viewers:           0,
  isFullscreen:      false,
  isOnLiveTab:       false,
  isWatchScreenOpen: false,
  webViewKey:        0,
  pendingFullscreen: false,
  fullscreenOrigin:  null,

  setLiveData(url, isOnAir, viewers) {
    set({ playerUrl: url, isOnAir, viewers });
  },

  setOnLiveTab(val) {
    set({ isOnLiveTab: val });
  },

  setWatchScreenOpen(val) {
    set({ isWatchScreenOpen: val });
  },

  openFullscreen() {
    set({ isFullscreen: true, fullscreenOrigin: 'live' });
  },

  closeFullscreen() {
    set({ isFullscreen: false, fullscreenOrigin: null });
  },

  refreshPlayer() {
    set(s => ({ webViewKey: s.webViewKey + 1 }));
  },

  // Demande un fullscreen différé — LiveScreen le consomme au montage
  requestFullscreen() {
    set({ pendingFullscreen: true, fullscreenOrigin: 'home' });
  },

  consumeFullscreen() {
    set({ pendingFullscreen: false, isFullscreen: true });
  },
}));
