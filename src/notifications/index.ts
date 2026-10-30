import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { es } from '../copy/es';
import { toBogota, today } from '../domain/dates';
import { isScheduled } from '../domain/habits';
import { getHabit, listHabits, setCheck } from '../db/habits';
import { SETTING_KEYS, setSetting } from '../db/settings';
import { desiredReminders, REMINDER_ID_PREFIX } from './schedule';

/*
 * Recordatorios por hábito: notificaciones locales semanales (sin push, sin red).
 * Cada recordatorio tiene un identificador `habit:<id>:<día>` y una firma en `data.sig`;
 * `syncHabitReminders` concilia lo programado con lo que debería haber.
 */

const CHANNEL_ID = 'habit-reminders';
const CATEGORY_ID = 'habit_reminder';
export const ACTION_DONE = 'done';
export const ACTION_MINIMAL = 'minimal';

export const notificationsSupported = Platform.OS !== 'web';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export function configureNotificationHandler(): void {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannelAndCategory(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: es.notifications.channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: ACTION_DONE, buttonTitle: es.notifications.actionDone, options: { opensAppToForeground: true } },
    { identifier: ACTION_MINIMAL, buttonTitle: es.notifications.actionMinimal, options: { opensAppToForeground: true } },
  ]);
}

export async function getPermissionState(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Pide el permiso (Android 13+) la primera vez que se crea un recordatorio.
 * Devuelve true si se puede notificar.
 */
export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  await ensureChannelAndCategory();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  setSetting(SETTING_KEYS.notificationsAsked, '1', { silent: true });
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
}

/** Reprograma todos los recordatorios para que coincidan con los hábitos guardados. */
export async function syncHabitReminders(): Promise<void> {
  if (!notificationsSupported) return;
  const desired = listHabits({ includeArchived: true }).flatMap((h) => desiredReminders(h, today()));
  const scheduled = (await Notifications.getAllScheduledNotificationsAsync()).filter((n) =>
    n.identifier.startsWith(REMINDER_ID_PREFIX),
  );
  const wanted = new Map(desired.map((d) => [d.identifier, d]));

  for (const n of scheduled) {
    const want = wanted.get(n.identifier);
    if (!want || n.content.data?.sig !== want.sig) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    } else {
      wanted.delete(n.identifier);
    }
  }
  if (wanted.size === 0) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await ensureChannelAndCategory();
  for (const d of wanted.values()) {
    await Notifications.scheduleNotificationAsync({
      identifier: d.identifier,
      content: {
        title: d.title,
        body: d.body,
        data: { habitId: d.habitId, sig: d.sig },
        categoryIdentifier: CATEGORY_ID,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: d.weekday,
        hour: d.hour,
        minute: d.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
}

/**
 * Procesa los botones "Hecho" y "Mínimo" de una notificación. Usa la fecha en que
 * se mostró la notificación, así que procesarla dos veces no cambia nada.
 * Devuelve true si la respuesta abrió la app sin acción (tocar la notificación).
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse): 'marked' | 'opened' | 'ignored' {
  const data = response.notification.request.content.data as { habitId?: unknown } | undefined;
  const habitId = typeof data?.habitId === 'string' ? data.habitId : null;
  if (!habitId || !getHabit(habitId)) return 'ignored';
  const action = response.actionIdentifier;
  if (action === ACTION_DONE || action === ACTION_MINIMAL) {
    const day = toBogota(new Date(response.notification.date)).date;
    const habit = getHabit(habitId);
    if (habit && isScheduled(habit, day)) setCheck(habitId, day, action);
    void Notifications.dismissNotificationAsync(response.notification.request.identifier);
    return 'marked';
  }
  return action === Notifications.DEFAULT_ACTION_IDENTIFIER ? 'opened' : 'ignored';
}
