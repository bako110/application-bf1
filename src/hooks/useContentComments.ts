import { useEffect, useRef, useCallback, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';
import * as api from '../services/api';

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  text: string;
  created_at: string;
}

type State = {
  comments: Comment[];
  wsStatus: 'connecting' | 'connected' | 'fallback' | 'error';
};

type Action =
  | { type: 'INIT'; comments: Comment[] }
  | { type: 'ADD'; comment: Comment }
  | { type: 'REMOVE'; comment_id: string }
  | { type: 'STATUS'; wsStatus: State['wsStatus'] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...state, comments: action.comments };
    case 'ADD': {
      const exists = state.comments.some(c => c.id === action.comment.id);
      if (exists) return state;
      return { ...state, comments: [action.comment, ...state.comments] };
    }
    case 'REMOVE':
      return { ...state, comments: state.comments.filter(c => c.id !== action.comment_id) };
    case 'STATUS':
      return { ...state, wsStatus: action.wsStatus };
    default:
      return state;
  }
}

export function useContentComments(contentType: string, contentId: string, enabled: boolean) {
  const [state, dispatch] = useReducer(reducer, { comments: [], wsStatus: 'connecting' });
  const wsRef          = useRef<WebSocket | null>(null);
  const destroyedRef   = useRef(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay = useRef(2000);

  const loadFallback = useCallback(async () => {
    try {
      const data = await api.getComments(contentType, contentId);
      dispatch({ type: 'INIT', comments: Array.isArray(data) ? data : [] });
    } catch {}
  }, [contentType, contentId]);

  const startFallback = useCallback(() => {
    if (fallbackTimer.current) return;
    loadFallback();
    fallbackTimer.current = setInterval(loadFallback, 6000);
    dispatch({ type: 'STATUS', wsStatus: 'fallback' });
  }, [loadFallback]);

  const stopFallback = useCallback(() => {
    if (fallbackTimer.current) { clearInterval(fallbackTimer.current); fallbackTimer.current = null; }
  }, []);

  const connect = useCallback(async () => {
    if (destroyedRef.current || !enabled) return;

    const wsBase = API_CONFIG.BASE_URL
      .replace(/^https?/, p => p === 'https' ? 'wss' : 'ws')
      .replace('/api/v1', '');
    const wsUrl = `${wsBase}/api/v1/ws/comments/${contentType}/${contentId}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      startFallback();
      return;
    }

    wsRef.current = ws;
    dispatch({ type: 'STATUS', wsStatus: 'connecting' });

    ws.onopen = () => {
      if (destroyedRef.current) { ws.close(); return; }
      reconnectDelay.current = 2000;
      stopFallback();
      dispatch({ type: 'STATUS', wsStatus: 'connected' });
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'comments_init') {
          dispatch({ type: 'INIT', comments: msg.comments ?? [] });
        } else if (msg.type === 'comment_added' && msg.comment) {
          dispatch({ type: 'ADD', comment: msg.comment });
        } else if (msg.type === 'comment_deleted' && msg.comment_id) {
          dispatch({ type: 'REMOVE', comment_id: msg.comment_id });
        }
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (destroyedRef.current) return;
      startFallback();
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      dispatch({ type: 'STATUS', wsStatus: 'error' });
    };
  }, [contentType, contentId, enabled, startFallback, stopFallback]);

  useEffect(() => {
    if (!enabled) return;
    destroyedRef.current = false;
    connect();
    return () => {
      destroyedRef.current = true;
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
      stopFallback();
      if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    };
  }, [enabled, contentType, contentId]);

  const addOptimistic = useCallback((comment: Comment) => {
    dispatch({ type: 'ADD', comment });
  }, []);

  const removeOptimistic = useCallback((comment_id: string) => {
    dispatch({ type: 'REMOVE', comment_id });
  }, []);

  return {
    comments:        state.comments,
    wsStatus:        state.wsStatus,
    addOptimistic,
    removeOptimistic,
  };
}
