import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import subscriptionService from '../services/subscriptionService';
import authService from '../services/authService';
import { colors } from '../contexts/ThemeContext';

const PremiumModal = ({ visible, onClose, onSubscribe, navigation, requiredCategory = null }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // États pour le flux multi-étapes
  const [currentStep, setCurrentStep] = useState(1); // 1: Plans, 2: Paiement, 3: Détails paiement
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'orange', 'moov', 'card'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (visible) {
      checkAuth();
      loadPlans();
      // Réinitialiser les états quand le modal s'ouvre
      setCurrentStep(1);
      setSelectedPlan(null);
      setPaymentMethod(null);
      setPhoneNumber('');
      setOtp('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
    }
  }, [visible]);

  const checkAuth = async () => {
    const isAuth = await authService.isAuthenticated();
    setIsAuthenticated(isAuth);
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getAvailablePlans();
      
      // Filtrer les plans selon la catégorie requise
      let filteredPlans = data;
      if (requiredCategory) {
        // Mapper les catégories du modèle aux plans disponibles
        // basic -> afficher uniquement plans Basic
        // standard -> afficher uniquement plans Standard
        // premium -> afficher uniquement plans Premium
        filteredPlans = data.filter(plan => {
          const planCategory = plan.code.toLowerCase().split('_')[0]; // Ex: "BASIC_1M" -> "basic"
          return planCategory === requiredCategory.toLowerCase();
        });
      }
      
      setPlans(filteredPlans);
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    // Vérifier si l'utilisateur est connecté
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour souscrire à un abonnement premium',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => {
              onClose();
              if (navigation) {
                // Navigation vers le tab Profil puis Login
                navigation.navigate('Mon compte', { screen: 'Login' });
              }
            },
          },
        ]
      );
      return;
    }
    
    setSelectedPlan(plan);
    setCurrentStep(2); // Passer à l'étape de sélection du paiement
  };
  
  const handleSelectPayment = (method) => {
    setPaymentMethod(method);
    setCurrentStep(3); // Passer à l'étape des détails de paiement
  };
  
  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setPaymentMethod(null);
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedPlan(null);
    }
  };
  
  const handleFinalSubscribe = async () => {
    // Validation des champs selon le mode de paiement
    if (paymentMethod === 'orange' || paymentMethod === 'moov') {
      if (!phoneNumber || phoneNumber.length < 8) {
        Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
        return;
      }
      if (!otp || otp.length < 4) {
        Alert.alert('Erreur', 'Veuillez entrer le code OTP');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.length < 16) {
        Alert.alert('Erreur', 'Numéro de carte invalide');
        return;
      }
      if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        Alert.alert('Erreur', 'Date d\'expiration invalide (MM/AA)');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        Alert.alert('Erreur', 'CVV invalide');
        return;
      }
      if (!cardName) {
        Alert.alert('Erreur', 'Nom du titulaire requis');
        return;
      }
    }

    setSubscribing(true);
    try {
      const paymentData = {
        method: paymentMethod,
        ...(paymentMethod === 'orange' || paymentMethod === 'moov' ? {
          phoneNumber,
          otp
        } : {
          cardNumber,
          cardExpiry,
          cardCvv,
          cardName
        })
      };
      
      await subscriptionService.createSubscription(selectedPlan.id, paymentMethod, paymentData);
      Alert.alert('Succès', 'Abonnement créé avec succès!');
      if (onSubscribe) onSubscribe(selectedPlan);
      onClose();
    } catch (error) {
      console.error('Erreur souscription:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'abonnement');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={32} color={'#FFFFFF'} />
          </TouchableOpacity>
          
          {/* Bouton retour pour les étapes 2 et 3 */}
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={'#FFFFFF'} />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Indicateur d'étapes */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>2</Text>
              </View>
              <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
              <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>3</Text>
              </View>
            </View>
            
            {/* Étape 1 : Sélection du plan */}
            {currentStep === 1 && (
              <>
                <Text style={styles.title}>
                  {requiredCategory 
                    ? `Abonnement ${requiredCategory.charAt(0).toUpperCase() + requiredCategory.slice(1)} Requis`
                    : 'Passez à Premium'}
                </Text>
                <Text style={styles.subtitle}>
                  {requiredCategory
                    ? `Ce contenu nécessite un abonnement ${requiredCategory.charAt(0).toUpperCase() + requiredCategory.slice(1)}. Choisissez votre plan ci-dessous.`
                    : 'Accédez à tous les contenus exclusifs et profitez d\'une expérience sans publicité'}
                </Text>
              </>
            )}
            
            {/* Étape 2 : Choix du mode de paiement */}
            {currentStep === 2 && (
              <>
                <Text style={styles.title}>Mode de paiement</Text>
                <Text style={styles.subtitle}>
                  Choisissez votre méthode de paiement préférée
                </Text>
              </>
            )}
            
            {/* Étape 3 : Détails de paiement */}
            {currentStep === 3 && (
              <>
                <Text style={styles.title}>Détails de paiement</Text>
                <Text style={styles.subtitle}>
                  {paymentMethod === 'orange' ? 'Orange Money' : 
                   paymentMethod === 'moov' ? 'Moov Money' : 
                   'Carte bancaire'}
                </Text>
              </>
            )}

            {!isAuthenticated && (
              <View style={styles.loginPrompt}>
                <Ionicons name="lock-closed" size={48} color={'#E23E3E'} />
                <Text style={styles.loginPromptTitle}>Connexion requise</Text>
                <Text style={styles.loginPromptText}>
                  Connectez-vous pour accéder aux offres premium et profiter de tous les avantages
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => {
                    onClose();
                    if (navigation) {
                      // Navigation vers le tab Profil puis Login
                      navigation.navigate('Mon compte', { screen: 'Login' });
                    }
                  }}
                >
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* ÉTAPE 1 : Sélection du plan */}
            {currentStep === 1 && (
              loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={'#E23E3E'} />
                  <Text style={styles.loadingText}>Chargement des plans...</Text>
                </View>
              ) : plans.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color={'#B0B0B0'} />
                  <Text style={styles.emptyText}>Aucun plan disponible pour le moment</Text>
                </View>
              ) : isAuthenticated ? (
                <>
                  {plans.length > 0 && !plans[0].isInCountry && (
                    <View style={styles.locationBanner}>
                      <Ionicons name="location" size={20} color={'#E23E3E'} />
                      <Text style={styles.locationBannerText}>
                        Tarif international appliqué (x{plans[0].priceMultiplier})
                      </Text>
                    </View>
                  )}
                  
                  {plans.map((plan) => (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        {plan.savings && (
                          <View style={styles.savingsBadge}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>{Math.round(plan.price).toLocaleString()} {plan.currency || 'FCFA'}</Text>
                        <Text style={styles.duration}>/ {plan.duration}</Text>
                      </View>
                      
                      {!plan.isInCountry && plan.basePrice !== plan.price && (
                        <View style={styles.priceInfoContainer}>
                          <Ionicons name="information-circle" size={16} color={'#B0B0B0'} />
                          <Text style={styles.priceInfo}>
                            Prix au Burkina Faso : {Math.round(plan.basePrice).toLocaleString()} FCFA
                          </Text>
                        </View>
                      )}

                      <View style={styles.featuresContainer}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <Text style={styles.checkmark}>✓</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => handleSelectPlan(plan)}
                      >
                        <Text style={styles.subscribeButtonText}>Choisir ce plan</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : null
            )}
            
            {/* ÉTAPE 2 : Choix du mode de paiement */}
            {currentStep === 2 && selectedPlan && (
              <>
                <View style={styles.selectedPlanSummary}>
                  <Text style={styles.summaryLabel}>Plan sélectionné :</Text>
                  <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
                  <Text style={styles.summaryPrice}>
                    {Math.round(selectedPlan.price).toLocaleString()} {selectedPlan.currency || 'FCFA'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.paymentOption}
                  onPress={() => handleSelectPayment('orange')}
                >
                  <View style={styles.paymentIconContainer}>
                    <Ionicons name="phone-portrait" size={32} color="#FF6600" />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>Orange Money</Text>
                    <Text style={styles.paymentDesc}>Paiement via Orange Money</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={'#B0B0B0'} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.paymentOption}
                  onPress={() => handleSelectPayment('moov')}
                >
                  <View style={styles.paymentIconContainer}>
                    <Ionicons name="phone-portrait" size={32} color="#0066CC" />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>Moov Money</Text>
                    <Text style={styles.paymentDesc}>Paiement via Moov Money</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={'#B0B0B0'} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.paymentOption}
                  onPress={() => handleSelectPayment('card')}
                >
                  <View style={styles.paymentIconContainer}>
                    <Ionicons name="card" size={32} color={'#E23E3E'} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>Carte bancaire</Text>
                    <Text style={styles.paymentDesc}>Visa, Mastercard</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={'#B0B0B0'} />
                </TouchableOpacity>
              </>
            )}
            
            {/* ÉTAPE 3 : Détails de paiement */}
            {currentStep === 3 && selectedPlan && paymentMethod && (
              <>
                <View style={styles.selectedPlanSummary}>
                  <Text style={styles.summaryLabel}>Récapitulatif :</Text>
                  <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
                  <Text style={styles.summaryPrice}>
                    {Math.round(selectedPlan.price).toLocaleString()} {selectedPlan.currency || 'FCFA'}
                  </Text>
                </View>
                
                {/* Formulaire Orange Money / Moov Money */}
                {(paymentMethod === 'orange' || paymentMethod === 'moov') && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Numéro de téléphone</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 70123456"
                        placeholderTextColor={'#B0B0B0'}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={8}
                      />
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Code OTP</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Entrez le code OTP"
                        placeholderTextColor={'#B0B0B0'}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        secureTextEntry
                      />
                      <Text style={styles.formHint}>
                        Composez #{paymentMethod === 'orange' ? '144' : '555'}# pour obtenir votre code OTP
                      </Text>
                    </View>
                  </>
                )}
                
                {/* Formulaire Carte bancaire */}
                {paymentMethod === 'card' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Numéro de carte</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        placeholderTextColor={'#B0B0B0'}
                        value={cardNumber}
                        onChangeText={setCardNumber}
                        keyboardType="number-pad"
                        maxLength={16}
                      />
                    </View>
                    
                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.formLabel}>Date d'expiration</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="MM/AA"
                          placeholderTextColor={'#B0B0B0'}
                          value={cardExpiry}
                          onChangeText={setCardExpiry}
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      
                      <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.formLabel}>CVV</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="123"
                          placeholderTextColor={'#B0B0B0'}
                          value={cardCvv}
                          onChangeText={setCardCvv}
                          keyboardType="number-pad"
                          maxLength={3}
                          secureTextEntry
                        />
                      </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Nom du titulaire</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="NOM PRÉNOM"
                        placeholderTextColor={'#B0B0B0'}
                        value={cardName}
                        onChangeText={setCardName}
                        autoCapitalize="characters"
                      />
                    </View>
                  </>
                )}
                
                <TouchableOpacity
                  style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
                  onPress={handleFinalSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.subscribeButtonText}>Confirmer le paiement</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.disclaimer}>
              Résiliez à tout moment. Aucun engagement.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginPrompt: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E23E3E',
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  savingsBadge: {
    backgroundColor: '#E23E3E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E23E3E',
  },
  duration: {
    fontSize: 16,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkmark: {
    fontSize: 18,
    color: '#E23E3E',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: '#DDDDDD',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#E23E3E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#E23E3E',
    borderColor: '#E23E3E',
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#2a2a2a',
  },
  stepLineActive: {
    backgroundColor: '#E23E3E',
  },
  selectedPlanSummary: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E23E3E',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E23E3E',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  paymentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  formHint: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 6,
    fontStyle: 'italic',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  disclaimer: {
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E23E3E',
    gap: 12,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  priceInfo: {
    flex: 1,
    fontSize: 13,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
});

export default PremiumModal;
