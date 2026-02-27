import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import supportService from '../services/supportService';
import { createSupportStyles } from '../styles/supportStyles'; // Import des styles séparés

export default function SupportScreen({ navigation }) {
  const { colors } = useTheme();
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
      case 'open': return colors.primary;
      case 'in_progress': return '#FFA500';
      case 'resolved': return '#4CAF50';
      case 'closed': return colors.textSecondary;
      default: return colors.text;
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

  const styles = createSupportStyles(colors);

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
            color={activeTab === 'faqs' ? colors.primary : colors.textSecondary} 
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
            color={activeTab === 'tickets' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>
            Mes Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar (FAQs only) */}
      {activeTab === 'faqs' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les FAQs..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
                      <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                    </View>
                    <Ionicons
                      name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>
                  {expandedFaq === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      <View style={styles.faqMeta}>
                        <View style={styles.faqMetaItem}>
                          <Ionicons name="eye" size={14} color={colors.textSecondary} />
                          <Text style={styles.faqMetaText}>{faq.views} vues</Text>
                        </View>
                        <View style={styles.faqMetaItem}>
                          <Ionicons name="thumbs-up" size={14} color={colors.textSecondary} />
                          <Text style={styles.faqMetaText}>{faq.helpful_count} utile</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={60} color={colors.textSecondary} />
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
                      <Ionicons name="pricetag" size={14} color={colors.textSecondary} />
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
                <Ionicons name="chatbubbles-outline" size={60} color={colors.textSecondary} />
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