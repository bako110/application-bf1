import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import subscriptionService from '../services/subscriptionService';
import authService from '../services/authService';
import { colors } from '../contexts/ThemeContext';

const PremiumModal = ({ visible, onClose, onSubscribe, navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (visible) {
      checkAuth();
      loadPlans();
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
      setPlans(data);
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
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
                navigation.navigate('Login');
              }
            },
          },
        ]
      );
      return;
    }

    setSubscribing(true);
    try {
      await subscriptionService.createSubscription(plan.id);
      Alert.alert('Succès', 'Abonnement créé avec succès!');
      if (onSubscribe) onSubscribe(plan);
      onClose();
    } catch (error) {
      console.error('Erreur souscription:', error);
      if (error.requiresAuth) {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour souscrire');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de créer l\'abonnement');
      }
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
            <Ionicons name="close-circle" size={32} color={colors.text} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Passez à Premium</Text>
            <Text style={styles.subtitle}>
              Accédez à tous les contenus exclusifs et profitez d'une expérience sans publicité
            </Text>

            {!isAuthenticated && (
              <View style={styles.loginPrompt}>
                <Ionicons name="lock-closed" size={48} color={colors.primary} />
                <Text style={styles.loginPromptTitle}>Connexion requise</Text>
                <Text style={styles.loginPromptText}>
                  Connectez-vous pour accéder aux offres premium et profiter de tous les avantages
                </Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => {
                    onClose();
                    if (navigation) navigation.navigate('Login');
                  }}
                >
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement des plans...</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Aucun plan disponible pour le moment</Text>
              </View>
            ) : isAuthenticated ? (
              plans.map((plan) => (
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
                  <Text style={styles.price}>{plan.price} {plan.currency || 'FCFA'}</Text>
                  <Text style={styles.duration}>/ {plan.duration}</Text>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>S'abonner</Text>
                  )}
                </TouchableOpacity>
              </View>
              ))
            ) : null}

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
    backgroundColor: colors.background || '#0a0a0a',
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
    color: colors.text || '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary || '#AAAAAA',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginPrompt: {
    backgroundColor: colors.surface || '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary || '#DC143C',
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: colors.textSecondary || '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary || '#DC143C',
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
    backgroundColor: colors.surface || '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border || '#2a2a2a',
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
    color: colors.text || '#FFFFFF',
  },
  savingsBadge: {
    backgroundColor: colors.primary || '#DC143C',
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
    color: colors.primary || '#DC143C',
  },
  duration: {
    fontSize: 16,
    color: colors.textSecondary || '#AAAAAA',
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
    color: colors.primary || '#DC143C',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: colors.text || '#DDDDDD',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: colors.primary || '#DC143C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary || '#AAAAAA',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary || '#AAAAAA',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  disclaimer: {
    fontSize: 13,
    color: colors.textSecondary || '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});

export default PremiumModal;
