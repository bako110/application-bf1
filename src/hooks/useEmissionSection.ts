/**
 * Transforme les items d'une section API en liste de catégories d'émissions
 * avec image et count — miroir de _loadEmissionSection dans home.js.
 *
 * Si l'image admin (emission-categories) est absente ET qu'aucun item de la
 * catégorie n'est présent dans les 100 chargés, on fait un fetch dédié
 * fetchFn(apiName, 0, 1) pour récupérer l'image du premier épisode.
 */
import { useMemo, useState, useEffect, useRef } from 'react';

export interface EmissionEntry {
  label:            string;
  apiName:          string;
  image?:           string;
  image_background?: string;
  count:            number;
}

interface Options {
  items?:       any[];
  sectionCats?: any[];
  section?:     string;
  orderedCats?: { label: string; api: string }[];
  catField?:    string;
  // fetchFn = api.getJTandMag / getMagazine / etc. — appelé avec (0, 1, apiName)
  fetchFn?:     (skip: number, limit: number, category: string) => Promise<{ items: any[]; total?: number }>;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function softMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;
  return normalize(a) === normalize(b);
}

export function useEmissionSection({
  items = [],
  sectionCats = [],
  section,
  orderedCats,
  catField = 'category',
  fetchFn,
}: Options): EmissionEntry[] {
  // Résolution synchrone (image admin + items déjà chargés)
  const base = useMemo(() => {
    const countMap = new Map<string, { count: number; img: string }>();
    for (const item of items) {
      const cat = (item.sport_type || item.subcategory || item[catField] || '').trim();
      if (!cat) continue;
      const prev = countMap.get(cat);
      const img  = prev?.img || item.image_main || item.image_url || item.thumbnail || item.image || '';
      countMap.set(cat, { count: (prev?.count ?? 0) + 1, img });
    }

    const allActive = sectionCats.filter(c => c.is_active !== false);
    const sectionFiltered = section
      ? allActive.filter(c => !c.section || softMatch(c.section, section))
      : allActive;

    function catMeta(apiName: string): { image?: string; image_background?: string } {
      const pool = sectionFiltered.length ? sectionFiltered : allActive;
      const meta = pool.find(c => c.name && softMatch(c.name, apiName));
      return {
        image:            meta?.image_main || meta?.image_url || meta?.image || undefined,
        image_background: meta?.image_background || undefined,
      };
    }

    if (orderedCats?.length) {
      return orderedCats.map(({ label, api: apiName }) => {
        const entry = countMap.get(apiName) ??
          [...countMap.entries()].find(([k]) => softMatch(k, apiName))?.[1];
        const meta = catMeta(apiName);
        return {
          label,
          apiName,
          image:            meta.image || entry?.img || undefined,
          image_background: meta.image_background,
          count:            entry?.count ?? 0,
        };
      });
    }

    return Array.from(countMap.entries()).map(([apiName, { count, img }]) => {
      const meta = catMeta(apiName);
      return {
        label:            apiName,
        apiName,
        image:            meta.image || img || undefined,
        image_background: meta.image_background,
        count,
      };
    });
  }, [items, sectionCats, section, orderedCats, catField]);

  // Patch d'images manquantes via fetch dédié par catégorie
  const [patches, setPatches] = useState<Record<string, string>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!fetchFn) return;
    const missing = base.filter(e => !e.image && !fetchedRef.current.has(e.apiName));
    if (!missing.length) return;

    missing.forEach(e => fetchedRef.current.add(e.apiName));

    Promise.allSettled(
      missing.map(e =>
        fetchFn(0, 1, e.apiName).then(res => {
          const first = res.items?.[0];
          const img   = first?.image_url || first?.thumbnail || first?.image || first?.image_main || '';
          return img ? { apiName: e.apiName, img } : null;
        })
      )
    ).then(results => {
      const newPatches: Record<string, string> = {};
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          newPatches[r.value.apiName] = r.value.img;
        }
      }
      if (Object.keys(newPatches).length) {
        setPatches(prev => ({ ...prev, ...newPatches }));
      }
    });
  }, [base, fetchFn]);

  return useMemo(() => {
    if (!Object.keys(patches).length) return base;
    return base.map(e =>
      e.image ? e : { ...e, image: patches[e.apiName] }
    );
  }, [base, patches]);
}
