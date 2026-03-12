import locationService from '../services/locationService';
import authService from '../services/authService';

/**
 * Script de test pour vérifier la récupération de localisation
 * 
 * Utilisation:
 * import { testLocationDetection } from '../utils/testLocation';
 * testLocationDetection();
 */

export const testLocationDetection = async () => {
  console.log('\n========================================');
  console.log('🧪 TEST DE LOCALISATION - DÉBUT');
  console.log('========================================\n');

  try {
    // 1. Vérifier l'authentification
    console.log('1️⃣ Vérification authentification...');
    const isAuth = await authService.isAuthenticated();
    const token = await authService.getToken();
    console.log('   ✓ Authentifié:', isAuth ? 'OUI' : 'NON');
    if (token) {
      console.log('   ✓ Token présent:', token.substring(0, 30) + '...');
    }

    // 2. Vérifier la permission de localisation
    console.log('\n2️⃣ Test permission localisation...');
    const hasPermission = await locationService.requestLocationPermission();
    console.log('   ✓ Permission accordée:', hasPermission ? 'OUI' : 'NON');

    if (!hasPermission) {
      console.error('   ❌ Permission refusée - impossible de continuer');
      return;
    }

    // 3. Récupérer les coordonnées GPS
    console.log('\n3️⃣ Récupération coordonnées GPS...');
    const coords = await locationService.getCurrentPosition();
    
    if (!coords) {
      console.error('   ❌ Pas de coordonnées obtenues');
      return;
    }
    
    console.log('   ✓ Latitude:', coords.latitude);
    console.log('   ✓ Longitude:', coords.longitude);

    // 4. Vérifier si au Burkina Faso
    console.log('\n4️⃣ Analyse position...');
    const isInCountry = locationService.isInCountry(coords.latitude, coords.longitude);
    console.log('   ✓ Position:', isInCountry ? 'BURKINA FASO 🇧🇫' : 'ÉTRANGER 🌍');
    console.log('   ✓ Tarif applicable:', isInCountry ? 'x1 (pays)' : 'x3 (étranger)');

    // 5. Test envoi au backend
    if (isAuth) {
      console.log('\n5️⃣ Envoi au backend...');
      const sent = await locationService.sendLocationToBackend(
        isInCountry, 
        coords.latitude, 
        coords.longitude
      );
      console.log('   ✓ Envoi réussi:', sent ? 'OUI ✓' : 'NON ✗');

      // 6. Vérifier données dans le backend
      if (sent) {
        console.log('\n6️⃣ Vérification backend...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s
        const backendLocation = await locationService.getLocationFromBackend();
        
        if (backendLocation) {
          console.log('   ✓ Données backend récupérées:');
          console.log('     - country_code:', backendLocation.country_code);
          console.log('     - is_in_country:', backendLocation.is_in_country);
          console.log('     - latitude:', backendLocation.latitude);
          console.log('     - longitude:', backendLocation.longitude);
          console.log('     - updated_at:', backendLocation.updated_at);
        } else {
          console.error('   ❌ Impossible de récupérer les données du backend');
        }
      }
    } else {
      console.log('\n5️⃣ Envoi au backend...');
      console.log('   ⚠️ Utilisateur non connecté - pas d\'envoi au backend');
    }

    console.log('\n========================================');
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ ERREUR PENDANT LE TEST');
    console.error('========================================');
    console.error('Détails:', error);
    console.error('Stack:', error.stack);
  }
};

export const testLocationAfterLogin = async () => {
  console.log('\n🔐 Test synchronisation après connexion...\n');
  
  try {
    const result = await locationService.syncLocationAfterLogin();
    console.log('✅ Résultat:', result);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
