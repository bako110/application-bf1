import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  }, []);

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
        setNotifications(notifications.map(n =>
          (n.id || n._id) === notifId ? { ...n, is_read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.is_read)
          .map(n => notificationService.markAsRead(n.id || n._id))
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
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
      <TouchableOpacity
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
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
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Tout marquer comme lu</Text>
          </TouchableOpacity>
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