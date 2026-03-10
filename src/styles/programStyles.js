import { StyleSheet } from 'react-native';

export const createProgramStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    /* ================= HEADER ================= */

    header: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },

    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    headerText: {
      marginLeft: 16,
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },

    headerSubtitle: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
      opacity: 0.9,
    },

    filterIconBtn: {
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderRadius: 20,
      padding: 6,
      marginLeft: 12,
    },

    /* ================= MODAL ================= */

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },

    modalContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.border || '#330000',
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },

    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginBottom: 16,
      padding: 8,
    },

    resetBtnText: {
      color: colors.primary,
      fontSize: 14,
      marginLeft: 4,
      fontWeight: '500',
    },

    modalLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 6,
      fontWeight: '600',
    },

    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
    },

    modalCancelBtn: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 12,
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: 'transparent',
    },

    modalCancelBtnText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 16,
      textAlign: 'center',
    },

    modalApplyBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 12,
      marginLeft: 8,
    },

    modalApplyBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      textAlign: 'center',
    },

    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
      marginBottom: 8,
    },

    filterBtn: {
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
      backgroundColor: 'transparent',
      minWidth: 60,
      alignItems: 'center',
    },

    filterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    filterBtnText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 11,
    },

    filterBtnTextActive: {
      color: '#fff',
    },

    /* ================= DATE SELECTOR (50% RÉDUIT) ================= */

    daysContainer: {
      maxHeight: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#330000',
    },

    daysContent: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    dayCard: {
      width: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 2,
      marginRight: 6,
      borderWidth: 1,
      borderColor: 'transparent',
    },

    dayCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    dayName: {
      fontSize: 8,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    dayNameActive: {
      color: '#FFFFFF',
    },

    dayNumber: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.text,
      marginVertical: 1,
    },

    dayNumberActive: {
      color: '#FFFFFF',
    },

    dayMonth: {
      fontSize: 7,
      color: colors.textSecondary,
    },

    dayMonthActive: {
      color: '#FFFFFF',
      opacity: 0.8,
    },

    todayIndicator: {
      backgroundColor: '#34C759',
      paddingHorizontal: 2,
      paddingVertical: 1,
      borderRadius: 4,
      marginTop: 1,
    },

    todayText: {
      fontSize: 6,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },

    dayBadge: {
      backgroundColor: colors.border || '#330000',
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: 5,
    },

    dayBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },

    dayBadgeText: {
      fontSize: 6,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },

    dayBadgeTextActive: {
      color: '#FFFFFF',
    },

    // Nouveaux styles pour le calendrier
    calendarContainer: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#330000',
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },

    calendarNavBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },

    calendarTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },

    calendarTitleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },

    // Styles pour le modal calendrier complet
    calendarModalContent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: '80%',
    },

    calendarModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#330000',
    },

    calendarModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },

    calendar: {
      borderWidth: 0,
      borderRadius: 10,
      marginHorizontal: 16,
      marginTop: 16,
    },

    calendarModalActions: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },

    calendarModalBtn: {
      backgroundColor: colors.background,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },

    calendarModalBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    dayCardToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },

    dayNumberToday: {
      color: colors.primary,
      fontWeight: 'bold',
    },

    todayDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      marginTop: 2,
    },

    todayBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },

    todayBtnText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 2,
    },

    /* ================= CONTENT ================= */

    content: {
      flex: 1,
    },

    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || '#330000',
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },

    /* ================= SHOW CARD ================= */

    showCard: {
      height: 200,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: colors.surface,
    },

    showImage: {
      width: '100%',
      height: '100%',
    },

    showGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70%',
      justifyContent: 'flex-end',
      padding: 16,
    },

    showContent: {
      gap: 8,
    },

    showHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    showTypeBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    liveBadge: {
      backgroundColor: colors.primary,
    },

    liveIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
    },

    showTypeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },

    showTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },

    showTimeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },

    showTitle: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 24,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },

    showDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },

    showFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },

    hostInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    hostName: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },

    reminderButton: {
      backgroundColor: `${colors.primary}20`,
      padding: 8,
      borderRadius: 8,
    },

    /* ================= EMPTY STATE ================= */
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },

    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },

    emptyStateText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default createProgramStyles;