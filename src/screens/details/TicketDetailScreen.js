import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Animated,
} from 'react-native';
import LoadingScreen from '../../components/LoadingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import supportService from '../../services/supportService';

export default function TicketDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { ticketId } = route.params;
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);
  
  // Pour le rafraîchissement automatique
  const intervalRef = useRef(null);
  const [isFocused, setIsFocused] = useState(true);
  const [newMessageIndicator, setNewMessageIndicator] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTicket();
    startAutoRefresh();
    
    return () => {
      stopAutoRefresh();
    };
  }, [ticketId]);

  useEffect(() => {
    // Gérer le focus de l'écran
    const unsubscribe = navigation.addListener('focus', () => {
      setIsFocused(true);
      startAutoRefresh();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsFocused(false);
      stopAutoRefresh();
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
      stopAutoRefresh();
    };
  }, [navigation]);

  const startAutoRefresh = () => {
    stopAutoRefresh(); // Arrêter l'ancien intervalle
    
    // Rafraîchir toutes les 10 secondes
    intervalRef.current = setInterval(() => {
      if (isFocused) {
        loadTicketSilently();
      }
    }, 10000);
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const loadTicketSilently = async () => {
    try {
      const ticketData = await supportService.getTicket(ticketId);
      
      // Vérifier si de nouveaux messages sont arrivés
      const oldMessageCount = ticket ? (ticket.responses ? ticket.responses.length + 1 : 1) : 0;
      const newMessageCount = ticketData ? (ticketData.responses ? ticketData.responses.length + 1 : 1) : 0;
      
      setTicket(ticketData);
      
      if (newMessageCount > oldMessageCount) {
        console.log('🆕 Nouveaux messages détectés!');
        showNewMessageIndicator();
      }
      
      console.log('🔄 Conversation rafraîchie automatiquement');
    } catch (error) {
      console.error('Error silent refresh ticket:', error);
    }
  };

  const showNewMessageIndicator = () => {
    setNewMessageIndicator(true);
    
    // Animation de fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Cacher l'indicateur après 3 secondes
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNewMessageIndicator(false);
      });
    }, 3000);
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      const ticketData = await supportService.getTicket(ticketId);
      setTicket(ticketData);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Erreur', 'Impossible de charger le ticket');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTicket();
    setRefreshing(false);
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un message');
      return;
    }

    setSubmittingMessage(true);
    try {
      await supportService.addTicketMessage(ticketId, newMessage.trim());
      setNewMessage('');
      await loadTicket(); // Recharger pour voir le nouveau message
    } catch (error) {
      console.error('Error adding message:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le message');
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, newStatus);
      await loadTicket(); // Recharger pour voir le nouveau statut
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#E23E3E';
      case 'in_progress': return '#FFA500';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#B0B0B0';
      default: return '#FFFFFF';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 'bug': return 'Bug';
      case 'feature': return 'Fonctionnalité';
      case 'question': return 'Question';
      default: return category;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const styles = createStyles(colors);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!ticket) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#E23E3E" />
        <Text style={[styles.errorText, { color: colors.text }]}>Ticket non trouvé</Text>
        <TouchableOpacity style={[styles.errorBackButton, { backgroundColor: '#E23E3E' }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Ticket #{ticketId.slice(-8)}</Text>
          <View style={styles.autoRefreshIndicator}>
            <Ionicons name="sync" size={12} color={colors.primary} />
            <Text style={styles.autoRefreshText}>Auto</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Indicateur de nouveaux messages */}
      {newMessageIndicator && (
        <Animated.View style={[styles.newMessageIndicator, { opacity: fadeAnim }]}>
          <Ionicons name="chatbubble" size={16} color="#fff" />
          <Text style={styles.newMessageText}>Nouveaux messages!</Text>
        </Animated.View>
      )}

      {/* Ticket Info */}
      <View style={styles.ticketInfo}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
          </View>
        </View>
        
        <View style={styles.ticketMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
            <Text style={styles.metaText}>{getCategoryText(ticket.category)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(ticket.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          <Text style={styles.messageCount}>
            {ticket.responses ? ticket.responses.length + 1 : 1} messages
          </Text>
        </View>
        
        <View style={styles.messagesList}>
          {/* Afficher le message initial */}
          <View style={styles.messageContainer}>
            <View style={styles.messageRow}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
              
              <View style={styles.messageContentContainer}>
                <View style={styles.messageHeader}>
                  <View style={styles.authorInfo}>
                    <Text style={styles.userAuthor}>Vous</Text>
                  </View>
                  <Text style={styles.messageDate}>
                    {formatDate(ticket.created_at)}
                  </Text>
                </View>
                
                <View style={styles.userBubble}>
                  <Text style={styles.userContent}>
                    {ticket.message}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Afficher les réponses si elles existent */}
          {ticket.responses && ticket.responses.length > 0 && ticket.responses.map((response, index) => (
            <View key={index} style={styles.messageContainer}>
              <View style={styles.messageRow}>
                <View style={[
                  styles.avatarContainer,
                  response.author === 'admin' ? styles.adminAvatar : styles.userAvatar
                ]}>
                  <Ionicons 
                    name={response.author === 'admin' ? 'headset' : 'person'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                
                <View style={styles.messageContentContainer}>
                  <View style={styles.messageHeader}>
                    <View style={styles.authorInfo}>
                      <Text style={[
                        response.author === 'admin' ? styles.adminAuthor : styles.userAuthor
                      ]}>
                        {response.author === 'admin' ? 'Équipe Support BF1' : response.author_name || 'Vous'}
                      </Text>
                      {response.author === 'admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>OFFICIEL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.messageDate}>
                      {formatDate(response.created_at)}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.messageBubble,
                    response.author === 'admin' ? styles.adminBubble : styles.userBubble
                  ]}>
                    <Text style={[
                      styles.messageContent,
                      response.author === 'admin' ? styles.adminContent : styles.userContent
                    ]}>
                      {response.message}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Status Actions */}
      {ticket.status !== 'closed' && (
        <View style={styles.statusActions}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            {ticket.status === 'open' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.closeButton]}
                onPress={() => handleStatusChange('closed')}
              >
                <Ionicons name="close-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Fermer le ticket</Text>
              </TouchableOpacity>
            )}
            {ticket.status === 'resolved' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.reopenButton]}
                onPress={() => handleStatusChange('open')}
              >
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Réouvrir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Add Message */}
      {ticket.status !== 'closed' && (
        <View style={styles.addMessageSection}>
          <Text style={styles.sectionTitle}>Ajouter un message</Text>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Écrivez votre message ici..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newMessage.trim() && styles.disabledButton]}
              onPress={handleAddMessage}
              disabled={!newMessage.trim() || submittingMessage}
            >
              {submittingMessage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorBackButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  autoRefreshText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  newMessageIndicator: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: '#E23E3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  newMessageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
  },
  ticketInfo: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  messagesSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  messageCount: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesList: {
    gap: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  adminAvatar: {
    backgroundColor: colors.primary,
  },
  userAvatar: {
    backgroundColor: colors.textSecondary,
  },
  messageContentContainer: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  adminAuthor: {
    color: colors.primary,
  },
  userAuthor: {
    color: colors.text,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  messageDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
  },
  adminBubble: {
    backgroundColor: colors.primary + '15',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.surface,
    borderTopRightRadius: 4,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminContent: {
    color: colors.text,
  },
  userContent: {
    color: colors.text,
  },
  emptyMessages: {
    alignItems: 'center',
    padding: 40,
  },
  emptyMessagesTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyMessagesSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statusActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  closeButton: {
    backgroundColor: '#E23E3E',
  },
  reopenButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addMessageSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
