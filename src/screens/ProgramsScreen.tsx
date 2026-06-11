import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore, useUiStore } from '../stores';
import * as api from '../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramStatus = 'live' | 'upcoming' | 'past';
type FilterStatus  = 'all' | 'live' | 'upcoming' | 'past';
type FilterType    = 'all' | 'JT' | 'Magazine' | 'Sport';
type FilterPeriod  = 'all' | 'today' | 'tomorrow' | 'week' | 'weekend' | 'past';

interface DayItem {
  date:    string;
  dayName: string;
  dayNum:  number;
  isToday: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr?: string | null) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function getStatus(startTime?: string, endTime?: string): ProgramStatus {
  if (!startTime) return 'past';
  const now   = Date.now();
  const start = new Date(startTime).getTime();
  const end   = endTime ? new Date(endTime).getTime() : start + 3_600_000;
  if (now >= start && now <= end) return 'live';
  if (start > now) return 'upcoming';
  return 'past';
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function generateWeekDays(lang: string): DayItem[] {
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const names = lang === 'fr'
    ? ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date:    d.toISOString().split('T')[0],
      dayName: names[d.getDay()],
      dayNum:  d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

function formatDayTitle(dateStr: string, lang: string) {
  try {
    const d = new Date(dateStr);
    const daysFr   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const daysEn   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthsFr = ['janvier','février','mars','avril','mai','juin','juillet',
                      'août','septembre','octobre','novembre','décembre'];
    const monthsEn = ['January','February','March','April','May','June','July',
                      'August','September','October','November','December'];
    const days   = lang === 'fr' ? daysFr   : daysEn;
    const months = lang === 'fr' ? monthsFr : monthsEn;
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  } catch { return dateStr; }
}

// ─── ProgramItem ──────────────────────────────────────────────────────────────

function ProgramItem({
  item, hasReminder, onReminder, isAuth, theme, t,
}: {
  item: any; hasReminder: boolean; onReminder: (id: string) => void;
  isAuth: boolean; theme: any; t: any;
}) {
  const status = getStatus(item.start_time, item.end_time);
  const STATUS_CFG = {
    live:     { bg: 'rgba(226,62,62,0.15)', color: COLORS.primary, label: t.programs.statusLiveLabel     },
    upcoming: { bg: 'rgba(0,122,255,0.10)', color: COLORS.info,    label: t.programs.statusUpcomingLabel },
    past:     { bg: 'transparent',          color: theme.text3,    label: t.programs.statusPastLabel     },
  };
  const sc = STATUS_CFG[status];

  return (
    <View style={[
      styles.programItem,
      { backgroundColor: theme.surface, borderLeftColor: status === 'live' ? COLORS.primary : theme.border },
      status === 'past' && { opacity: 0.6 },
    ]}>
      <View style={styles.programLeft}>
        <Text style={[styles.timeText, { color: status === 'past' ? theme.text3 : theme.text }]}>
          {formatTime(item.start_time) || '--:--'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      <View style={styles.programContent}>
        <Text style={[styles.programTitle, { color: status === 'past' ? theme.text3 : theme.text }]} numberOfLines={2}>
          {item.title || item.name || 'Émission'}
        </Text>
        <Text style={[styles.programMeta, { color: theme.text3 }]}>
          {item.end_time ? `${t.programs.untilTime} ${formatTime(item.end_time)}` : ''}
          {item.type ? (item.end_time ? ` · ${item.type}` : item.type) : ''}
        </Text>
      </View>

      {status === 'upcoming' && isAuth && (
        <TouchableOpacity
          onPress={() => onReminder(String(item.id ?? item._id))}
          style={[
            styles.reminderBtn,
            hasReminder
              ? { backgroundColor: theme.bg2, borderColor: theme.border }
              : { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
          ]}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          disabled={hasReminder}
        >
          <Icon name={hasReminder ? 'notifications' : 'notifications-outline'} size={15}
            color={hasReminder ? theme.text3 : COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── CalendarModal ────────────────────────────────────────────────────────────

function CalendarModal({
  visible, selectedDate, onSelect, onClose, theme, t, lang,
}: {
  visible: boolean; selectedDate: string | null;
  onSelect: (d: string) => void; onClose: () => void;
  theme: any; t: any; lang: string;
}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year,  setYear]  = useState(today.getFullYear());

  const MONTHS_FR = ['janvier','février','mars','avril','mai','juin',
                     'juillet','août','septembre','octobre','novembre','décembre'];
  const MONTHS_EN = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
  const MONTHS = lang === 'fr' ? MONTHS_FR : MONTHS_EN;
  const WDAYS  = lang === 'fr'
    ? ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();

  const cells: { day: number; cur: boolean; dateStr: string }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, cur: false, dateStr: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ day: d, cur: true, dateStr: toDateStr(dt) });
  }
  const rem = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, cur: false, dateStr: '' });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}
          style={[styles.calendarSheet, { backgroundColor: theme.surface }]}>

          <View style={styles.calendarHeader}>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>{t.programs.selectDate}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
              <Icon name="chevron-back" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: theme.text }]}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
              <Icon name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.wdayRow}>
            {WDAYS.map(d => (
              <Text key={d} style={[styles.wdayLabel, { color: theme.text3 }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((c, i) => {
              const isSelected = c.cur && c.dateStr === selectedDate;
              const isTd = c.cur && c.dateStr === toDateStr(today);
              return (
                <TouchableOpacity
                  key={i}
                  disabled={!c.cur}
                  onPress={() => { if (c.cur) { onSelect(c.dateStr); onClose(); } }}
                  style={[
                    styles.calCell,
                    isSelected && { backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
                    isTd && !isSelected && { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md },
                  ]}
                >
                  <Text style={[
                    styles.calCellText,
                    { color: !c.cur ? theme.border : isSelected ? COLORS.white : theme.text },
                  ]}>
                    {c.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── FilterModal ──────────────────────────────────────────────────────────────

function FilterModal({
  visible, filterType, filterPeriod, onApply, onClose, theme, t,
}: {
  visible: boolean;
  filterType: FilterType; filterPeriod: FilterPeriod;
  onApply: (type: FilterType, period: FilterPeriod) => void;
  onClose: () => void; theme: any; t: any;
}) {
  const [type,   setType]   = useState<FilterType>(filterType);
  const [period, setPeriod] = useState<FilterPeriod>(filterPeriod);

  useEffect(() => { setType(filterType); setPeriod(filterPeriod); }, [visible]);

  const TYPES: { id: FilterType; label: string }[] = [
    { id: 'all',      label: t.programs.typeAll },
    { id: 'JT',       label: 'JT'              },
    { id: 'Magazine', label: 'Magazine'         },
    { id: 'Sport',    label: 'Sport'            },
  ];

  const PERIODS: { id: FilterPeriod; label: string }[] = [
    { id: 'all',      label: t.programs.periodAll      },
    { id: 'today',    label: t.programs.periodToday    },
    { id: 'tomorrow', label: t.programs.periodTomorrow },
    { id: 'week',     label: t.programs.periodWeek     },
    { id: 'weekend',  label: t.programs.periodWeekend  },
    { id: 'past',     label: t.programs.periodPast     },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1}
          style={[styles.filterSheet, { backgroundColor: theme.surface }]}>

          <Text style={[styles.filterTitle, { color: theme.text }]}>{t.programs.filter}</Text>

          <Text style={[styles.filterLabel, { color: theme.text3 }]}>{t.programs.filterType}</Text>
          <View style={styles.chipRow}>
            {TYPES.map(({ id, label }) => (
              <TouchableOpacity key={id} onPress={() => setType(id)}
                style={[styles.chip,
                  type === id
                    ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    : { borderColor: theme.border },
                ]}>
                <Text style={[styles.chipText, { color: type === id ? COLORS.white : theme.text3 }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.filterLabel, { color: theme.text3 }]}>{t.programs.filterPeriod}</Text>
          <View style={styles.chipRow}>
            {PERIODS.map(({ id, label }) => (
              <TouchableOpacity key={id} onPress={() => setPeriod(id)}
                style={[styles.chip,
                  period === id
                    ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    : { borderColor: theme.border },
                ]}>
                <Text style={[styles.chipText, { color: period === id ? COLORS.white : theme.text3 }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity onPress={onClose}
              style={[styles.filterBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
              <Text style={[styles.filterBtnText, { color: theme.text }]}>{t.programs.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onApply(type, period); onClose(); }}
              style={[styles.filterBtn, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
              <Text style={[styles.filterBtnText, { color: COLORS.white }]}>{t.programs.apply}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export function ProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t, lang }       = useTranslation();
  const navigation        = useNavigation();
  const insets            = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { showLoginModal } = useUiStore();
  const qc                = useQueryClient();
  const dayScrollRef      = useRef<ScrollView>(null);

  const weekDays = generateWeekDays(lang);
  const todayStr = toDateStr(new Date());

  const [selectedDay,  setSelectedDay]  = useState<string>(todayStr);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType,   setFilterType]   = useState<FilterType>('all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFilter,   setShowFilter]   = useState(false);
  const [reminderIds,  setReminderIds]  = useState<Set<string>>(new Set());
  const [refreshing,   setRefreshing]   = useState(false);

  // Grille semaine courante
  const { data: weekGrid, isLoading: loadingWeek, refetch: refetchWeek } = useQuery({
    queryKey: ['programs-week', filterType],
    queryFn:  () => api.getProgramWeek(0, filterType !== 'all' ? filterType : undefined),
  });

  // Grille date spécifique (calendrier ou passés)
  const needGrid = !!selectedDate || filterPeriod === 'past';
  const { data: dayGrid, isLoading: loadingDay, refetch: refetchDay } = useQuery({
    queryKey: ['programs-day', selectedDate, filterPeriod, filterType],
    queryFn:  () => {
      const typeParam = filterType !== 'all' ? filterType : null;
      if (selectedDate) {
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 1);
        return api.getProgramGrid(selectedDate, toDateStr(end), typeParam);
      }
      // filterPeriod === 'past'
      const end = new Date();
      end.setDate(end.getDate() + 1);
      return api.getProgramGrid('2020-01-01', toDateStr(end), typeParam);
    },
    enabled: needGrid,
  });

  const rawGrid  = needGrid ? dayGrid : weekGrid;
  const allDays: any[] = rawGrid?.days ?? [];

  // Rappels
  const { data: remindersData } = useQuery({
    queryKey: ['my-reminders'],
    queryFn:  () => api.getMyReminders('scheduled', true),
    enabled:  isAuthenticated,
  });

  useEffect(() => {
    if (remindersData) {
      setReminderIds(new Set((remindersData as any[] ?? []).map((r: any) => String(r.program_id))));
    }
  }, [remindersData]);

  const reminderMutation = useMutation({
    mutationFn: (progId: string) =>
      api.createReminder(progId, { program_id: progId, minutes_before: 15, reminder_type: 'push' }),
    onSuccess: (_, progId) => {
      setReminderIds(prev => new Set([...prev, progId]));
      qc.invalidateQueries({ queryKey: ['my-reminders'] });
    },
  });

  const handleReminder = useCallback((progId: string) => {
    if (!isAuthenticated) { showLoginModal(t.auth.loginRequired); return; }
    if (reminderIds.has(progId)) return;
    reminderMutation.mutate(progId);
  }, [isAuthenticated, reminderIds, showLoginModal, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWeek(), needGrid ? refetchDay() : Promise.resolve()]);
    setRefreshing(false);
  }, [refetchWeek, refetchDay, needGrid]);

  function matchesPeriod(date: string): boolean {
    if (filterPeriod === 'all' || selectedDate) return true;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const pd  = new Date(date); pd.setHours(0, 0, 0, 0);
    const diff = Math.floor((pd.getTime() - now.getTime()) / 86400000);
    if (filterPeriod === 'today')    return diff === 0;
    if (filterPeriod === 'tomorrow') return diff === 1;
    if (filterPeriod === 'week')     return diff >= 0 && diff <= 6;
    if (filterPeriod === 'weekend')  { const dow = pd.getDay(); return dow === 0 || dow === 6; }
    if (filterPeriod === 'past')     return pd < now;
    return true;
  }

  // Construire sections
  const sections = allDays
    .filter(day => {
      if (!selectedDate && filterPeriod === 'all') return day.date === selectedDay;
      return matchesPeriod(day.date);
    })
    .map(day => {
      const programs = [...(day.programs ?? [])]
        .filter(p => {
          if (filterStatus === 'all') return true;
          return getStatus(p.start_time, p.end_time) === filterStatus;
        })
        .sort((a, b) => {
          const order = { live: 0, upcoming: 1, past: 2 };
          const sa = getStatus(a.start_time, a.end_time);
          const sb = getStatus(b.start_time, b.end_time);
          if (order[sa] !== order[sb]) return order[sa] - order[sb];
          return new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime();
        });
      return { title: formatDayTitle(day.date, lang), data: programs, key: day.date };
    })
    .filter(s => s.data.length > 0);

  const isLoading  = loadingWeek || (needGrid && loadingDay);
  const hasFilters = filterStatus !== 'all' || filterType !== 'all' || filterPeriod !== 'all' || !!selectedDate;

  const STATUS_FILTERS: { id: FilterStatus; label: string }[] = [
    { id: 'all',      label: t.programs.statusAll      },
    { id: 'live',     label: t.programs.statusLive     },
    { id: 'upcoming', label: t.programs.statusUpcoming },
    { id: 'past',     label: t.programs.statusPast     },
  ];

  function resetFilters() {
    setFilterStatus('all');
    setFilterType('all');
    setFilterPeriod('all');
    setSelectedDate(null);
    setSelectedDay(todayStr);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar translucent backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.bg, borderBottomColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{t.content.programs}</Text>
        <View style={styles.headerActions}>
          {hasFilters && (
            <TouchableOpacity onPress={resetFilters} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Icon name="close-circle" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.iconBtn}>
            <Icon name="calendar-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.iconBtn}>
            <Icon name="options-outline" size={22} color={hasFilters ? COLORS.primary : theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sélecteur jours (masqué si date calendrier ou période spéciale) ── */}
      {!selectedDate && filterPeriod === 'all' && (
        <View style={[styles.dayBar, { backgroundColor: theme.bg, borderBottomColor: theme.divider }]}>
          <ScrollView ref={dayScrollRef} horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScroll}>
            {weekDays.map(d => {
              const active = selectedDay === d.date;
              return (
                <TouchableOpacity key={d.date} onPress={() => setSelectedDay(d.date)}
                  style={[styles.dayBtn, active && { backgroundColor: COLORS.primary }]}
                  activeOpacity={0.7}>
                  <Text style={[styles.dayName, { color: active ? COLORS.white : theme.text3 }]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dayNum, { color: active ? COLORS.white : theme.text }]}>
                    {d.dayNum}
                  </Text>
                  {d.isToday && !active && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Date calendrier sélectionnée ── */}
      {selectedDate && (
        <TouchableOpacity
          style={[styles.selectedDateBar, { backgroundColor: COLORS.redAlpha12, borderBottomColor: COLORS.primary }]}
          onPress={() => { setSelectedDate(null); setSelectedDay(todayStr); }}>
          <Icon name="calendar" size={14} color={COLORS.primary} />
          <Text style={[styles.selectedDateText, { color: COLORS.primary }]}>
            {formatDayTitle(selectedDate, lang)}
          </Text>
          <Icon name="close-circle" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      {/* ── Filtres statut ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.statusBar, { borderBottomColor: theme.divider }]}
        contentContainerStyle={styles.statusScroll}>
        {STATUS_FILTERS.map(({ id, label }) => {
          const active = filterStatus === id;
          return (
            <TouchableOpacity key={id} onPress={() => setFilterStatus(id)}
              style={[styles.statusChip,
                active  ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                        : { borderColor: theme.border },
              ]}
              activeOpacity={0.7}>
              <Text style={[styles.statusChipText, { color: active ? COLORS.white : theme.text3 }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Contenu ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !sections.length ? (
        <View style={styles.center}>
          <Icon name="calendar-outline" size={48} color={theme.text3} />
          <Text style={[styles.emptyText, { color: theme.text3 }]}>
            {t.programs.empty}{hasFilters ? ` ${t.programs.emptyFilters}` : ''}
          </Text>
          {hasFilters && (
            <TouchableOpacity onPress={resetFilters}
              style={[styles.resetBtn, { borderColor: COLORS.primary }]}>
              <Text style={[styles.resetBtnText, { color: COLORS.primary }]}>{t.programs.reset}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => `${item.id ?? item._id ?? i}`}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
              <View style={styles.dayDot} />
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>{section.title}</Text>
              <Text style={[styles.sectionCount, { color: theme.text3 }]}>
                {section.data.length} {section.data.length > 1 ? t.programs.program_other : t.programs.program_one}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ProgramItem
              item={item}
              hasReminder={reminderIds.has(String(item.id ?? item._id))}
              onReminder={handleReminder}
              isAuth={isAuthenticated}
              theme={theme}
              t={t}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        />
      )}

      {/* ── Modals ── */}
      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        onSelect={(d) => { setSelectedDate(d); setSelectedDay(d); setFilterPeriod('all'); }}
        onClose={() => setShowCalendar(false)}
        theme={theme}
        t={t}
        lang={lang}
      />
      <FilterModal
        visible={showFilter}
        filterType={filterType}
        filterPeriod={filterPeriod}
        onApply={(type, period) => {
          setFilterType(type);
          setFilterPeriod(period);
          if (period === 'past') setSelectedDate(null);
        }}
        onClose={() => setShowFilter(false)}
        theme={theme}
        t={t}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg, paddingBottom: 12,
    borderBottomWidth: 1, minHeight: 56, gap: SPACING.sm,
  },
  backBtn:       { padding: 4 },
  pageTitle:     { flex: 1, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBtn:       { padding: 4 },

  dayBar:    { borderBottomWidth: 0.5 },
  dayScroll: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  dayBtn: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.lg, minWidth: 52,
  },
  dayName:  { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  dayNum:   { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary, marginTop: 3,
  },

  selectedDateBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: 8, borderBottomWidth: 1,
  },
  selectedDateText: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  statusBar:    { flexGrow: 0, borderBottomWidth: 0.5 },
  statusScroll: { paddingHorizontal: SPACING.lg, paddingVertical: 10, gap: 8 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  statusChipText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  dayDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  sectionTitle: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionCount: { fontSize: FONT_SIZE.xs },

  programItem: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: 8,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    gap: SPACING.md, borderLeftWidth: 3,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  programLeft:    { width: 56, alignItems: 'center', gap: 4, flexShrink: 0 },
  timeText:       { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  statusBadge:    { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  statusText:     { fontSize: 7, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.3 },
  programContent: { flex: 1 },
  programTitle:   { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, lineHeight: 18, marginBottom: 2 },
  programMeta:    { fontSize: FONT_SIZE.xs, lineHeight: 16 },
  reminderBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyText:    { fontSize: FONT_SIZE.base },
  resetBtn:     { marginTop: 4, paddingHorizontal: SPACING.xl, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1 },
  resetBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  calendarSheet: {
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg, paddingBottom: 32,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  calendarTitle:  { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  monthNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  monthBtn:   { padding: 8 },
  monthLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  wdayRow:    { flexDirection: 'row', marginBottom: SPACING.sm },
  wdayLabel:  { flex: 1, textAlign: 'center', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:    { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellText:{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  filterSheet: {
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.lg, paddingBottom: 40,
  },
  filterTitle:   { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xl },
  filterLabel:   { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.lg },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText:      { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  filterActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xl },
  filterBtn:     { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, borderWidth: 1 },
  filterBtnText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
