import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import notificationService from '../services/notificationService';
import { formatRelativeTime } from '../utils/dateUtils';
import { createNotificationsStyles } from '../styles/notificationsStyles'; // Import des styles séparés

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
    
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Recharger quand l'écran devient visible
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!notification.is_read) {
        const notifId = notification.id || notification._id;
        await notificationService.markAsRead(notifId);
        // Retirer la notification de la liste car elle est maintenant lue
        setNotifications(notifications.filter(n => (n.id || n._id) !== notifId));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Recharger les notifications (l'endpoint /me ne retournera plus rien car toutes sont lues)
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => (n.id || n._id) !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la notification');
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Supprimer toutes les notifications',
      'Êtes-vous sûr de vouloir supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteAllNotifications();
              setNotifications([]);
            } catch (error) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Erreur', 'Impossible de supprimer toutes les notifications');
            }
          }
        }
      ]
    );
  };

  const getNotificationIcon = (category) => {
    switch (category) {
      case 'live': return 'radio';
      case 'news': return 'newspaper';
      case 'show': return 'tv';
      case 'movie': return 'film';
      case 'comment': return 'chatbubble';
      case 'like': return 'heart';
      default: return 'notifications';
    }
  };

  const renderNotification = ({ item }) => {
    const styles = createNotificationsStyles(colors);
    
    return (
      <View style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
        <TouchableOpacity
          style={styles.notificationMainContent}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.notificationIcon}>
            <Ionicons
              name={getNotificationIcon(item.category)}
              size={24}
              color={item.is_read ? colors.textSecondary : colors.primary}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
        
        {/* Bouton de suppression */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id || item._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#E23E3E" />
        </TouchableOpacity>
      </View>
    );
  };

  const styles = createNotificationsStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {notifications.filter(n => !n.is_read).length} non lues
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
              <Text style={styles.markAllButton}>Tout marquer lu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllButton}>
              <Ionicons name="trash" size={18} color="#E23E3E" />
              <Text style={styles.deleteAllText}>Tout supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={60} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>Aucune notification</Text>
            <Text style={styles.emptyStateSubtext}>
              Vous serez notifié des nouveaux contenus et activités
            </Text>
          </View>
        }
      />
    </View>
  );
}