// styles/jtandMagStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createJTandMagStyles = (colors) => {
  // Note: viewMode n'est pas disponible ici car c'est un état du composant
  // Nous devons l'inclure dans la fonction pour pouvoir l'utiliser dans les styles
  return (viewMode) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background || '#000000',
    },
    content: {
      flex: 1,
      paddingHorizontal: 12,
    },
    listContainer: {
      paddingTop: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingTop: 16,
    },
    showCard: {
      width: (width - 36) / 2,
      height: 240,
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#1A0000',
    },
    showCardList: {
      width: '100%',
      minHeight: 180,
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#1A0000',
      flexDirection: 'row',
    },
    showImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imageGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    showImageList: {
      width: 120,
      height: '100%',
      resizeMode: 'cover',
    },
    listContentContainer: {
      flex: 1,
      padding: 12,
      backgroundColor: '#1A0000',
    },
    listHeader: {
      marginBottom: 6,
    },
    showOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 10,
    },
    showTitle: {
      color: '#FFFFFF',
      fontSize: viewMode === 'list' ? 16 : 15,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    showDescription: {
      color: '#B0B0B0',
      fontSize: 12,
      lineHeight: 16,
      marginBottom: 8,
    },
    showMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1, // Gap minimal pour maximiser l'espace
      marginBottom: 6,
      flexWrap: 'nowrap',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1, // Gap minimal pour maximiser l'espace
      flexShrink: 0,
      minWidth: 50,
    },
    metaText: {
      color: '#B0B0B0',
      fontSize: 11,
      fontWeight: '600',
    },
    hostContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      maxWidth: '100%',
    },
    hostText: {
      color: '#B0B0B0',
      fontSize: 10,
      flex: 1,
    },
    hostItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      minWidth: 0, // Permet au texte de rétrécir
    },
    hostTextInline: {
      color: '#B0B0B0',
      fontSize: 11,
      fontWeight: '600',
      flex: 1,
    },
    bottomPadding: {
      height: 30,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 20,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: '#B0B0B0',
      marginTop: 8,
      textAlign: 'center',
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E23E3E',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
      marginTop: 24,
    },
    refreshButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 24,
    },
    errorText: {
      color: '#FFFFFF',
      fontSize: 16,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#E23E3E',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
};