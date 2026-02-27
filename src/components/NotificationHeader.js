import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

// Badge de notification
const NotificationBadge = ({ count, colors }) => {
  if (count <= 0) return null;
  
  const styles = createStyles(colors);
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 9 ? '9+' : count}
      </Text>
    </View>
  );
};

// Modal des notifications
const NotificationsModal = ({ visible, onClose, notifications, unreadCount, onMarkAllAsRead, onMarkAsRead, colors }) => {
  const styles = createStyles(colors);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#DC143C" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => {
                    const notifId = notification.id || notification._id;
                    return (
                    <TouchableOpacity 
                      key={notifId || `notification-${index}`} 
                      style={[
                        styles.notificationItem,
                        !notification.is_read && styles.unreadNotification
                      ]}
                      onPress={() => onMarkAsRead(notification)}
                    >
                      <View style={styles.notificationIcon}>
                        <Ionicons name="notifications" size={20} color="#DC143C" />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      {!notification.is_read && (
                        <View style={styles.unreadDot} />
                      )}
                    </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off-outline" size={60} color="#666" />
                    <Text style={styles.emptyText}>Aucune notification</Text>
                  </View>
                )}
              </ScrollView>
              
              {notifications.length > 0 && unreadCount > 0 && (
                <TouchableOpacity style={styles.markAllReadButton} onPress={onMarkAllAsRead}>
                  <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Composant principal
export default function NotificationHeader() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadNotifications();
  }, []);

  const checkAuthAndLoadNotifications = async () => {
    const isAuth = await authService.isAuthenticated();
    setIsAuthenticated(isAuth);
    if (isAuth) {
      loadNotifications();
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationPress = () => {
    if (!isAuthenticated) {
      // Si non connecté, ne rien faire ou afficher un message
      console.log('📱 [NotificationHeader] Utilisateur non connecté');
      return;
    }
    setModalVisible(true);
    // Les notifications sont déjà chargées au mount, pas besoin de recharger
  };

  const handleMarkAsRead = async (notification) => {
    try {
      console.log('🔔 [NotificationHeader] handleMarkAsRead - notification reçue:', notification);
      console.log('🔔 [NotificationHeader] notification.id:', notification.id);
      console.log('🔔 [NotificationHeader] notification._id:', notification._id);
      console.log('🔔 [NotificationHeader] Clés disponibles:', Object.keys(notification));
      
      if (!notification.is_read) {
        const notifId = notification.id || notification._id;
        console.log('🔔 [NotificationHeader] ID extrait:', notifId);
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
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
    }
  };

  // Ne rien afficher si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handleNotificationPress}
        style={styles.iconButton}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color="#DC143C" 
        />
        <NotificationBadge count={unreadCount} colors={colors} />
      </TouchableOpacity>

      <NotificationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        colors={colors}
      />
    </>
  );
}

const createStyles = (colors) => StyleSheet.create({
  iconButton: {
    marginRight: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unreadNotification: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  markAllReadButton: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
