import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';

/**
 * Retourne une fonction qui navigue vers l'écran Login,
 * quel que soit le contexte de navigation (tab, stack, modal).
 * Login est dans ProfileStack > ProfileTab → impossible avec navigate('Login') direct.
 */
export function useLoginNavigation() {
  const navigation = useNavigation<any>();
  const navRef = useRef(navigation);
  navRef.current = navigation;

  return () => {
    const nav = navRef.current;
    if (!nav) return;
    try {
      const parent = nav.getParent?.();
      const tabNav = parent ?? nav;
      tabNav.navigate('ProfileTab', { screen: 'Login', params: {} });
    } catch {
      try { nav.navigate('Login' as never); } catch {}
    }
  };
}
