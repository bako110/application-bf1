import api from '../config/api';
import authService from './authService';
import locationService from './locationService';

class SubscriptionService {
  // Créer un abonnement premium
  async createSubscription(planId, paymentMethod = 'mobile_money', transactionId = null) {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      throw { requiresAuth: true, message: 'Vous devez être connecté pour souscrire' };
    }

    const user = await authService.getCurrentUser();
    if (!user) {
      throw { requiresAuth: true, message: 'Utilisateur non trouvé' };
    }

    try {
      // Récupérer le plan pour calculer les dates et le prix
      const plan = await this.getPlanById(planId);
      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      // Récupérer les informations de localisation
      const { isInCountry } = await locationService.getLocationStatus();
      const priceMultiplier = await locationService.getPriceMultiplier();
      
      console.log(`💰 Création abonnement: Prix base=${plan.basePrice} FCFA, Multiplicateur=x${priceMultiplier}, Prix final=${plan.price} FCFA`);

      const response = await api.post('/subscriptions/', {
        user_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        offer: plan.code,
        is_in_country: isInCountry,
        price_multiplier: priceMultiplier,
        final_price: Math.round(plan.price),
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer mon abonnement actuel
  async getMySubscription() {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      return null;
    }

    try {
      const response = await api.get('/subscriptions/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Vérifier si l'utilisateur a un abonnement actif
  async hasActiveSubscription() {
    try {
      const subscription = await this.getMySubscription();
      return subscription && subscription.is_active;
    } catch (error) {
      return false;
    }
  }

  // Annuler un abonnement
  async cancelSubscription(subscriptionId) {
    try {
      const response = await api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Récupérer les plans disponibles depuis le backend
  async getAvailablePlans() {
    try {
      const response = await api.get('/subscription-plans/', {
        params: { active_only: true }
      });
      
      // Récupérer le multiplicateur de prix selon la localisation
      const priceMultiplier = await locationService.getPriceMultiplier();
      const { isInCountry } = await locationService.getLocationStatus();
      
      console.log(`💰 Multiplicateur de prix: x${priceMultiplier} (${isInCountry ? 'AU PAYS' : 'À L\'ÉTRANGER'})`);
      
      // Transformer les données du backend pour l'affichage
      return response.data.map(plan => {
        const basePrice = plan.price_cents / 100;
        const adjustedPrice = basePrice * priceMultiplier;
        
        return {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          basePrice: basePrice, // Prix de base
          price: adjustedPrice, // Prix ajusté selon localisation
          priceMultiplier: priceMultiplier,
          isInCountry: isInCountry,
          currency: plan.currency,
          duration: `${plan.duration_months} mois`,
          duration_months: plan.duration_months,
          features: this.getFeaturesByDuration(plan.duration_months),
          savings: this.calculateSavings(plan.duration_months, plan.price_cents * priceMultiplier),
        };
      });
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      return [];
    }
  }

  // Récupérer un plan par ID
  async getPlanById(planId) {
    try {
      const plans = await this.getAvailablePlans();
      return plans.find(p => p.id === planId);
    } catch (error) {
      console.error('Erreur récupération plan:', error);
      return null;
    }
  }

  // Obtenir les fonctionnalités selon la durée
  getFeaturesByDuration(months) {
    const baseFeatures = [
      'Accès à tous les contenus premium',
      'Visionnage hors ligne',
      'Qualité HD et 4K',
      'Sans publicité',
      'Accès prioritaire aux nouveautés',
    ];

    if (months >= 3) {
      baseFeatures.push('Support prioritaire');
    }

    if (months >= 12) {
      baseFeatures.push('Support prioritaire 24/7');
      baseFeatures.push('Meilleure offre');
    }

    return baseFeatures;
  }

  // Calculer les économies
  calculateSavings(months, priceCents) {
    if (months === 1) return null;
    
    // Prix mensuel de base estimé
    const monthlyPrice = 3000 * 100; // 3000 FCFA en centimes
    const expectedPrice = monthlyPrice * months;
    const savings = (expectedPrice - priceCents) / 100;
    
    if (savings > 0) {
      return `Économisez ${savings.toLocaleString()} FCFA`;
    }
    
    return null;
  }
}

export default new SubscriptionService();
