import { useUiStore } from '../stores';
import type { Translations } from '../i18n';

export function useTranslation(): { t: Translations; lang: string } {
  const { t, language } = useUiStore();
  return { t, lang: language };
}
