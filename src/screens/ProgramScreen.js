import React, { useState, useEffect } from 'react';
import { Modal, Pressable, Animated, Alert } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import LoadingScreen from '../components/LoadingScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import showService from '../services/showService';
import ShowCard from '../components/showCard';
import Logo from '../components/logo';
import reminderNotificationService from '../services/reminderNotificationService';
import ExpandableText from '../components/ExpandableText';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { createProgramStyles } from '../styles/programStyles'; // Import des styles séparés

// Configuration française pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

function ProgramScreen({ navigation }) {
  const { colors } = useTheme();
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
  const [selectedDate, setSelectedDate] = useState(null); // Date sélectionnée dans le calendrier
  const [weekDates, setWeekDates] = useState([]); // Dates de la semaine courante
  const [calendarModal, setCalendarModal] = useState(false); // Modal du calendrier complet
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
    'Tous', // Tous les programmes (priorité en cours et à venir)
    'Aujourd\'hui',
    'Demain',
    'Cette semaine',
    'Week-end',
    'Passés', // 7 derniers jours uniquement
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

      // PLUS DE FILTRAGE DES PROGRAMMES PASSÉS
      // Tous les programmes sont affichés (passés, en cours, à venir)

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
          case 'Passés':
            // Afficher tous les programmes antérieurs à aujourd'hui
            dateOk = showDate < today;
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
    
    // Désélectionner la date du calendrier quand on applique un filtre
    setSelectedDate(null);

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
    setSelectedDate(null); // Réinitialiser aussi la date du calendrier
  };

  useEffect(() => {
    loadProgram();
    startAnimations();
  }, []);

  // Exposer la fonction setFilterModal via les params de navigation
  useEffect(() => {
    const hasActiveFilters = selectedType !== 'Tous' || selectedStatus !== 'Tous' || selectedDateFilter !== 'Tous';
    navigation.setParams({
      openFilterModal: () => setFilterModal(true),
      hasActiveFilters: hasActiveFilters
    });
  }, [navigation, selectedType, selectedStatus, selectedDateFilter]);

  // Recharger les programmes quand le filtre de date change (notamment pour "Passés")
  useEffect(() => {
    loadProgram();
  }, [selectedDateFilter]);

  // Générer les dates de la semaine courante pour le calendrier horizontal
  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Lundi de cette semaine
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        dayNumber: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    return dates;
  };

  useFocusEffect(
    React.useCallback(() => {
      // Initialiser les dates de la semaine au premier chargement
      if (weekDates.length === 0) {
        setWeekDates(generateWeekDates());
      }
      loadProgram();
    }, [selectedDate, selectedDateFilter, selectedType])
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
      
      console.log('🚀 [DEBUG] Début du chargement des programmes...');
      console.log('🚀 [DEBUG] Filtre actuel:', selectedDateFilter);
      console.log('🚀 [DEBUG] Date sélectionnée:', selectedDate);
      
      let response;
      let allDays = [];
      
      // MODE 1: Date spécifique sélectionnée dans le calendrier
      if (selectedDate) {
        console.log('📅 [DEBUG] Mode: Date spécifique -', selectedDate);
        
        try {
          // Calculer le jour suivant pour couvrir toute la journée sélectionnée
          const startDate = new Date(selectedDate);
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 1); // Jour suivant
          
          const startDateStr = selectedDate;
          const endDateStr = endDate.toISOString().split('T')[0];
          
          console.log('📅 [DEBUG] Requête API: start_date=', startDateStr, 'end_date=', endDateStr);
          
          response = await showService.getProgramGrid(
            startDateStr,
            endDateStr,
            selectedType !== 'Tous' ? selectedType : null
          );
          allDays = response?.days || [];
          console.log('✅ [DEBUG] Programmes du', selectedDate, ':', allDays.length, 'jours');
          if (allDays.length > 0 && allDays[0]?.programs) {
            console.log('📺 [DEBUG] Nombre de programmes:', allDays[0].programs.length);
          }
        } catch (error) {
          console.error('❌ [ERROR] Erreur chargement programmes du', selectedDate, ':', error);
          allDays = [];
        }
      }
      // MODE 2: Filtre "Passés" - charger tout l'historique
      else if (selectedDateFilter === 'Passés') {
        console.log('📅 [DEBUG] Mode: Programmes PASSÉS (historique complet)');
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1); // Jour suivant pour inclure aujourd'hui complètement
        
        const startDateStr = '2020-01-01';
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('📅 [DEBUG] Chargement de', startDateStr, 'à', endDateStr);
        
        try {
          response = await showService.getProgramGrid(
            startDateStr,
            endDateStr,
            selectedType !== 'Tous' ? selectedType : null
          );
          allDays = response?.days || [];
          console.log('✅ [DEBUG] Programmes passés reçus:', allDays.length, 'jours');
        } catch (error) {
          console.error('❌ [ERROR] Erreur chargement programmes passés:', error);
          allDays = [];
        }
      }
      // MODE 3: Par défaut - semaine courante uniquement
      else {
        console.log('📅 [DEBUG] Mode: Semaine courante (7 jours)');
        
        try {
          const response = await showService.getProgramWeek(0, selectedType !== 'Tous' ? selectedType : null);
          allDays = response?.days || [];
          
          // Mettre à jour les types disponibles
          if (response?.types_available) {
            setAvailableTypes(response.types_available);
          }
          
          console.log('✅ [DEBUG] Programmes de la semaine:', allDays.length, 'jours');
        } catch (error) {
          console.error('❌ [ERROR] Erreur chargement semaine:', error);
          allDays = [];
        }
      }
      
      console.log('📦 [DEBUG] Nombre total de jours à traiter:', allDays.length);
      
      // Vérification si allDays est vide
      if (!allDays || allDays.length === 0) {
        console.warn('⚠️ [WARN] Aucun jour disponible !');
        console.warn('⚠️ [WARN] Vérifiez que le backend retourne des données');
        setGroupedShows([]);
        setWeekShows([]);
        setLoading(false);
        return;
      }
      
      // Extraire types_available de la réponse
      const { types_available } = response || {};
      
      // Afficher les 3 premiers programmes reçus
      if (allDays.length > 0 && allDays[0].programs && allDays[0].programs.length > 0) {
        console.log('🔍 [DEBUG] Premiers programmes du premier jour:');
        allDays[0].programs.slice(0, 3).forEach((prog, i) => {
          console.log(`   Programme ${i+1}:`);
          console.log(`   - Titre: ${prog.title}`);
          console.log(`   - start_time: ${prog.start_time}`);
          const date = new Date(prog.start_time);
          console.log(`   - Date objet: ${date}`);
          console.log(`   - Heure extraite: ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
        });
      }
      
      // Mettre à jour les types disponibles
      if (types_available && types_available.length > 0) {
        setAvailableTypes(types_available);
      }
      
      console.log('🔄 [DEBUG] Conversion des jours en sections UI...');
      
      // Convertir les jours en format attendu par l'UI
      const sections = allDays.map(day => {
        const mappedPrograms = day.programs.map(mapProgramToShow);
        
        console.log(`📅 [DEBUG] Jour ${day.date}: ${day.programs.length} programmes`);
        
        // TRIER les programmes par priorité : EN DIRECT > À VENIR > PASSÉS
        const now = new Date();
        mappedPrograms.sort((a, b) => {
          const aStartTime = new Date(a.startTime);
          const bStartTime = new Date(b.startTime);
          
          // 1. Les programmes EN DIRECT en premier
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          
          // 2. Les programmes À VENIR avant les PASSÉS
          const aIsFuture = aStartTime > now;
          const bIsFuture = bStartTime > now;
          
          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;
          
          // 3. Sinon, trier par heure de début (chronologique)
          return aStartTime - bStartTime;
        });
        
        return {
          title: day.date,
          date: day.date,
          dayName: day.day_name,
          data: mappedPrograms,
        };
      });
      
      console.log('📅 [DEBUG] Nombre de sections créées:', sections.length);
      if (sections.length > 0) {
        console.log('📅 [DEBUG] Première section:', sections[0].date, '- Programmes:', sections[0].data.length);
        console.log('📅 [DEBUG] Dernière section:', sections[sections.length - 1].date, '- Programmes:', sections[sections.length - 1].data.length);
        console.log('📅 [DEBUG] Toutes les dates:', sections.map(s => s.date).join(', '));
      }
      
      // Par défaut, afficher TOUS les programmes (priorité aujourd'hui et à venir)
      // Seul le filtre "Passés" ne montre QUE les jours passés
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sectionsToDisplay = selectedDateFilter === 'Passés'
        ? sections.filter(section => {
            const sectionDate = new Date(section.date);
            sectionDate.setHours(0, 0, 0, 0);
            return sectionDate < today; // Uniquement les jours passés
          })
        : sections; // Tous les jours (passés, aujourd'hui, futurs)
      
      console.log('📅 [DEBUG] Sections à afficher:', sectionsToDisplay.length, '(filtre:', selectedDateFilter, ')');
      
      // Aplatir tous les programmes pour weekShows
      const allShows = sectionsToDisplay.flatMap(section => section.data);
      setWeekShows(allShows);
      setGroupedShows(sectionsToDisplay);
      
      if (sectionsToDisplay.length > 0) {
        // PRIORITÉ : Sélectionner aujourd'hui s'il existe dans la liste
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySection = sectionsToDisplay.find(section => {
          const sectionDate = new Date(section.date);
          sectionDate.setHours(0, 0, 0, 0);
          return sectionDate.toDateString() === today.toDateString();
        });
        
        if (todaySection) {
          // Aujourd'hui existe : le sélectionner (PRIORITÉ)
          setSelectedDay(todaySection.date);
          console.log('✅ [DEBUG] Jour sélectionné par défaut: AUJOURD\'HUI');
        } else if (selectedDateFilter === 'Passés') {
          // Filtre "Passés" : sélectionner le jour le plus récent
          setSelectedDay(sectionsToDisplay[sectionsToDisplay.length - 1].date);
          console.log('✅ [DEBUG] Jour sélectionné par défaut: DERNIER JOUR PASSÉ');
        } else {
          // Sinon : sélectionner le premier jour disponible
          setSelectedDay(sectionsToDisplay[0].date);
          console.log('✅ [DEBUG] Jour sélectionné par défaut: PREMIER JOUR');
        }
      }
      
      // Charger les rappels de l'utilisateur
      try {
        const reminders = await showService.getMyReminders(null, true);
        setMyReminders(reminders);
      } catch (err) {
        console.log('Could not load reminders:', err);
      }
      
    } catch (error) {
      console.error('❌ [ERROR] Erreur chargement programme:', error);
      console.error('❌ [ERROR] Détails:', error.response?.data || error.message);
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

  const styles = createProgramStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
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

      {/* Modal Calendrier complet */}
      <Modal
        visible={calendarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCalendarModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarModal(false)} />
        <View style={styles.calendarModalContent}>
          <View style={styles.calendarModalHeader}>
            <Text style={styles.calendarModalTitle}>Sélectionner une date</Text>
            <TouchableOpacity onPress={() => setCalendarModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Calendar
            current={selectedDate || new Date().toISOString().split('T')[0]}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setCalendarModal(false);
              // Réinitialiser le filtre de date
              if (selectedDateFilter !== 'Tous') {
                setSelectedDateFilter('Tous');
              }
            }}
            markedDates={{
              [selectedDate]: { 
                selected: true, 
                selectedColor: colors.primary,
                selectedTextColor: '#FFFFFF'
              },
              [new Date().toISOString().split('T')[0]]: {
                marked: true,
                dotColor: colors.primary,
                selected: selectedDate === new Date().toISOString().split('T')[0],
                selectedColor: colors.primary
              }
            }}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textSecondary,
              dotColor: colors.primary,
              selectedDotColor: '#FFFFFF',
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              indicatorColor: colors.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12
            }}
            style={styles.calendar}
          />
          
          <View style={styles.calendarModalActions}>
            <TouchableOpacity 
              style={styles.calendarModalBtn}
              onPress={() => {
                setSelectedDate(null);
                setCalendarModal(false);
                setWeekDates(generateWeekDates());
              }}
            >
              <Text style={styles.calendarModalBtnText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calendrier horizontal de la semaine */}
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.calendarNavBtn}
            onPress={() => {
              // Semaine précédente
              const newDates = weekDates.map(d => {
                const date = new Date(d.date);
                date.setDate(date.getDate() - 7);
                return {
                  date: date.toISOString().split('T')[0],
                  dayName: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
                  dayNumber: date.getDate(),
                  isToday: date.toDateString() === new Date().toDateString(),
                };
              });
              setWeekDates(newDates);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarTitleBtn}
            onPress={() => setCalendarModal(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.calendarTitle}>
              {selectedDate 
                ? new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Semaine courante'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarNavBtn}
            onPress={() => {
              // Semaine suivante
              const newDates = weekDates.map(d => {
                const date = new Date(d.date);
                date.setDate(date.getDate() + 7);
                return {
                  date: date.toISOString().split('T')[0],
                  dayName: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
                  dayNumber: date.getDate(),
                  isToday: date.toDateString() === new Date().toDateString(),
                };
              });
              setWeekDates(newDates);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daysContainer}
          contentContainerStyle={styles.daysContent}
        >
          {/* Bouton pour revenir à aujourd'hui */}
          {selectedDate && (
            <TouchableOpacity
              style={styles.todayBtn}
              onPress={() => {
                setSelectedDate(null);
                setWeekDates(generateWeekDates());
              }}
            >
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.todayBtnText}>Semaine</Text>
            </TouchableOpacity>
          )}
          
          {weekDates.map((day) => {
            const isSelected = selectedDate === day.date;
            
            return (
              <TouchableOpacity
                key={day.date}
                style={[styles.dayCard, isSelected && styles.dayCardActive, day.isToday && styles.dayCardToday]}
                onPress={() => {
                  setSelectedDate(day.date);
                  // Réinitialiser le filtre de date
                  if (selectedDateFilter !== 'Tous') {
                    setSelectedDateFilter('Tous');
                  }
                }}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive, day.isToday && styles.dayNumberToday]}>
                  {day.dayNumber}
                </Text>
                {day.isToday && !isSelected && (
                  <View style={styles.todayDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Days Selector (pour les jours avec programmes - affiché seulement quand il n'y a pas de date sélectionnée) */}
      {!selectedDate && groupedShows.length > 0 && (
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
      )}

      {/* Shows List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {groupedShows.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Aucun programme disponible
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Les programmes seront affichés ici une fois chargés depuis le serveur.
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 8 }]}>
              Vérifiez votre connexion Internet ou réessayez plus tard.
            </Text>
          </View>
        ) : (
          groupedShows
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
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    {section.dayName} {new Date(section.date).getDate()}/{new Date(section.date).getMonth() + 1}
                  </Text>
                </View>
                {filteredData.map((show, index) => {
                  // Vérifier si le programme est passé
                  const isPastProgram = new Date(show.startTime) < new Date() && !show.isLive;
                  
                  return (
                    <Animated.View
                      key={show.id}
                      style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.showCard,
                          isPastProgram && { opacity: 0.6 } // Réduire l'opacité des programmes passés
                        ]}
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
                                  {show.isLive ? 'EN DIRECT' : isPastProgram ? 'TERMINÉ' : show.type}
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
                );
                })}
              </View>
            );
          }).filter(item => item !== null)
        )}
      </ScrollView>
    </View>
  );
}

export default ProgramScreen;