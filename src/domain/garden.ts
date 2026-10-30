import { addDays, daysBetween, maxDay, minDay } from './dates';
import { checksByDate, hasFirmRoots, isFulfilled, isScheduled, weeklyTarget } from './habits';
import type { CheckLike, HabitLike } from './types';

export type GardenStage = 'seed' | 'sprout' | 'young' | 'plant' | 'bloom';
export type Hydration = 'vibrant' | 'normal' | 'wilted' | 'very_wilted';

/** Días regados mínimos para cada etapa. 66 = mediana para formar un hábito (Lally, 2010). */
export const STAGE_THRESHOLDS: readonly { stage: GardenStage; from: number }[] = [
  { stage: 'seed', from: 0 },
  { stage: 'sprout', from: 7 },
  { stage: 'young', from: 21 },
  { stage: 'plant', from: 45 },
  { stage: 'bloom', from: 66 },
];

export function gardenStage(wateredDays: number): GardenStage {
  let stage: GardenStage = 'seed';
  for (const t of STAGE_THRESHOLDS) if (wateredDays >= t.from) stage = t.stage;
  return stage;
}

/** Días regados que faltan para la siguiente etapa, o null si ya floreció. */
export function daysToNextStage(wateredDays: number): number | null {
  const next = STAGE_THRESHOLDS.find((t) => t.from > wateredDays);
  return next ? next.from - wateredDays : null;
}

/** Días distintos con al menos un hábito del área en "hecho" o "mínimo". */
export function countWateredDays(
  areaId: string,
  habits: readonly HabitLike[],
  checks: readonly CheckLike[],
): number {
  const ids = new Set(habits.filter((h) => h.areaId === areaId).map((h) => h.id));
  const days = new Set<string>();
  for (const c of checks) if (ids.has(c.habitId) && isFulfilled(c.status)) days.add(c.date);
  return days.size;
}

/**
 * El crecimiento nunca retrocede: si se borra un hábito o se cambia de área, la planta
 * conserva lo que ya creció (`storedMax` se guarda en ajustes).
 */
export function gardenGrowth(computed: number, storedMax: number | null | undefined): number {
  return Math.max(computed, storedMax ?? 0);
}

export interface HydrationResult {
  level: Hydration;
  /** Cumplimiento ponderado de los últimos 7 días, o null si no había nada programado. */
  ratio: number | null;
}

export function hydrationLevel(ratio: number | null): Hydration {
  if (ratio === null) return 'normal';
  const eps = 1e-9;
  if (ratio >= 0.8 - eps) return 'vibrant';
  if (ratio >= 0.5 - eps) return 'normal';
  if (ratio > eps) return 'wilted';
  return 'very_wilted';
}

/**
 * Hidratación de un área según los últimos 7 días (hoy incluido) de sus hábitos activos.
 * - Hoy sin marcar no cuenta todavía.
 * - Los días perdidos de un hábito con raíz firme pesan la mitad.
 * - Hábitos de X veces por semana: la meta se prorratea con los días activos de la ventana.
 */
export function gardenHydration(
  area: { id: string },
  habits: readonly HabitLike[],
  checks: readonly CheckLike[],
  today: string,
): HydrationResult {
  const windowStart = addDays(today, -6);
  let good = 0;
  let bad = 0;

  for (const habit of habits) {
    if (habit.areaId !== area.id || habit.archived || habit.startDate > today) continue;
    if (habit.endDate && habit.endDate < windowStart) continue; // terminó antes de la ventana
    const missWeight = hasFirmRoots(habit, checks) ? 0.5 : 1;
    const byDate = checksByDate(habit.id, checks);
    const from = maxDay(windowStart, habit.startDate);
    const to = habit.endDate ? minDay(habit.endDate, today) : today;

    if (habit.frequencyType === 'times_per_week') {
      let activeDays = 0;
      let fulfilled = 0;
      for (const day of daysBetween(from, to)) {
        const status = byDate.get(day);
        if (isFulfilled(status)) fulfilled += 1;
        if (day === today && status === undefined) continue;
        activeDays += 1;
      }
      const target = weeklyTarget(habit);
      const expected = Math.min(target, Math.ceil((target * activeDays) / 7));
      const met = Math.min(fulfilled, expected);
      good += met;
      bad += (expected - met) * missWeight;
      continue;
    }

    for (const day of daysBetween(from, to)) {
      if (!isScheduled(habit, day)) continue;
      const status = byDate.get(day);
      if (day === today && status === undefined) continue;
      if (isFulfilled(status)) good += 1;
      else bad += missWeight;
    }
  }

  const total = good + bad;
  const ratio = total > 0 ? good / total : null;
  return { level: hydrationLevel(ratio), ratio };
}

export type AreaDayStatus = 'watered' | 'dry' | 'none';

/**
 * Estado de un día para el mapa de 8 semanas de un área:
 * - watered: algún hábito del área en "hecho" o "mínimo".
 * - dry: había algo programado y nada se cumplió (se muestra en gris neutro, nunca en rojo).
 * - none: nada programado, o es hoy y aún no se marca.
 */
export function areaDayStatus(
  areaId: string,
  habits: readonly HabitLike[],
  checks: readonly CheckLike[],
  day: string,
  today: string,
): AreaDayStatus {
  const areaHabits = habits.filter((h) => h.areaId === areaId);
  const ids = new Set(areaHabits.map((h) => h.id));
  const dayChecks = checks.filter((c) => c.date === day && ids.has(c.habitId));
  if (dayChecks.some((c) => isFulfilled(c.status))) return 'watered';
  if (day >= today) return 'none';
  const scheduled = areaHabits.some(
    (h) => !h.archived && h.frequencyType !== 'times_per_week' && isScheduled(h, day),
  );
  return scheduled ? 'dry' : 'none';
}
