import { useNavigation } from '@react-navigation/native';

/**
 * Retourne une fonction qui navigue vers l'écran Login,
 * quel que soit le contexte de navigation (tab, stack, modal).
 * Login est dans ProfileStack > ProfileTab → impossible avec navigate('Login') direct.
 */
export function useLoginNavigation() {
  const navigation = useNavigation<any>();

  return () => {
    // Remonter jusqu'au tab navigator
    const tabNav = navigation.getParent?.() ?? navigation;
    try {
      tabNav.navigate('ProfileTab', { screen: 'Login', params: {} });
    } catch {
      // Fallback si déjà dans ProfileTab
      navigation.navigate('Login');
    }
  };
}
