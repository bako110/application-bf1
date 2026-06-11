import fr from './fr';
import en from './en';

export type Language = 'fr' | 'en';

// Deep-replace all leaf string literals with `string` so both fr and en satisfy the type
type Loosen<T> = T extends string ? string : { [K in keyof T]: Loosen<T[K]> };
export type Translations = Loosen<typeof fr>;

export const translations: Record<Language, Translations> = { fr, en };

// Accès typé aux traductions — utilisé via le store
export function getTranslations(lang: Language): Translations {
  return translations[lang] ?? translations.fr;
}

export { fr, en };
