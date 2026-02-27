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
    color: colors.primary || '#E23E3E',
  },
  favoriteDate: {
    fontSize: 12,
    color: colors.textSecondary || '#B0B0B0',
  },
  removeButton: {
    position: 'absolute',
    top: 48,
    right: 38,
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
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
  favoriteTypeBadge: {
    backgroundColor: colors.primary || '#E23E3E20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  favoriteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exploreButton: {
    backgroundColor: colors.primary || '#E23E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersScrollView: {
    flexGrow: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card || '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#3C3C3E',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface || '#2A2A2A',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border || '#3C3C3E',
  },
  filterButtonActive: {
    backgroundColor: colors.primary || '#E23E3E',
    borderColor: colors.primary || '#E23E3E',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary || '#B0B0B0',
    marginLeft: 4,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  favoritesContainer: {
    flex: 1,
  },
  favoritesContent: {
    paddingVertical: 16,
  },
  favoritesGrid: {
    gap: 12,
  },
  favoriteImageContainer: {
    position: 'relative',
  },
  loginButton: {
    backgroundColor: colors.primary || '#E23E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary || '#B0B0B0',
    textAlign: 'center',
    marginTop: 8,
  },
});
