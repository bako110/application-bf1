import { StyleSheet } from 'react-native';

export const createDivertissementStyles = (colors, viewMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  gridContainer: {
    paddingHorizontal: 0,
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  interviewCard: {
    width: '100%',
    marginBottom: viewMode === 'grid' ? 16 : 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // En mode liste, on veut une carte horizontale
    flexDirection: viewMode === 'grid' ? 'column' : 'row',
    height: viewMode === 'grid' ? 200 : 120,
  },
  interviewCardList: {
    flexDirection: 'row',
    height: 120,
    marginBottom: 12,
    // Gardé pour compatibilité
  },
  interviewImage: {
    width: viewMode === 'grid' ? '100%' : 120,
    height: viewMode === 'grid' ? 200 : '100%',
  },
  interviewImageList: {
    width: 120,
    height: '100%',
    // Gardé pour compatibilité
  },
  interviewOverlay: {
    // En mode grid, overlay en bas de l'image
    // En mode liste, overlay sur la partie droite de la carte
    ...(viewMode === 'grid' ? {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      justifyContent: 'flex-end',
    } : {
      flex: 1, // Prend tout l'espace restant
      padding: 16,
      justifyContent: 'center', // Centrer verticalement le contenu
      backgroundColor: 'rgba(0,0,0,0.7)',
    }),
  },
  interviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,20,60,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  interviewBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  interviewTitle: {
    color: '#FFFFFF',
    fontSize: viewMode === 'grid' ? 16 : 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    // En mode liste, on peut ajuster
    ...(viewMode === 'list' && {
      marginBottom: 0,
      paddingRight: 16,
    }),
    ...(viewMode === 'grid' && {
      marginBottom: 8,
    }),
  },
  interviewTitleList: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    // Gardé pour compatibilité
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
});