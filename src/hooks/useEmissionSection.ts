import { useMemo } from 'react';

export interface EmissionEntry {
  label:             string;
  apiName:           string;
  image?:            string;
  image_background?: string;
  filter_path?:      string;
  count:             number;
}

interface Options {
  sectionCats?: any[];
  section?:     string;
  orderedCats?: { label: string; api: string }[];
}

function decodeIfCorrupted(s: string): string {
  // Corrige le double-encodage UTF-8 du backend (ex: "LeÃ§ons" -> "Leçons")
  try {
    const bytes = Array.from(s).map(c => c.charCodeAt(0));
    const chars = [];
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b < 0x80) { chars.push(b); i++; }
      else if (b >= 0xC2 && b < 0xE0 && bytes[i+1] >= 0x80) {
        chars.push(((b & 0x1F) << 6) | (bytes[i+1] & 0x3F)); i += 2;
      } else if (b >= 0xE0 && bytes[i+1] >= 0x80 && bytes[i+2] >= 0x80) {
        chars.push(((b & 0x0F) << 12) | ((bytes[i+1] & 0x3F) << 6) | (bytes[i+2] & 0x3F)); i += 3;
      } else { chars.push(b); i++; }
    }
    return String.fromCharCode(...chars);
  } catch {
    return s;
  }
}

function normalize(s: string) {
  return decodeIfCorrupted(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

function softMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.trim().toLowerCase() === b.trim().toLowerCase()) return true;
  return normalize(a) === normalize(b);
}

export function useEmissionSection({
  sectionCats = [],
  section,
  orderedCats,
}: Options): EmissionEntry[] {
  return useMemo(() => {
    const allActive = sectionCats.filter(c => c.is_active !== false);
    const sectionPool = section
      ? allActive.filter(c => c.section && softMatch(c.section, section))
      : allActive;

    function adminEntry(apiName: string) {
      return (
        sectionPool.find(c => c.name && softMatch(c.name, apiName)) ??
        allActive.find(c => c.name && softMatch(c.name, apiName))
      );
    }

    if (orderedCats?.length) {
      return orderedCats.map(({ label, api: apiName }) => {
        const meta = adminEntry(apiName);
        return {
          label,
          apiName,
          image:            meta?.image_main || undefined,
          image_background: meta?.image_background || undefined,
          filter_path:      meta?.filter_path || undefined,
          count:            meta?.shows_count ?? 0,
        };
      });
    }

    // Sans orderedCats : construit depuis sectionPool directement
    return sectionPool.map(meta => ({
      label:            meta.name,
      apiName:          meta.name,
      image:            meta.image_main || undefined,
      image_background: meta.image_background || undefined,
      filter_path:      meta.filter_path || undefined,
      count:            meta.shows_count ?? 0,
    }));
  }, [sectionCats, section, orderedCats]);
}
