import notifee, {
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID      = 'bf1_programme';
const CHANNEL_JT      = 'bf1_journal';
const REMINDERS_KEY   = 'bf1_reminders_v1';

// ─── Channels Android ────────────────────────────────────────────────────────

export async function setupNotificationChannels() {
  await notifee.createChannel({
    id:         CHANNEL_ID,
    name:       'Programme TV',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration:  true,
    sound:      'default',
  });
  await notifee.createChannel({
    id:         CHANNEL_JT,
    name:       'Journaux (13h & 19h30)',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration:  true,
    sound:      'default',
  });
}

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

// ─── Rappel programme (trigger à start_time - 5 min) ─────────────────────────

export async function scheduleReminder(program: {
  id:         string;
  title:      string;
  start_time?: string | null;
  start_at?:  string | null;
  aired_at?:  string | null;
}): Promise<boolean> {
  const rawStart = program.start_time ?? program.start_at ?? program.aired_at;
  if (!rawStart) return false;

  const fireAt = new Date(rawStart).getTime() - 5 * 60_000;
  if (fireAt <= Date.now()) return false;

  await setupNotificationChannels();

  const trigger: TimestampTrigger = {
    type:      TriggerType.TIMESTAMP,
    timestamp: fireAt,
  };

  await notifee.createTriggerNotification(
    {
      id:    `reminder_${program.id}`,
      title: '📺 BF1 — Dans 5 minutes',
      body:  program.title,
      android: {
        channelId:  CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        smallIcon:  'ic_notification',
      },
    },
    trigger,
  );

  // Persiste localement
  const stored = await getReminderIds();
  stored.add(program.id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([...stored]));
  return true;
}

export async function cancelReminder(programId: string): Promise<void> {
  await notifee.cancelTriggerNotification(`reminder_${programId}`);
  const stored = await getReminderIds();
  stored.delete(programId);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([...stored]));
}

export async function getReminderIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

// ─── JT 13h & 19h30 — notifs quotidiennes automatiques ───────────────────────

// Chaque entrée = une notif quotidienne automatique à (hour:minute) = heure réelle - 5 min
// Pour ajouter un programme : copier une ligne, changer id (unique), hour, minute, label
const JT_SLOTS = [
  { id: 'jt_13h',   hour: 12, minute: 55, label: 'Journal de 13h' },
  { id: 'jt_19h30', hour: 19, minute: 25, label: 'Journal de 19h30' },
  // Exemples à décommenter ou dupliquer :
  // { id: 'jt_8h',    hour: 7,  minute: 55, label: 'Journal de 8h' },
  // { id: 'morning',  hour: 6,  minute: 55, label: 'Matinale BF1' },
  // { id: 'prime',    hour: 20, minute: 55, label: 'Prime Time 21h' },
];

export async function scheduleJournalNotifications(): Promise<void> {
  await setupNotificationChannels();

  for (const slot of JT_SLOTS) {
    // Calcule le prochain déclenchement (aujourd'hui ou demain si déjà passé)
    const now  = new Date();
    const fire = new Date();
    fire.setHours(slot.hour, slot.minute, 0, 0);
    if (fire.getTime() <= now.getTime()) {
      fire.setDate(fire.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type:            TriggerType.TIMESTAMP,
      timestamp:       fire.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id:    slot.id,
        title: '📺 BF1 — Dans 5 minutes',
        body:  slot.label,
        android: {
          channelId:   CHANNEL_JT,
          importance:  AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          smallIcon:   'ic_notification',
        },
      },
      trigger,
    );
  }
}

export async function cancelJournalNotifications(): Promise<void> {
  for (const slot of JT_SLOTS) {
    await notifee.cancelTriggerNotification(slot.id);
  }
}
