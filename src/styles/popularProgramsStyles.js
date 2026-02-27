// styles/popularProgramsStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createPopularProgramsStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card || '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#3C3C3E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  programCard: {
    width: (width - 48) / 2,
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card || '#1A0000',
  },
  programImage: {
    width: '100%',
    height: 120,
  },
  programOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  programTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
    marginBottom: 4,
  },
  programTime: {
    fontSize: 12,
    color: colors.textSecondary || '#B0B0B0',
  },
  programRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary || '#E23E3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary || '#B0B0B0',
    textAlign: 'center',
  },
});
