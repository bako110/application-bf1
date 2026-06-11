import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { themes, type Theme, type ThemeMode } from '../theme';

type Preference = ThemeMode | 'auto';

interface ThemeStore {
  mode:        ThemeMode;    // thème effectif ('dark' | 'light')
  preference:  Preference;   // choix utilisateur ('dark' | 'light' | 'auto')
  theme:       Theme;
  setMode:     (p: Preference) => Promise<void>;
  loadSavedMode: () => Promise<void>;
}

const KEY = 'bf1_theme_preference';

function resolve(p: Preference): ThemeMode {
  if (p === 'auto') return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  return p;
}

const systemDefault = resolve('auto');

export const useThemeStore = create<ThemeStore>((set) => ({
  mode:       systemDefault,
  preference: 'auto',
  theme:      themes[systemDefault],

  async setMode(p) {
    await AsyncStorage.setItem(KEY, p);
    const resolved = resolve(p);
    set({ preference: p, mode: resolved, theme: themes[resolved] });
  },

  async loadSavedMode() {
    try {
      const saved = (await AsyncStorage.getItem(KEY)) as Preference | null;
      // Si jamais sauvegardé → 'auto' par défaut
      const pref: Preference = saved === 'light' ? 'light' : saved === 'dark' ? 'dark' : 'auto';
      const resolved = resolve(pref);
      set({ preference: pref, mode: resolved, theme: themes[resolved] });
    } catch {
      const fallback = resolve('auto');
      set({ preference: 'auto', mode: fallback, theme: themes[fallback] });
    }
  },
}));

// Écoute du changement système (uniquement en mode auto)
Appearance.addChangeListener(({ colorScheme }) => {
  const { preference } = useThemeStore.getState();
  if (preference === 'auto') {
    const resolved: ThemeMode = colorScheme === 'light' ? 'light' : 'dark';
    useThemeStore.setState({ mode: resolved, theme: themes[resolved] });
  }
});
