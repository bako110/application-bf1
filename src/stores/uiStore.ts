import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Language } from '../i18n';
import { getTranslations, type Translations } from '../i18n';

interface UiStore {
  language:          Language;
  t:                 Translations;
  toastMessage:      string | null;
  toastVisible:      boolean;
  toastAction:       (() => void) | null;
  loginModalVisible: boolean;
  loginModalMessage: string;

  setLanguage:      (lang: Language) => Promise<void>;
  loadLanguage:     () => Promise<void>;
  showToast:        (message: string, duration?: number, action?: () => void) => void;
  hideToast:        () => void;
  showLoginModal:   (message?: string) => void;
  hideLoginModal:   () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  language:          'fr',
  t:                 getTranslations('fr'),
  toastMessage:      null,
  toastVisible:      false,
  toastAction:       null,
  loginModalVisible: false,
  loginModalMessage: '',

  async setLanguage(lang) {
    await AsyncStorage.setItem('bf1_language', lang);
    set({ language: lang, t: getTranslations(lang) });
  },

  async loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem('bf1_language') as Language | null;
      const lang: Language = saved === 'en' ? 'en' : 'fr';
      set({ language: lang, t: getTranslations(lang) });
    } catch {}
  },

  showToast(message, duration = 2200, action) {
    set({ toastMessage: message, toastVisible: true, toastAction: action ?? null });
    setTimeout(() => set({ toastVisible: false, toastMessage: null, toastAction: null }), duration);
  },

  hideToast() {
    set({ toastVisible: false, toastMessage: null, toastAction: null });
  },

  showLoginModal(message = '') {
    set({ loginModalVisible: true, loginModalMessage: message });
  },

  hideLoginModal() {
    set({ loginModalVisible: false });
  },
}));
