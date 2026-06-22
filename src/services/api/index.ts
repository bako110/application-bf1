import AsyncStorage from '@react-native-async-storage/async-storage';
import { http } from './http';
import { LIVE_STREAM_URL } from '../../constants';

export { http };

// ─── Types communs ───────────────────────────────────────────────────────────
export interface PagedResponse<T> {
  items: T[];
  total: number;
  skip?: number;
  limit?: number;
}

function normalizeItem(item: any): any {
  const out = (!item.id && item._id) ? { ...item, id: item._id } : item;
  // Normalise required_subscription_category → subscription
  if (!out.subscription && out.required_subscription_category) {
    out.subscription = out.required_subscription_category;
  }
  return out;
}

function extractItems<T>(res: any): PagedResponse<T> {
  const raw: any[] = res?.items ?? (Array.isArray(res) ? res : []);
  return {
    items: raw.map(normalizeItem) as T[],
    total: res?.total ?? 0,
    skip:  res?.skip,
    limit: res?.limit,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function login(identifier: string, password: string) {
  const res = await http.post<any>('/users/login', { identifier, password });
  if (res.access_token) {
    http.setToken(res.access_token);
    http.clearCache();
    await AsyncStorage.multiSet([
      ['bf1_token', res.access_token],
      ['bf1_user',  JSON.stringify(res.user)],
    ]);
  }
  return res;
}

export async function register(username: string, email: string, password: string) {
  const res = await http.post<any>('/users/register', { username, email, password });
  if (res.access_token) {
    http.setToken(res.access_token);
    await AsyncStorage.multiSet([
      ['bf1_token', res.access_token],
      ['bf1_user',  JSON.stringify(res.user)],
    ]);
  }
  return res;
}

export async function loginWithGoogleIdToken(idToken: string) {
  const res = await http.post<any>('/users/auth/google/mobile', { id_token: idToken });
  if (res.access_token) {
    http.setToken(res.access_token);
    http.clearCache();
    await AsyncStorage.multiSet([
      ['bf1_token', res.access_token],
      ['bf1_user',  JSON.stringify(res.user)],
    ]);
  }
  return res;
}

export async function suggestUsername(email: string): Promise<string | null> {
  try {
    const res = await http.post<any>('/username/suggest', { email });
    return res?.username ?? null;
  } catch { return null; }
}

export async function logout() {
  http.setToken(null);
  http.clearCache();
  await AsyncStorage.multiRemove(['bf1_token', 'bf1_user']);
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem('bf1_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function refreshUser() {
  try {
    const data = await http.get<any>('/users/me');
    if (data) await AsyncStorage.setItem('bf1_user', JSON.stringify(data));
    return data;
  } catch { return getUser(); }
}

export function isAuthenticated() {
  return Boolean(http.getToken());
}

// ─── Contenu ─────────────────────────────────────────────────────────────────
export async function getNews(skip = 0, limit = 20) {
  const res = await http.get<any>(`/news?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getMissed(skip = 0, limit = 20) {
  const res = await http.get<any>(`/missed?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getJTandMag(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/jtandmag?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getMagazine(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/magazine?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getSports(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/sports?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getDivertissement(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/divertissement?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getTeleRealite(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/tele-realite?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getReportages(skip = 0, limit = 20, category?: string) {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const res = await http.get<any>(`/reportage?skip=${skip}&limit=${limit}${cat}`).catch(() => ({}));
  return extractItems(res);
}

export async function getArchive(skip = 0, limit = 20) {
  const res = await http.get<any>(`/archives?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getMovies(skip = 0, limit = 20) {
  const res = await http.get<any>(`/movies?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getSeries(skip = 0, limit = 20) {
  const res = await http.get<any>(`/series?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getReels(skip = 0, limit = 20) {
  const res = await http.get<any>(`/reels?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return extractItems(res);
}

export async function getPrograms() {
  return http.get<any>('/programs').catch(() => []);
}

export async function getEmissions() {
  const res = await http.get<any[]>('/emission-categories').catch(() => []);
  const result = (Array.isArray(res) ? res : [])
    .filter(i => i.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return result;
}

// ─── Détails par ID ──────────────────────────────────────────────────────────
export async function getNewsById(id: string | number) {
  return http.get<any>(`/news/${id}`);
}

export async function getShowById(id: string | number, type?: string) {
  const map: Record<string, string> = {
    sport:          '/sports',
    jtandmag:       '/jtandmag',
    magazine:       '/magazine',
    divertissement: '/divertissement',
    reportage:      '/reportage',
    archive:        '/archives',
    tele_realite:   '/tele-realite',
    movie:          '/movies',
    missed:         '/missed',
  };
  const endpoint = (type ? map[type] : null) ?? '/shows';
  try {
    const data = await http.get<any>(`${endpoint}/${id}`);
    // Normalise _id → id (MongoDB ObjectId renvoyé par certains endpoints)
    if (data && !data.id && data._id) data.id = data._id;
    return data;
  } catch (err: any) {
    console.log('[getShowById] failed', endpoint, id, err?.status, err?.message);
    // Si l'endpoint typé échoue (404/500), fallback sur /shows/{id}
    if (endpoint !== '/shows') {
      const data = await http.get<any>(`/shows/${id}`);
      if (data && !data.id && data._id) data.id = data._id;
      return data;
    }
    throw err;
  }
}

export async function getRelated(id: string | number, type?: string) {
  return getRelatedByType(type ?? 'show', String(id));
}

export async function getEmissionById(id: string | number) {
  return http.get<any>(`/emission-categories/${id}`).catch(() => null);
}

export async function getShowsByEmission(id: string | number, skip = 0, limit = 40) {
  const res = await http.get<any>(`/emission-categories/${id}/shows?skip=${skip}&limit=${limit}`).catch(() => ({}));
  return res?.items ?? (Array.isArray(res) ? res : []);
}

export async function getMovieById(id: string) {
  return http.get<any>(`/movies/${id}`);
}

export async function getSeriesById(id: string) {
  return http.get<any>(`/series/${id}`);
}

export async function getSeriesSeasons(seriesId: string) {
  const r = await http.get<any>(`/series/${seriesId}/seasons`).catch(() => null);
  return r?.seasons ?? (Array.isArray(r) ? r : []);
}

export async function getSeriesEpisodes(seriesId: string) {
  const r = await http.get<any>(`/series/${seriesId}/episodes`).catch(() => null);
  return r?.episodes ?? (Array.isArray(r) ? r : []);
}

export async function getSeasonEpisodes(seasonId: string) {
  return http.get<any>(`/seasons/${seasonId}/episodes`).catch(() => []);
}

// ─── Live ─────────────────────────────────────────────────────────────────────
export async function getLive() {
  return http.get<any>('/livestream/status');
}

export async function getLiveStreamUrl(): Promise<string> {
  try {
    const data = await getLive();
    let url = data?.live_dailymotion_url || LIVE_STREAM_URL;
    if (url?.includes('dailymotion')) {
      const sep = url.includes('?') ? '&' : '?';
      url += `${sep}ui-logo=0&ui-start-screen-info=0&sharing-enable=0&endscreen-enable=0&queue-enable=0&ui-theme=dark&syndication=0`;
    }
    return url;
  } catch { return LIVE_STREAM_URL; }
}

// ─── Recherche ────────────────────────────────────────────────────────────────
export async function searchContent(q: string, limit = 10) {
  const res = await http.get<any>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`).catch(() => ({ items: [] }));
  // L'API retourne { query, items, categoryResults, suggestions, totalFound, hasMore }
  return {
    items:          res?.items          ?? [],
    categoryResults: res?.categoryResults ?? [],
    suggestions:    res?.suggestions    ?? [],
    totalFound:     res?.totalFound     ?? 0,
    hasMore:        res?.hasMore        ?? false,
  };
}

export async function getSectionCategories() {
  return http.get<any[]>('/section-categories').catch(() => []);
}

// ─── Favoris ──────────────────────────────────────────────────────────────────
export async function getMyFavorites(contentType?: string) {
  const url = contentType ? `/favorites/me?content_type=${contentType}` : '/favorites/me';
  return http.get<any[]>(url).catch(() => []);
}

export async function addFavorite(contentTypeOrId: string | number, contentId?: string) {
  if (contentId === undefined) {
    return http.post('/favorites', { content_type: 'show', content_id: String(contentTypeOrId) });
  }
  return http.post('/favorites', { content_type: contentTypeOrId, content_id: contentId });
}

export async function removeFavorite(contentTypeOrId: string | number, contentId?: string) {
  if (contentId === undefined) {
    return http.delete(`/favorites/content/show/${contentTypeOrId}`);
  }
  return http.delete(`/favorites/content/${contentTypeOrId}/${contentId}`);
}

export async function checkFavorite(contentType: string, contentId: string) {
  try {
    const favs = await http.get<any[]>(`/favorites/me?content_type=${contentType}`);
    return Array.isArray(favs) && favs.some(f => String(f.content_id) === String(contentId));
  } catch { return false; }
}

// ─── Likes ────────────────────────────────────────────────────────────────────
export async function toggleLike(contentType: string, contentId: string) {
  const res = await http.post<any>('/likes/toggle', { content_type: contentType, content_id: contentId });
  http.invalidatePrefix(`/likes/content/${contentType}/${contentId}`);
  return res;
}

export async function checkLiked(contentType: string, contentId: string) {
  try {
    const res = await http.get<any>(`/likes/check/${contentType}/${contentId}`);
    return res?.liked ?? false;
  } catch { return false; }
}

export async function getLikesCount(contentType: string, contentId: string) {
  try {
    const res = await http.get<any>(`/likes/content/${contentType}/${contentId}/count`);
    return typeof res?.count === 'number' ? res.count : 0;
  } catch { return 0; }
}

// ─── Commentaires ────────────────────────────────────────────────────────────
export async function getComments(contentType: string, contentId: string) {
  return http.get<any[]>(`/comments/content/${contentType}/${contentId}?limit=50`).catch(() => []);
}

export async function addComment(contentType: string, contentId: string, text: string) {
  const res = await http.post<any>('/comments', { content_type: contentType, content_id: contentId, text });
  http.invalidatePrefix(`/comments/content/${contentType}/${contentId}`);
  return res;
}

export async function deleteComment(commentId: string) {
  const res = await http.delete(`/comments/${commentId}`);
  http.invalidatePrefix('/comments/content/');
  return res;
}

// ─── Commentaires live ───────────────────────────────────────────────────────
export async function getLiveComments(skip = 0, limit = 50) {
  const res = await http.get<any>(`/livestream/comments?skip=${skip}&limit=${limit}`).catch(() => ({ comments: [] }));
  return res.comments ?? [];
}

export async function addLiveComment(text: string) {
  return http.post('/livestream/comments', { text });
}

export async function deleteLiveComment(commentId: string) {
  return http.delete(`/livestream/comments/${commentId}`);
}

export async function updateComment(commentId: string, text: string) {
  return http.put(`/comments/${commentId}`, { text });
}

export async function deleteMyChatMessage(messageId: string) {
  return http.delete(`/ws/chat/my/${messageId}`);
}

export async function editMyChatMessage(messageId: string, text: string) {
  return http.patch(`/ws/chat/my/${messageId}`, { text });
}

// État chat (open/closed) + messages initiaux via REST (fallback WS)
export async function getLiveChatStatus() {
  return http.get<any>('/ws/status').catch(() => ({ chat_open: true, livestream_viewers: 0 }));
}

export async function getLiveChatMessages(limit = 50) {
  const res = await http.get<any>(`/ws/chat/messages?limit=${limit}`).catch(() => ({ messages: [], chat_open: true }));
  return { messages: res?.messages ?? [], chat_open: res?.chat_open !== false };
}

// ─── Vues ─────────────────────────────────────────────────────────────────────
export async function incrementView(contentType: string, contentId: string, userId?: string) {
  return http.post('/views/increment', {
    content_type: contentType,
    content_id:   contentId,
    user_id:      userId ?? null,
  }).catch(() => null);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications() {
  return http.get<any[]>('/notifications/me').catch(() => []);
}

export async function markNotificationRead(id: string) {
  return http.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  return http.patch('/notifications/mark-all-read', {});
}

export async function deleteNotification(id: string) {
  return http.delete(`/notifications/${id}`);
}

export async function deleteAllNotifications() {
  return http.delete('/notifications/delete-all');
}

// ─── Profil & Paramètres ──────────────────────────────────────────────────────
export async function updateProfile(patch: Record<string, unknown>) {
  const res = await http.patch<any>('/users/me', patch);
  if (res) {
    const current = await getUser() ?? {};
    await AsyncStorage.setItem('bf1_user', JSON.stringify({ ...current, ...res }));
  }
  return res;
}

export async function getUserSettings() {
  return http.get<any>('/settings/my-settings');
}

export async function updateUserSettings(patch: Record<string, unknown>) {
  return http.put('/settings/my-settings', patch);
}

export async function resetUserSettings() {
  return http.post('/settings/my-settings/reset', {});
}

// ─── Abonnements ──────────────────────────────────────────────────────────────
export async function getSubscriptionPlans() {
  return http.get<any[]>('/subscription-plans?active_only=true').catch(() => []);
}

export async function createSubscription(payload: unknown) {
  return http.post('/subscriptions', payload);
}

export async function getMySubscription() {
  return http.get<any>('/subscriptions/me');
}

export async function checkArchiveAccess(id: string) {
  return http.get<any>(`/archives/${id}/check-access`);
}

// ─── Support / Contact ────────────────────────────────────────────────────────
export async function sendContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  return http.post('/contact', data);
}

// ─── Programmes ───────────────────────────────────────────────────────────────
export async function getProgramWeek(weeksAhead = 0, type?: string) {
  const params = new URLSearchParams({ weeks_ahead: String(weeksAhead) });
  if (type) params.append('type', type);
  return http.get<any>(`/programs/grid/weekly?${params}`).catch(() => ({ days: [] }));
}

export async function getProgramGrid(startDate?: string | null, endDate?: string | null, type?: string | null) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate)   params.append('end_date',   endDate);
  if (type)      params.append('type',       type);
  return http.get<any>(`/programs/grid/daily?${params}`).catch(() => ({ days: [] }));
}

export async function createReminder(programId: string, data: unknown) {
  return http.post(`/programs/${programId}/reminders`, data);
}

export async function getMyReminders(status?: string, upcomingOnly = false) {
  const p = new URLSearchParams();
  if (status) p.append('status', status);
  if (upcomingOnly) p.append('upcoming_only', 'true');
  return http.get<any[]>(`/programs/reminders/my${p.toString() ? `?${p}` : ''}`).catch(() => []);
}

export async function cancelReminder(reminderId: string) {
  return http.post(`/programs/reminders/${reminderId}/cancel`, {});
}

export async function deleteReminder(reminderId: string) {
  return http.delete(`/programs/reminders/${reminderId}`);
}

export async function updateReminder(reminderId: string, data: unknown) {
  return http.patch(`/programs/reminders/${reminderId}`, data);
}

// ─── Contenu lié ─────────────────────────────────────────────────────────────
export async function getRelatedByType(type: string, excludeId: string) {
  const map: Record<string, string> = {
    news: '/news', sport: '/sports', jtandmag: '/jtandmag',
    magazine: '/magazine', divertissement: '/divertissement',
    reportage: '/reportage', archive: '/archives',
    tele_realite: '/tele-realite', movie: '/movies', missed: '/missed',
  };
  const endpoint = map[type];
  if (!endpoint) return [];
  const res = await http.get<any>(`${endpoint}?skip=0&limit=20`).catch(() => ({}));
  const items = res?.items ?? (Array.isArray(res) ? res : []);
  return items
    .filter((i: any) => String(i.id ?? i._id) !== String(excludeId))
    .sort((a: any, b: any) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 20)
    .map((i: any) => ({ ...normalizeItem(i), type: i.type ?? type }));
}

// ─── Émissions par filter path ────────────────────────────────────────────────
const ENDPOINT_TYPE: Record<string, string> = {
  '/magazine': 'magazine', '/jtandmag': 'jtandmag', '/divertissement': 'divertissement',
  '/reportage': 'reportage', '/tele-realite': 'tele_realite', '/sports': 'sport',
};

export async function getShowsByFilterPath(filterPath: string, skip = 0, limit = 20) {
  if (!filterPath) return { items: [], total: 0, contentType: 'show' };
  const clean   = filterPath.replace(/^\/api\/v1/, '');
  const base    = clean.split('?')[0];
  const qPart   = (clean.split('?')[1] ?? '')
    .replace(/(?:^|&)skip=[^&]*/, '').replace(/(?:^|&)limit=[^&]*/, '').replace(/^&/, '');
  const query   = `skip=${skip}&limit=${limit}${qPart ? '&' + qPart : ''}`;
  const contentType = ENDPOINT_TYPE[base] ?? base.replace(/^\//, '').replace(/-/g, '_');
  const res = await http.get<any>(`${base}?${query}`).catch(() => ({}));
  const items = (res?.items ?? (Array.isArray(res) ? res : []))
    .map((i: any) => ({ ...i, id: i._id ?? i.id, _contentType: contentType }));
  return { items, total: res?.total ?? 0, contentType };
}

// ─── Aliases pratiques ────────────────────────────────────────────────────────
export const search       = (q: string) => searchContent(q);
export const getFavorites = () => getMyFavorites();

// /auth/forgot-password retourne 404 — le bon endpoint est /users/forgot-password
export const forgotPassword = (email: string) =>
  http.post('/users/forgot-password', { email }).catch(() => null);
export const submitSupport = (data: { name?: string; email?: string; subject: string; message: string }) =>
  sendContactMessage({ name: data.name ?? '', email: data.email ?? '', subject: data.subject, message: data.message });
