import { addDays, daysBetween, minDay, mondayOf, weekdayOf } from './dates';
import type { CheckLike, CheckStatus, HabitLike } from './types';

/** 66 días: mediana para formar un hábito (Lally et al., 2010). */
export const FIRM_ROOTS_DAYS = 66;

export function isFulfilled(status: CheckStatus | null | undefined): boolean {
  return status === 'done' || status === 'minimal';
}

/** "1,3,5" → [1, 3, 5] (lunes = 1). Ignora valores inválidos. */
export function parseWeekdays(value: string | null | undefined): number[] {
  if (!value) return [];
  const set = new Set<number>();
  for (const part of value.split(',')) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 1 && n <= 7) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

export function formatWeekdays(days: readonly number[]): string {
  return [...new Set(days)].sort((a, b) => a - b).join(',');
}

export function weeklyTarget(habit: Pick<HabitLike, 'timesPerWeek'>): number {
  return Math.max(1, Math.min(7, habit.timesPerWeek ?? 1));
}

/**
 * ¿El hábito está programado ese día?
 * - Antes de la fecha de inicio nunca lo está.
 * - Los hábitos de "X veces por semana" se pueden hacer cualquier día.
 */
export function isScheduled(habit: HabitLike, date: string): boolean {
  if (date < habit.startDate) return false;
  switch (habit.frequencyType) {
    case 'daily':
    case 'times_per_week':
      return true;
    case 'weekdays':
      return parseWeekdays(habit.weekdays).includes(weekdayOf(date));
  }
}

/** Índice fecha → estado de los checks de un hábito. */
export function checksByDate(habitId: string, checks: readonly CheckLike[]): Map<string, CheckStatus> {
  const map = new Map<string, CheckStatus>();
  for (const c of checks) if (c.habitId === habitId) map.set(c.date, c.status);
  return map;
}

export interface StreakResult {
  current: number;
  longest: number;
  /** Los dos últimos periodos programados (ya cerrados o marcados) quedaron sin cumplir. */
  needsAttention: boolean;
  unit: 'days' | 'weeks';
}

/**
 * Racha flexible.
 *
 * Hábitos diarios o de días específicos:
 * - Cuenta los días programados cumplidos ("hecho" o "mínimo") desde la última vez que hubo
 *   dos días programados seguidos en "no" o sin marcar. Un solo día perdido no la rompe.
 * - Los días no programados se ignoran.
 * - Hoy sin marcar todavía no cuenta (ni a favor ni en contra).
 *
 * Hábitos de X veces por semana:
 * - Se cuenta en semanas (lunes a domingo) que llegan a la meta. Una semana por debajo no la
 *   rompe; dos seguidas sí.
 * - La semana en curso solo cuenta cuando ya llegó a la meta.
 * - La primera semana, si el hábito empezó a mitad de semana y no llegó a la meta, se ignora.
 */
export function computeFlexibleStreak(
  habit: HabitLike,
  checks: readonly CheckLike[],
  today: string,
): StreakResult {
  const byDate = checksByDate(habit.id, checks);
  const periods =
    habit.frequencyType === 'times_per_week'
      ? weeklyPeriods(habit, byDate, today)
      : dailyPeriods(habit, byDate, today);
  const unit = habit.frequencyType === 'times_per_week' ? 'weeks' : 'days';

  let run = 0;
  let longest = 0;
  let misses = 0;
  for (const met of periods) {
    if (met) {
      run += 1;
      misses = 0;
    } else {
      misses += 1;
      if (misses >= 2) run = 0;
    }
    longest = Math.max(longest, run);
  }

  const n = periods.length;
  const needsAttention = n >= 2 && periods[n - 1] === false && periods[n - 2] === false;
  return { current: run, longest, needsAttention, unit };
}

/** Secuencia cumplido/no cumplido de los días programados, de más antiguo a más reciente. */
function dailyPeriods(habit: HabitLike, byDate: Map<string, CheckStatus>, today: string): boolean[] {
  if (habit.startDate > today) return [];
  const out: boolean[] = [];
  for (const day of daysBetween(habit.startDate, today)) {
    if (!isScheduled(habit, day)) continue;
    const status = byDate.get(day);
    if (day === today && status === undefined) continue; // hoy aún no termina
    out.push(isFulfilled(status));
  }
  return out;
}

function weeklyPeriods(habit: HabitLike, byDate: Map<string, CheckStatus>, today: string): boolean[] {
  if (habit.startDate > today) return [];
  const target = weeklyTarget(habit);
  const firstMonday = mondayOf(habit.startDate);
  const currentMonday = mondayOf(today);
  const out: boolean[] = [];
  for (let monday = firstMonday; monday <= currentMonday; monday = addDays(monday, 7)) {
    const count = fulfilledInRange(byDate, maxOf(monday, habit.startDate), minDay(addDays(monday, 6), today));
    const met = count >= target;
    if (!met && monday === currentMonday) continue; // semana en curso
    if (!met && monday === firstMonday && habit.startDate !== monday) continue; // semana parcial de inicio
    out.push(met);
  }
  return out;
}

function maxOf(a: string, b: string): string {
  return a >= b ? a : b;
}

function fulfilledInRange(byDate: Map<string, CheckStatus>, from: string, to: string): number {
  let count = 0;
  for (const [day, status] of byDate) {
    if (day >= from && day <= to && isFulfilled(status)) count += 1;
  }
  return count;
}

/** Total de días en "hecho" o "mínimo" de un hábito. */
export function fulfilledCount(habit: Pick<HabitLike, 'id'>, checks: readonly CheckLike[]): number {
  let count = 0;
  for (const c of checks) if (c.habitId === habit.id && isFulfilled(c.status)) count += 1;
  return count;
}

/** Raíz firme: 66 o más días en "hecho" o "mínimo". */
export function hasFirmRoots(habit: Pick<HabitLike, 'id'>, checks: readonly CheckLike[]): boolean {
  return fulfilledCount(habit, checks) >= FIRM_ROOTS_DAYS;
}

export interface Compliance {
  fulfilled: number;
  expected: number;
}

/**
 * Cumplimiento de un hábito en la semana que empieza en `monday`, contando solo hasta `today`.
 * Devuelve null si en ese rango no había nada programado.
 */
export function weeklyCompliance(
  habit: HabitLike,
  checks: readonly CheckLike[],
  monday: string,
  today: string,
): Compliance | null {
  const byDate = checksByDate(habit.id, checks);
  const sunday = addDays(monday, 6);
  const from = maxOf(monday, habit.startDate);
  const to = minDay(sunday, today);
  if (from > to) return null;

  if (habit.frequencyType === 'times_per_week') {
    const target = weeklyTarget(habit);
    const fulfilled = Math.min(target, fulfilledInRange(byDate, from, to));
    return { fulfilled, expected: target };
  }

  let fulfilled = 0;
  let expected = 0;
  for (const day of daysBetween(from, to)) {
    if (!isScheduled(habit, day)) continue;
    const status = byDate.get(day);
    if (day === today && status === undefined) continue;
    expected += 1;
    if (isFulfilled(status)) fulfilled += 1;
  }
  return expected === 0 ? null : { fulfilled, expected };
}
