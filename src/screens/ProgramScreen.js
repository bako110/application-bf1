import React, { useState, useEffect } from 'react';
import { Modal, Pressable, Animated, Alert } from 'react-native';
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
import reminderNotificationService from '../services/reminderNotificationService';
import ExpandableText from '../components/ExpandableText';

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
        
        // Annuler la notification planifiée
        await reminderNotificationService.cancelReminderNotification(existingReminder.id);
      } else {
        // Créer un rappel (5 minutes avant)
        const newReminder = await showService.createReminder(programId, 5, 'push');
        
        // Vérifier si le rappel n'est pas déjà dans la liste (cas où il existait déjà côté serveur)
        setMyReminders(prev => {
          const alreadyExists = prev.some(r => r.id === newReminder.id);
          if (alreadyExists) {
            return prev;
          }
          return [...prev, newReminder];
        });
        
        // Planifier la notification
        await reminderNotificationService.scheduleReminderNotification(newReminder);
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      // Si l'erreur est 401 (non authentifié), afficher un message approprié
      if (error?.status === 401 || error?.detail?.includes('connecté')) {
        Alert.alert(
          'Connexion requise',
          'Vous devez être connecté pour créer des rappels de programmes.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Filtrage des émissions
  const filterShows = (shows, sectionDate) => {
    return shows.filter(show => {
      // Vérifier que l'émission correspond bien à la date de la section
      const showDate = new Date(show.startTime);
      const sectionDateObj = new Date(sectionDate);
      const now = new Date();
      
      // Comparer uniquement la date (jour/mois/année) sans l'heure
      if (showDate.toDateString() !== sectionDateObj.toDateString()) {
        return false; // L'émission n'est pas à cette date
      }

      // Pour la journée en cours, masquer les programmes dont l'heure est passée
      if (sectionDateObj.toDateString() === now.toDateString()) {
        if (showDate < now && !show.isLive) {
          return false; // Programme passé (sauf s'il est en direct)
        }
      }

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

    // Si un filtre de date spécifique est sélectionné, désélectionner le jour
    // pour afficher toutes les sections qui correspondent au filtre
    if (selectedDateFilter !== 'Tous') {
      // Ne pas sélectionner de jour spécifique, laisser le filtre gérer l'affichage
      setSelectedDay(null);
    } else if (selectedDay === null && groupedShows.length > 0) {
      // Si aucun filtre de date et aucun jour sélectionné, sélectionner le premier jour
      setSelectedDay(groupedShows[0].date);
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

  // Exposer la fonction setFilterModal via les params de navigation
  useEffect(() => {
    navigation.setParams({
      openFilterModal: () => setFilterModal(true)
    });
  }, [navigation]);

  // Ne pas recharger automatiquement quand le filtre change
  // Les filtres sont appliqués côté client sur les données déjà chargées

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
      
      console.log('📦 [DEBUG FRONTEND] Réponse brute du backend:', response);
      
      // Extraire les données
      const { days, types_available, total_count } = response;
      
      console.log(`📺 [DEBUG FRONTEND] Nombre de jours reçus: ${days?.length}`);
      
      // Afficher les 3 premiers programmes reçus
      if (days && days.length > 0 && days[0].programs && days[0].programs.length > 0) {
        console.log('🔍 [DEBUG FRONTEND] Premiers programmes reçus:');
        days[0].programs.slice(0, 3).forEach((prog, i) => {
          console.log(`   Programme ${i+1}:`);
          console.log(`   - Titre: ${prog.title}`);
          console.log(`   - start_time (brut): ${prog.start_time}`);
          console.log(`   - Type de start_time: ${typeof prog.start_time}`);
          const date = new Date(prog.start_time);
          console.log(`   - Date objet: ${date}`);
          console.log(`   - Heure extraite: ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
        });
      }
      
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
      
      // Filtrer pour ne garder que les jours à partir d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
      
      const filteredSections = sections.filter(section => {
        const sectionDate = new Date(section.date);
        sectionDate.setHours(0, 0, 0, 0);
        return sectionDate >= today; // Garder uniquement aujourd'hui et les jours futurs
      });
      
      // Aplatir tous les programmes pour weekShows
      const allShows = filteredSections.flatMap(section => section.data);
      setWeekShows(allShows);
      setGroupedShows(filteredSections);
      
      if (filteredSections.length > 0) {
        setSelectedDay(filteredSections[0].date);
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
        <ActivityIndicator size="large" color={'#DC143C'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Ionicons name="refresh" size={16} color={'#DC143C'} />
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
                // Réinitialiser tous les filtres de date quand on clique sur un jour spécifique
                if (selectedDateFilter !== 'Tous') {
                  setSelectedDateFilter('Tous');
                }
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
            // Si un filtre de date est actif, afficher toutes les sections correspondantes
            if (selectedDateFilter !== 'Tous') {
              const filteredData = filterShows(section.data, section.date);
              return filteredData.length > 0;
            }
            // Sinon, afficher seulement le jour sélectionné (ou tous si aucun jour sélectionné)
            return selectedDay === null || section.date === selectedDay;
          })
          .map(section => {
            const filteredData = filterShows(section.data, section.date);

            // Ne pas afficher les sections vides
            if (filteredData.length === 0) return null;

            return (
              <View key={section.date} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color={'#DC143C'} />
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
                      onPress={() => navigation.navigate('ShowDetail', { 
                        showId: show.id, 
                        isProgram: true,
                        programData: show 
                      })}
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
                              <Ionicons name="time-outline" size={14} color={'#FFFFFF'} />
                              <Text style={styles.showTimeText}>
                                {(() => {
                                  const date = new Date(show.startTime);
                                  const hours = String(date.getHours()).padStart(2, '0');
                                  const minutes = String(date.getMinutes()).padStart(2, '0');
                                  return `${hours}:${minutes}`;
                                })()}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
                          <ExpandableText
                            text={show.description}
                            numberOfLines={2}
                            style={styles.showDescription}
                            expandedStyle={styles.showDescription}
                          />
                          <View style={styles.showFooter}>
                            <View style={styles.hostInfo}>
                              <Ionicons name="person-circle-outline" size={16} color={'#B0B0B0'} />
                              <Text style={styles.hostName}>{show.host}</Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.reminderButton}
                              onPress={() => toggleReminder(show.id)}
                            >
                              <Ionicons 
                                name={hasReminder(show.id) ? "notifications" : "notifications-outline"} 
                                size={18} 
                                color={hasReminder(show.id) ? "#fff" : '#DC143C'} 
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
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
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
    backgroundColor: '#1A0000',
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
    color: '#FFFFFF',
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
    color: '#DC143C',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalLabel: {
    fontSize: 14,
    color: '#B0B0B0',
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
    borderColor: '#DC143C',
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: '#DC143C',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#DC143C',
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
    borderColor: '#DC143C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  filterBtnText: {
    color: '#DC143C',
    fontWeight: '600',
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  daysContainer: {
    maxHeight: 140,
    borderBottomWidth: 1,
    borderBottomColor: '#330000',
  },
  daysContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayCard: {
    width: 80,
    alignItems: 'center',
    backgroundColor: '#1A0000',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0B0',
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  dayMonth: {
    fontSize: 11,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  dayMonthActive: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  todayIndicator: {
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  todayText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayBadge: {
    backgroundColor: '#330000',
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
    color: '#B0B0B0',
  },
  dayBadgeTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#330000',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  showCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1A0000',
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
    backgroundColor: '#DC143C',
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
  },
  showDescription: {
    color: '#B0B0B0',
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
    color: '#B0B0B0',
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