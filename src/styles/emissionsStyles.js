import { StyleSheet } from 'react-native';

export const createEmissionsStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
    },

    listContainer: {
      paddingVertical: 20,
    },

    card: {
      marginBottom: 20,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.card,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },

    image: {
      width: '100%',
      aspectRatio: 16 / 9,
    },

    gradient: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: '60%',
    },

    footer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      padding: 12,
    },

    viewsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },

    viewsText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },

    title: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 6,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    metaText: {
      color: '#fff',
      marginLeft: 6,
      fontSize: 12,
      opacity: 0.8,
    },

    badge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },

    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },

    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },

    loading: {
      marginTop: 10,
      color: colors.text,
    },

    empty: {
      marginTop: 10,
      color: '#888',
      fontSize: 14,
    },
  });