import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import notificationService from '../services/notificationService';
import authService from '../services/authService';
import { useNavigation } from '@react-navigation/native';

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
const NotificationsModal = ({ visible, onClose, notifications, unreadCount, onMarkAllAsRead, onMarkAsRead, onDeleteNotification, onDeleteAll, colors }) => {
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
                <View style={styles.headerActions}>
                  {notifications.length > 0 && (
                    <>
                      <TouchableOpacity onPress={onMarkAllAsRead} style={styles.headerButton}>
                        <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onDeleteAll} style={styles.headerButton}>
                        <Ionicons name="trash" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#E23E3E" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView style={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => {
                    const notifId = notification.id || notification._id;
                    return (
                      <View
                        key={notifId || `notification-${index}`}
                        style={[
                          styles.notificationItem,
                          !notification.is_read && styles.unreadNotification
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.notificationMainContent}
                          onPress={() => onMarkAsRead(notification)}
                        >
                          <View style={styles.notificationIcon}>
                            <Ionicons name="notifications" size={20} color="#E23E3E" />
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
                        <TouchableOpacity
                          onPress={() => onDeleteNotification(notifId)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off-outline" size={60} color="#666" />
                    <Text style={styles.emptyText}>Aucune notification</Text>
                  </View>
                )}
              </ScrollView>
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
  const navigation = useNavigation();
  const styles = createStyles(colors);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadNotifications();
    
    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(() => {
      checkAuthAndLoadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Recharger quand le modal s'ouvre
  useEffect(() => {
    if (modalVisible && isAuthenticated) {
      loadNotifications();
    }
  }, [modalVisible]);

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
      // L'endpoint /me retourne uniquement les notifications non lues
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter pour voir vos notifications',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => {
              // Naviguer vers l'onglet "Mon compte" puis vers l'écran Login
              // Utilisation de navigation.reset pour aller directement à l'écran de connexion
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Mon compte',
                    state: {
                      routes: [
                        {
                          name: 'Login',
                        },
                      ],
                    },
                  },
                ],
              });
            }
          }
        ]
      );
      return;
    }
    setModalVisible(true);
  };

  const handleMarkAsRead = async (notification) => {
    try {
      if (!notification.is_read) {
        const notifId = notification.id || notification._id;
        await notificationService.markAsRead(notifId);
        // Retirer la notification de la liste car elle est maintenant lue
        setNotifications(notifications.filter(n => (n.id || n._id) !== notifId));
        setUnreadCount(prev => Math.max(0, prev - 1));
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
      console.error('Erreur marquage notifications:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => (n.id || n._id) !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
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
              setUnreadCount(0);
            } catch (error) {
              console.error('Error deleting all notifications:', error);
              Alert.alert('Erreur', 'Impossible de supprimer toutes les notifications');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleNotificationPress}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color="#E23E3E" 
        />
        {isAuthenticated && <NotificationBadge count={unreadCount} colors={colors} />}
      </TouchableOpacity>

      {isAuthenticated && (
        <NotificationsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllAsRead={handleMarkAllAsRead}
          onMarkAsRead={handleMarkAsRead}
          onDeleteNotification={handleDeleteNotification}
          onDeleteAll={handleDeleteAll}
          colors={colors}
        />
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
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
  notificationMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  unreadNotification: {
    backgroundColor: 'rgba(226, 62, 62, 0.1)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(226, 62, 62, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.text,
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
    backgroundColor: '#E23E3E',
    marginLeft: 8,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});