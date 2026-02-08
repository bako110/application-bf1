import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Demander la permission de localisation
  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'BF1 a besoin d\'accéder à votre position pour adapter les tarifs d\'abonnement.',
            buttonNeutral: 'Plus tard',
            buttonNegative: 'Refuser',
            buttonPositive: 'Autoriser',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Erreur permission localisation:', err);
        return false;
      }
    }
    return true; // iOS gère les permissions différemment
  }

  // Récupérer la position actuelle
  async getCurrentPosition() {
    const hasPermission = await this.requestLocationPermission();
    
    if (!hasPermission) {
      console.log('⚠️ Permission de localisation refusée');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Position obtenue:', position.coords);
          resolve(position.coords);
        },
        (error) => {
          console.error('❌ Erreur géolocalisation:', error);
          reject(error);
        },
        { 
          enableHighAccuracy: false, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
    });
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
      const coords = await this.getCurrentPosition();
      
      if (!coords) {
        // Si pas de permission, on considère comme à l'étranger par sécurité
        await this.saveLocationStatus(false);
        return { isInCountry: false, reason: 'no_permission' };
      }

      const isInCountry = this.isInCountry(coords.latitude, coords.longitude);
      
      // Sauvegarder le statut
      await this.saveLocationStatus(isInCountry);
      
      console.log(`📍 Utilisateur ${isInCountry ? 'AU PAYS' : 'À L\'ÉTRANGER'}`);
      
      return {
        isInCountry,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur détermination localisation:', error);
      // En cas d'erreur, on considère comme à l'étranger par sécurité
      await this.saveLocationStatus(false);
      return { isInCountry: false, reason: 'error', error: error.message };
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
          return { isInCountry, needsCheck: true };
        }
      }

      return { isInCountry, needsCheck: false };
    } catch (error) {
      console.error('Erreur récupération statut localisation:', error);
      return { isInCountry: false, needsCheck: true };
    }
  }

  // Calculer le multiplicateur de prix
  async getPriceMultiplier() {
    const { isInCountry } = await this.getLocationStatus();
    return isInCountry ? 1 : 3; // x1 au pays, x3 à l'étranger
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
