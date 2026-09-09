import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';

/** Décrit où revenir après connexion : le tab racine + la route empilée dans son stack. */
export interface LoginRedirect {
  tab:    string;
  screen: string;
  params?: object;
}

/**
 * Retourne une fonction qui navigue vers l'écran Login,
 * quel que soit le contexte de navigation (tab, stack, modal).
 * Login est dans ProfileStack > ProfileTab → impossible avec navigate('Login') direct.
 *
 * Mémorise l'écran d'où l'utilisateur vient (tab + route + params) pour l'y
 * ramener après une connexion réussie, au lieu de toujours atterrir sur Profile.
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

      // Capture la route active dans le tab courant (avant de naviguer vers Login)
      let redirect: LoginRedirect | null = null;
      try {
        const tabState = tabNav.getState?.();
        const activeTabRoute = tabState?.routes?.[tabState.index];
        if (activeTabRoute && activeTabRoute.name !== 'ProfileTab') {
          const innerState = activeTabRoute.state;
          const innerRoute = innerState?.routes?.[innerState.index] ?? null;
          redirect = {
            tab:    activeTabRoute.name,
            screen: innerRoute?.name ?? '',
            params: innerRoute?.params,
          };
        }
      } catch {}

      tabNav.navigate('ProfileTab', {
        screen: 'Login',
        params: redirect ? { redirect: JSON.stringify(redirect) } : {},
      });
    } catch {
      try { nav.navigate('Login' as never); } catch {}
    }
  };
}
