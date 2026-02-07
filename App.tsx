/**
 * BF1 React Native App - version propre
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TouchableWithoutFeedback,
  StyleSheet,
  StatusBar,
  useColorScheme
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Services
import notificationService from './src/services/notificationService';

// Components
// import Splash from './src/components/Splash';

// Screens
import HomeStack from './src/screens/HomeStack';
import LiveStack from './src/screens/LiveStack';
import ReelScreen from './src/screens/ReelScreen';
import ProgramStack from './src/screens/ProgramStack';
import MoviesStack from './src/screens/MoviesStack';
import ProfileStack from './src/screens/ProfileStack';

const Tab = createBottomTabNavigator();

// ===== Notification Badge =====
const NotificationBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// ===== Notifications Modal =====
const NotificationsModal = ({
  visible,
  onClose,
  notifications,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  loadNotifications,
  loading
}: {
  visible: boolean;
  onClose: () => void;
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead: () => void;
  loadNotifications: () => void;
  loading: boolean;
}) => {
  const safeAreaInsets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    setUnreadCount(unread);
  }, [notifications]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={[styles.modalContent, { paddingBottom: safeAreaInsets.bottom }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#DC143C" />
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <ScrollView style={styles.notificationsList}>
                  {notifications.length > 0 ? notifications.map((n: any, i: number) => (
                    <TouchableOpacity
                      key={n._id || `notif-${i}`}
                      style={[styles.notificationItem, !n.is_read && styles.unreadNotification]}
                      onPress={() => !n.is_read && onMarkAsRead(n._id)}
                    >
                      <Ionicons name="notifications-outline" size={20} color="#DC143C" style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notificationTitle}>{n.title}</Text>
                        <Text style={styles.notificationMessage}>{n.message}</Text>
                        <Text style={styles.notificationTime}>
                          {n.created_at ? new Date(n.created_at).toLocaleString() : 'Date inconnue'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => onDelete(n._id)}>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )) : (
                    <View style={styles.emptyNotifications}>
                      <Ionicons name="notifications-off-outline" size={60} color="#666" />
                      <Text style={styles.emptyText}>Aucune notification</Text>
                    </View>
                  )}
                  {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllReadButton} onPress={onMarkAllAsRead}>
                      <Text style={styles.markAllReadText}>Tout marquer comme lu</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ===== Header Notifications =====
const HeaderRightWithNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.fetchNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 16 }}>
        <Ionicons name="notifications-outline" size={24} color="#DC143C" />
        <NotificationBadge count={unreadCount} />
      </TouchableOpacity>

      <NotificationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        notifications={notifications}
        onMarkAsRead={async (id) => { await notificationService.markAsRead(id); loadNotifications(); }}
        onDelete={async (id) => { await notificationService.deleteNotification(id); loadNotifications(); }}
        onMarkAllAsRead={async () => { await notificationService.markAllAsRead(); loadNotifications(); }}
        loadNotifications={loadNotifications}
        loading={loading}
      />
    </>
  );
};

// ===== Main App =====
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';

  // useEffect(() => {
  //   const timer = setTimeout(() => setShowSplash(false), 1800);
  //   return () => clearTimeout(timer);
  // }, []);

  // if (showSplash) return <Splash />;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName = 'home';
                  switch (route.name) {
                    case 'Accueil': iconName = focused ? 'home' : 'home-outline'; break;
                    case 'Reel': iconName = focused ? 'play-circle' : 'play-circle-outline'; break;
                    case 'Programme': iconName = focused ? 'calendar' : 'calendar-outline'; break;
                    case 'Films': iconName = focused ? 'film' : 'film-outline'; break;
                    case 'Profil': iconName = focused ? 'person' : 'person-outline'; break;
                  }
                  return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#DC143C',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                  backgroundColor: '#000000',
                  borderTopColor: '#1C1C1E',
                  height: 80,
                  paddingBottom: 28,
                },
                headerStyle: { backgroundColor: '#000000' },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: 'bold' },
              })}
            >
              <Tab.Screen name="Accueil" component={HomeStack} options={{ headerShown: false }} />
              <Tab.Screen name="Reel" component={ReelScreen} options={{ headerShown: false }} />
              <Tab.Screen name="Programme" component={ProgramStack} />
              <Tab.Screen name="Films" component={MoviesStack} />
              <Tab.Screen name="Profil" component={ProfileStack} />
            </Tab.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  loadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#FFF' },
  notificationsList: { maxHeight: 400 },
  notificationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  unreadNotification: { backgroundColor: 'rgba(220,20,60,0.1)' },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  notificationMessage: { fontSize: 14, color: '#AAA', marginBottom: 4 },
  notificationTime: { fontSize: 12, color: '#666' },
  emptyNotifications: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16, textAlign: 'center' },
  markAllReadButton: { margin: 20, padding: 16, backgroundColor: '#DC143C', borderRadius: 12, alignItems: 'center' },
  markAllReadText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
