import { useEffect, useRef, useCallback, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import * as api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string | number | null;
  username: string;
  text: string;
  avatar_url: string | null;
  created_at: string;
  edited?: boolean;
}

type ChatStatus = 'connecting' | 'connected' | 'fallback' | 'error';

// Plafond RAM large : la fenêtre serveur est de 20 min, `loadOlder` va chercher
// plus loin dans l'historique persisté (TTL 90 j côté backend).
const MAX_RAM_MESSAGES = 1000;

interface ChatState {
  messages:      ChatMessage[];
  chatOpen:      boolean;
  viewers:       number;
  wsStatus:      ChatStatus;
  hasMoreOlder:  boolean;
  loadingOlder:  boolean;
}

type ChatAction =
  | { type: 'INIT';    messages: ChatMessage[]; chatOpen: boolean; viewers: number }
  | { type: 'APPEND';  message: ChatMessage }
  | { type: 'PREPEND'; messages: ChatMessage[]; hasMore: boolean }
  | { type: 'REMOVE';  id: string }
  | { type: 'EDIT';    id: string; text: string }
  | { type: 'STATUS';  chatOpen: boolean }
  | { type: 'CLEARED' }
  | { type: 'VIEWERS'; count: number }
  | { type: 'WS_STATUS'; wsStatus: ChatStatus }
  | { type: 'LOADING_OLDER'; value: boolean }
  | { type: 'FALLBACK_MSGS'; messages: ChatMessage[] };

/** Fusionne deux listes triées chrono en dédupliquant par id. */
function mergeById(older: ChatMessage[], current: ChatMessage[]): ChatMessage[] {
  const seen = new Set(current.map(m => m.id));
  const merged = [...older.filter(m => !seen.has(m.id)), ...current];
  return merged.length > MAX_RAM_MESSAGES ? merged.slice(-MAX_RAM_MESSAGES) : merged;
}

function reducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        messages: action.messages.slice(-MAX_RAM_MESSAGES),
        chatOpen: action.chatOpen,
        viewers:  action.viewers,
        hasMoreOlder: action.messages.length > 0,
      };
    case 'APPEND': {
      if (state.messages.some(m => m.id === action.message.id)) return state;
      const msgs = [...state.messages, action.message];
      if (msgs.length > MAX_RAM_MESSAGES) msgs.shift();
      return { ...state, messages: msgs };
    }
    case 'PREPEND':
      return {
        ...state,
        messages: mergeById(action.messages, state.messages),
        hasMoreOlder: action.hasMore,
        loadingOlder: false,
      };
    case 'REMOVE':
      return { ...state, messages: state.messages.filter(m => m.id !== action.id) };
    case 'EDIT':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.id ? { ...m, text: action.text, edited: true } : m
        ),
      };
    case 'STATUS':
      return { ...state, chatOpen: action.chatOpen };
    case 'CLEARED':
      return { ...state, messages: [], hasMoreOlder: false };
    case 'VIEWERS':
      return { ...state, viewers: action.count };
    case 'WS_STATUS':
      return { ...state, wsStatus: action.wsStatus };
    case 'LOADING_OLDER':
      return { ...state, loadingOlder: action.value };
    case 'FALLBACK_MSGS':
      return { ...state, messages: action.messages.slice(-MAX_RAM_MESSAGES) };
    default:
      return state;
  }
}

const INITIAL: ChatState = {
  messages:      [],
  chatOpen:      true,
  viewers:       0,
  wsStatus:      'connecting',
  hasMoreOlder:  true,
  loadingOlder:  false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveChat(userId?: string | number | null) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const stateRef          = useRef(state);
  stateRef.current        = state;
  const wsRef             = useRef<WebSocket | null>(null);
  const wsReadyRef        = useRef(false);
  const destroyedRef      = useRef(false);
  const reconnectTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay    = useRef(2000);

  // ── Fallback HTTP polling ──────────────────────────────────────────────────
  const loadFallback = useCallback(async () => {
    try {
      const res   = await api.getLiveComments(0, 50);
      const items: ChatMessage[] = Array.isArray(res) ? res : (res as any)?.comments ?? [];
      dispatch({ type: 'FALLBACK_MSGS', messages: items });
    } catch {}
  }, []);

  const startFallback = useCallback(() => {
    if (fallbackTimer.current) return;
    loadFallback();
    fallbackTimer.current = setInterval(loadFallback, 8000);
    dispatch({ type: 'WS_STATUS', wsStatus: 'fallback' });
  }, [loadFallback]);

  const stopFallback = useCallback(() => {
    if (fallbackTimer.current) { clearInterval(fallbackTimer.current); fallbackTimer.current = null; }
  }, []);

  // ── Charger les messages plus anciens (pagination vers le passé) ──────────
  const loadingOlderRef = useRef(false);
  const loadOlder = useCallback(async () => {
    if (loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    dispatch({ type: 'LOADING_OLDER', value: true });
    try {
      // skip = nombre de messages déjà chargés → on récupère la tranche d'avant
      const skip = stateRef.current.messages.length;
      const { comments, hasMore } = await api.getLiveCommentsPage(skip, 50);
      dispatch({ type: 'PREPEND', messages: comments as ChatMessage[], hasMore });
    } catch {
      dispatch({ type: 'LOADING_OLDER', value: false });
    } finally {
      loadingOlderRef.current = false;
    }
  }, []);

  // ── Message WS entrant ────────────────────────────────────────────────────
  const handleMessage = useCallback((raw: string) => {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'joined_livestream':
      case 'chat_init':
        dispatch({ type: 'INIT', messages: msg.messages ?? [], chatOpen: msg.open !== false, viewers: msg.viewers ?? msg.total_viewers ?? 0 });
        break;
      case 'chat_message':
        if (msg.message) dispatch({ type: 'APPEND', message: msg.message });
        break;
      case 'chat_message_hidden':
      case 'chat_message_deleted':
        if (msg.message_id) dispatch({ type: 'REMOVE', id: msg.message_id });
        break;
      case 'chat_message_edited':
        if (msg.message_id) dispatch({ type: 'EDIT', id: msg.message_id, text: msg.text ?? '' });
        break;
      case 'chat_status':
        dispatch({ type: 'STATUS', chatOpen: msg.open !== false });
        break;
      case 'chat_cleared':
        dispatch({ type: 'CLEARED' });
        break;
      case 'viewer_joined':
      case 'viewer_left':
        if (msg.total_viewers) dispatch({ type: 'VIEWERS', count: msg.total_viewers });
        break;
      case 'error':
        if (msg.code === 'CHAT_CLOSED') dispatch({ type: 'STATUS', chatOpen: false });
        break;
    }
  }, []);

  // ── Connexion WebSocket ───────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (destroyedRef.current) return;

    const wsBase = API_CONFIG.BASE_URL.replace(/^https?/, p => p === 'https' ? 'wss' : 'ws')
      .replace('/api/v1', '');
    const wsUrl = `${wsBase}/api/v1/ws`;
    const token = await AsyncStorage.getItem('bf1_token').catch(() => null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      startFallback();
      return;
    }
    wsRef.current = ws;
    dispatch({ type: 'WS_STATUS', wsStatus: 'connecting' });

    ws.onopen = () => {
      if (destroyedRef.current) { ws.close(); return; }
      wsReadyRef.current = true;
      reconnectDelay.current = 2000;
      stopFallback();
      dispatch({ type: 'WS_STATUS', wsStatus: 'connected' });
      ws.send(JSON.stringify({ type: 'join_livestream', user_id: userId ?? null, token: token ?? null }));
    };

    ws.onmessage = (e) => handleMessage(e.data);

    ws.onclose = () => {
      wsReadyRef.current = false;
      wsRef.current = null;
      if (destroyedRef.current) return;
      startFallback();
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      wsReadyRef.current = false;
      dispatch({ type: 'WS_STATUS', wsStatus: 'error' });
    };
  }, [userId, handleMessage, startFallback, stopFallback]);

  // ── Init / cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    destroyedRef.current = false;
    connect();
    return () => {
      destroyedRef.current = true;
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
      stopFallback();
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
      wsReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-join quand userId arrive (store hydraté après connexion WS) ────────
  const prevUserIdRef = useRef<string | number | null | undefined>(undefined);
  useEffect(() => {
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId;
      return;
    }
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    // userId vient d'arriver → re-envoyer join_livestream avec le bon token
    if (wsReadyRef.current && wsRef.current) {
      AsyncStorage.getItem('bf1_token').catch(() => null).then(token => {
        if (wsReadyRef.current && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'join_livestream',
            user_id: userId ?? null,
            token: token ?? null,
          }));
        }
      });
    }
  }, [userId]);

  // ── Envoyer un message ────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, user: { id?: any; username?: string; avatar_url?: string | null } | null) => {
    const trimmed = text.trim();
    if (!trimmed || !state.chatOpen) return false;

    if (wsReadyRef.current && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type:       'chat_send',
        text:       trimmed,
        user_id:    user?.id       ?? null,
        username:   user?.username ?? 'Anonyme',
        avatar_url: (user as any)?.avatar_url ?? (user as any)?.avatar ?? null,
      }));
      return true;
    }

    // Fallback HTTP
    try {
      await api.addLiveComment(trimmed);
      await loadFallback();
      return true;
    } catch { return false; }
  }, [state.chatOpen, loadFallback]);

  // ── Supprimer son message ─────────────────────────────────────────────────
  const deleteMessage = useCallback(async (msgId: string) => {
    // Optimiste : on retire tout de suite, le broadcast confirmera
    dispatch({ type: 'REMOVE', id: msgId });
    try {
      await api.deleteMyChatMessage(msgId);
      return true;
    } catch (e: any) {
      // Échec : on recharge l'historique pour remettre le message s'il est encore là
      if (!wsReadyRef.current) loadFallback();
      console.warn('[chat] delete échec:', e?.status, e?.message);
      return false;
    }
  }, [loadFallback]);

  // ── Modifier son message ──────────────────────────────────────────────────
  const editMessage = useCallback(async (msgId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return false;
    dispatch({ type: 'EDIT', id: msgId, text: trimmed });
    try {
      await api.editMyChatMessage(msgId, trimmed);
      return true;
    } catch (e: any) {
      if (!wsReadyRef.current) loadFallback();
      console.warn('[chat] edit échec:', e?.status, e?.message);
      return false;
    }
  }, [loadFallback]);

  return {
    messages:      state.messages,
    chatOpen:      state.chatOpen,
    viewers:       state.viewers,
    wsStatus:      state.wsStatus,
    hasMoreOlder:  state.hasMoreOlder,
    loadingOlder:  state.loadingOlder,
    loadOlder,
    sendMessage,
    deleteMessage,
    editMessage,
  };
}
