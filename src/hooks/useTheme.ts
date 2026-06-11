import { useThemeStore } from '../stores';
import type { Theme } from '../theme';

export function useTheme(): { theme: Theme; isDark: boolean } {
  const { theme, mode } = useThemeStore();
  return { theme, isDark: mode === 'dark' };
}
