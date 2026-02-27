// styles/favoritesStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createFavoritesStyles = (colors) => StyleSheet.create({
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
  favoritesList: {
    paddingTop: 16,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: colors.card || '#1C1C1E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: 120,
    height: 80,
  },
  favoriteContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
    marginBottom: 4,
  },
  favoriteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary || '#DC143C',
  },
  favoriteDate: {
    fontSize: 12,
    color: colors.textSecondary || '#B0B0B0',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyIcon: {
    marginBottom: 16,
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
