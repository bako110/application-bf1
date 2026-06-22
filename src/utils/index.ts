import { SUB_HIERARCHY, SUB_BADGE, COLORS, API_CONFIG } from '../constants';

// ─── URL d'image ──────────────────────────────────────────────────────────────
export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_CONFIG.BASE_URL.replace('/api/v1', '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Formatage de date ────────────────────────────────────────────────────────
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'Récemment';
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const sec  = Math.floor(diff / 1000);
    const min  = Math.floor(diff / 60_000);
    const h    = Math.floor(diff / 3_600_000);
    const d    = Math.floor(diff / 86_400_000);
    if (sec < 60)  return 'À l\'instant';
    if (min < 60)  return `${min}m`;
    if (h   < 24)  return `${h}h`;
    if (d   < 7)   return `${d}j`;
    return new Date(dateString).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  } catch { return 'Récemment'; }
}

export function formatFullDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return (
      d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' - ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return ''; }
}

// ─── Abonnements ─────────────────────────────────────────────────────────────
export function canAccess(userCat: string | undefined, required: string | null | undefined): boolean {
  if (!required) return true;
  return (SUB_HIERARCHY[userCat ?? ''] ?? 0) >= (SUB_HIERARCHY[required] ?? 0);
}

export function getSubBadge(category?: string | null) {
  if (!category) return null;
  return SUB_BADGE[category as keyof typeof SUB_BADGE] ?? null;
}

export function getEffectiveCategory(item: any): string | null {
  if ('required_subscription_category' in item) {
    return item.required_subscription_category || null;
  }
  return item.is_premium ? 'premium' : null;
}

// ─── Couleur gradient abonnement ─────────────────────────────────────────────
export function subGradientColors(category: string): [string, string] {
  const map: Record<string, [string, string]> = {
    basic:    ['#3B82F6', '#2563EB'],
    standard: ['#9C27B0', '#7B1FA2'],
    premium:  ['#FF6F00', '#F57C00'],
  };
  return map[category] ?? [COLORS.primary, COLORS.primaryDark];
}

// ─── Tri par date ─────────────────────────────────────────────────────────────
export function sortByDate<T>(items: T[], ...fields: (keyof T)[]): T[] {
  return [...items].sort((a, b) => {
    for (const f of fields) {
      const da = a[f] ? new Date(a[f] as string).getTime() : null;
      const db = b[f] ? new Date(b[f] as string).getTime() : null;
      if (da && db) return db - da;
    }
    return 0;
  });
}

// ─── Formatage des vues ───────────────────────────────────────────────────────
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000)     return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

// ─── Normalisation de texte (pour matching insensible aux accents) ────────────
export function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
