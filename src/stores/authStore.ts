import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { http } from '../services/api/http';
import * as api from '../services/api';
import { SUB_HIERARCHY } from '../constants';

interface User {
  id: string;
  username: string;
  email: string;
  subscription_category?: string;
  avatar?: string;
  [key: string]: unknown;
}

interface AuthStore {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  loading:         boolean;

  // Actions
  initialize:       () => Promise<void>;
  login:            (identifier: string, password: string) => Promise<void>;
  register:         (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle:  (token: string, user: any) => Promise<void>;
  logout:           () => Promise<void>;
  refreshUser:      () => Promise<void>;
  setUser:          (u: User) => void;

  // Helpers abonnement
  canAccess:      (required?: string | null) => boolean;
  isPremium:      () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:            null,
  token:           null,
  isAuthenticated: false,
  loading:         true,

  async initialize() {
    try {
      await http.loadToken();
      const token = http.getToken();
      if (!token) { set({ loading: false }); return; }

      const raw = await AsyncStorage.getItem('bf1_user');
      const user = raw ? JSON.parse(raw) : null;
      set({ token, user, isAuthenticated: Boolean(user), loading: false });

      // Rafraîchir en arrière-plan
      api.refreshUser().then(u => {
        if (u) set({ user: u });
      }).catch(() => {});
    } catch {
      set({ loading: false });
    }
  },

  async login(identifier, password) {
    const res = await api.login(identifier, password);
    set({
      token:           res.access_token,
      user:            res.user,
      isAuthenticated: true,
    });
  },

  async register(username, email, password) {
    const res = await api.register(username, email, password);
    set({
      token:           res.access_token,
      user:            res.user,
      isAuthenticated: true,
    });
  },

  async loginWithGoogle(token, user) {
    const res = await api.loginWithToken(token, user);
    // Récupérer le profil complet depuis l'API
    let fullUser = res.user;
    try {
      const me = await api.refreshUser();
      if (me) fullUser = me;
    } catch {}
    set({
      token:           token,
      user:            fullUser,
      isAuthenticated: true,
    });
  },

  async logout() {
    await api.logout();
    set({ token: null, user: null, isAuthenticated: false });
  },

  async refreshUser() {
    try {
      const u = await api.refreshUser();
      if (u) set({ user: u });
    } catch {}
  },

  setUser(u) { set({ user: u }); },

  canAccess(required) {
    if (!required) return true;
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return false;
    const userLevel     = SUB_HIERARCHY[user.subscription_category ?? ''] ?? 0;
    const requiredLevel = SUB_HIERARCHY[required] ?? 0;
    return userLevel >= requiredLevel;
  },

  isPremium() {
    const { user } = get();
    return (SUB_HIERARCHY[user?.subscription_category ?? ''] ?? 0) >= SUB_HIERARCHY.premium;
  },
}));
