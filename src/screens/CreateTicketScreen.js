import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import supportService from '../services/supportService';

export default function CreateTicketScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { type } = route.params || { type: 'question' };
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getTypeTitle = () => {
    switch (type) {
      case 'bug': return 'Signaler un Bug';
      case 'feature': return 'Demander une Fonctionnalité';
      case 'question': return 'Poser une Question';
      default: return 'Nouveau Ticket';
    }
  };

  const getTypePlaceholder = () => {
    switch (type) {
      case 'bug': return 'Décrivez le bug que vous avez rencontré...';
      case 'feature': return 'Décrivez la fonctionnalité que vous souhaitez...';
      case 'question': return 'Posez votre question ici...';
      default: return 'Décrivez votre demande...';
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const ticketData = {
        subject: subject.trim(),
        message: message.trim(),
        category: type,
      };

      const result = await supportService.createTicket(ticketData);
      
      Alert.alert(
        'Succès',
        'Votre ticket a été créé avec succès. Nous vous répondrons dans les plus brefs délais.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la création du ticket. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{getTypeTitle()}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {type === 'bug' ? 'BUG' : type === 'feature' ? 'FEATURE' : 'QUESTION'}
            </Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Subject */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sujet</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Entrez un sujet concis..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>

        {/* Message */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder={getTypePlaceholder()}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Type Info */}
        <View style={styles.typeInfo}>
          <Ionicons name="information-circle-outline" size={20} color="#DC143C" />
          <Text style={styles.typeInfoText}>
            Type: {type === 'bug' ? '🐛 Bug' : type === 'feature' ? '✨ Fonctionnalité' : '❓ Question'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Envoyer le Ticket</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  typeBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DC143C' + '30',
  },
  typeInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#DC143C',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
