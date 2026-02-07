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
import notificationService from '../services/notificationService';

// Badge de notification
const NotificationBadge = ({ count }) => {
  if (count <= 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 9 ? '9+' : count}
      </Text>
    </View>
  );
};

// Modal des notifications
const NotificationsModal = ({ visible, onClose, notifications, unreadCount, onMarkAllAsRead, onMarkAsRead }) => {
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
                  <Ionicons name="close" size={24} color="#FF6B00" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <TouchableOpacity 
                      key={notification.id} 
                      style={[
                        styles.notificationItem,
                        !notification.is_read && styles.unreadNotification
                      ]}
                      onPress={() => onMarkAsRead(notification.id, notification.is_read)}
                    >
                      <View style={styles.notificationIcon}>
                        <Ionicons name="notifications" size={20} color="#FF6B00" />
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
                  ))
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
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.fetchNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const handleNotificationPress = () => {
    setModalVisible(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId, isRead) => {
    if (!isRead) {
      try {
        await notificationService.markAsRead(notificationId);
        loadNotifications();
      } catch (error) {
        console.error('Erreur marquage notification:', error);
      }
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

  return (
    <>
      <TouchableOpacity 
        onPress={handleNotificationPress}
        style={styles.iconButton}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color="#FF6B00" 
        />
        <NotificationBadge count={unreadCount} />
      </TouchableOpacity>

      <NotificationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#1C1C1E',
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
    borderBottomColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    borderBottomColor: '#2C2C2E',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
    marginLeft: 8,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  markAllReadButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
