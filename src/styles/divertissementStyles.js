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
    flexDirection: viewMode === 'grid' ? 'column' : 'row',
    height: viewMode === 'grid' ? 200 : 120,
  },
  interviewCardList: {
    flexDirection: 'row',
    height: 120,
    marginBottom: 12,
  },
  interviewImage: {
    width: viewMode === 'grid' ? '100%' : 120,
    height: viewMode === 'grid' ? 200 : '100%',
  },
  interviewImageList: {
    width: 120,
    height: '100%',
  },
  interviewOverlay: {
    ...(viewMode === 'grid'
      ? {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          justifyContent: 'flex-end',
        }
      : {
          flex: 1,
          padding: 16,
          justifyContent: 'center',
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
    fontSize: 7, // Réduction supplémentaire: 9->7
    fontWeight: 'bold',
  },
  interviewTitle: {
    color: '#FFFFFF',
    fontSize: viewMode === 'grid' ? 10 : 12, // Réduction supplémentaire: 13->10, 14->12
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    ...(viewMode === 'list' && {
      marginBottom: 0,
      paddingRight: 16,
    }),
    ...(viewMode === 'grid' && {
      marginBottom: 6, // Réduction de marginBottom: 8->6
    }),
  },
  interviewTitleList: {
    color: '#FFFFFF',
    fontSize: 11, // Réduction supplémentaire: 14->11
    fontWeight: 'bold',
    marginBottom: 4, // Réduction de marginBottom: 6->4
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 12, // Réduction supplémentaire: 16->12
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12, // Réduction: 16->12
    marginBottom: 4, // Réduction: 6->4
  },
  emptySubtitle: {
    fontSize: 9, // Réduction supplémentaire: 11->9
    color: colors.textSecondary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23E3E',
    paddingHorizontal: 20, // Réduction: 24->20
    paddingVertical: 10, // Réduction: 12->10
    borderRadius: 6, // Réduction: 8->6
    marginTop: 20, // Réduction: 24->20
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 11, // Réduction supplémentaire: 13->11
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
    fontSize: 13, // 16*0.8
    marginTop: 13, // 16*0.8
  },
});