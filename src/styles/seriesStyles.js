import { StyleSheet, Platform } from 'react-native';

export const createSeriesStyles = (colors, numColumns) => {
  return StyleSheet.create({
    // Container principal
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    // Header simple
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Filtres style Netflix
    filtersContainer: {
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filtersContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 24,
      backgroundColor: colors.surface || colors.card,
      marginRight: 10,
      gap: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: '#E23E3E',
      borderColor: '#E23E3E',
    },
    filterText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },

    // Liste style Netflix
    listContent: {
      paddingHorizontal: 8,
      paddingTop: 16,
      paddingBottom: 40,
    },

    // Carte série style Netflix (système sportScreen)
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    cardImage: {
      width: '100%',
      height: 220,
      resizeMode: 'cover',
      backgroundColor: colors.surface || colors.card,
    },
    premiumBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(226, 62, 62, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    cardInfo: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      lineHeight: 18,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Loader
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
};
