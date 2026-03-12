import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import authService from './authService';

class LocationService {
  // Pays de référence (Burkina Faso)
  COUNTRY_CODE = 'BF';
  COUNTRY_NAME = 'Burkina Faso';
  
  // Coordonnées approximatives du Burkina Faso
  COUNTRY_BOUNDS = {
    minLat: 9.4,
    maxLat: 15.1,
    minLng: -5.5,
    maxLng: 2.4
  };

  // Récupérer la position via IP (pas besoin de permission)
  async getCurrentPosition() {
    try {
      console.log('📍 [LocationService] Détection localisation via IP (politique de confidentialité)...');
      
      // Essayer plusieurs APIs de géolocalisation IP
      const apis = [
        {
          url: 'https://ipapi.co/json/',
          parse: (data) => ({
            latitude: data.latitude,
            longitude: data.longitude,
            country_code: data.country_code,
            country_name: data.country_name,
            city: data.city
          })
        },
        {
          url: 'https://api.ip2location.io/?key=free',
          parse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            country_code: data.country_code,
            country_name: data.country_name,
            city: data.city_name
          })
        },
        {
          url: 'https://ipwhois.app/json/',
          parse: (data) => ({
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
            country_code: data.country_code,
            country_name: data.country,
            city: data.city
          })
        }
      ];

      for (const apiConfig of apis) {
        try {
          console.log(`📡 [LocationService] Tentative avec ${apiConfig.url}...`);
          
          const response = await fetch(apiConfig.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            timeout: 5000
          });

          // Vérifier si la réponse est OK
          if (!response.ok) {
            console.warn(`⚠️ [LocationService] Réponse non OK: ${response.status}`);
            continue;
          }

          // Vérifier le Content-Type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn(`⚠️ [LocationService] Content-Type invalide: ${contentType}`);
            continue;
          }

          const text = await response.text();
          console.log(`📄 [LocationService] Réponse brute (premiers 100 chars): ${text.substring(0, 100)}`);

          const data = JSON.parse(text);
          const location = apiConfig.parse(data);

          // Vérifier que les données sont valides
          if (!location.latitude || !location.longitude || !location.country_code) {
            console.warn('⚠️ [LocationService] Données incomplètes');
            continue;
          }

          console.log('✅ [LocationService] Localisation IP détectée:', {
            pays: location.country_name,
            code: location.country_code,
            ville: location.city,
            coords: `${location.latitude}, ${location.longitude}`
          });

          return {
            latitude: location.latitude,
            longitude: location.longitude,
            country_code: location.country_code,
            country_name: location.country_name,
            fromIP: true
          };

        } catch (apiError) {
          console.warn(`⚠️ [LocationService] Erreur avec ${apiConfig.url}:`, apiError.message);
          // Continuer avec l'API suivante
          continue;
        }
      }

      // Si toutes les APIs ont échoué
      throw new Error('Toutes les APIs de géolocalisation ont échoué');

    } catch (error) {
      console.error('❌ [LocationService] Erreur détection IP:', error.message);
      // Par défaut, considérer que l'utilisateur est au Burkina Faso
      console.log('🇧🇫 [LocationService] Utilisation position par défaut: Burkina Faso');
      return {
        latitude: 12.3714, // Ouagadougou
        longitude: -1.5197,
        country_code: 'BF',
        country_name: 'Burkina Faso',
        isDefault: true
      };
    }
  }

  // Vérifier si les coordonnées sont au Burkina Faso
  isInCountry(latitude, longitude) {
    return (
      latitude >= this.COUNTRY_BOUNDS.minLat &&
      latitude <= this.COUNTRY_BOUNDS.maxLat &&
      longitude >= this.COUNTRY_BOUNDS.minLng &&
      longitude <= this.COUNTRY_BOUNDS.maxLng
    );
  }

  // Déterminer la localisation et sauvegarder
  async determineLocation() {
    try {
      console.log('📍 [LocationService] Début détermination de localisation (via IP)...');
      
      const coords = await this.getCurrentPosition();
      
      if (!coords) {
        console.log('⚠️ [LocationService] Pas de coordonnées obtenues, utilisation défaut BF');
        // Par défaut Burkina Faso
        await this.saveLocationStatus(true);
        return { isInCountry: true, reason: 'no_coords', useDefaultRate: true };
      }

      console.log('✅ [LocationService] Coordonnées obtenues:', { 
        lat: coords.latitude, 
        lng: coords.longitude,
        source: coords.fromIP ? 'IP' : coords.isDefault ? 'Défaut' : 'GPS'
      });

      const isInCountry = this.isInCountry(coords.latitude, coords.longitude);
      
      console.log(`📍 [LocationService] Analyse position: ${isInCountry ? 'AU BURKINA FASO ✓' : 'À L\'ÉTRANGER (tarif x3)'}`);
      
      // Sauvegarder le statut localement
      await this.saveLocationStatus(isInCountry);
      
      // Sauvegarder aussi les coordonnées pour réutilisation
      await AsyncStorage.setItem('lastKnownCoords', JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        country_code: coords.country_code,
        fromIP: coords.fromIP
      }));
      
      // Envoyer au backend si l'utilisateur est connecté
      const sent = await this.sendLocationToBackend(isInCountry, coords.latitude, coords.longitude);
      
      console.log(`📍 [LocationService] Résultat final - Pays: ${isInCountry ? 'BF (x1)' : 'ÉTRANGER (x3)'}, Backend: ${sent ? 'SYNC ✓' : 'NON SYNC'}`);
      
      return {
        isInCountry,
        latitude: coords.latitude,
        longitude: coords.longitude,
        country_code: coords.country_code,
        sentToBackend: sent,
        fromIP: coords.fromIP,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ [LocationService] Erreur détermination localisation:', error);
      // En cas d'erreur, considérer Burkina Faso par défaut
      await this.saveLocationStatus(true);
      return { isInCountry: true, reason: 'error', error: error.message, useDefaultRate: true };
    }
  }

  // Envoyer la localisation au backend
  async sendLocationToBackend(isInCountry, latitude, longitude) {
    try {
      // Vérifier si l'utilisateur est connecté
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        console.log('🔒 [LocationService] Utilisateur non connecté, localisation non envoyée au backend');
        return false;
      }

      // Vérifier qu'on a un token
      const token = await authService.getToken();
      if (!token) {
        console.log('🔒 [LocationService] Pas de token disponible');
        return false;
      }

      const locationData = {
        country_code: this.COUNTRY_CODE,
        is_in_country: isInCountry,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };

      console.log('📤 [LocationService] Envoi localisation au backend:', locationData);
      console.log('🔑 [LocationService] Token présent:', token.substring(0, 20) + '...');

      // Envoyer la localisation au backend avec retry
      let attempts = 0;
      let maxRetries = 3;
      let response = null;

      while (attempts < maxRetries) {
        try {
          attempts++;
          console.log(`📤 [LocationService] Tentative ${attempts}/${maxRetries}...`);
          
          response = await api.patch('/users/me/location', locationData);
          
          console.log('✅ [LocationService] Localisation enregistrée au backend:', response.data);
          console.log(`📍 [LocationService] Statut sauvegardé: ${response.data.location_is_in_country ? 'AU PAYS' : 'À L\'ÉTRANGER'}`);
          
          return true;
        } catch (retryError) {
          console.error(`❌ [LocationService] Tentative ${attempts} échouée:`, retryError.response?.data || retryError.message);
          
          if (attempts < maxRetries) {
            // Attendre 2 secondes avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw retryError;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('❌ [LocationService] Erreur envoi localisation au backend:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return false;
    }
  }

  // Sauvegarder le statut de localisation
  async saveLocationStatus(isInCountry) {
    try {
      await AsyncStorage.setItem('userIsInCountry', JSON.stringify(isInCountry));
      await AsyncStorage.setItem('locationCheckedAt', new Date().toISOString());
      console.log('💾 Statut de localisation sauvegardé:', isInCountry ? 'AU PAYS' : 'À L\'ÉTRANGER');
    } catch (error) {
      console.error('Erreur sauvegarde localisation:', error);
    }
  }

  // Récupérer le statut de localisation sauvegardé
  async getLocationStatus() {
    try {
      const status = await AsyncStorage.getItem('userIsInCountry');
      const checkedAt = await AsyncStorage.getItem('locationCheckedAt');
      
      if (!status) {
        return { isInCountry: false, needsCheck: true };
      }

      const isInCountry = JSON.parse(status);
      
      // Vérifier si la localisation a été vérifiée il y a plus de 24h
      if (checkedAt) {
        const lastCheck = new Date(checkedAt);
        const now = new Date();
        const hoursSinceCheck = (now - lastCheck) / (1000 * 60 * 60);
        
        if (hoursSinceCheck > 24) {
          console.log('⏰ [LocationService] Cache expiré (>24h), refresh nécessaire');
          return { isInCountry, needsCheck: true };
        }
      }

      return { isInCountry, needsCheck: false };
    } catch (error) {
      console.error('Erreur récupération statut localisation:', error);
      return { isInCountry: false, needsCheck: true };
    }
  }

  // Forcer une nouvelle détection de localisation (ignorer le cache)
  async forceLocationRefresh() {
    console.log('🔄 [LocationService] Forçage du refresh de localisation...');
    return await this.determineLocation();
  }

  // Synchroniser la localisation après connexion
  async syncLocationAfterLogin() {
    console.log('🔄 [LocationService] Synchronisation localisation après connexion...');
    
    // Attendre un peu pour s'assurer que le token est bien enregistré
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérifier qu'on est bien connecté
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      console.error('❌ [LocationService] Utilisateur non authentifié, abandon de la sync');
      return { isInCountry: true, reason: 'not_authenticated' };
    }

    console.log('✅ [LocationService] Utilisateur authentifié, détection localisation IP...');
    
    // Forcer une nouvelle détection (via IP, sans permission)
    return await this.determineLocation();
  }

  // Calculer le multiplicateur de prix
  async getPriceMultiplier() {
    try {
      // D'abord, essayer de récupérer depuis le backend si l'utilisateur est connecté
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const backendLocation = await this.getLocationFromBackend();
        if (backendLocation && backendLocation.is_in_country !== null) {
          const multiplier = backendLocation.is_in_country ? 1 : 3;
          const locationName = backendLocation.is_in_country ? 'BURKINA FASO' : 'ÉTRANGER';
          console.log(`💰 [LocationService] Multiplicateur depuis BACKEND: x${multiplier} (${locationName})`);
          console.log(`   📍 Code pays: ${backendLocation.country_code || 'Non défini'}`);
          console.log(`   🗓️  Dernière mise à jour: ${backendLocation.updated_at ? new Date(backendLocation.updated_at).toLocaleString('fr-FR') : 'Jamais'}`);
          return multiplier;
        }
      }
      
      // Sinon, utiliser le cache local
      const { isInCountry } = await this.getLocationStatus();
      const multiplier = isInCountry ? 1 : 3;
      const locationName = isInCountry ? 'BURKINA FASO' : 'ÉTRANGER';
      console.log(`💰 [LocationService] Multiplicateur depuis CACHE LOCAL: x${multiplier} (${locationName})`);
      console.log(`   ⚠️  Données non synchronisées avec le backend`);
      return multiplier; // x1 au pays, x3 à l'étranger
    } catch (error) {
      console.error('❌ [LocationService] Erreur calcul multiplicateur, utilisation x1 par défaut (Burkina Faso)');
      return 1; // Par défaut, utiliser le tarif local (plus avantageux pour l'utilisateur)
    }
  }

  // Récupérer les données de localisation depuis le backend
  async getLocationFromBackend() {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        console.log('🔒 [LocationService] Utilisateur non connecté, impossible de récupérer la localisation du backend');
        return null;
      }

      console.log('📥 [LocationService] Récupération localisation depuis le backend...');
      const response = await api.get('/users/me');
      
      if (!response.data) {
        console.log('⚠️ [LocationService] Pas de données utilisateur reçues');
        return null;
      }

      const locationData = {
        country_code: response.data.location_country_code,
        is_in_country: response.data.location_is_in_country,
        latitude: response.data.location_latitude,
        longitude: response.data.location_longitude,
        updated_at: response.data.location_updated_at
      };

      console.log('✅ [LocationService] Localisation récupérée du backend:', {
        pays: locationData.is_in_country ? 'BURKINA FASO' : 'ÉTRANGER',
        code: locationData.country_code,
        coords: locationData.latitude && locationData.longitude ? 
          `${locationData.latitude.toFixed(2)}, ${locationData.longitude.toFixed(2)}` : 'Non défini'
      });
      
      return locationData;
    } catch (error) {
      console.error('❌ [LocationService] Erreur récupération localisation du backend:', error.response?.data || error.message);
      return null;
    }
  }

  // Formater le prix avec le multiplicateur
  async formatPrice(basePrice, currency = 'FCFA') {
    const multiplier = await this.getPriceMultiplier();
    const finalPrice = basePrice * multiplier;
    return {
      basePrice,
      finalPrice,
      multiplier,
      currency,
      formatted: `${finalPrice.toLocaleString()} ${currency}`
    };
  }
}

export default new LocationService();
