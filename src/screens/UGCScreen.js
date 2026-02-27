import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

export default function UGCScreen({ navigation }) {
  const { colors } = useTheme();

  const legalSections = [
    {
      title: "Conditions d'Utilisation",
      icon: 'document-text',
      content: `En utilisant l'application BF1 TV, vous acceptez les conditions suivantes :

1. Utilisation responsable : Vous vous engagez à utiliser l'application de manière légale et responsable.

2. Contenu protégé : Tous les contenus audiovisuels sont protégés par le droit d'auteur.

3. Respect de la vie privée : Vous respectez la vie privée des autres utilisateurs.

4. Pas de reproduction : Il est interdit de reproduire ou diffuser les contenus sans autorisation.

5. Signalement des abus : Vous devez signaler tout contenu inapproprié.`,
    },
    {
      title: "Politique de Confidentialité",
      icon: 'shield-checkmark',
      content: `Nous collectons et utilisons vos données personnelles de manière transparente :

1. Données collectées : Email, préférences, historique de visionnage.

2. Utilisation : Amélioration du service, recommandations personnalisées.

3. Protection : Vos données sont cryptées et sécurisées.

4. Partage : Nous ne partageons pas vos données avec des tiers sans consentement.

5. Droits : Vous pouvez accéder, modifier ou supprimer vos données.`,
    },
    {
      title: "Guidelines Communautaires",
      icon: 'people',
      content: `Pour maintenir une communauté saine et respectueuse :

1. Respect mutuel : Traitez les autres avec respect et courtoisie.

2. Contenu approprié : Partagez du contenu pertinent et constructif.

3. Pas de harcèlement : Le harcèlement, les menaces ou les insultes sont interdits.

4. Propriété intellectuelle : Respectez le droit d'auteur et la propriété intellectuelle.

5. Signalement : Signalez tout comportement ou contenu inapproprié.`,
    },
    {
      title: "Droits d'Auteur",
      icon: 'copyright',
      content: `Protection des droits d'auteur et propriété intellectuelle :

1. Contenu BF1 : Tous les contenus BF1 sont protégés par le droit d'auteur.

2. Utilisation personnelle : Visionnage à titre personnel uniquement.

3. Interdiction de copie : Copie, distribution ou modification sans autorisation interdite.

4. Signalement : Signalez toute violation des droits d'auteur.

5. Contact : Pour toute question sur les droits, contactez-nous.`,
    },
    {
      title: "Mentions Légales",
      icon: 'business',
      content: `Informations légales sur BF1 TV :

1. Éditeur : BF1 TV
2. Siège social : [Adresse]
3. Contact : contact@bf1.tv
4. Hébergeur : [Informations hébergeur]
5. CNIL : Déclaration à la CNIL n°[Numéro]`,
    },
  ];

  const renderSection = (section, index) => (
    <View key={index} style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={section.icon} size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      </View>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
        {section.content}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Conditions d'Utilisation</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Mentions légales et politiques de BF1 TV
          </Text>
        </View>

        <View style={styles.content}>
          {legalSections.map(renderSection)}

          <View style={[styles.contactSection, { backgroundColor: colors.surface }]}>
            <Ionicons name="mail" size={24} color={colors.primary} />
            <View style={styles.contactContent}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Besoin d'aide ?</Text>
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                Contactez-nous pour toute question sur les conditions d'utilisation
              </Text>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL('mailto:support@bf1.tv')}
              >
                <Text style={styles.contactButtonText}>Nous contacter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
