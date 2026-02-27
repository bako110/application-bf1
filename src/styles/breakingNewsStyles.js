// styles/breakingNewsStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createBreakingNewsStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 35,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listContainer: {
    flexDirection: 'column',
  },
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    paddingVertical: 4,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 24,
    paddingVertical: 2,
    borderRadius: 30,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#3C3C3E',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  newsCardGrid: {
    width: '48%',
    height: 220,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
  },
  newsCardList: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A0000',
    flexDirection: 'row',
  },
  newsImageGrid: {
    width: '100%',
    height: '100%',
  },
  newsImageList: {
    width: 120,
    height: '100%',
  },
  newsContentList: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsTitleList: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsDescriptionList: {
    color: '#B0B0B0',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  newsMetaList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsTimeList: {
    color: '#B0B0B0',
    fontSize: 11,
  },
  newsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  newsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  newsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 26,
  },
  newsDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    color: '#B0B0B0',
    fontSize: 13,
  },
  newsTime: {
    color: '#DC143C',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});