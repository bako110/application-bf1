import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import supportService from '../services/supportService';

export default function SupportScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('faqs'); // 'faqs' or 'tickets'
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'faqs') {
        const data = await supportService.getFAQs();
        setFaqs(data);
      } else {
        const data = await supportService.getMyTickets();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    Alert.alert(
      'Nouveau Ticket',
      'Choisissez le type de ticket',
      [
        {
          text: 'Signaler un Bug',
          onPress: () => navigation.navigate('CreateTicket', { type: 'bug' }),
        },
        {
          text: 'Demander une Fonctionnalité',
          onPress: () => navigation.navigate('CreateTicket', { type: 'feature' }),
        },
        {
          text: 'Poser une Question',
          onPress: () => navigation.navigate('CreateTicket', { type: 'question' }),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleFaqPress = async (faq) => {
    if (expandedFaq === faq.id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(faq.id);
      try {
        await supportService.markFAQHelpful(faq.id);
      } catch (error) {
        console.error('Error marking FAQ as helpful:', error);
      }
    }
  };

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#DC143C';
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

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faqs' && styles.activeTab]}
          onPress={() => setActiveTab('faqs')}
        >
          <Ionicons 
            name="help-circle" 
            size={20} 
            color={activeTab === 'faqs' ? '#DC143C' : '#B0B0B0'} 
          />
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.activeTabText]}>
            FAQs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
          onPress={() => setActiveTab('tickets')}
        >
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={activeTab === 'tickets' ? '#DC143C' : '#B0B0B0'} 
          />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>
            Mes Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar (FAQs only) */}
      {activeTab === 'faqs' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={'#B0B0B0'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les FAQs..."
            placeholderTextColor={'#B0B0B0'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={'#B0B0B0'} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={'#DC143C'} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'faqs' ? (
            // FAQs List
            filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => handleFaqPress(faq)}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqTitleContainer}>
                      <Ionicons name="help-circle-outline" size={20} color={'#DC143C'} />
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                    </View>
                    <Ionicons
                      name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={'#B0B0B0'}
                    />
                  </View>
                  {expandedFaq === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      <View style={styles.faqMeta}>
                        <View style={styles.faqMetaItem}>
                          <Ionicons name="eye" size={14} color={'#B0B0B0'} />
                          <Text style={styles.faqMetaText}>{faq.views} vues</Text>
                        </View>
                        <View style={styles.faqMetaItem}>
                          <Ionicons name="thumbs-up" size={14} color={'#B0B0B0'} />
                          <Text style={styles.faqMetaText}>{faq.helpful_count} utile</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={60} color={'#B0B0B0'} />
                <Text style={styles.emptyStateText}>Aucune FAQ trouvée</Text>
              </View>
            )
          ) : (
            // Tickets List
            tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                        {getStatusText(ticket.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage} numberOfLines={2}>{ticket.message}</Text>
                  <View style={styles.ticketFooter}>
                    <View style={styles.ticketMeta}>
                      <Ionicons name="pricetag" size={14} color={'#B0B0B0'} />
                      <Text style={styles.ticketMetaText}>{ticket.category}</Text>
                    </View>
                    <Text style={styles.ticketDate}>
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color={'#B0B0B0'} />
                <Text style={styles.emptyStateText}>Aucun ticket</Text>
                <Text style={styles.emptyStateSubtext}>
                  Créez un ticket pour obtenir de l'aide
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {activeTab === 'tickets' && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateTicket}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A0000',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#DC143C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  activeTabText: {
    color: '#DC143C',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A0000',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  faqCard: {
    backgroundColor: '#1A0000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#000000',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 22,
  },
  faqMeta: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  faqMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faqMetaText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  ticketCard: {
    backgroundColor: '#1A0000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketMetaText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  ticketDate: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
