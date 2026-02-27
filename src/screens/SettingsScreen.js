import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import userSettingsService from '../services/userSettingsService';
import { createSettingsStyles } from '../styles/settingsStyles'; // Import des styles séparés

export default function SettingsScreen({ navigation }) {
  const { colors, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getMySettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Erreur', 'Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    // Sauvegarder l'ancienne valeur pour rollback en cas d'erreur
    const oldValue = settings[key];
    
    // Mettre à jour immédiatement l'UI pour un feedback instantané
    setSettings({ ...settings, [key]: value });
    
    try {
      setSaving(true);
      await userSettingsService.updateSetting(key, value);
      // Succès - afficher une confirmation discrète
      console.log(`✅ Paramètre ${key} mis à jour avec succès`);
    } catch (error) {
      console.error('Error updating setting:', error);
      // Rollback en cas d'erreur
      setSettings({ ...settings, [key]: oldValue });
      Alert.alert('Erreur', 'Impossible de mettre à jour le paramètre');
    } finally {
      setSaving(false);
    }
  };

  const changeTheme = async (theme) => {
    setShowThemeModal(false);
    
    // Appliquer le thème immédiatement visuellement
    setTheme(theme);
    
    // Sauvegarder dans les paramètres utilisateur
    await updateSetting('theme', theme);
    
    // Sauvegarder aussi dans AsyncStorage pour persistance
    try {
      const userSettings = await AsyncStorage.getItem('userSettings');
      const currentSettings = userSettings ? JSON.parse(userSettings) : {};
      currentSettings.theme = theme;
      await AsyncStorage.setItem('userSettings', JSON.stringify(currentSettings));
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
    }
  };

  const changeLanguage = async (language) => {
    setShowLanguageModal(false);
    await updateSetting('language', language);
  };

  const resetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const data = await userSettingsService.resetMySettings();
              setSettings(data);
              Alert.alert('Succès', 'Paramètres réinitialisés');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser les paramètres');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const styles = createSettingsStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
        <Text style={styles.errorText}>Impossible de charger les paramètres</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notifications Push</Text>
              <Text style={styles.settingDescription}>Recevoir des notifications sur votre appareil</Text>
            </View>
          </View>
          <Switch
            value={settings.push_notifications}
            onValueChange={(value) => updateSetting('push_notifications', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.push_notifications ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notifications Email</Text>
              <Text style={styles.settingDescription}>Recevoir des emails</Text>
            </View>
          </View>
          <Switch
            value={settings.email_notifications}
            onValueChange={(value) => updateSetting('email_notifications', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.email_notifications ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="radio" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notifications Live</Text>
              <Text style={styles.settingDescription}>Alertes pour les lives en direct</Text>
            </View>
          </View>
          <Switch
            value={settings.live_notifications}
            onValueChange={(value) => updateSetting('live_notifications', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.live_notifications ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="newspaper" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notifications Actualités</Text>
              <Text style={styles.settingDescription}>Alertes pour les nouvelles actualités</Text>
            </View>
          </View>
          <Switch
            value={settings.news_notifications}
            onValueChange={(value) => updateSetting('news_notifications', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.news_notifications ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>
      </View>

      {/* Lecture */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lecture Vidéo</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="play-circle" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Lecture Automatique</Text>
              <Text style={styles.settingDescription}>Lancer automatiquement les vidéos</Text>
            </View>
          </View>
          <Switch
            value={settings.auto_play}
            onValueChange={(value) => updateSetting('auto_play', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.auto_play ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="closed-captioning" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Sous-titres</Text>
              <Text style={styles.settingDescription}>Activer les sous-titres par défaut</Text>
            </View>
          </View>
          <Switch
            value={settings.subtitles_enabled}
            onValueChange={(value) => updateSetting('subtitles_enabled', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.subtitles_enabled ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="videocam" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Qualité Vidéo</Text>
              <Text style={styles.settingDescription}>{settings.video_quality === 'auto' ? 'Automatique' : settings.video_quality}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Confidentialité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confidentialité</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="eye" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Afficher l'historique</Text>
              <Text style={styles.settingDescription}>Afficher votre historique de visionnage</Text>
            </View>
          </View>
          <Switch
            value={settings.show_watch_history}
            onValueChange={(value) => updateSetting('show_watch_history', value)}
            trackColor={{ false: colors.border || '#1A0000', true: colors.primary }}
            thumbColor={settings.show_watch_history ? '#fff' : '#f4f3f4'}
            disabled={saving}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Visibilité du Profil</Text>
              <Text style={styles.settingDescription}>{settings.profile_visibility}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Apparence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => setShowThemeModal(true)}>
          <View style={styles.settingInfo}>
            <Ionicons name="color-palette" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Thème</Text>
              <Text style={styles.settingDescription}>{settings.theme === 'dark' ? 'Sombre' : settings.theme === 'light' ? 'Clair' : 'Automatique'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguageModal(true)}>
          <View style={styles.settingInfo}>
            <Ionicons name="language" size={24} color={colors.text} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Langue</Text>
              <Text style={styles.settingDescription}>{settings.language === 'fr' ? 'Français' : 'English'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.error || '#FF0000'} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.error || '#FF0000'} />
          )}
          <Text style={styles.resetButtonText}>Réinitialiser les paramètres</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Modal Thème */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir le thème</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalOption, settings.theme === 'dark' && styles.modalOptionSelected]}
              onPress={() => changeTheme('dark')}
            >
              <Ionicons name="moon" size={24} color={settings.theme === 'dark' ? colors.primary : colors.text} />
              <Text style={[styles.modalOptionText, settings.theme === 'dark' && styles.modalOptionTextSelected]}>Sombre</Text>
              {settings.theme === 'dark' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, settings.theme === 'light' && styles.modalOptionSelected]}
              onPress={() => changeTheme('light')}
            >
              <Ionicons name="sunny" size={24} color={settings.theme === 'light' ? colors.primary : colors.text} />
              <Text style={[styles.modalOptionText, settings.theme === 'light' && styles.modalOptionTextSelected]}>Clair</Text>
              {settings.theme === 'light' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, settings.theme === 'auto' && styles.modalOptionSelected]}
              onPress={() => changeTheme('auto')}
            >
              <Ionicons name="phone-portrait" size={24} color={settings.theme === 'auto' ? colors.primary : colors.text} />
              <Text style={[styles.modalOptionText, settings.theme === 'auto' && styles.modalOptionTextSelected]}>Automatique</Text>
              {settings.theme === 'auto' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Langue */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la langue</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalOption, settings.language === 'fr' && styles.modalOptionSelected]}
              onPress={() => changeLanguage('fr')}
            >
              <Text style={styles.flagEmoji}>🇫🇷</Text>
              <Text style={[styles.modalOptionText, settings.language === 'fr' && styles.modalOptionTextSelected]}>Français</Text>
              {settings.language === 'fr' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, settings.language === 'en' && styles.modalOptionSelected]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.flagEmoji}>🇬🇧</Text>
              <Text style={[styles.modalOptionText, settings.language === 'en' && styles.modalOptionTextSelected]}>English</Text>
              {settings.language === 'en' && <Ionicons name="checkmark" size={24} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}