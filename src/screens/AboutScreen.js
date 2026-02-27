import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import aboutService from '../services/aboutService';

export default function AboutScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    loadAboutInfo();
  }, []);

  const loadAboutInfo = async () => {
    try {
      setLoading(true);
      const data = await aboutService.getAllAboutInfo();
      setAppInfo(data.appInfo);
      setTeamMembers(data.teamMembers);
    } catch (error) {
      console.error('Error loading about info:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLink = async (url) => {
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening link:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#E23E3E'} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* App Info */}
      {appInfo && (
        <>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="tv" size={60} color={'#E23E3E'} />
            </View>
            <Text style={styles.appName}>{appInfo.app_name}</Text>
            <Text style={styles.version}>Version {appInfo.version}</Text>
            <Text style={styles.description}>{appInfo.description}</Text>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suivez-nous</Text>
            <View style={styles.socialLinks}>
              {appInfo.facebook_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(appInfo.facebook_url)}
                >
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
              )}
              {appInfo.twitter_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(appInfo.twitter_url)}
                >
                  <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              )}
              {appInfo.instagram_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(appInfo.instagram_url)}
                >
                  <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                </TouchableOpacity>
              )}
              {appInfo.youtube_url && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(appInfo.youtube_url)}
                >
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {appInfo.support_email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => openLink(`mailto:${appInfo.support_email}`)}
              >
                <Ionicons name="mail" size={20} color={'#FFFFFF'} />
                <Text style={styles.contactText}>{appInfo.support_email}</Text>
              </TouchableOpacity>
            )}
            {appInfo.contact_phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => openLink(`tel:${appInfo.contact_phone}`)}
              >
                <Ionicons name="call" size={20} color={'#FFFFFF'} />
                <Text style={styles.contactText}>{appInfo.contact_phone}</Text>
              </TouchableOpacity>
            )}
            {appInfo.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => openLink(appInfo.website)}
              >
                <Ionicons name="globe" size={20} color={'#FFFFFF'} />
                <Text style={styles.contactText}>{appInfo.website}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features */}
          {appInfo.features && appInfo.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fonctionnalités</Text>
              {appInfo.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={'#E23E3E'} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Team */}
          {teamMembers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notre Équipe</Text>
              {teamMembers.map((member) => (
                <View key={member.id} style={styles.teamMemberCard}>
                  <View style={styles.teamMemberAvatar}>
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person" size={30} color={'#B0B0B0'} />
                    )}
                  </View>
                  <View style={styles.teamMemberInfo}>
                    <Text style={styles.teamMemberName}>{member.name}</Text>
                    <Text style={styles.teamMemberRole}>{member.role}</Text>
                    {member.bio && (
                      <Text style={styles.teamMemberBio} numberOfLines={2}>{member.bio}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations Légales</Text>
            {appInfo.privacy_policy_url && (
              <TouchableOpacity
                style={styles.legalItem}
                onPress={() => openLink(appInfo.privacy_policy_url)}
              >
                <Text style={styles.legalText}>Politique de Confidentialité</Text>
                <Ionicons name="chevron-forward" size={20} color={'#B0B0B0'} />
              </TouchableOpacity>
            )}
            {appInfo.terms_url && (
              <TouchableOpacity
                style={styles.legalItem}
                onPress={() => openLink(appInfo.terms_url)}
              >
                <Text style={styles.legalText}>Conditions d'Utilisation</Text>
                <Ionicons name="chevron-forward" size={20} color={'#B0B0B0'} />
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 BF1 TV. Tous droits réservés.</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A0000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  teamMemberCard: {
    flexDirection: 'row',
    backgroundColor: '#1A0000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  teamMemberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamMemberRole: {
    fontSize: 14,
    color: '#E23E3E',
    marginBottom: 8,
  },
  teamMemberBio: {
    fontSize: 13,
    color: '#B0B0B0',
    lineHeight: 18,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A0000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
});
