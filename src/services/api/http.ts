import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants';

// ─── Types ───────────────────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: string;
  headers?: Record<string, string>;
}

interface CacheEntry {
  data: unknown;
  ts: number;
}

// ─── Routes jamais mises en cache (données personnelles) ────────────────────
const NO_CACHE_PREFIXES = [
  '/users/me',
  '/favorites',
  '/notifications/me',
  '/subscriptions/me',
  '/likes/my-likes',
  '/likes/check/',
  '/archives/',
  '/livestream/comments',
];

function isCacheable(path: string): boolean {
  return !NO_CACHE_PREFIXES.some(p => path.startsWith(p));
}

// ─── État interne ────────────────────────────────────────────────────────────
let _token: string | null = null;
const _cache = new Map<string, CacheEntry>();

// ─── Client HTTP ─────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isGet = !options.method || options.method === 'GET';

  // Cache GET
  if (isGet && isCacheable(path)) {
    const cached = _cache.get(path);
    if (cached && Date.now() - cached.ts < API_CONFIG.CACHE_TTL) {
      return cached.data as T;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      // 401 → vider token
      if (res.status === 401) {
        _token = null;
        await AsyncStorage.multiRemove(['bf1_token', 'bf1_user']);
      }
      const err = new Error(data?.detail || data?.message || `HTTP ${res.status}`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    // Mise en cache GET réussi
    if (isGet && isCacheable(path)) {
      _cache.set(path, { data, ts: Date.now() });
    }

    return data as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── API publique ────────────────────────────────────────────────────────────
export const http = {
  get:    <T>(path: string)             => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)             => request<T>(path, { method: 'DELETE' }),

  setToken(t: string | null) { _token = t; },
  getToken()                 { return _token; },

  clearCache()                      { _cache.clear(); },
  invalidatePrefix(prefix: string)  {
    for (const key of _cache.keys()) {
      if (key.startsWith(prefix)) _cache.delete(key);
    }
  },

  // Initialisation du token depuis AsyncStorage au démarrage
  async loadToken(): Promise<void> {
    try {
      const t = await AsyncStorage.getItem('bf1_token');
      if (t) _token = t;
    } catch {}
  },
};
