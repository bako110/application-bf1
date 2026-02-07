import React, { useState, useEffect } from 'react';
import { Modal, Pressable, Animated } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../contexts/ThemeContext';
import showService from '../services/showService';
import ShowCard from '../components/showCard';
import Logo from '../components/logo';

function ProgramScreen({ navigation }) {
  const [weekShows, setWeekShows] = useState([]);
  const [groupedShows, setGroupedShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterModal, setFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Tous');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  const [selectedDateFilter, setSelectedDateFilter] = useState('Tous');
  const [availableTypes, setAvailableTypes] = useState([]);
  const [myReminders, setMyReminders] = useState([]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Mapper les données du backend au format de l'app
  const mapProgramToShow = (program) => ({
    id: program.id || program._id,
    title: program.title,
    type: program.type,
    startTime: program.start_time,
    endTime: program.end_time,
    description: program.description || '',
    image_url: program.image_url || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=250&fit=crop',
    isLive: program.is_live || false,
    host: program.host || 'BF1',
    has_replay: program.has_replay || false,
    category: program.category,
  });

  // Types d'émission présents dans la semaine
  const getAllTypes = () => {
    if (availableTypes.length > 0) {
      return ['Tous', ...availableTypes];
    }
    const types = new Set();
    weekShows.forEach(show => {
      if (show.type) types.add(show.type);
    });
    return ['Tous', ...Array.from(types)];
  };

  const statusOptions = ['Tous', 'En direct', 'À venir'];

  // Options de filtrage par date
  const dateFilterOptions = [
    'Tous',
    'Aujourd\'hui',
    'Demain',
    'Cette semaine',
    'Week-end',
  ];

  // Vérifier si un programme a un rappel
  const hasReminder = (programId) => {
    return myReminders.some(reminder => reminder.program_id === programId && reminder.status === 'scheduled');
  };

  // Créer ou supprimer un rappel
  const toggleReminder = async (programId) => {
    try {
      const existingReminder = myReminders.find(
        reminder => reminder.program_id === programId && reminder.status === 'scheduled'
      );
      
      if (existingReminder) {
        // Supprimer le rappel
        await showService.deleteReminder(existingReminder.id);
        setMyReminders(prev => prev.filter(r => r.id !== existingReminder.id));
      } else {
        // Créer un rappel (15 minutes avant)
        const newReminder = await showService.createReminder(programId, 15, 'push');
        setMyReminders(prev => [...prev, newReminder]);
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  // Filtrage des émissions
  const filterShows = (shows, sectionDate) => {
    return shows.filter(show => {
      let typeOk = selectedType === 'Tous' || show.type === selectedType;
      let statusOk = true;
      let dateOk = true;

      // Filtre par statut
      if (selectedStatus !== 'Tous') {
        if (selectedStatus === 'En direct') statusOk = show.isLive;
        if (selectedStatus === 'À venir') statusOk = !show.isLive && new Date(show.startTime) > new Date();
      }

      // Filtre par date (nouveau)
      if (selectedDateFilter !== 'Tous') {
        const showDate = new Date(show.startTime);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (selectedDateFilter) {
          case 'Aujourd\'hui':
            dateOk = showDate.toDateString() === today.toDateString();
            break;
          case 'Demain':
            dateOk = showDate.toDateString() === tomorrow.toDateString();
            break;
          case 'Cette semaine':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
            dateOk = showDate >= startOfWeek && showDate <= endOfWeek;
            break;
          case 'Week-end':
            const dayOfWeek = showDate.getDay();
            dateOk = dayOfWeek === 6 || dayOfWeek === 0; // Samedi ou Dimanche
            break;
          default:
            dateOk = true;
        }
      }

      return typeOk && statusOk && dateOk;
    });
  };

  // Fonction pour appliquer les filtres et mettre à jour la vue
  const applyFilters = () => {
    setFilterModal(false);

    // Si un filtre de date est sélectionné, on ajuste la journée sélectionnée
    if (selectedDateFilter !== 'Tous') {
      const today = new Date();
      let targetDate = null;

      switch (selectedDateFilter) {
        case 'Aujourd\'hui':
          targetDate = today.toISOString().split('T')[0];
          break;
        case 'Demain':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          targetDate = tomorrow.toISOString().split('T')[0];
          break;
        case 'Week-end':
          // Chercher le prochain week-end dans les sections disponibles
          const weekendSection = groupedShows.find(section => {
            const date = new Date(section.date);
            const day = date.getDay();
            return day === 6 || day === 0; // Samedi ou Dimanche
          });
          if (weekendSection) {
            targetDate = weekendSection.date;
          }
          break;
      }

      if (targetDate && groupedShows.some(section => section.date === targetDate)) {
        setSelectedDay(targetDate);
      }
    }
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSelectedType('Tous');
    setSelectedStatus('Tous');
    setSelectedDateFilter('Tous');
  };

  useEffect(() => {
    loadProgram();
    startAnimations();
  }, []);

  // Recharger quand le filtre de type change
  useEffect(() => {
    if (selectedType !== 'Tous') {
      loadProgram();
    }
  }, [selectedType]);

  useFocusEffect(
    React.useCallback(() => {
      loadProgram();
    }, [])
  );

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadProgram = async () => {
    try {
      setLoading(true);
      
      // Récupérer la grille des programmes de la semaine depuis le backend
      const response = await showService.getProgramWeek(0, selectedType !== 'Tous' ? selectedType : null);
      
      // Extraire les données
      const { days, types_available, total_count } = response;
      
      // Mettre à jour les types disponibles
      if (types_available && types_available.length > 0) {
        setAvailableTypes(types_available);
      }
      
      // Convertir les jours en format attendu par l'UI
      const sections = days.map(day => {
        const mappedPrograms = day.programs.map(mapProgramToShow);
        return {
          title: day.date,
          date: day.date,
          dayName: day.day_name,
          data: mappedPrograms,
        };
      });
      
      // Aplatir tous les programmes pour weekShows
      const allShows = sections.flatMap(section => section.data);
      setWeekShows(allShows);
      setGroupedShows(sections);
      
      if (sections.length > 0) {
        setSelectedDay(sections[0].date);
      }
      
      // Charger les rappels de l'utilisateur
      try {
        const reminders = await showService.getMyReminders(null, true);
        setMyReminders(reminders);
      } catch (err) {
        console.log('Could not load reminders:', err);
      }
      
    } catch (error) {
      console.error('Error loading program:', error);
      // En cas d'erreur, afficher un message ou des données par défaut
      setGroupedShows([]);
      setWeekShows([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayShortName = (dayName) => {
    const shorts = {
      'Lundi': 'Lun',
      'Mardi': 'Mar',
      'Mercredi': 'Mer',
      'Jeudi': 'Jeu',
      'Vendredi': 'Ven',
      'Samedi': 'Sam',
      'Dimanche': 'Dim',
    };
    return shorts[dayName] || dayName;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Logo size="small" showText={false} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Programme</Text>
            <Text style={styles.headerSubtitle}>
              {weekShows.length} émissions cette semaine
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.filterIconBtn}>
              <Ionicons name="filter" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Modal Filtres */}
      <Modal
        visible={filterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModal(false)} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtrer les émissions</Text>

          {/* Bouton de réinitialisation */}
          <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.resetBtnText}>Réinitialiser</Text>
          </TouchableOpacity>

          {/* Filtre par date */}
          <Text style={styles.modalLabel}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {dateFilterOptions.map(dateOption => (
              <TouchableOpacity
                key={dateOption}
                style={[styles.filterBtn, selectedDateFilter === dateOption && styles.filterBtnActive]}
                onPress={() => setSelectedDateFilter(dateOption)}
              >
                <Text style={[styles.filterBtnText, selectedDateFilter === dateOption && styles.filterBtnTextActive]}>
                  {dateOption}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtre par type */}
          <Text style={styles.modalLabel}>Type d'émission</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {getAllTypes().map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterBtn, selectedType === type && styles.filterBtnActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.filterBtnText, selectedType === type && styles.filterBtnTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtre par statut */}
          <Text style={styles.modalLabel}>Statut</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {statusOptions.map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterBtn, selectedStatus === status && styles.filterBtnActive]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[styles.filterBtnText, selectedStatus === status && styles.filterBtnTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setFilterModal(false)}>
              <Text style={styles.modalCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalApplyBtn} onPress={applyFilters}>
              <Text style={styles.modalApplyBtnText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Days Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysContainer}
        contentContainerStyle={styles.daysContent}
      >
        {groupedShows.map((section, index) => {
          const isSelected = selectedDay === section.date;
          const date = new Date(section.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const filteredCount = filterShows(section.data, section.date).length;

          return (
            <TouchableOpacity
              key={section.date}
              style={[styles.dayCard, isSelected && styles.dayCardActive]}
              onPress={() => {
                setSelectedDay(section.date);
                setSelectedDateFilter('Tous'); // Réinitialiser le filtre de date quand on clique sur un jour
              }}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {getDayShortName(section.dayName)}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                {date.getDate()}
              </Text>
              <Text style={[styles.dayMonth, isSelected && styles.dayMonthActive]}>
                {date.toLocaleDateString('fr-FR', { month: 'short' })}
              </Text>
              {isToday && (
                <View style={styles.todayIndicator}>
                  <Text style={styles.todayText}>Aujourd'hui</Text>
                </View>
              )}
              <View style={[styles.dayBadge, isSelected && styles.dayBadgeActive]}>
                <Text style={[styles.dayBadgeText, isSelected && styles.dayBadgeTextActive]}>
                  {filteredCount}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Shows List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {groupedShows
          .filter(section => {
            // Si un filtre de date est actif, on montre toutes les sections qui contiennent des émissions filtrées
            if (selectedDateFilter !== 'Tous') {
              return filterShows(section.data, section.date).length > 0;
            }
            // Sinon, on montre seulement la journée sélectionnée
            return section.date === selectedDay;
          })
          .map(section => {
            const filteredData = filterShows(section.data, section.date);

            // Ne pas afficher les sections vides
            if (filteredData.length === 0) return null;

            return (
              <View key={section.date} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    {section.dayName} {new Date(section.date).getDate()}/{new Date(section.date).getMonth() + 1}
                  </Text>
                </View>
                {filteredData.map((show, index) => (
                  <Animated.View
                    key={show.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.showCard}
                      onPress={() => navigation.navigate('ShowDetail', { showId: show.id })}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: show.image_url }}
                        style={styles.showImage}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={styles.showGradient}
                      >
                        <View style={styles.showContent}>
                          <View style={styles.showHeader}>
                            <View style={[styles.showTypeBadge, show.isLive && styles.liveBadge]}>
                              {show.isLive && <View style={styles.liveIndicator} />}
                              <Text style={styles.showTypeText}>
                                {show.isLive ? 'EN DIRECT' : show.type}
                              </Text>
                            </View>
                            <View style={styles.showTime}>
                              <Ionicons name="time-outline" size={14} color={colors.text} />
                              <Text style={styles.showTimeText}>
                                {new Date(show.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
                          <Text style={styles.showDescription} numberOfLines={2}>{show.description}</Text>
                          <View style={styles.showFooter}>
                            <View style={styles.hostInfo}>
                              <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                              <Text style={styles.hostName}>{show.host}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.reminderButton}
                              onPress={() => toggleReminder(show.id)}
                            >
                              <Ionicons 
                                name={hasReminder(show.id) ? "notifications" : "notifications-outline"} 
                                size={18} 
                                color={hasReminder(show.id) ? "#fff" : colors.primary} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            );
          }).filter(item => item !== null)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
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
    paddingVertical: 4,
    marginBottom: 12,
  },
  filterBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  daysContainer: {
    maxHeight: 140,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  daysContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayCard: {
    width: 80,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNameActive: {
    color: colors.text,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  dayNumberActive: {
    color: colors.text,
  },
  dayMonth: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dayMonthActive: {
    color: colors.text,
    opacity: 0.8,
  },
  todayIndicator: {
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  todayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.text,
  },
  dayBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dayBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  dayBadgeTextActive: {
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  showTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
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
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
});

export default ProgramScreen;