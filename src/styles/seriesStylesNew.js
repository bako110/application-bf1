import { StyleSheet } from 'react-native';

export const createSeriesStyles = (colors, screenWidth) => {
  const cardWidth = (screenWidth - 48) / 2; // 2 colonnes avec espacement

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

    // Filtres simples
    filtersContainer: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filtersContent: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.background,
      marginRight: 8,
      gap: 6,
    },
    filterButtonActive: {
      backgroundColor: '#E23E3E',
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },

    // Liste
    listContent: {
      paddingHorizontal: 8,
      paddingTop: 16,
      paddingBottom: 32,
    },
    row: {
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 16,
    },

    // Carte série simple
    card: {
      width: cardWidth,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 4,
    },
    cardImage: {
      width: '100%',
      height: cardWidth * 1.5, // Ratio portrait
      backgroundColor: colors.border,
    },
    premiumBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#E23E3E',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: {
      padding: 12,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Loader
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loaderText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
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
