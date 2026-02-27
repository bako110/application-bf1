import { StyleSheet } from 'react-native';

export const createAppStyles = (colors) => StyleSheet.create({
  // Badge styles
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
  
  // Modal styles
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
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  
  // Loading styles
  loadingContainer: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    fontSize: 16, 
    color: '#FFF' 
  },
  
  // Notifications list styles
  notificationsList: { 
    maxHeight: 400 
  },
  notificationItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2C2C2E' 
  },
  unreadNotification: { 
    backgroundColor: 'rgba(220,20,60,0.1)' 
  },
  notificationTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFF', 
    marginBottom: 4 
  },
  notificationMessage: { 
    fontSize: 14, 
    color: '#AAA', 
    marginBottom: 4 
  },
  notificationTime: { 
    fontSize: 12, 
    color: '#666' 
  },
  
  // Empty state styles
  emptyNotifications: { 
    padding: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 16, 
    textAlign: 'center' 
  },
  
  // Action button styles
  markAllReadButton: { 
    margin: 20, 
    padding: 16, 
    backgroundColor: '#DC143C', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  markAllReadText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFF' 
  },
});

export default createAppStyles;
