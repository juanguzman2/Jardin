import { es } from '../copy/es';
import type { Habit } from '../db/schema';
import { parseWeekdays } from '../domain/habits';

/*
 * Lógica pura de los recordatorios: qué notificaciones semanales debería tener cada hábito.
 * La programación real está en ./index.ts.
 */

export const REMINDER_ID_PREFIX = 'habit:';

export interface DesiredReminder {
  identifier: string;
  sig: string;
  habitId: string;
  title: string;
  body: string;
  /** Formato de expo-notifications: 1 = domingo … 7 = sábado. */
  weekday: number;
  hour: number;
  minute: number;
}

/** Lunes = 1 … domingo = 7  →  domingo = 1 … sábado = 7. */
export function toExpoWeekday(mondayFirst: number): number {
  return mondayFirst === 7 ? 1 : mondayFirst + 1;
}

/** Días (lunes = 1) en que suena el recordatorio de un hábito. */
export function reminderDays(habit: Habit): number[] {
  const explicit = parseWeekdays(habit.reminderWeekdays);
  if (explicit.length > 0) return explicit;
  if (habit.frequencyType === 'weekdays') return parseWeekdays(habit.weekdays);
  return [1, 2, 3, 4, 5, 6, 7];
}

export function desiredReminders(habit: Habit): DesiredReminder[] {
  if (habit.archived || !habit.reminderTime) return [];
  const [h, m] = habit.reminderTime.split(':').map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return [];
  const title = habit.name;
  const body = habit.ifThen?.trim() || habit.minimalVersion?.trim() || es.habits.notWateredToday;
  return reminderDays(habit).map((day) => {
    const weekday = toExpoWeekday(day);
    return {
      identifier: `${REMINDER_ID_PREFIX}${habit.id}:${day}`,
      sig: JSON.stringify([title, body, weekday, h, m]),
      habitId: habit.id,
      title,
      body,
      weekday,
      hour: h,
      minute: m,
    };
  });
}

